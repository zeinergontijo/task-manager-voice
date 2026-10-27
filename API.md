# 📡 Documentação da API

## Endpoints

### 1. POST /api/comando
Processa um comando de voz (texto) e executa a ação correspondente.

**Request:**
```json
{
  "comando": "Adicionar tarefa: comprar leite",
  "userId": "usuario123"
}
```

**Response (Sucesso):**
```json
{
  "acao": "criar",
  "resposta": "Tarefa \"comprar leite\" criada com sucesso!",
  "dados": {
    "id": "tarefa123"
  }
}
```

**Response (Erro):**
```json
{
  "erro": "Comando e userId são obrigatórios"
}
```

**Ações suportadas:**
- `criar` - Cria uma nova tarefa
- `listar` - Lista tarefas pendentes
- `listar_completas` - Lista tarefas completas
- `completar` - Marca tarefa como feita
- `deletar` - Remove uma tarefa

---

### 2. GET /api/tarefas/:userId
Lista tarefas do usuário.

**Query Parameters:**
```
filtro=pendentes   (padrão)
filtro=completas
```

**Request:**
```
GET /api/tarefas/usuario123?filtro=pendentes
```

**Response:**
```json
{
  "tarefas": [
    {
      "id": "tarefa1",
      "titulo": "comprar leite",
      "concluida": false,
      "criadoEm": "2026-10-27T10:30:00Z"
    },
    {
      "id": "tarefa2",
      "titulo": "estudar JavaScript",
      "concluida": false,
      "criadoEm": "2026-10-27T09:15:00Z"
    }
  ]
}
```

---

### 3. PATCH /api/tarefas/:userId/:tarefaId/toggle
Alterna o status da tarefa (completa/pendente).

**Request:**
```
PATCH /api/tarefas/usuario123/tarefa1/toggle
```

**Response:**
```json
{
  "mensagem": "Tarefa marcada como completa"
}
```

---

### 4. DELETE /api/tarefas/:userId/:tarefaId
Remove uma tarefa.

**Request:**
```
DELETE /api/tarefas/usuario123/tarefa1
```

**Response:**
```json
{
  "mensagem": "Tarefa deletada com sucesso"
}
```

---

## Modelo de Dados (Firestore)

### Coleção: usuarios/{userId}/tarefas

```
{
  "titulo": string,           // Texto da tarefa
  "concluida": boolean,       // Status da tarefa
  "criadoEm": timestamp,      // Data de criação
  "atualizadoEm": timestamp   // Data de última atualização
}
```

### Exemplo:
```
usuarios/
  └─ dXN1YXJpbzEyMw==/ (userId codificado em base64)
     └─ tarefas/
        ├─ tarefa1
        │  ├─ titulo: "comprar leite"
        │  ├─ concluida: false
        │  ├─ criadoEm: 2026-10-27T10:30:00Z
        │  └─ atualizadoEm: 2026-10-27T10:30:00Z
        │
        └─ tarefa2
           ├─ titulo: "estudar JavaScript"
           ├─ concluida: false
           ├─ criadoEm: 2026-10-27T09:15:00Z
           └─ atualizadoEm: 2026-10-27T09:15:00Z
```

---

## Processamento de Comandos

### Fluxo:
1. **Frontend** captura áudio com Web Speech API
2. **Frontend** converte áudio para texto
3. **Frontend** envia texto para `/api/comando`
4. **Backend** processa com Claude API para extrair intenção
5. **Backend** executa ação no Firestore
6. **Backend** retorna resposta
7. **Frontend** atualiza UI e lista de tarefas

### Exemplo de Processamento:

**Entrada:** "Adicionar tarefa: comprar pão"

**Processamento Claude:**
```
Sistema: Você é um assistente que processa comandos de gerenciamento de tarefas...
Usuário: Adicionar tarefa: comprar pão

Claude retorna:
{
  "acao": "criar",
  "titulo": "comprar pão",
  "resposta": "Tarefa \"comprar pão\" criada com sucesso!"
}
```

**Resultado:** Tarefa é criada no Firestore

---

## Tratamento de Erros

### Códigos HTTP:

| Código | Significado |
|--------|------------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 404 | Recurso não encontrado |
| 500 | Erro no servidor |

### Respostas de Erro:

```json
{
  "erro": "Descrição do erro"
}
```

---

## Autenticação

Atualmente usa **userId simples** (email em Base64).

### Para produção, implemente:
- OAuth 2.0 com Google
- Firebase Authentication
- JWT tokens

---

## Rate Limiting (Opcional)

Implementar rate limiting para evitar abuso:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // 100 requisições por 15 minutos
});

app.use('/api/', limiter);
```

---

## CORS

Atualmente permite requisições de qualquer origem. Para produção:

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://seu-dominio.com',
  credentials: true
}));
```

---

## Exemplos com cURL

### Criar tarefa:
```bash
curl -X POST http://localhost:3000/api/comando \
  -H "Content-Type: application/json" \
  -d '{
    "comando": "Adicionar tarefa: estudar",
    "userId": "usuario123"
  }'
```

### Listar tarefas:
```bash
curl http://localhost:3000/api/tarefas/usuario123?filtro=pendentes
```

### Marcar como feita:
```bash
curl -X PATCH http://localhost:3000/api/tarefas/usuario123/tarefa1/toggle
```

### Deletar:
```bash
curl -X DELETE http://localhost:3000/api/tarefas/usuario123/tarefa1
```

---

## Documentação Adicional

- [Anthropic API](https://docs.anthropic.com)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
