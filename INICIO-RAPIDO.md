# ⚡ Guia de Início Rápido

## 5 Passos para Começar

### Passo 1️⃣: Instalar Dependências
```bash
npm install
```

### Passo 2️⃣: Configurar Firebase

#### 1. Criar conta/projeto no Firebase
- Acesse: https://console.firebase.google.com
- Clique em **"Criar um projeto"**
- Nome: `task-manager-voice` (ou outro de sua escolha)
- Ative Google Analytics (opcional)
- Clique em **"Criar projeto"**

#### 2. Criar Firestore
- No Firebase Console, vá para **"Firestore Database"**
- Clique em **"Criar banco de dados"**
- Localização: **América do Sul** (ou próximo a você)
- Modo: **Iniciar em modo de teste** ✅
- Clique em **"Criar"**

#### 3. Baixar credenciais
- Vá para **"Configurações"** (engrenagem) → **"Contas de serviço"**
- Clique em **"Gerar uma nova chave privada"**
- Salve o arquivo como **`firebase-config.json`** na raiz do projeto
- ⚠️ **Não publique este arquivo!**

#### 4. Copiar URL do Firestore
- Volte para Firestore Database
- No topo, você verá algo como: `https://seu-projeto.firebaseio.com`
- Copie esta URL

### Passo 3️⃣: Obter Chave da API Anthropic

1. Acesse: https://console.anthropic.com/api/keys
2. Clique em **"Create Key"**
3. Copie a chave

### Passo 4️⃣: Configurar Variáveis de Ambiente

1. Renomeie `.env.exemplo` para `.env`
2. Preencha com suas informações:

```env
PORT=3000
ANTHROPIC_API_KEY=sua_chave_aqui
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
```

### Passo 5️⃣: Executar

```bash
npm start
```

Abra no navegador: **http://localhost:3000**

---

## 🎤 Primeiros Comandos de Teste

1. **Faça login** com seu email (qualquer email funciona em desenvolvimento)
2. **Clique no botão do microfone** 🎤
3. **Fale um destes comandos:**

```
"Adicionar tarefa: estudar JavaScript"
"Adicionar tarefa: comprar leite"
"Adicionar tarefa: fazer exercício"
"Listar minhas tarefas"
"Marcar a primeira tarefa como feita"
"Listar tarefas completas"
```

---

## ✅ Checklist de Configuração

- [ ] `npm install` executado
- [ ] `firebase-config.json` criado e salvo
- [ ] `.env` preenchido corretamente
- [ ] Firebase Firestore em modo teste
- [ ] Chave Anthropic obtida
- [ ] Servidor iniciado com `npm start`
- [ ] Navegador aberto em `http://localhost:3000`
- [ ] Microfone funcionando
- [ ] Primeira tarefa criada por voz ✨

---

## 🔧 Variáveis de Ambiente

### .env (complete com seus valores)

```env
# Porta do servidor
PORT=3000

# Chave da API Anthropic (para processar comandos em linguagem natural)
# Obtenha em: https://console.anthropic.com/api/keys
ANTHROPIC_API_KEY=sk-ant-...

# URL do Firebase Firestore
# Obtenha em: Firebase Console → Firestore Database (copiar URL no topo)
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
```

---

## 📁 Estrutura do Projeto

```
task-manager-voice/
├── server.js              ← Backend (Express + Firebase + Claude)
├── package.json           ← Dependências
├── .env                   ← Variáveis de ambiente (NÃO COMMITAR)
├── firebase-config.json   ← Credenciais Firebase (NÃO COMMITAR)
├── public/
│   ├── index.html         ← Interface
│   ├── app.js             ← Lógica (Web Speech API)
│   └── style.css          ← Estilos
├── README.md              ← Documentação completa
├── API.md                 ← Endpoints da API
└── .gitignore            ← Arquivos a ignorar
```

---

## 🐛 Se Algo Não Funcionar

### "Microfone não funciona"
```
✓ Use Chrome, Edge, Firefox ou Safari (navegadores modernos)
✓ Permita acesso ao microfone quando solicitado
✓ Fale claro e em português
```

### "Erro: Cannot find module 'firebase-admin'"
```
npm install
```

### "Erro de autenticação Firebase"
```
✓ firebase-config.json existe?
✓ Credenciais estão corretas?
✓ Firestore está em modo teste?
```

### "Erro: Invalid API Key"
```
✓ Chave Anthropic está correta em .env?
✓ Não tem espaços extras?
```

### "Nenhuma tarefa aparece"
```
✓ Recarregue a página (F5)
✓ Abra o console (F12) para ver erros
✓ Verifique Firebase Console → Firestore
```

---

## 🚀 Próximos Passos

Depois de tudo funcionando:

1. **Personalize** a interface (cores, fontes)
2. **Adicione autenticação** real (Google OAuth)
3. **Configure regras de segurança** no Firestore
4. **Faça deploy** (Vercel, Heroku, Google Cloud Run)
5. **Adicione mais comandos** personalizados

---

## 📚 Recursos Úteis

- [Firebase Console](https://console.firebase.google.com)
- [Anthropic Console](https://console.anthropic.com)
- [Documentação Firebase](https://firebase.google.com/docs/firestore)
- [Documentação Anthropic](https://docs.anthropic.com)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## 💡 Dicas

- 📝 **Fale naturalmente** - "Preciso estudar" é reconhecido como tarefa
- 🎯 **Seja específico** - "Adicionar: tarefa importante" funciona melhor
- 🔄 **Sincronização em tempo real** - Tarefas atualizam a cada 10 segundos
- 💾 **Dados persistem** - Suas tarefas ficam salvas no Firebase

---

**Pronto para gerenciar tarefas por voz? 🎉**

Em caso de dúvidas, consulte `README.md` ou `API.md`
