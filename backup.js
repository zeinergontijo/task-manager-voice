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

// Autenticação Google Drive
let drive;
let auth;

async function initializeGoogleDrive() {
  try {
    // Usar as mesmas credenciais do Firebase
    auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    drive = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive autenticado');
  } catch (error) {
    console.error('❌ Erro ao autenticar Google Drive:', error);
    throw error;
  }
}

async function exportarTarefas() {
  try {
    console.log(`\n📤 Iniciando backup em ${new Date().toLocaleString('pt-BR')}`);

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

    return backup;
  } catch (error) {
    console.error('❌ Erro ao exportar tarefas:', error);
    throw error;
  }
}

async function salvarNoGoogleDrive(backupData) {
  try {
    const nomeArquivo = `backup-tarefas-${new Date().toISOString().split('T')[0]}.json`;
    const caminhoLocal = path.join(__dirname, nomeArquivo);

    // Salvar localmente primeiro
    fs.writeFileSync(caminhoLocal, JSON.stringify(backupData, null, 2));
    console.log(`📁 Backup local criado: ${nomeArquivo}`);

    // Procurar pasta "Task Manager Backups" no Google Drive
    const pastaExistente = await drive.files.list({
      q: "name='Task Manager Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      spaces: 'drive',
      pageSize: 1,
      fields: 'files(id, name)'
    });

    let pastaId;
    if (pastaExistente.data.files.length > 0) {
      pastaId = pastaExistente.data.files[0].id;
      console.log('📂 Pasta de backup encontrada no Google Drive');
    } else {
      // Criar pasta se não existir
      const novaFolder = await drive.files.create({
        resource: {
          name: 'Task Manager Backups',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      pastaId = novaFolder.data.id;
      console.log('✨ Pasta de backup criada no Google Drive');
    }

    // Upload do arquivo
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

    console.log(`☁️ Backup salvo no Google Drive: ${nomeArquivo}`);

    // Deletar arquivo local após upload bem-sucedido
    fs.unlinkSync(caminhoLocal);
    console.log(`🗑️ Arquivo local removido`);

    return {
      sucesso: true,
      arquivo: nomeArquivo,
      drive: true
    };
  } catch (error) {
    console.error('❌ Erro ao salvar no Google Drive:', error);
    throw error;
  }
}

async function limparBackupAntigos() {
  try {
    // Manter apenas últimos 30 dias de backups
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const pastaExistente = await drive.files.list({
      q: "name='Task Manager Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      spaces: 'drive',
      pageSize: 1,
      fields: 'files(id)'
    });

    if (pastaExistente.data.files.length === 0) return;

    const pastaId = pastaExistente.data.files[0].id;

    const arquivos = await drive.files.list({
      q: `'${pastaId}' in parents and trashed=false`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)'
    });

    for (const file of arquivos.data.files) {
      const dataCriacao = new Date(file.createdTime);
      if (dataCriacao < dataLimite) {
        await drive.files.delete({ fileId: file.id });
        console.log(`🗑️ Backup antigo removido: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('⚠️ Erro ao limpar backups antigos:', error);
    // Não lançar erro, apenas avisar
  }
}

async function executarBackup() {
  try {
    await initializeGoogleDrive();
    const backupData = await exportarTarefas();
    await salvarNoGoogleDrive(backupData);
    await limparBackupAntigos();

    console.log(`\n✅ BACKUP CONCLUÍDO COM SUCESSO!`);
    console.log(`📊 Total de usuários: ${backupData.usuarios.length}`);
    console.log(`📋 Total de tarefas: ${backupData.usuarios.reduce((acc, u) => acc + u.totalTarefas, 0)}`);
    console.log(`⏰ Próximo backup: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('pt-BR')}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO NO BACKUP:', error);
    process.exit(1);
  }
}

// Executar backup imediatamente ao rodar o script
executarBackup();
