# ⚡ PWA - Guia Rápido (5 Minutos)

## 📱 Instalar no iPhone em 5 Passos

### Passo 1: Iniciar Servidor (PC)

```bash
cd "C:\Projetos Claude\agenda"
npm start
```

Espere ver:
```
✅ Servidor rodando na porta 3000
```

---

### Passo 2: Descobrir IP (PC)

Abra **PowerShell** e execute:
```bash
ipconfig
```

**Procure por:**
```
IPv4 Address: 192.168.1.100  ← Copie este número
```

---

### Passo 3: Abrir no iPhone

1. **Abra Safari no iPhone**
2. **Digite na barra:**
```
http://192.168.1.100:3000
```
(Troque 192.168.1.100 pelo seu IP)

3. **Permita acesso ao microfone**

---

### Passo 4: Instalar como App

1. **Clique em ↗️ Compartilhar** (canto inferior direito)
2. **Procure "Adicionar à Tela Inicial"**
3. **Dê um nome:** "Tarefas" (ou outro)
4. **Clique em Adicionar**

---

### Passo 5: Usar o App

✅ Ícone aparece na tela inicial
✅ Clique para abrir
✅ Permita microfone
✅ **Fale comandos!**

```
"Adicionar tarefa: estudar"
"Listar minhas tarefas"
"Marcar como feita"
```

---

## 🎤 Testes Rápidos

Depois de abrir a app no iPhone, teste:

| Comando | Resultado |
|---------|-----------|
| "Adicionar tarefa: comprar pão" | ✅ Tarefa criada |
| "Listar minhas tarefas" | ✅ Mostra lista |
| "Marcar a primeira como feita" | ✅ Marca |
| "Deletar a primeira" | ✅ Remove |

---

## 📍 Acessar de Qualquer Lugar (Opcional)

Se quer usar fora de casa:

### Usando Ngrok:

1. **Baixe:** https://ngrok.com/download
2. **Execute:**
```bash
ngrok http 3000
```

3. **Copie o link** (algo como `https://abc123.ngrok.io`)
4. **No iPhone:** Cole no Safari
5. **Instale como PWA** (mesmos passos acima)

---

## ✨ Funciona Offline?

Sim! A app funciona **sem internet**:
- ✅ Você fala comandos
- ✅ Armazena localmente
- 🔄 Sincroniza quando conectar

---

## 🐛 Se Algo Der Errado

| Problema | Solução |
|----------|---------|
| "Não conecta" | IP está correto? Tente recarregar |
| "Microfone não funciona" | Permite acesso em Settings → Safari |
| "Tarefas não aparecem" | Faça login novamente |
| "Quer atualizar app?" | Feche e reabra |

---

## 🚀 Próximas Vezes

Depois de instalar:

1. **Clique no ícone** na tela inicial
2. **App abre** em 1 segundo
3. **Funciona offline**
4. **Sincroniza** quando conectar ao WiFi

---

## 💡 Dicas

- 🎤 Fale claro em português
- 📍 Mesmo WiFi da primeira vez? Abre mais rápido
- 🌙 Modo escuro automático
- 💾 Dados salvos localmente + Firebase

---

**Pronto? 🎉**

Abra o Safari no iPhone e comece!
