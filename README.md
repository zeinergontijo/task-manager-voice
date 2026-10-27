# 🎤 Gerenciador de Tarefas por Voz

Uma aplicação web para gerenciar tarefas usando **comandos de voz em português**, com armazenamento em banco de dados na nuvem.

## ✨ Funcionalidades

- 🎤 **Reconhecimento de voz em português** (Web Speech API)
- ➕ Criar tarefas por voz ("Adicionar tarefa: comprar leite")
- 📝 Listar tarefas pendentes e completas
- ✅ Marcar tarefas como feitas
- 🗑️ Deletar tarefas
- 💾 Armazenamento em **Firebase Firestore**
- 🔐 Autenticação simples por email
- 📱 Interface responsiva e moderna

## 🚀 Setup Rápido

### 1. **Clonar/Baixar o projeto**
```bash
cd task-manager-voice
```

### 2. **Instalar dependências**
```bash
npm install
```

### 3. **Configurar Firebase**

#### Passo 1: Criar projeto Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em **"Criar um projeto"**
3. Digite um nome (ex: "task-manager-voice")
4. Clique em **Criar projeto**

#### Passo 2: Configurar Firestore
1. No Firebase Console, vá para **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha a localização (ex: América do Sul)
4. Escolha **Iniciar em modo de teste** (para desenvolvimento)
   - ⚠️ **Importante**: Em produção, configure regras de segurança apropriadas
5. Clique em **Criar**

#### Passo 3: Obter credenciais
1. Acesse **Configurações do projeto** (engrenagem no canto superior)
2. Vá para **Contas de serviço**
3. Clique em **Gerar uma nova chave privada**
4. Salve o arquivo JSON baixado como `firebase-config.json` na raiz do projeto

#### Passo 4: Obter URL do banco
1. Na página do Firestore, copie o URL do banco (algo como `https://seu-projeto.firebaseio.com`)

### 4. **Configurar variáveis de ambiente**

1. Renomeie `.env.exemplo` para `.env`
2. Preenchha as variáveis:

```env
PORT=3000
ANTHROPIC_API_KEY=sua_chave_api_anthropic_aqui
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
```

#### Como obter a chave Anthropic:
1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Vá para **API Keys**
3. Clique em **Create Key**
4. Copie a chave e cole no `.env`

### 5. **Executar o servidor**

```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📖 Como Usar

### Comandos de Voz Suportados

```
"Adicionar tarefa: comprar leite"         → Cria nova tarefa
"Listar minhas tarefas"                   → Lista tarefas pendentes
"Listar tarefas completas"                → Lista tarefas finalizadas
"Marcar tarefa 1 como feita"              → Marca tarefa como concluída
"Deletar tarefa 2"                        → Remove a tarefa
"Qual é a primeira tarefa?"               → Respostas em linguagem natural
```

### Como Funciona:

1. **Faça login** com seu email (qualquer email funciona no dev)
2. **Clique no botão do microfone** 🎤
3. **Fale um comando** em português natural
4. **O sistema processa** e executa a ação
5. **Veja a resposta** e a lista de tarefas atualizada

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Frontend (Web)                   │
│  ├─ index.html                          │
│  ├─ style.css                           │
│  └─ app.js (Web Speech API)             │
└────────────┬────────────────────────────┘
             │
       HTTP / JSON
             │
┌────────────▼────────────────────────────┐
│    Backend (Node.js + Express)          │
│  ├─ /api/comando (processar voz)        │
│  ├─ /api/tarefas (CRUD)                 │
│  └─ Claude API (processar linguagem)    │
└────────────┬────────────────────────────┘
             │
        Firestore
             │
┌────────────▼────────────────────────────┐
│   Firebase Cloud Firestore              │
│  └─ usuarios/{userId}/tarefas/{taskId}  │
└─────────────────────────────────────────┘
```

## 🛡️ Segurança (Importante!)

### Desenvolvimento
- Modo de teste do Firestore permite leitura/escrita sem regras de segurança

### Produção
Configure regras de segurança no Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId}/tarefas/{taskId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 🐛 Troubleshooting

### "Microfone não funciona"
- ✅ Use navegadores modernos (Chrome, Edge, Firefox, Safari)
- ✅ Permita acesso ao microfone quando solicitado
- ✅ Certifique-se de usar HTTPS (exceto localhost)

### "Erro de conexão ao Firebase"
- ✅ Verifique se `firebase-config.json` existe
- ✅ Verifique as credenciais
- ✅ Firestore está em modo teste?

### "Comando não funciona"
- ✅ Fale claro em português
- ✅ Verifique se a chave Anthropic é válida
- ✅ Abra o console do navegador (F12) para ver erros

## 📦 Dependências

- **Express**: Framework web
- **Firebase Admin**: Acesso ao Firestore
- **Anthropic SDK**: Processamento de linguagem natural
- **CORS**: Permitir requisições entre domínios
- **dotenv**: Gerenciar variáveis de ambiente

## 🚀 Deploy (Opcional)

### Vercel
```bash
vercel
```

### Heroku
```bash
heroku create seu-app
git push heroku main
```

### Google Cloud Run
```bash
gcloud run deploy task-manager-voice --source .
```

## 📝 Estrutura de Dados

### Firestore
```
usuarios/
  └─ {userId}/
     └─ tarefas/
        └─ {taskId}
           ├─ titulo: string
           ├─ concluida: boolean
           ├─ criadoEm: timestamp
           └─ atualizadoEm: timestamp
```

## 🎓 Aprendizados

- Web Speech API para reconhecimento de voz
- Firebase Firestore para banco de dados em nuvem
- Claude API para processamento de linguagem natural
- Frontend responsivo com CSS Grid
- Arquitetura cliente-servidor

## 📄 Licença

MIT

## 💬 Suporte

Para problemas, verifique:
1. Console do navegador (F12 → Console)
2. Terminal do servidor
3. Firebase Console → Firestore Logs
4. Documentação do Anthropic: https://docs.anthropic.com

---

**Aproveite seu gerenciador de tarefas por voz! 🎉**
