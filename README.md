# Plataforma de Eventos e Ingressos

Plataforma de bilheteria ponta a ponta: organizadores publicam eventos a
partir de catálogos externos reais, clientes reservam lugares e pagam de forma
simulada, e a portaria valida os ingressos na entrada por leitura de QR Code.

## Sobre

O sistema atende três papéis distintos:

- **Organizador** — busca filmes no TMDb ou shows no Ticketmaster e publica
  eventos definindo data, local, capacidade e preço.
- **Cliente** — navega pelo catálogo, reserva um assento (eventos de cinema)
  ou uma quantidade de ingressos (eventos de pista), paga, e recebe ingressos
  com QR Code em "Meus Ingressos".
- **Portaria** — seleciona o evento que está fiscalizando e valida ingressos
  na entrada, pela câmera ou digitando o código.

Os dois fluxos de reserva existem porque correspondem aos dois formatos reais
do mercado de bilheteria: lugar marcado e pista.

## Stack

| Camada       | Tecnologia                                     |
| ------------ | ---------------------------------------------- |
| Front-end    | React + TypeScript, Vite, Tailwind, shadcn/ui  |
| Back-end     | Node.js + Express, TypeScript                  |
| Banco        | PostgreSQL via Prisma                          |
| Autenticação | JWT                                            |
| Documentação | OpenAPI (Swagger UI em `/api-docs`)            |
| Qualidade    | ESLint, Prettier, Husky, Commitlint, GitHub CI |
| Ambiente     | Docker Compose                                 |

O repositório é um monorepo com npm workspaces: `apps/api` (back-end) e
`apps/web` (front-end).

## Documentação

As decisões de produto e de arquitetura estão versionadas junto do código:

- [`docs/PRD.md`](docs/PRD.md) — requisitos de produto e regras de negócio
- [`docs/SPEC.md`](docs/SPEC.md) — modelo de dados, rotas e regras técnicas
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decisões de arquitetura, com as
  alternativas que foram descartadas e por quê
- [`docs/TASKS.md`](docs/TASKS.md) — plano de execução e checklist de progresso

## Pré-requisitos

- **Node.js 24** — a versão está fixada em [`.nvmrc`](.nvmrc); com o nvm
  instalado, `nvm use` na raiz seleciona a correta
- **Docker** e **Docker Compose** — para subir a API e o banco

## Como rodar

### Com Docker (recomendado)

Sobe a API e o PostgreSQL juntos, já compilando o TypeScript:

```bash
docker compose up --build
```

A API responde em `http://localhost:3333` e a documentação interativa fica em
`http://localhost:3333/api-docs`.

Para verificar que está tudo no ar:

```bash
curl http://localhost:3333/health
```

Para derrubar:

```bash
docker compose down
```

### Localmente

Instale as dependências dos dois apps com um único comando na raiz:

```bash
npm install
```

Crie os arquivos de ambiente a partir dos modelos versionados:

```bash
cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env
```

Preencha o `JWT_SECRET` no `apps/api/.env` com um valor aleatório longo. As
chaves de API externas (Asaas, TMDb, Ticketmaster) só serão necessárias
quando as integrações entrarem.

A API precisa de um PostgreSQL acessível. O caminho mais simples é subir só o
banco pelo Compose e rodar a API fora do container:

```bash
docker compose up postgres -d
```

```bash
npm run dev --workspace @eventos/api
```

```bash
npm run dev --workspace @eventos/web
```

O front sobe em `http://localhost:5173`.

## Scripts

Na raiz do repositório:

| Comando                | O que faz                                  |
| ---------------------- | ------------------------------------------ |
| `npm run lint`         | ESLint nos dois apps                       |
| `npm run format`       | Aplica o Prettier                          |
| `npm run format:check` | Verifica a formatação sem alterar arquivos |
| `npm run build`        | Compila os dois apps                       |

## Estrutura

```
.
├── apps/
│   ├── api/          # Express + Prisma
│   └── web/          # React + Vite
├── docs/             # PRD, SPEC, decisões e plano de execução
└── docker-compose.yml
```

## Estado atual

O projeto está em desenvolvimento. A infraestrutura está completa —
monorepo, TypeScript nos dois apps, Docker Compose com PostgreSQL,
documentação OpenAPI, lint e formatação automáticos, e CI a cada push.

O único endpoint implementado até aqui é `GET /health`, que confirma a
conexão com o banco. As funcionalidades de negócio descritas acima ainda não
estão disponíveis; o progresso pode ser acompanhado em
[`docs/TASKS.md`](docs/TASKS.md).
