const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
require('dotenv').config();

// Inicializar Firebase
// Na Vercel as credenciais vêm da variável FIREBASE_SERVICE_ACCOUNT (JSON);
// localmente, do arquivo firebase-config.json
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./firebase-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

// Dono das tarefas: mesmo ID que o app antigo gerava (email em base64),
// para continuar usando as tarefas já salvas
function idDoEmail(email) {
  return Buffer.from(email).toString('base64');
}

// Cada pessoa tem seu token e suas tarefas. A principal vem de TAREFAS_EMAIL/MCP_TOKEN;
// as demais de OUTRAS_PESSOAS, no formato "email:token,email:token"
function lerPessoas() {
  const pares = [[process.env.TAREFAS_EMAIL, process.env.MCP_TOKEN]];
  for (const item of (process.env.OUTRAS_PESSOAS || '').split(',')) {
    if (!item.trim()) continue;
    const separador = item.lastIndexOf(':');
    pares.push([item.slice(0, separador), item.slice(separador + 1)]);
  }

  const pessoas = [];
  for (const [email, token] of pares.map(([e, t]) => [(e || '').trim(), (t || '').trim()])) {
    if (!email) console.warn('⚠️ Pessoa sem email (TAREFAS_EMAIL ou OUTRAS_PESSOAS)');
    else if (token.length < 32) console.warn(`⚠️ Token de ${email} ausente ou curto demais (mínimo 32 caracteres)`);
    else if (pessoas.some(p => p.token === token)) console.warn(`⚠️ Token de ${email} repetido; cada pessoa precisa do seu`);
    else pessoas.push({ email, token, usuarioId: idDoEmail(email) });
  }
  return pessoas;
}

const PESSOAS = lerPessoas();

function colecaoTarefas(usuarioId) {
  return db.collection('usuarios').doc(usuarioId).collection('tarefas');
}

// Status gravado no banco; "atrasada" e "vence_hoje" não são gravadas, são calculadas pelo prazo
const STATUS = ['em_aberto', 'em_andamento', 'realizada'];

// Datas no formato AAAA-MM-DD pelo horário de Brasília (a Vercel roda em UTC)
function dataBR(data) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(data);
}

function hoje() {
  return dataBR(new Date());
}

// Data e hora (HH:MM) de agora no horário de Brasília
function agoraBR() {
  const agora = new Date();
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(agora);
  return { data: dataBR(agora), hora };
}

// Tarefas antigas só têm o campo "concluida"
function statusDe(dados) {
  if (STATUS.includes(dados.status)) return dados.status;
  return dados.concluida ? 'realizada' : 'em_aberto';
}

function paraJson(doc, agora = agoraBR()) {
  const dados = doc.data();
  const status = statusDe(dados);
  let situacao = status;
  if (status !== 'realizada' && dados.prazo) {
    if (dados.prazo < agora.data) situacao = 'atrasada';
    else if (dados.prazo === agora.data) {
      // Compromisso de hoje com hora já passada também está atrasado
      situacao = dados.hora && dados.hora < agora.hora ? 'atrasada' : 'vence_hoje';
    }
  }
  const criadoEm = dados.criadoEm?.toDate?.() || null;
  // Tarefas realizadas antes de existir "realizadaEm" usam a última atualização
  const realizadaEm =
    status === 'realizada' ? (dados.realizadaEm || dados.atualizadoEm)?.toDate?.() || null : null;
  return {
    id: doc.id,
    titulo: dados.titulo,
    status,
    situacao,
    tipo: dados.tipo || null,
    prazo: dados.prazo || null,
    hora: dados.hora || null,
    criadoEm: criadoEm?.toISOString() || null,
    realizadaEm: realizadaEm ? dataBR(realizadaEm) : null,
    // Data usada nos resumos por período
    dataReferencia: realizadaEm ? dataBR(realizadaEm) : dados.prazo || (criadoEm ? dataBR(criadoEm) : null)
  };
}

