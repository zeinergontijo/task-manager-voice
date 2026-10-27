const cron = require('node-cron');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccount = require('./firebase-config.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
let drive;

async function initializeGoogleDrive() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    drive = google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('❌ Erro ao autenticar Google Drive:', error);
    throw error;
  }
}

async function executarBackupAgendado() {
  try {
    console.log(`\n⏰ Backup agendado iniciado em ${new Date().toLocaleString('pt-BR')}`);

    await initializeGoogleDrive();

    // Exportar dados
    const usuariosSnapshot = await db.collection('usuarios').get();
    const backup = {
      dataExportacao: new Date().toISOString(),
      usuarios: []
    };

    for (const usuarioDoc of usuariosSnapshot.docs) {
      const usuarioId = usuarioDoc.id;
      const tarefasSnapshot = await db
        .collection('usuarios')
        .doc(usuarioId)
        .collection('tarefas')
        .get();

      const tarefas = [];
      tarefasSnapshot.forEach(doc => {
        tarefas.push({
          id: doc.id,
          ...doc.data(),
          criadoEm: doc.data().criadoEm?.toDate?.() || doc.data().criadoEm,
          atualizadoEm: doc.data().atualizadoEm?.toDate?.() || doc.data().atualizadoEm
        });
      });

      backup.usuarios.push({
        id: usuarioId,
        totalTarefas: tarefas.length,
        tarefas
      });
    }

    // Salvar no Google Drive
    const nomeArquivo = `backup-tarefas-${new Date().toISOString().split('T')[0]}.json`;
    const caminhoLocal = path.join(__dirname, nomeArquivo);

    fs.writeFileSync(caminhoLocal, JSON.stringify(backup, null, 2));

    // Procurar pasta
    const pastaExistente = await drive.files.list({
      q: "name='Task Manager Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      spaces: 'drive',
      pageSize: 1,
      fields: 'files(id, name)'
    });

    let pastaId;
    if (pastaExistente.data.files.length > 0) {
      pastaId = pastaExistente.data.files[0].id;
    } else {
      const novaFolder = await drive.files.create({
        resource: {
          name: 'Task Manager Backups',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      pastaId = novaFolder.data.id;
    }

    // Upload
    const fileMetadata = {
      name: nomeArquivo,
      parents: [pastaId]
    };

    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(caminhoLocal)
    };

    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    fs.unlinkSync(caminhoLocal);

    console.log(`✅ Backup automático concluído!`);
    console.log(`📊 Usuários: ${backup.usuarios.length}`);
    console.log(`📋 Total de tarefas: ${backup.usuarios.reduce((acc, u) => acc + u.totalTarefas, 0)}`);
  } catch (error) {
    console.error('❌ Erro no backup agendado:', error);
  }
}

// Agendar backup para rodar todo dia às 02:00 da manhã
const scheduleBackup = () => {
  console.log('⏰ Agendador de backup iniciado');
  console.log('📅 Backup agendado para: 02:00 todos os dias\n');

  // "0 2 * * *" = 02:00 todos os dias
  cron.schedule('0 2 * * *', () => {
    executarBackupAgendado();
  });

  // Também executar na inicialização
  console.log('🚀 Executando primeiro backup...\n');
  executarBackupAgendado();
};

scheduleBackup();

// Manter o processo rodando
console.log('✅ Serviço de backup automático ativo');
console.log('🔒 Pressione Ctrl+C para parar\n');
