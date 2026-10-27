# 💾 Backup Automático no Google Drive

Sua aplicação agora tem **backup automático** de todas as tarefas no Google Drive (integrado com seu Google One).

## 🎯 Como Funciona

```
Seu Firestore
      ↓
Exporta todos os dados
      ↓
Salva como JSON
      ↓
Envia para Google Drive
      ↓
Pasta: "Task Manager Backups"
      ↓
✅ Seu Google One faz sync automático
```

## 📋 Dois Modos de Backup

### 1️⃣ **Backup Manual (Um Clique)**
Fazer backup quando quiser:

```bash
npm run backup
```

Isso irá:
- ✅ Exportar todas as tarefas
- ✅ Salvar no Google Drive
- ✅ Mostrar resumo no terminal

### 2️⃣ **Backup Automático (Recomendado)**
Backup automático **todo dia às 02:00 da manhã**:

```bash
npm run backup-scheduler
```

Mantém esse terminal aberto e:
- ✅ Roda automaticamente
- ✅ Todos os dias
- ✅ Mantém últimos 30 dias
- ✅ Deleta backups antigos automaticamente

---

## 🚀 Setup Rápido

### Passo 1: Instalar dependências atualizadas
```bash
npm install
```

### Passo 2: Rodar backup manual (teste)
```bash
npm run backup
```

Você verá:
```
✅ Google Drive autenticado
📤 Iniciando backup em 27/10/2026 10:30:45
📁 Backup local criado: backup-tarefas-2026-10-27.json
📂 Pasta de backup encontrada no Google Drive
☁️ Backup salvo no Google Drive: backup-tarefas-2026-10-27.json
✅ BACKUP CONCLUÍDO COM SUCESSO!
```

### Passo 3: Ativar backup automático (opcional)

#### Opção A: Rodar manualmente no terminal
```bash
npm run backup-scheduler
```
Mantém esse terminal aberto 24/7.

#### Opção B: Agendar com Windows Task Scheduler (recomendado)

**No PowerShell (como administrador):**

```powershell
# 1. Ir para a pasta do projeto
cd "C:\Projetos Claude\agenda"

# 2. Criar tarefa agendada
$taskName = "Task Manager Backup"
$taskPath = "C:\Projetos Claude\agenda\backup-scheduler.js"
$scriptPath = 'C:\Program Files\nodejs\node.exe'

# 3. Criar ação
$action = New-ScheduledTaskAction -Execute $scriptPath -Argument $taskPath -WorkingDirectory "C:\Projetos Claude\agenda"

# 4. Criar gatilho (todos os dias às 02:00)
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

# 5. Criar a tarefa
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName $taskName -Description "Backup automático de tarefas"
```

**Ou via UI do Windows:**
1. **Abrir** → Windows Task Scheduler (Agendador de Tarefas)
2. **Criar Tarefa Básica**
3. **Nome:** "Task Manager Backup"
4. **Gatilho:** Diário às 02:00 AM
5. **Ação:** Executar programa
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `C:\Projetos Claude\agenda\backup-scheduler.js`
   - Começar em: `C:\Projetos Claude\agenda`
6. **Salvar**

---

## 📁 Verificar Backups no Google Drive

1. Abra **Google Drive**
2. Procure pasta **"Task Manager Backups"**
3. Você verá arquivos como:
   - `backup-tarefas-2026-10-27.json`
   - `backup-tarefas-2026-10-26.json`
   - etc...

## 📖 Estrutura do Arquivo de Backup

```json
{
  "dataExportacao": "2026-10-27T10:30:45.123Z",
  "usuarios": [
    {
      "id": "dXN1YXJpbzEyMw==",
      "totalTarefas": 5,
      "tarefas": [
        {
          "id": "tarefa1",
          "titulo": "comprar leite",
          "concluida": false,
          "criadoEm": "2026-10-27T10:30:00Z",
          "atualizadoEm": "2026-10-27T10:30:00Z"
        }
      ]
    }
  ]
}
```

---

## 🔐 Segurança

- ✅ Usa as **mesmas credenciais do Firebase** (seguro)
- ✅ Dados salvos no **seu Google Drive** (privado)
- ✅ Sincroniza com **Google One** automaticamente
- ✅ Não compartilha com ninguém
- ✅ Você controla tudo

---

## 🛠️ Troubleshooting

### "Erro: Cannot find module 'googleapis'"
```bash
npm install
```

### "Erro ao autenticar Google Drive"
- ✅ Verifique se `firebase-config.json` existe
- ✅ Credenciais têm permissão de Drive File

### "Pasta não aparece no Google Drive"
- ✅ Aguarde sincronização (alguns segundos)
- ✅ Recarregue Google Drive (F5)
- ✅ Procure por "Task Manager Backups"

### "Não vejo os arquivos JSON"
- ✅ Backup rodou com sucesso?
- ✅ Verifique o terminal para erros
- ✅ Tente rodar `npm run backup` manualmente

---

## 📊 Limpeza Automática

O script **deleta automaticamente** backups com:
- ❌ Mais de 30 dias
- ✅ Mantém espaço em nuvem
- ✅ Guarda essencialmente últimos 30 dias

**Você pode mudar isso** editando `backup-scheduler.js`:
```javascript
// Linha ~80
dataLimite.setDate(dataLimite.getDate() - 30); // Mudar 30 para outro número
```

---

## 📈 Estatísticas do Backup

Cada backup mostra:
```
✅ BACKUP CONCLUÍDO COM SUCESSO!
📊 Total de usuários: 2
📋 Total de tarefas: 15
⏰ Próximo backup: 28/10/2026 02:00:00
```

---

## 🚨 Recuperação de Dados

Se precisar **restaurar um backup antigo**:

1. Baixe o arquivo JSON do Google Drive
2. Entenda a estrutura
3. Importe manualmente no Firestore (ou crie um script de restore)

---

## 💡 Dicas

- 📅 **Backup diário** garante perda máxima de 1 dia
- 🔄 **Google One** sincroniza em tempo real
- 📱 Acesse backups em qualquer dispositivo (Google Drive)
- 🔒 Dados privados no seu Google Drive
- 💰 Sem custo extra (usa seu Google One existente)

---

## 📞 Suporte

Se algo der errado:
1. Verifique erros no terminal
2. Tente `npm run backup` manualmente
3. Verifique Google Drive
4. Verifique Firebase Console → Firestore

Tudo funcionando? 🎉 Seus dados estão seguros!