const SITUACOES = ['em_aberto', 'em_andamento', 'vence_hoje', 'atrasada', 'realizada'];

function contarPorSituacao(tarefas) {
  const contagem = Object.fromEntries(SITUACOES.map(s => [s, 0]));
  for (const t of tarefas) contagem[t.situacao]++;
  contagem.total = tarefas.length;
  return contagem;
}

function resposta(conteudo) {
  return { content: [{ type: 'text', text: JSON.stringify(conteudo, null, 2) }] };
}

function erro(mensagem) {
  return { content: [{ type: 'text', text: mensagem }], isError: true };
}

const prazoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD')
  .describe('Data limite no formato AAAA-MM-DD');

const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM (24 horas)')
  .describe('Hora do compromisso no formato HH:MM (24 horas), horário de Brasília. Só vale junto com um prazo');

// Tipos são livres, mas guardados sempre em minúsculas para "Fazenda" e "fazenda" serem o mesmo
const tipoSchema = z
  .string()
  .trim()
  .min(1)
  .transform(t => t.toLowerCase())
  .describe('Categoria da tarefa, ex.: fazenda, softmax, pessoal. Prefira um tipo que já exista (veja tiposExistentes em listar_tarefas)');

// Ferramentas que o Claude pode usar
function criarServidorMcp(usuarioId) {
  const server = new McpServer({ name: 'agenda', version: '2.0.0' });
  const tarefasDaPessoa = colecaoTarefas(usuarioId);

  server.registerTool(
    'listar_tarefas',
    {
      title: 'Listar tarefas',
      description:
        'Lista as tarefas do usuário, filtrando por situação e tipo. Cada tarefa vem com "situacao": em_aberto, em_andamento, vence_hoje (não realizada e prazo é hoje), atrasada (não realizada e prazo vencido, ou prazo hoje com hora já passada) ou realizada; "status" mostra se ela já foi começada. Use antes de alterar ou deletar, para descobrir o id da tarefa certa. Também devolve a data de hoje e os tipos já usados.',
      inputSchema: {
        situacao: z
          .enum(['pendentes', 'em_aberto', 'em_andamento', 'vence_hoje', 'atrasada', 'realizada', 'todas'])
          .default('pendentes')
          .describe('pendentes = tudo que não foi realizado (em aberto, em andamento e atrasadas)'),
        tipo: tipoSchema.optional().describe('Listar só tarefas deste tipo')
      }
    },
    async ({ situacao, tipo }) => {
      const agora = agoraBR();
      const snapshot = await tarefasDaPessoa.get();
      const todas = snapshot.docs.map(doc => paraJson(doc, agora));
      const tarefas = todas
        .filter(t =>
          situacao === 'todas' ||
          (situacao === 'pendentes' ? t.status !== 'realizada' : t.situacao === situacao)
        )
        .filter(t => !tipo || t.tipo === tipo)
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      const tiposExistentes = [...new Set(todas.map(t => t.tipo).filter(Boolean))].sort();
      return resposta({ hoje: agora.data, agora: agora.hora, total: tarefas.length, tiposExistentes, tarefas });
    }
  );

  server.registerTool(
    'resumo_tarefas',
    {
      title: 'Resumo de tarefas por período',
      description:
        'Conta as tarefas de um período por situação (em_aberto, em_andamento, vence_hoje, atrasada, realizada) e por tipo, e lista os títulos de cada grupo. ' +
        'Cada tarefa entra no período pela sua data de referência: realizadas pela data em que foram concluídas; as demais pelo prazo, ou pela data de criação se não tiverem prazo. ' +
        'Use para perguntas como "quantas tarefas atrasadas tenho em outubro?" ou "o que concluí esta semana?". Se o usuário estiver falando por voz, responda com os números primeiro, de forma curta.',
      inputSchema: {
        de: prazoSchema.optional().describe('Início do período (AAAA-MM-DD), inclusive. Omita para não limitar o início'),
        ate: prazoSchema.optional().describe('Fim do período (AAAA-MM-DD), inclusive. Omita para não limitar o fim'),
        tipo: tipoSchema.optional().describe('Resumir só tarefas deste tipo'),
        incluir_lista: z.boolean().default(true).describe('false para devolver só os números')
      }
    },
    async ({ de, ate, tipo, incluir_lista }) => {
      if (de && ate && de > ate) return erro('A data "de" é posterior à data "ate".');

      const agora = agoraBR();
      const snapshot = await tarefasDaPessoa.get();
      const tarefas = snapshot.docs
        .map(doc => paraJson(doc, agora))
        .filter(t => !tipo || t.tipo === tipo)
        .filter(t => (!de || (t.dataReferencia && t.dataReferencia >= de)) && (!ate || (t.dataReferencia && t.dataReferencia <= ate)))
        .sort((a, b) =>
          (a.dataReferencia || '').localeCompare(b.dataReferencia || '') || (a.hora || '').localeCompare(b.hora || '')
        );

      const porTipo = {};
      for (const t of tarefas) (porTipo[t.tipo || 'sem_tipo'] ||= []).push(t);

      const conteudo = {
        hoje: agora.data,
        agora: agora.hora,
        periodo: { de: de || null, ate: ate || null },
        tipo: tipo || null,
        contagem: contarPorSituacao(tarefas),
        porTipo: Object.fromEntries(Object.entries(porTipo).map(([k, lista]) => [k, contarPorSituacao(lista)]))
      };
      if (incluir_lista) {
        conteudo.tarefas = Object.fromEntries(
          SITUACOES.map(s => [
            s,
            tarefas
              .filter(t => t.situacao === s)
              .map(({ id, titulo, tipo, prazo, hora, realizadaEm }) => ({ id, titulo, tipo, prazo, hora, realizadaEm }))
          ]).filter(([, lista]) => lista.length)
        );
      }
      return resposta(conteudo);
    }
  );

  server.registerTool(
    'criar_tarefa',
    {
      title: 'Criar tarefa',
      description:
        'Cria uma nova tarefa pendente. Se o usuário não disser o tipo e ele não for óbvio pelo contexto, pergunte.',
      inputSchema: {
        titulo: z.string().min(1).describe('Descrição curta da tarefa'),
        tipo: tipoSchema.optional(),
        prazo: prazoSchema.optional(),
        hora: horaSchema.optional(),
        status: z.enum(STATUS).default('em_aberto').describe('Use em_andamento se o usuário já começou a tarefa')
      }
    },
    async ({ titulo, tipo, prazo, hora, status }) => {
      if (hora && !prazo) return erro('Informe também o prazo (dia) do compromisso para usar a hora.');

      const agora = new Date();
      const docRef = await tarefasDaPessoa.add({
        titulo,
        status,
        concluida: status === 'realizada',
        ...(status === 'realizada' && { realizadaEm: agora }),
        ...(tipo && { tipo }),
        ...(prazo && { prazo }),
        ...(hora && { hora }),
        criadoEm: agora,
        atualizadoEm: agora
      });
      return resposta({ criada: paraJson(await docRef.get()) });
    }
  );

  server.registerTool(
    'atualizar_tarefa',
    {
      title: 'Atualizar tarefa',
      description:
        'Altera uma tarefa existente: muda o status, o título, o tipo, o prazo ou a hora. Passe só o que mudar. "atrasada" e "vence_hoje" não são status: dependem do prazo e da hora.',
      inputSchema: {
        id: z.string().describe('Id da tarefa, obtido com listar_tarefas'),
        status: z
          .enum(STATUS)
          .optional()
          .describe('em_aberto (reabrir), em_andamento (começou) ou realizada (concluiu)'),
        titulo: z.string().min(1).optional(),
        tipo: tipoSchema.nullable().optional().describe('Novo tipo ou null para remover'),
        prazo: prazoSchema.nullable().optional().describe('Nova data limite (AAAA-MM-DD) ou null para remover (remove também a hora)'),
        hora: horaSchema.nullable().optional().describe('Nova hora (HH:MM) ou null para remover')
      }
    },
    async ({ id, status, titulo, tipo, prazo, hora }) => {
      const docRef = tarefasDaPessoa.doc(id);
      const atual = await docRef.get();
      if (!atual.exists) return erro(`Tarefa ${id} não encontrada.`);

      // Hora sem dia não faz sentido: tirar o prazo tira a hora
      const prazoFinal = prazo === undefined ? atual.data().prazo : prazo;
      if (hora && !prazoFinal) return erro('Informe também o prazo (dia) do compromisso para usar a hora.');

      const mudancas = { atualizadoEm: new Date() };
      if (status !== undefined) {
        mudancas.status = status;
        mudancas.concluida = status === 'realizada';
        if (status !== 'realizada') {
          mudancas.realizadaEm = admin.firestore.FieldValue.delete();
        } else if (statusDe(atual.data()) !== 'realizada') {
          mudancas.realizadaEm = mudancas.atualizadoEm;
        }
      }
      if (titulo !== undefined) mudancas.titulo = titulo;
      if (tipo !== undefined) mudancas.tipo = tipo ?? admin.firestore.FieldValue.delete();
      if (prazo !== undefined) mudancas.prazo = prazo ?? admin.firestore.FieldValue.delete();
      if (hora !== undefined) mudancas.hora = hora ?? admin.firestore.FieldValue.delete();
      if (prazo === null) mudancas.hora = admin.firestore.FieldValue.delete();

      await docRef.update(mudancas);
      return resposta({ atualizada: paraJson(await docRef.get()) });
    }
  );

  server.registerTool(
    'deletar_tarefa',
    {
      title: 'Deletar tarefa',
      description: 'Apaga uma tarefa definitivamente. Para tarefas feitas, prefira atualizar_tarefa com status=realizada.',
      inputSchema: {
        id: z.string().describe('Id da tarefa, obtido com listar_tarefas')
      },
      annotations: { destructiveHint: true }
    },
    async ({ id }) => {
      const docRef = tarefasDaPessoa.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return erro(`Tarefa ${id} não encontrada.`);

      await docRef.delete();
      return resposta({ deletada: paraJson(doc) });
    }
  );

  return server;
}

