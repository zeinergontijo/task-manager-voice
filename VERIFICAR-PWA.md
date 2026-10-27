# ✅ Checklist de Verificação PWA

Use este checklist para verificar se sua PWA está funcionando corretamente.

---

## 🖥️ No PC (Antes de Ir para iPhone)

- [ ] **Node.js instalado?**
  ```bash
  node --version
  ```
  
- [ ] **npm instalado?**
  ```bash
  npm --version
  ```

- [ ] **Pasta `C:\Projetos Claude\agenda` existe?**

- [ ] **Arquivo `.env` preenchido?**
  - [ ] `PORT=3000`
  - [ ] `ANTHROPIC_API_KEY=sk-ant-...`
  - [ ] `FIREBASE_DATABASE_URL=https://...`

- [ ] **Arquivo `firebase-config.json` existe?**

- [ ] **Dependências instaladas?**
  ```bash
  npm install
  ```

- [ ] **Servidor inicia sem erros?**
  ```bash
  npm start
  ```
  - [ ] Mostra "Servidor rodando na porta 3000"

- [ ] **Abrir no navegador do PC:**
  - [ ] `http://localhost:3000` funciona
  - [ ] Interface carrega corretamente
  - [ ] Botão do microfone aparece

---

## 🌐 No Navegador (Chrome/Edge no PC)

- [ ] **DevTools aberto (F12)**
  
- [ ] **Aba Application → Manifest:**
  - [ ] `manifest.json` carrega
  - [ ] Mostra "Gerenciador de Tarefas por Voz"
  - [ ] Tem ícone 🎤

- [ ] **Aba Application → Service Workers:**
  - [ ] `service-worker.js` registrado
  - [ ] Status: "activated and running"

- [ ] **Aba Application → Cache Storage:**
  - [ ] `task-manager-v1` existe
  - [ ] Contém: index.html, style.css, app.js

- [ ] **Console (F12 → Console):**
  - [ ] ✅ "Service Worker registrado com sucesso"
  - [ ] Sem erros vermelhos

- [ ] **Teste do Microfone (PC):**
  - [ ] Clique no botão 🎤
  - [ ] Diga: "Adicionar tarefa: teste"
  - [ ] Vê a transcrição aparecer
  - [ ] Tarefa é criada

---

## 📱 No iPhone - Preparação

- [ ] **iPhone conectado ao WiFi**
  
- [ ] **Mesmo WiFi do PC?**
  
- [ ] **Sabe o IP do PC?**
  ```bash
  # No PC, execute:
  ipconfig
  # Procure por "IPv4 Address"
  ```

- [ ] **Safari aberto no iPhone**

- [ ] **Link digitado corretamente:**
  ```
  http://192.168.1.100:3000
  (Troque pelo seu IP)
  ```

---

## 🍎 No Safari do iPhone

- [ ] **Página carrega corretamente?**

- [ ] **Vê o título "Gerenciador de Tarefas"?**

- [ ] **Botão 🎤 aparece?**

- [ ] **Caixa de login aparece (primeira vez)?**
  - [ ] Digite seu email
  - [ ] Clique em "Entrar"

- [ ] **Lista de tarefas aparece?**

- [ ] **Permissão do Microfone:**
  - [ ] Clique em 🎤
  - [ ] iPhone pergunta: "Permitir acesso ao microfone?"
  - [ ] Clique em "Permitir"

- [ ] **Teste de Voz:**
  - [ ] Fale: "Adicionar tarefa: teste"
  - [ ] Vê a transcrição?
  - [ ] Tarefa aparece na lista?

---

## 📲 Instalar como PWA

- [ ] **Clique em ↗️ Compartilhar** (canto inferior)

- [ ] **Procura "Adicionar à Tela Inicial"?**
  - [ ] Se não ver, role para baixo
  - [ ] Procure por "Adicionar à Tela Inicial"

- [ ] **Dá um nome (ex: "Tarefas")**

