# 🚀 Deploy no Vercel - Guia Completo

Sua aplicação será publicada na internet! Funciona 24/7 sem seu PC ligado.

---

## 📋 O Que Vai Acontecer:

```
Seu código no PC
    ↓
Sobe para GitHub
    ↓
Vercel puxa do GitHub
    ↓
Deploy automático
    ↓
Link permanente: https://seu-app.vercel.app
    ↓
iPhone acessa de qualquer lugar!
```

---

## ✅ Pré-requisitos

- [ ] Conta **GitHub** (cria em 2 min: https://github.com/signup)
- [ ] Conta **Vercel** (cria com GitHub, grátis)
- [ ] Seu código em `C:\Projetos Claude\agenda`

---

## 🎯 Passo 1: Criar Conta GitHub (Se não tiver)

1. Acesse: https://github.com/signup
2. Email: zeiner@gmail.com
3. Senha: Crie uma forte
4. Username: `seu-nome-github` (ex: zeiner)
5. Crie a conta

**Pronto!** Agora você tem GitHub.

---

## 🔧 Passo 2: Inicializar Git Localmente

Abra **PowerShell** na pasta do projeto:

```bash
cd "C:\Projetos Claude\agenda"
```

Configure Git (primeira vez):

```bash
git config --global user.name "Seu Nome"
git config --global user.email "zeiner@gmail.com"
```

Inicializar repositório:

```bash
git init
git add .
git commit -m "Initial commit - Task Manager PWA"
```

**Resultado esperado:**
```
[main (root-commit) abc123] Initial commit
 15 files changed, 2000+ insertions(+)
```

---

## 📤 Passo 3: Criar Repositório no GitHub

1. Abra: https://github.com/new
2. **Repository name:** `task-manager-voice`
3. **Description:** "Gerenciador de tarefas por voz com PWA"
4. **Public** (não precisa ser privado)
5. Clique **Create repository**

---

## 🔌 Passo 4: Conectar Local com GitHub

Copie as instruções que aparecerão. No PowerShell, execute:

```bash
git remote add origin https://github.com/seu-username/task-manager-voice.git
git branch -M main
git push -u origin main
```

**Troque `seu-username` pelo seu username do GitHub!**

Se pedir autenticação:
- Use seu **token** do GitHub (gera em Settings → Developer settings → Personal access tokens)
- Ou use credenciais do GitHub

**Resultado:**
```
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
...
 * [new branch]      main -> main
```

---

## 🚀 Passo 5: Fazer Deploy no Vercel

### Opção A: Via Website (Mais Fácil)

1. Abra: https://vercel.com/signup
2. Clique **Continue with GitHub**
3. Autorize Vercel
4. Você será redirecionado para Vercel

### Opção B: Via CLI (Se preferir)

```bash
npm install -g vercel
vercel
```

---

## 🎬 Passo 6: Configurar Projeto no Vercel

1. **Clique: "Add New Project"**
2. **Procure:** `task-manager-voice`
3. **Clique em "Import"**
4. **Configurar variáveis de ambiente:**

Você verá um formulário para **Environment Variables**:

Adicione:
```
FIREBASE_SERVICE_ACCOUNT=<conteúdo inteiro do firebase-config.json>
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
TAREFAS_EMAIL=seu@email.com
MCP_TOKEN=<mesmo token do .env>
```

5. **Clique "Deploy"**

**Espere 2-3 minutos...**

---

## ✅ Deploy Concluído!

Você receberá um link como:

```
https://task-manager-voice.vercel.app
```

Salve este link! Use em qualquer lugar.

---

## 🔌 Conectar ao Claude

1. No **claude.ai**, abra **Configurações → Conectores**
2. **Adicionar conector personalizado**
3. **Nome:** "Tarefas"
4. **URL:** `https://task-manager-voice.vercel.app/mcp/SEU_MCP_TOKEN`

**Pronto! Use pelo app do Claude no iPhone, com ou sem PC ligado! 🎉**

---

## 🔄 Atualizar Aplicação

Se fizer mudanças no código:

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
```

**Vercel detecta e faz deploy automático!** ⚡

---

## 🛠️ Troubleshooting Deploy

### "Erro de Build"

Verifique:
- [ ] `vercel.json` existe?
- [ ] `.gitignore` tem `node_modules`?
- [ ] `firebase-config.json` está em `.gitignore`?
- [ ] Environment variables estão corretas?

### "Erro ao conectar Firebase"

- [ ] Verificar `FIREBASE_DATABASE_URL` no Vercel
- [ ] Firebase permite requisições do seu domínio?
- [ ] Firestore em modo teste?

### "Erro de CORS"

Vercel automaticamente resolve CORS, mas se persistir:
- [ ] Verificar configurações do Firebase
- [ ] Adicionar origem no Firestore

---

## 🔐 Segurança

### ⚠️ Importante: Não comitar `firebase-config.json`

Verifique `.gitignore`:

```bash
cat .gitignore
```

Deve conter:
```
firebase-config.json
.env
node_modules/
```

Se não tiver, adicione:
```bash
echo "firebase-config.json" >> .gitignore
git add .gitignore
git commit -m "Add firebase-config to gitignore"
git push
```

---

## 📊 Status do Deploy

Acompanhe em: https://vercel.com/dashboard

Você verá:
- Deployments anteriores
- Logs de erro (se houver)
- Performance
- Analytics

---

## 💡 Próximos Passos

1. **Domínio personalizado** (opcional)
   - Você pode adicionar seu domínio no Vercel

2. **CI/CD automático**
   - Cada push = deploy automático

3. **Analytics**
   - Ver quantas pessoas usam

4. **Backups automáticos**
   - Seu backup-scheduler ainda funciona no PC

---

## 🎉 Pronto!

Agora você tem:

✅ App web pública na internet
✅ Funciona 24/7 
✅ URL permanente
✅ PWA instalável no iPhone
✅ Sem precisar ligar o PC

**Link para compartilhar:** `https://task-manager-voice.vercel.app`

---

## 📞 Suporte

Se algo der errado:

1. Verifique logs no Vercel Dashboard
2. Tente `vercel logs`
3. Consulte documentação: https://vercel.com/docs

**Tudo funcionando? 🚀 Parabéns!**
