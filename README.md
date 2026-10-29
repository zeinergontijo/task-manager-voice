# 📅 Agenda no Claude

Um **servidor MCP** que dá ao Claude acesso às suas tarefas. Não há tela nem app próprio:
você conversa com o Claude (iPhone, computador ou claude.ai), por voz ou texto, e ele
cria, lista, conclui e apaga tarefas sozinho.

Roda na sua assinatura do Claude — **não precisa de chave da API da Anthropic**.

```
Você (voz/texto) → app do Claude → conector "Agenda" → este servidor (Vercel) → Firestore
```

## 🧰 Ferramentas que o Claude recebe

| Ferramenta | O que faz |
|---|---|
| `listar_tarefas` | Lista por situação (em aberto, em andamento, vence hoje, atrasada, realizada) e tipo |
| `resumo_tarefas` | Conta e agrupa as tarefas de um período por situação e tipo |
| `criar_tarefa` | Cria uma tarefa, com tipo, prazo (AAAA-MM-DD), hora (HH:MM) e status opcionais |
| `atualizar_tarefa` | Muda o status, o título, o tipo, o prazo ou a hora |
| `deletar_tarefa` | Apaga uma tarefa |

### Situação da tarefa

| Situação | Quando |
|---|---|
| `em_aberto` | Ainda não começou |
| `em_andamento` | Já começou |
| `realizada` | Concluída |
| `vence_hoje` | Não realizada e o prazo é hoje |
| `atrasada` | Não realizada e com prazo vencido, ou prazo hoje com a hora já passada |

`vence_hoje` e `atrasada` são calculadas pela data de Brasília a cada consulta, não são gravadas.

### Resumo por período

No `resumo_tarefas`, cada tarefa entra no período pela sua **data de referência**:
realizadas pela data em que foram concluídas; as demais pelo prazo, ou pela data de
criação se não tiverem prazo.

Exemplos do que dizer ao Claude:

```
"Anota: pagar a conta de luz até sexta e comprar ração"
"Anota na fazenda: vacinar o gado na segunda"
"Marca dentista quinta às 14h30"
"O que eu ainda tenho pendente?"
"O que tem de Softmax?"
"Comecei a vacinação do gado"
"O que está atrasado?"
"Quantas tarefas eu concluí em outubro?"
"Me dá um resumo da fazenda deste mês"
"Já paguei a luz"
"Apaga a tarefa da ração"
```

## ⚙️ Configuração local

1. `npm install`
2. Coloque as credenciais do Firebase em `firebase-config.json`
   (Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada)
3. Copie `.env.exemplo` para `.env` e preencha:

```env
PORT=3000
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
TAREFAS_EMAIL=seu@email.com
MCP_TOKEN=um_token_longo_e_aleatorio
```

Para gerar o `MCP_TOKEN`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. `npm start` — o servidor responde em `http://localhost:3000/mcp/<MCP_TOKEN>`

## 🚀 Publicar na Vercel

Cada `git push` na `main` publica automaticamente. Em **Vercel → Project → Settings →
Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | O conteúdo inteiro do `firebase-config.json` |
| `FIREBASE_DATABASE_URL` | Mesmo valor do `.env` |
| `TAREFAS_EMAIL` | Mesmo valor do `.env` |
| `MCP_TOKEN` | Mesmo valor do `.env` |
| `OUTRAS_PESSOAS` | Opcional, veja "Mais de uma pessoa" |

A variável `ANTHROPIC_API_KEY` não é mais usada e pode ser removida.

## 👥 Mais de uma pessoa

Cada pessoa tem sua agenda separada e sua própria URL do conector. A pessoa principal
continua em `TAREFAS_EMAIL`/`MCP_TOKEN`; as outras vão em `OUTRAS_PESSOAS`, como
`email:token` separados por vírgula:

```env
OUTRAS_PESSOAS=marcia@email.com:outro_token_longo_e_aleatorio
```

Gere um token novo para cada pessoa (mesmo comando acima) e cadastre a variável também
na Vercel. Cada uma adiciona o conector na própria conta do Claude com a sua URL:
`https://SEU-APP.vercel.app/mcp/TOKEN_DELA`. Quem tem uma URL só enxerga as tarefas
daquela pessoa.

## 🔌 Conectar ao Claude

1. No **claude.ai** (navegador), abra **Configurações → Conectores**
2. Clique em **Adicionar conector personalizado**
3. Nome: `Agenda` — URL: `https://SEU-APP.vercel.app/mcp/SEU_MCP_TOKEN`
4. Salve. O conector passa a aparecer também no app do iPhone.

Na primeira vez que o Claude usar uma ferramenta, ele pede sua permissão; você pode
escolher "sempre permitir".

## 🛡️ Segurança

- A URL do conector contém o `MCP_TOKEN`: **trate-a como uma senha**. Quem tiver a URL
  acessa suas tarefas. Se vazar, gere outro token e atualize na Vercel e no conector.
- O servidor usa o Firebase Admin, que ignora as regras do Firestore. Por isso você pode
  bloquear todo acesso direto ao banco:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 💾 Backup

O backup diário para o Google Drive continua igual — veja `BACKUP-AUTOMATICO.md`.

## 📝 Estrutura de dados

```
usuarios/{base64(email da pessoa)}/tarefas/{taskId}
  ├─ titulo: string
  ├─ status: em_aberto | em_andamento | realizada
  ├─ concluida: boolean (espelho de status = realizada, usado pelo backup)
  ├─ tipo: string (minúsculas, opcional — ex.: fazenda, softmax, pessoal)
  ├─ prazo: string (AAAA-MM-DD, opcional)
  ├─ hora: string (HH:MM, opcional, só com prazo)
  ├─ realizadaEm: timestamp (quando foi concluída)
  ├─ criadoEm: timestamp
  └─ atualizadoEm: timestamp
```
