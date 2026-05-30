# GitHub App — Max Stack (Fase 5)

Comentários automáticos em PR e webhook `pull_request`.

## Opção A — Personal Access Token (rápido)

1. Crie um PAT em GitHub → Settings → Developer settings → Fine-grained token
2. Permissões: **Pull requests** (read/write), **Contents** (read), **Metadata** (read)
3. Copie para `.env`:

```env
GITHUB_TOKEN=ghp_...
```

4. Comente em um PR:

```bash
npm run pr-comment -- RivasCode-Ops/Quadro-Negro 1
npm run pr-comment -- owner/repo 42 --dry-run   # só preview
```

## Opção B — GitHub App (produção)

### 1. Criar App

GitHub → Settings → Developer settings → **GitHub Apps** → New GitHub App

| Campo | Valor |
|-------|--------|
| Name | Max Stack |
| Homepage | https://github.com/RivasCode-Ops/max-coding |
| Webhook URL | `https://seu-tunnel/api/github/webhook` (ou omitir se só CLI) |
| Webhook secret | gere um segredo forte |
| Repository permissions | Contents: Read · Pull requests: Read & write · Metadata: Read |
| Subscribe to events | Pull request |
| Where | Only on this account / selected repos |

Gere e baixe a **private key** (`.pem`).

### 2. Instalar App

Instale o App na org/conta e anote o **Installation ID** (URL ou API).

### 3. Configurar `.env`

```env
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY_PATH=./max-stack-app.pem
GITHUB_INSTALLATION_ID=12345678
GITHUB_WEBHOOK_SECRET=seu-segredo
```

### 4. Webhook local (dev)

Exponha a API com tunnel (ngrok, cloudflared):

```bash
npm start
# tunnel → https://abc.ngrok.io/api/github/webhook
```

Eventos `pull_request` (opened, synchronize) disparam:

1. Checkout do HEAD do PR em `data/pr-checkouts/`
2. Quick scan Max Stack
3. Comentário no PR com health, achados e recomendações

### 5. API

| Método | Path | Body |
|--------|------|------|
| POST | `/api/github/pr-comment` | `{ "ownerRepo": "org/repo", "pullNumber": 1, "mode": "quick" }` |
| POST | `/api/github/webhook` | payload GitHub (raw) |

## Formato do comentário

Markdown com health score, gaps, top achados, recomendações P1/P2 e arquivos alterados no PR.

## Segurança

- Webhook validado via `X-Hub-Signature-256`
- Checkout raso (`--depth 1`) em diretório isolado
- Sem push nem merge — somente leitura + comentário
- `data/pr-checkouts/` no `.gitignore`

## Troubleshooting

| Erro | Solução |
|------|---------|
| `Configure GITHUB_TOKEN ou GitHub App` | Defina auth no `.env` |
| `403` na API | Token sem escopo `pull_requests:write` |
| `git fetch` falha | Git instalado no PATH |
| Webhook 401 | `GITHUB_WEBHOOK_SECRET` incorreto |
