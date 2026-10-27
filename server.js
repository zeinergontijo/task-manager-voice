const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar Firebase
const serviceAccount = require('./firebase-config.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
const client = new Anthropic();

// Processar comando de voz
app.post('/api/comando', async (req, res) => {
  try {
    const { comando, userId } = req.body;

    if (!comando || !userId) {
      return res.status(400).json({ erro: 'Comando e userId são obrigatórios' });
    }

    // Processar comando com Claude para extrair intenção
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 500,
      system: `Você é um assistente que processa comandos de gerenciamento de tarefas em português.
Analise o comando do usuário e retorne um JSON com:
{
  "acao": "criar|listar|completar|deletar|listar_completas",
  "titulo": "título da tarefa (se aplicável)",
  "id": "id da tarefa (se aplicável)",
  "resposta": "mensagem amigável em português"
}

Exemplos:
- "Adicionar tarefa: comprar leite" -> {"acao": "criar", "titulo": "comprar leite", ...}
- "Listar minhas tarefas" -> {"acao": "listar", ...}
- "Marcar tarefa 1 como feita" -> {"acao": "completar", "id": "1", ...}
- "Deletar tarefa 2" -> {"acao": "deletar", "id": "2", ...}`,
      messages: [{ role: 'user', content: comando }]
    });

    const conteudo = response.content[0].text;
    const parsedResponse = JSON.parse(conteudo);

    let resultado = {};

    switch (parsedResponse.acao) {
      case 'criar':
        resultado = await criarTarefa(userId, parsedResponse.titulo);
        break;
      case 'listar':
        resultado = await listarTarefas(userId, false);
        break;
      case 'listar_completas':
        resultado = await listarTarefas(userId, true);
        break;
      case 'completar':
        resultado = await completarTarefa(userId, parsedResponse.id);
        break;
      case 'deletar':
        resultado = await deletarTarefa(userId, parsedResponse.id);
        break;
      default:
        resultado = { resposta: 'Comando não reconhecido' };
    }

    res.json({
      acao: parsedResponse.acao,
      resposta: parsedResponse.resposta || resultado.resposta,
      dados: resultado.dados || []
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao processar comando' });
  }
});

// Criar tarefa
async function criarTarefa(userId, titulo) {
  const docRef = await db.collection('usuarios').doc(userId).collection('tarefas').add({
    titulo,
    concluida: false,
    criadoEm: new Date(),
    atualizadoEm: new Date()
  });

  return {
    resposta: `Tarefa "${titulo}" criada com sucesso!`,
    dados: { id: docRef.id }
  };
}

// Listar tarefas
async function listarTarefas(userId, completadas = false) {
  const snapshot = await db
    .collection('usuarios').doc(userId)
    .collection('tarefas')
    .where('concluida', '==', completadas)
    .orderBy('criadoEm', 'desc')
    .get();

  const tarefas = [];
  snapshot.forEach(doc => {
    tarefas.push({ id: doc.id, ...doc.data() });
  });

  const status = completadas ? 'completas' : 'pendentes';
  return {
    resposta: `Você tem ${tarefas.length} tarefa(s) ${status}.`,
    dados: tarefas
  };
}

// Completar tarefa
async function completarTarefa(userId, tarefaId) {
  await db.collection('usuarios').doc(userId).collection('tarefas').doc(tarefaId).update({
    concluida: true,
    atualizadoEm: new Date()
  });

  return {
    resposta: 'Tarefa marcada como completa!'
  };
}

// Deletar tarefa
async function deletarTarefa(userId, tarefaId) {
  await db.collection('usuarios').doc(userId).collection('tarefas').doc(tarefaId).delete();

  return {
    resposta: 'Tarefa deletada com sucesso!'
  };
}

// GET - Listar tarefas
app.get('/api/tarefas/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { filtro } = req.query;
    const completadas = filtro === 'completas';

    const snapshot = await db
      .collection('usuarios').doc(userId)
      .collection('tarefas')
      .where('concluida', '==', completadas)
      .orderBy('criadoEm', 'desc')
      .get();

    const tarefas = [];
    snapshot.forEach(doc => {
      tarefas.push({
        id: doc.id,
        ...doc.data(),
        criadoEm: doc.data().criadoEm.toDate()
      });
    });

    res.json({ tarefas });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao listar tarefas' });
  }
});

// PATCH - Toggle tarefa (marcar como feita/não feita)
app.patch('/api/tarefas/:userId/:tarefaId/toggle', async (req, res) => {
  try {
    const { userId, tarefaId } = req.params;

    const docSnap = await db
      .collection('usuarios').doc(userId)
      .collection('tarefas').doc(tarefaId)
      .get();

    if (!docSnap.exists) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    const novoStatus = !docSnap.data().concluida;
    await db
      .collection('usuarios').doc(userId)
      .collection('tarefas').doc(tarefaId)
      .update({
        concluida: novoStatus,
        atualizadoEm: new Date()
      });

    res.json({
      mensagem: novoStatus ? 'Tarefa marcada como completa' : 'Tarefa desmarcada'
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
  }
});

// DELETE - Deletar tarefa
app.delete('/api/tarefas/:userId/:tarefaId', async (req, res) => {
  try {
    const { userId, tarefaId } = req.params;

    const docSnap = await db
      .collection('usuarios').doc(userId)
      .collection('tarefas').doc(tarefaId)
      .get();

    if (!docSnap.exists) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    await db
      .collection('usuarios').doc(userId)
      .collection('tarefas').doc(tarefaId)
      .delete();

    res.json({ mensagem: 'Tarefa deletada com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao deletar tarefa' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
