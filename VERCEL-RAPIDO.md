# ⚡ Deploy Vercel - 5 Minutos

## 🎯 Resumo Ultra-Rápido

```
GitHub (1 min) → Vercel (2 min) → Link Permanente (1 min) = 4 minutos
```

---

## 📋 Checklist Rápido

- [ ] Conta GitHub criada: https://github.com/signup
- [ ] Pasta do projeto: `C:\Projetos Claude\agenda`
- [ ] Git instalado: `git --version`

---

## 🚀 5 Passos

### Passo 1: Configurar Git (1 minuto)

```bash
cd "C:\Projetos Claude\agenda"
git config --global user.name "Seu Nome"
git config --global user.email "zeiner@gmail.com"
git init
git add .
git commit -m "Deploy no Vercel"
```

### Passo 2: Criar Repo GitHub (1 minuto)

1. Abra: https://github.com/new
2. Nome: `task-manager-voice`
3. Clique **Create**

### Passo 3: Conectar com GitHub (1 minuto)

```bash
git remote add origin https://github.com/seu-username/task-manager-voice.git
git branch -M main
git push -u origin main
```

**Troque `seu-username` pelo seu username!**

### Passo 4: Deploy Vercel (1 minuto)

1. Abra: https://vercel.com/signup
2. **Continue with GitHub**
3. Autorize
4. **Add New Project**
5. Procure: `task-manager-voice`
6. Clique **Import**

### Passo 5: Variáveis de Ambiente (1 minuto)

No formulário do Vercel, adicione:

```
ANTHROPIC_API_KEY=sk-ant-...
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
```

Clique **Deploy**

**Aguarde 2-3 minutos...**

---

## ✅ Pronto!

Você receberá um link como:

```
https://task-manager-voice.vercel.app
```

---

## 🍎 No iPhone

1. Safari: `https://task-manager-voice.vercel.app`
2. ↗️ Compartilhar → Adicionar à Tela Inicial
3. Nome: "Tarefas"
4. Pronto! 🎉

---

## 🔄 Próximas Vezes

Para atualizar o código:

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
```

**Vercel faz deploy automático!** ⚡

---

**Tudo pronto? Comece agora! 🚀**