const app = express();
app.use(express.json());

// O token secreto faz parte da URL do conector e diz de quem são as tarefas
function tokenIgual(token, esperado) {
  const a = Buffer.from(token);
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function pessoaDoToken(token) {
  if (typeof token !== 'string') return null;
  return PESSOAS.find(p => tokenIgual(token, p.token)) || null;
}

// Modo sem sessão: cada requisição cria seu próprio servidor MCP (ideal para a Vercel)
app.post('/mcp/:token', async (req, res) => {
  const pessoa = pessoaDoToken(req.params.token);
  if (!pessoa) {
    return res.status(404).json({ erro: 'Não encontrado' });
  }

  try {
    const server = criarServidorMcp(pessoa.usuarioId);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Erro:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Erro interno do servidor' },
        id: null
      });
    }
  }
});

app.all('/mcp/:token', (req, res) => {
  res.status(405).set('Allow', 'POST').json({ erro: 'Método não permitido' });
});

app.get('/', (req, res) => {
  res.send('Servidor MCP da Agenda rodando.');
});

if (!PESSOAS.length) console.warn('⚠️ Nenhuma pessoa configurada: defina TAREFAS_EMAIL e MCP_TOKEN no .env');

// Localmente sobe o servidor; na Vercel o app é exportado
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor MCP rodando em http://localhost:${PORT}/mcp/<MCP_TOKEN>`);
  });
}

module.exports = app;
