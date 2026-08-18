# Plataforma de Eventos e Ingressos

Plataforma de bilheteria ponta a ponta: organizadores publicam eventos a
partir de catálogos externos reais, clientes reservam lugares e pagam em
ambiente de sandbox, e a portaria valida os ingressos na entrada por leitura
de QR Code.

## Ambiente publicado

|                     | Endereço                                       |
| ------------------- | ---------------------------------------------- |
| Front-end           | https://eventos-web-iar6.onrender.com          |
| API                 | https://eventos-api-q8oq.onrender.com          |
| Documentação da API | https://eventos-api-q8oq.onrender.com/api-docs |

**Duas limitações do plano gratuito do Render, que afetam quem for testar:**

- **Cold start.** Após 15 minutos sem tráfego, a API hiberna. A primeira
  requisição depois disso leva cerca de um minuto para responder. Se a tela de
  login parecer travada na primeira tentativa, é isso: aguarde e tente de novo.
- **Validade do banco.** O PostgreSQL gratuito expira 30 dias após a criação,
  com 14 dias de carência antes da remoção
  ([documentação do Render](https://render.com/docs/free#free-postgres)).
  Passado esse prazo, o ambiente publicado deixa de funcionar, e o caminho é
  rodar localmente conforme a seção abaixo.

## Contas de teste

Criadas pelo seed, todas com a senha `senha123`:

| Papel       | Email                   | O que faz                                               |
| ----------- | ----------------------- | ------------------------------------------------------- |
| Organizador | `organizador@teste.com` | Publica e cancela eventos                               |
| Cliente     | `cliente1@teste.com`    | Reserva, paga e cancela                                 |
| Cliente     | `cliente2@teste.com`    | Segundo cliente, para testar disputa pelo mesmo assento |
| Portaria    | `portaria@teste.com`    | Valida ingressos na entrada                             |

## O fluxo completo, para avaliar em cinco minutos

1. Entre como **cliente1** e escolha um evento de cinema no catálogo.
2. Reserve um assento. A partir daí você tem 15 minutos para pagar, com
   contador na tela.
3. No checkout, escolha cartão e use o botão "Aprova", que preenche o cartão
   de teste do sandbox. Para ver a recusa, use o botão "Recusa".
4. Com o pagamento confirmado, o ingresso aparece em "Meus ingressos", com o
   QR Code.
5. Em outra aba (ou janela anônima), entre como **portaria**, escolha a mesma
   sessão e valide o código. Ler de novo devolve "já utilizado".
6. Como **organizador**, publique um evento novo a partir do catálogo do TMDb
   ou do Ticketmaster, ou cancele um existente e veja a cascata: reservas e
   ingressos cancelados, assentos liberados e estorno na Asaas.

Pagamento em PIX também funciona e gera QR Code real do sandbox. Como o
webhook da Asaas não alcança um ambiente local, a tela oferece botões para
simular o retorno da cobrança.

## Stack

| Camada       | Tecnologia                                                                          |
| ------------ | ----------------------------------------------------------------------------------- |
| Front-end    | React + TypeScript, Vite, Tailwind, shadcn/ui                                       |
| Back-end     | Node.js + Express, TypeScript                                                       |
| Banco        | PostgreSQL via Prisma 7                                                             |
| Autenticação | JWT, também usado na assinatura dos QR Codes                                        |
| Pagamento    | Asaas (sandbox), com PIX e cartão reais                                             |
| Catálogos    | TMDb (filmes) e Ticketmaster Discovery (shows)                                      |
| Documentação | OpenAPI, com Swagger UI em `/api-docs`                                              |
| Testes       | Jest contra PostgreSQL real, mais uma suíte de contrato com o provedor de pagamento |
| Qualidade    | ESLint, Prettier, Husky, Commitlint, GitHub Actions                                 |
| Ambiente     | Docker Compose                                                                      |

Monorepo com npm workspaces: `apps/api` (back-end) e `apps/web` (front-end).

## Pré-requisitos

- **Node.js 24**, fixado em [`.nvmrc`](.nvmrc). Com nvm instalado, `nvm use`
  na raiz seleciona a versão certa.
- **Docker** e **Docker Compose**, para o banco.
- **Chaves de API gratuitas** de [TMDb](https://www.themoviedb.org/settings/api),
  [Ticketmaster](https://developer.ticketmaster.com/) e
  [Asaas sandbox](https://sandbox.asaas.com/). Sem elas o app sobe, mas a
  busca no catálogo e o pagamento não funcionam.

## Como rodar

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Preencha o `apps/api/.env`: um valor aleatório longo em `JWT_SECRET` e as três
chaves de API. Depois:

```bash
docker compose up postgres -d
npm run db:migrate:deploy --workspace @eventos/api
npm run db:seed --workspace @eventos/api
```

E, em dois terminais:

```bash
npm run dev --workspace @eventos/api
npm run dev --workspace @eventos/web
```

O front sobe em `http://localhost:5173`, a API em `http://localhost:3333`, e a
documentação interativa em `http://localhost:3333/api-docs`.

### Só a API, em container

```bash
docker compose up --build
```

Sobe API e banco juntos. O front continua fora do Compose de propósito: em
desenvolvimento ele ganha recarga instantânea pelo servidor do Vite, que um
container só atrapalharia, e em produção ele é servido como Static Site no
Render, junto da API (blueprint em `render.yaml`).

## Variáveis de ambiente

**`apps/api/.env`**

| Variável                 | Para que serve                                       |
| ------------------------ | ---------------------------------------------------- |
| `DATABASE_URL`           | Conexão com o PostgreSQL                             |
| `JWT_SECRET`             | Assina os tokens de sessão e o conteúdo dos QR Codes |
| `CORS_ORIGIN`            | Origens do front autorizadas, separadas por vírgula  |
| `ASAAS_API_KEY`          | Chave do sandbox de pagamento                        |
| `TMDB_API_KEY`           | Catálogo de filmes                                   |
| `TICKETMASTER_API_KEY`   | Catálogo de shows                                    |
| `PORT`, `NODE_ENV`, `TZ` | Porta, ambiente e fuso (fixado em UTC)               |

**`apps/web/.env`**

| Variável       | Para que serve  |
| -------------- | --------------- |
| `VITE_API_URL` | URL base da API |

## Testes

A suíte principal roda contra um PostgreSQL real, em banco separado e
descartável: o que ela precisa provar é disputa por linha dentro de transação,
e mock de ORM não reproduz isso.

```bash
cp apps/api/.env.test.example apps/api/.env.test
docker compose --profile test up -d postgres-test
npm test --workspace @eventos/api
```

Existe uma segunda suíte, que fala com o sandbox da Asaas de verdade e
verifica que o provedor ainda aceita o que enviamos. Ela roda sob demanda,
usando a `ASAAS_API_KEY` do `apps/api/.env`:

```bash
npm run test:integration --workspace @eventos/api
```

As duas são separadas de propósito: vermelho na primeira significa erro no
nosso código, vermelho na segunda significa mudança no provedor ou rede fora.

## Scripts

Na raiz:

| Comando                | O que faz                                  |
| ---------------------- | ------------------------------------------ |
| `npm run lint`         | ESLint nos dois apps                       |
| `npm run format`       | Aplica o Prettier                          |
| `npm run format:check` | Verifica a formatação sem alterar arquivos |
| `npm run build`        | Compila os dois apps                       |

Em `apps/api` (com `--workspace @eventos/api`):

| Comando             | O que faz                          |
| ------------------- | ---------------------------------- |
| `db:migrate:deploy` | Aplica as migrations               |
| `db:seed`           | Semeia usuários e eventos de teste |
| `db:generate`       | Gera o client do Prisma            |
| `test`              | Suíte principal                    |
| `test:integration`  | Suíte de contrato com a Asaas      |

## Documentação do processo

As decisões estão versionadas junto do código, e não em um documento
separado da implementação:

- [`docs/PRD.md`](docs/PRD.md) — requisitos de produto e regras de negócio
- [`docs/SPEC.md`](docs/SPEC.md) — modelo de dados, rotas e regras técnicas
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decisões de arquitetura, com as
  alternativas descartadas e o motivo
- [`docs/TASKS.md`](docs/TASKS.md) — plano de execução em blocos, dívidas
  técnicas e registro de revisões
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — como a IA foi usada, o que foi
  feito sem ela, e onde discordei das sugestões

## Estrutura

```
.
├── apps/
│   ├── api/          # Express + Prisma + Jest
│   └── web/          # React + Vite
├── docs/             # PRD, SPEC, decisões, plano e uso de IA
├── docker-compose.yml
└── render.yaml       # Blueprint do ambiente publicado
```