- [ ] **Clique em "Adicionar"**

- [ ] **Ícone aparece na tela inicial?**

- [ ] **Ícone tem o emoji 🎤?**

---

## 🎯 Usar a PWA Instalada

- [ ] **Clique no ícone na tela inicial**

- [ ] **App abre em tempo de inicialização rápido?**

- [ ] **Interface completa carrega?**

- [ ] **Clique em 🎤 para falar**

- [ ] **Diga um comando:**
  ```
  "Adicionar tarefa: meu primeiro teste no iPhone"
  ```

- [ ] **Tarefa aparece?**

- [ ] **Teste outros comandos:**
  - [ ] "Listar minhas tarefas"
  - [ ] "Marcar a primeira como feita"
  - [ ] "Listar tarefas completas"

---

## 🔌 Offline (Teste Importante)

- [ ] **Ative Modo Avião no iPhone**

- [ ] **Abra a PWA**

- [ ] **Funciona sem internet?**
  - [ ] Interface carrega?
  - [ ] Botão 🎤 funciona?
  - [ ] Pode falar comandos?

- [ ] **Desative Modo Avião**

- [ ] **Tarefas sincronizaram?**
  - [ ] As tarefas offline apareceram no Firebase?

---

## 💾 Sincronização Firebase

- [ ] **Acesse Firebase Console:**
  https://console.firebase.google.com

- [ ] **Vá para Firestore Database**

- [ ] **Procure pela coleção:**
  ```
  usuarios → {seu-user-id} → tarefas
  ```

- [ ] **Tarefas aparecem no Firebase?**

- [ ] **Dados estão corretos?**
  - [ ] titulo
  - [ ] concluida (true/false)
  - [ ] criadoEm (data)

---

## 🔄 Sincronização Google Drive (Backup)

- [ ] **Rode o backup manual:**
  ```bash
  npm run backup
  ```

- [ ] **Viu mensagens de sucesso?**
  - [ ] ✅ "Google Drive autenticado"
  - [ ] ☁️ "Backup salvo no Google Drive"

- [ ] **Abra Google Drive**

- [ ] **Procure pela pasta "Task Manager Backups"**

- [ ] **Arquivo JSON existe?**
  - [ ] Nome: `backup-tarefas-YYYY-MM-DD.json`

- [ ] **Abra o arquivo no Google Drive**

- [ ] **Vê seus dados?**

---

## 🎵 Recursos Avançados (Opcional)

- [ ] **DevTools no iPhone (se disponível):**
  - [ ] Settings → Safari → Avançado → Web Inspector

- [ ] **Teste performance:**
  - [ ] Abertura da app < 2 segundos
  - [ ] Comandos processados < 3 segundos

- [ ] **Teste outros idiomas:**
  - [ ] Fale em português
  - [ ] Funciona bem?

---

## 🚀 Status Final

Quando todos os itens estiverem marcados:

- ✅ PWA funcionando perfeitamente
- ✅ Dados sincronizados com Firebase
- ✅ Backup automático no Google Drive
- ✅ Funciona offline
- ✅ Pronto para usar

---

## 📊 Resultados

| Componente | Status |
|-----------|--------|
| Servidor | ✅ / ⚠️ / ❌ |
| Frontend | ✅ / ⚠️ / ❌ |
| PWA | ✅ / ⚠️ / ❌ |
| Firebase | ✅ / ⚠️ / ❌ |
| Backup | ✅ / ⚠️ / ❌ |
| iPhone | ✅ / ⚠️ / ❌ |

---

## 💡 Se Algo Falhar

1. **Verifique o console do navegador (F12)**
2. **Procure por mensagens de erro**
3. **Tente recarregar (Ctrl+Shift+R)**
4. **Limpe o cache (Settings → Safari → Limpar Histórico)**
5. **Reinicie o servidor**

---

**Tudo marcado? 🎉 Parabéns! Sua PWA está pronta!**
