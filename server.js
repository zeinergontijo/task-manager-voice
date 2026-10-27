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
const USUARIO_ID = Buffer.from(process.env.TAREFAS_EMAIL || '').toString('base64');

function colecaoTarefas() {
  return db.collection('usuarios').doc(USUARIO_ID).collection('tarefas');
}

function paraJson(doc) {
  const dados = doc.data();
  return {
    id: doc.id,
    titulo: dados.titulo,
    concluida: dados.concluida,
    tipo: dados.tipo || null,
    prazo: dados.prazo || null,
    criadoEm: dados.criadoEm?.toDate?.().toISOString() || null
  };
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

// Tipos são livres, mas guardados sempre em minúsculas para "Fazenda" e "fazenda" serem o mesmo
const tipoSchema = z
  .string()
  .trim()
  .min(1)
  .transform(t => t.toLowerCase())
  .describe('Categoria da tarefa, ex.: fazenda, softmax, pessoal. Prefira um tipo que já exista (veja tiposExistentes em listar_tarefas)');

// Ferramentas que o Claude pode usar
function criarServidorMcp() {
  const server = new McpServer({ name: 'tarefas', version: '2.0.0' });

  server.registerTool(
    'listar_tarefas',
    {
      title: 'Listar tarefas',
      description:
        'Lista as tarefas do usuário, opcionalmente só de um tipo. Use antes de concluir, editar ou deletar, para descobrir o id da tarefa certa. Também devolve os tipos já usados.',
      inputSchema: {
        status: z
          .enum(['pendentes', 'concluidas', 'todas'])
          .default('pendentes')
          .describe('Quais tarefas listar'),
        tipo: tipoSchema.optional().describe('Listar só tarefas deste tipo')
      }
    },
    async ({ status, tipo }) => {
      const snapshot = await colecaoTarefas().get();
      const todas = snapshot.docs.map(paraJson);
      const tarefas = todas
        .filter(t => status === 'todas' || t.concluida === (status === 'concluidas'))
        .filter(t => !tipo || t.tipo === tipo)
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      const tiposExistentes = [...new Set(todas.map(t => t.tipo).filter(Boolean))].sort();
      return resposta({ total: tarefas.length, tiposExistentes, tarefas });
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
        prazo: prazoSchema.optional()
      }
    },
    async ({ titulo, tipo, prazo }) => {
      const agora = new Date();
      const docRef = await colecaoTarefas().add({
        titulo,
        concluida: false,
        ...(tipo && { tipo }),
        ...(prazo && { prazo }),
        criadoEm: agora,
        atualizadoEm: agora
      });
      return resposta({ criada: { id: docRef.id, titulo, tipo: tipo || null, prazo: prazo || null } });
    }
  );

  server.registerTool(
    'atualizar_tarefa',
    {
      title: 'Atualizar tarefa',
      description:
        'Altera uma tarefa existente: marca como concluída ou pendente, muda o título, o tipo ou o prazo. Passe só o que mudar.',
      inputSchema: {
        id: z.string().describe('Id da tarefa, obtido com listar_tarefas'),
        concluida: z.boolean().optional().describe('true para concluir, false para reabrir'),
        titulo: z.string().min(1).optional(),
        tipo: tipoSchema.nullable().optional().describe('Novo tipo ou null para remover'),
        prazo: prazoSchema.nullable().optional().describe('Nova data limite (AAAA-MM-DD) ou null para remover')
      }
    },
    async ({ id, concluida, titulo, tipo, prazo }) => {
      const docRef = colecaoTarefas().doc(id);
      if (!(await docRef.get()).exists) return erro(`Tarefa ${id} não encontrada.`);

      const mudancas = { atualizadoEm: new Date() };
      if (concluida !== undefined) mudancas.concluida = concluida;
      if (titulo !== undefined) mudancas.titulo = titulo;
      if (tipo !== undefined) mudancas.tipo = tipo ?? admin.firestore.FieldValue.delete();
      if (prazo !== undefined) mudancas.prazo = prazo ?? admin.firestore.FieldValue.delete();

      await docRef.update(mudancas);
      return resposta({ atualizada: paraJson(await docRef.get()) });
    }
  );

  server.registerTool(
    'deletar_tarefa',
    {
      title: 'Deletar tarefa',
      description: 'Apaga uma tarefa definitivamente. Para tarefas feitas, prefira atualizar_tarefa com concluida=true.',
      inputSchema: {
        id: z.string().describe('Id da tarefa, obtido com listar_tarefas')
      },
      annotations: { destructiveHint: true }
    },
    async ({ id }) => {
      const docRef = colecaoTarefas().doc(id);
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

// O token secreto faz parte da URL do conector, para que só você acesse
function tokenValido(token) {
  const esperado = process.env.MCP_TOKEN || '';
  if (esperado.length < 32 || typeof token !== 'string') return false;
  const a = Buffer.from(token);
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Modo sem sessão: cada requisição cria seu próprio servidor MCP (ideal para a Vercel)
app.post('/mcp/:token', async (req, res) => {
  if (!tokenValido(req.params.token)) {
    return res.status(404).json({ erro: 'Não encontrado' });
  }

  try {
    const server = criarServidorMcp();
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
  res.send('Servidor MCP de tarefas rodando.');
});

if (!USUARIO_ID) console.warn('⚠️ TAREFAS_EMAIL não definido no .env');
if ((process.env.MCP_TOKEN || '').length < 32) console.warn('⚠️ MCP_TOKEN ausente ou curto demais (mínimo 32 caracteres)');

// Localmente sobe o servidor; na Vercel o app é exportado
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor MCP rodando em http://localhost:${PORT}/mcp/<MCP_TOKEN>`);
  });
}

module.exports = app;
