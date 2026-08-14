# TASKS.md — Plano de Execução e Checklist

> Guia de implementação, dividido em blocos sequenciais. Cada bloco só começa
> depois que o anterior foi revisado e aprovado pelo desenvolvedor. Dentro de
> cada bloco, o trabalho é quebrado em **tarefas atômicas** — pequenas o
> suficiente para mapear a ~1 commit cada, com critério de "pronto" objetivo,
> reduzindo a chance de o agente que implementa inventar escopo não
> especificado.

---

## Regras para o Agente (IA) Seguir

1. **Um bloco por vez, na ordem.** Não pular, não antecipar tarefas de blocos
   futuros, mesmo que pareça mais eficiente.
2. **Antes de começar a implementar um bloco**, apresentar as issues
   completas daquele bloco (título, labels, descrição e critério de "pronto")
   para o desenvolvedor cadastrar no GitHub. A IA nunca presume que a issue
   já existe.
3. **Uma tarefa atômica por vez**, na ordem da tabela. Ao concluir, sugerir
   uma mensagem de commit no padrão
   [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`,
   `fix:`, `chore:`, `docs:`, `test:`) — o commit em si é feito pelo
   desenvolvedor.
4. **Marcar `Verificado?` como `[x]` somente após confirmação do
   desenvolvedor** de que testou e aprovou aquela tarefa especificamente. Até
   lá, usar `[~]` (implementada, aguardando validação). A IA nunca marca
   `[x]` sozinha.
5. **Não avançar para a próxima tarefa atômica** se a anterior depender dela
   e ainda estiver `[ ]` ou `[~]` sem aprovação — verificar a coluna
   **Referência** para saber se a tarefa depende de uma decisão já registrada
   em `DECISIONS.md`, `SPEC.md` ou `PRD.md`; se a referência não cobrir algo
   necessário, parar e perguntar antes de assumir.
6. **Ao concluir todas as tarefas de um bloco**, informar quais issues podem
   ser fechadas (por título) — quem fecha no GitHub é sempre o
   desenvolvedor.
7. **Checkpoint obrigatório de revisão**: ao final de cada bloco, parar e
   pedir para o desenvolvedor testar manualmente todas as funcionalidades
   daquele bloco. Não iniciar o próximo bloco sem aprovação explícita.
8. **Mudança de decisão já registrada**: se surgir necessidade de mudar algo
   já decidido em `DECISIONS.md`, `SPEC.md` ou `PRD.md`, avisar o
   desenvolvedor e propor a atualização — nunca mudar silenciosamente.
9. **Atualizar `AI_USAGE.md`** incrementalmente, conforme cada bloco é
   concluído.

### Legenda da coluna "Verificado?"

| Símbolo | Significado |
|---|---|
| `[ ]` | Não iniciado |
| `[~]` | Implementado, aguardando validação do desenvolvedor |
| `[x]` | Validado e aprovado pelo desenvolvedor |

---

## Bloco 0 — Setup e Infraestrutura

**Objetivo:** ter o esqueleto do monorepo rodando (front, back, banco),
antes de qualquer funcionalidade de negócio.

**Issues para cadastrar no GitHub**

> **A ordem das issues abaixo é a ordem de execução.** A tabela de tarefas
> atômicas mais adiante está ordenada por ID, não por execução — ela é o
> controle do que já foi feito, e a issue é a versão legível do trabalho.
> Por isso os IDs não aparecem em sequência contínua ao seguir as issues.

```
Título: [infra] Setup inicial do monorepo (apps/web, apps/api, docs/)
Labels: infra

Esqueleto do monorepo antes de qualquer funcionalidade de negócio: dois
apps (apps/web e apps/api) sob um workspace único, ambos em TypeScript.

**Raiz**
- [ ] Criar as pastas apps/web, apps/api e docs/
- [ ] Criar o .gitignore
- [ ] Criar o package.json da raiz com os workspaces (apps/*)
- [ ] Fixar a versão do Node (.nvmrc + engines)

**API (apps/api)**
- [ ] Inicializar com Express + TypeScript
- [ ] Criar as pastas src/routes, src/controllers, src/services,
      src/middlewares e src/config
- [ ] Criar o .env.example

**Web (apps/web)**
- [ ] Criar com Vite (template react-ts)
- [ ] Configurar o Tailwind
- [ ] Instalar shadcn/ui com tema próprio
- [ ] Criar o .env.example

Pronto quando: npm install na raiz resolve os dois apps e ambos sobem
localmente.

Detalhamento em docs/TASKS.md (Bloco 0).
```

```
Título: [infra] Configurar qualidade de código e padronização de commits
Labels: infra

Padronização automática de estilo e de histórico, configurada na raiz do
workspace. Vem cedo de propósito: formatar depois obrigaria a um commit
que toca todos os arquivos do projeto, e cada commit feito antes do
Commitlint escapa da validação de mensagem.

**Estilo**
- [ ] Criar o .editorconfig
- [ ] Configurar o ESLint com typescript-eslint nos dois apps
- [ ] Configurar o Prettier integrado ao ESLint

**Hooks**
- [ ] Instalar o Husky (pre-commit e commit-msg)
- [ ] Configurar o lint-staged
- [ ] Configurar o Commitlint com config-conventional

**Verificação**
- [ ] Confirmar que commit com mensagem fora do padrão é rejeitado
- [ ] Confirmar que commit com erro de lint é bloqueado

Pronto quando: os dois cenários de verificação acima falham como
esperado.

Detalhamento em docs/TASKS.md (Bloco 0).
```

```
Título: [infra] Configurar templates de Issue/PR e CI no GitHub
Labels: infra

Os hooks locais dependem da máquina de quem commita. O CI é a camada que
roda independente disso.

- [ ] Criar o template de issue (.github/ISSUE_TEMPLATE/)
- [ ] Criar o .github/PULL_REQUEST_TEMPLATE.md
- [ ] Criar o workflow de CI rodando lint nos PRs
- [ ] Abrir um PR de teste e confirmar que o workflow executa

Pronto quando: issue e PR carregam o template automaticamente e o lint
roda no PR.

Detalhamento em docs/TASKS.md (Bloco 0).
```

```
Título: [back-end] Configurar Prisma e conexão com o banco
Labels: back-end

Prisma inicializado e uma rota de health-check confirmando que a API
enxerga o banco. A modelagem das entidades vem depois — aqui é só a
conexão de pé.

- [ ] Rodar prisma init e configurar o datasource
- [ ] Criar a rota GET /health verificando a conexão com o banco

Pronto quando: GET /health responde OK com o banco conectado.

Detalhamento em docs/TASKS.md (Bloco 0).
```

```
Título: [infra] Configurar Docker Compose (API + Postgres)
Labels: infra

Ambiente local reprodutível: API e Postgres subindo com um comando só.
Como a API é TypeScript, a imagem precisa compilar antes de rodar — o
container executa o output em dist/, não o fonte.

- [ ] Escrever o Dockerfile da API
- [ ] Criar o .dockerignore
- [ ] Escrever o docker-compose.yml (api + postgres)
- [ ] Subir com docker-compose up e confirmar o GET /health

Pronto quando: docker-compose up compila e sobe API + banco sem erro.

Detalhamento em docs/TASKS.md (Bloco 0).
```

```
Título: [back-end] Configurar Swagger (OpenAPI) para documentação da API
Labels: back-end

Documentação interativa servida pela própria aplicação em /api-docs, em
vez de uma coleção Postman que precisaria ser baixada e importada (ver
docs/DECISIONS.md). O Bearer JWT já fica configurado agora, para os
endpoints protegidos que virão.

- [ ] Configurar o swagger-ui-express com a definição OpenAPI
- [ ] Servir a interface em GET /api-docs
- [ ] Declarar o esquema de segurança Bearer JWT
- [ ] Documentar o GET /health

Pronto quando: /api-docs carrega com o GET /health documentado.

Detalhamento em docs/TASKS.md (Bloco 0).
```

```
Título: [docs] Criar README inicial do projeto
Labels: docs

Versão inicial do README, expandida conforme o projeto avança.

- [ ] Escrever o README (descrição, stack e links para docs/)

Pronto quando: o README apresenta o projeto e aponta para a documentação
existente.

Detalhamento em docs/TASKS.md (Bloco 0).
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 0.1 | 0.1.01 | Criar estrutura de pastas do monorepo (`apps/web`, `apps/api`, `docs/`) | raiz | DECISIONS.md — Estrutura de Diretórios | [~] |
| 0.1 | 0.1.02 | Criar `.gitignore` na raiz (`node_modules`, `.env` e variantes **com exceção de `.env.example`**, `dist`, `coverage`, `.claude/settings.local.json`) — **antes** de qualquer `npm install`, para o `node_modules` nunca chegar a aparecer no versionamento | raiz | - | [~] |
| 0.1 | 0.1.03 | Criar `package.json` na raiz com npm workspaces (`apps/*`) — base para Husky, lint-staged e Commitlint, que vivem na raiz junto ao `.git` | raiz | DECISIONS.md — Organização do repositório | [~] |
| 0.1 | 0.1.04 | Criar `.nvmrc` e campo `engines` fixando a versão do Node (reprodutibilidade do ambiente) | raiz | - | [~] |
| 0.1 | 0.1.05 | Criar `.env.example` em `apps/api` (DATABASE_URL, JWT_SECRET, ASAAS_API_KEY, TMDB_API_KEY, TICKETMASTER_API_KEY) | apps/api | - | [~] |
| 0.1 | 0.1.06 | Criar `.env.example` em `apps/web` (VITE_API_URL) | apps/web | - | [~] |
| 0.2 | 0.2.01 | Inicializar `apps/api` (`package.json` + Express) | apps/api | DECISIONS.md — Back-end | [~] |
| 0.2 | 0.2.02 | Configurar TypeScript em `apps/api` (`tsconfig.json`, `tsx` para dev, script de build via `tsc`, `@types/*`) | apps/api | DECISIONS.md — Linguagem | [~] |
| 0.2 | 0.2.03 | Carregamento de variáveis de ambiente via `--env-file-if-exists` nativo do Node (sem `dotenv`), nos scripts `dev` e `start` | apps/api | DECISIONS.md — Variáveis de ambiente | [~] |
| 0.2 | 0.2.04 | Criar estrutura de pastas (`routes/`, `controllers/`, `services/`, `middlewares/`, `config/`) | apps/api | - | [~] |
| 0.2 | 0.2.05 | Criar rota `GET /health` | apps/api | - | [ ] |
| 0.2 | 0.2.06 | Inicializar Prisma (`prisma init`) | apps/api | DECISIONS.md — ORM | [ ] |
| 0.3 | 0.3.01 | Inicializar `apps/web` com Vite + React + TypeScript (template `react-ts`) | apps/web | DECISIONS.md — Front-end, Linguagem | [~] |
| 0.3 | 0.3.02 | Instalar e configurar Tailwind CSS | apps/web | DECISIONS.md — Estilização | [~] |
| 0.3 | 0.3.03 | Instalar shadcn/ui + inicializar tema base customizado (paleta, tipografia) | apps/web | DECISIONS.md — Estilização | [~] |
| 0.4 | 0.4.01 | Criar `Dockerfile` da API (build `tsc` → `dist/`, execução do output compilado) | apps/api | DECISIONS.md — Linguagem, Containerização | [ ] |
| 0.4 | 0.4.02 | Criar `.dockerignore` (`node_modules`, `.env`, `dist`) — evita inflar o contexto de build e vazar segredo para dentro da imagem | apps/api | - | [ ] |
| 0.4 | 0.4.03 | Criar `docker-compose.yml` (serviços `api` + `postgres`) | raiz | DECISIONS.md — Containerização | [ ] |
| 0.4 | 0.4.04 | Testar: `docker-compose up` compila o TypeScript e sobe API + banco sem erro | raiz | - | [ ] |
| 0.4 | 0.4.05 | Testar: `GET /health` responde 200 com banco conectado | raiz | - | [ ] |
| 0.5 | 0.5.01 | Criar `.editorconfig` na raiz | raiz | - | [~] |
| 0.5 | 0.5.02 | Instalar e configurar ESLint + `typescript-eslint` (`apps/api` e `apps/web`) | raiz | DECISIONS.md — Qualidade de código | [~] |
| 0.5 | 0.5.03 | Instalar e configurar Prettier | raiz | - | [~] |
| 0.5 | 0.5.04 | Instalar Husky e configurar hooks (`pre-commit`, `commit-msg`) | raiz | - | [~] |
| 0.5 | 0.5.05 | Instalar lint-staged (roda ESLint + Prettier nos arquivos staged) | raiz | - | [~] |
| 0.5 | 0.5.06 | Instalar Commitlint + `@commitlint/config-conventional` | raiz | - | [~] |
| 0.5 | 0.5.07 | Testar: commit com mensagem fora do padrão Conventional Commits deve ser rejeitado | raiz | - | [ ] |
| 0.5 | 0.5.08 | Testar: commit com código mal formatado/lint quebrado deve ser bloqueado | raiz | - | [ ] |
| 0.6 | 0.6.01 | Criar `.github/ISSUE_TEMPLATE/` (template de issue padronizado) | raiz | - | [ ] |
| 0.6 | 0.6.02 | Criar `.github/PULL_REQUEST_TEMPLATE.md` | raiz | - | [ ] |
| 0.6 | 0.6.03 | Criar workflow `.github/workflows/ci.yml` rodando lint em cada PR | raiz | - | [ ] |
| 0.6 | 0.6.04 | Testar: abrir um PR de teste e confirmar que o CI executa o lint | raiz | - | [ ] |
| 0.7 | 0.7.01 | Instalar e configurar `swagger-ui-express` em `apps/api` | apps/api | DECISIONS.md — Documentação de API | [ ] |
| 0.7 | 0.7.02 | Expor documentação interativa em `GET /api-docs` | apps/api | DECISIONS.md — Documentação de API | [ ] |
| 0.7 | 0.7.03 | Configurar esquema de segurança Bearer JWT no Swagger | apps/api | DECISIONS.md — Documentação de API | [ ] |
| 0.7 | 0.7.04 | Documentar `GET /health` no Swagger (valida o setup) | apps/api | - | [ ] |
| 0.8 | 0.8.01 | Criar `README.md` inicial (título, descrição, stack, links para `docs/`) | raiz | - | [ ] |

**Checkpoint de revisão:** dev confirma que `docker-compose up` sobe tudo, o
health-check responde, o front roda com `vite dev`, commits fora do padrão
(mensagem ou lint) são bloqueados automaticamente, `/api-docs` carrega o
Swagger, e o CI roda no PR de teste.

---

## Bloco 1 — Modelagem de Dados

**Objetivo:** schema completo no banco, com dados de teste semeados.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Criar schema Prisma completo
Labels: back-end
Descrição: Modelar no schema.prisma as entidades User, Evento, Assento,
Reserva, Ingresso e Pagamento, conforme docs/SPEC.md §1, incluindo os
relacionamentos (atenção: Reserva 1:N Ingresso), o campo expiraEm em
Reserva, e a constraint de unicidade de assento por evento. Definir
convenção de datas em UTC. Rodar a primeira migration.
Pronto quando: migration aplicada com sucesso e todas as entidades
visíveis no Prisma Studio.
```

```
Título: [back-end] Script de seed com dados de teste
Labels: back-end
Descrição: Criar script de seed que popula: 1 organizador, 2 clientes,
1 usuário de portaria, 1 evento tipo CINEMA com assentos, 1 evento tipo
SHOW com estoque, além de 1 reserva paga com ingresso VALIDO e 1 ingresso
já UTILIZADO, conforme docs/PRD.md §5.
Pronto quando: rodar o script de seed popula o banco corretamente,
validado via Prisma Studio.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 1.1 | 1.1.01 | Definir model `User` no `schema.prisma` | apps/api | SPEC.md §1.1 | [ ] |
| 1.1 | 1.1.02 | Definir model `Evento` no `schema.prisma` | apps/api | SPEC.md §1.2 | [ ] |
| 1.1 | 1.1.03 | Definir model `Assento` + constraint `@@unique([eventoId, fileira, numero])` | apps/api | SPEC.md §1.3 | [ ] |
| 1.1 | 1.1.04 | Definir model `Reserva` (incl. `expiraEm` e status `EXPIRADA`) | apps/api | SPEC.md §1.4 | [ ] |
| 1.1 | 1.1.05 | Definir model `Ingresso` (relação 1:N com `Reserva`) | apps/api | SPEC.md §1.5 | [ ] |
| 1.1 | 1.1.06 | Definir model `Pagamento` | apps/api | SPEC.md §1.6 | [ ] |
| 1.1 | 1.1.07 | Definir relacionamentos (FKs) entre os models | apps/api | SPEC.md §1.7 | [ ] |
| 1.1 | 1.1.08 | Rodar primeira migration (`prisma migrate dev`) | apps/api | - | [ ] |
| 1.2 | 1.2.01 | Seed: 1 usuário organizador | apps/api/prisma | PRD.md §5 | [ ] |
| 1.2 | 1.2.02 | Seed: 2 usuários clientes | apps/api/prisma | PRD.md §5 | [ ] |
| 1.2 | 1.2.03 | Seed: 1 usuário portaria | apps/api/prisma | PRD.md §5 | [ ] |
| 1.2 | 1.2.04 | Seed: 1 evento tipo CINEMA com assentos | apps/api/prisma | PRD.md §5 | [ ] |
| 1.2 | 1.2.05 | Seed: 1 evento tipo SHOW com estoque | apps/api/prisma | PRD.md §5 | [ ] |
| 1.2 | 1.2.06 | Seed: 1 reserva paga com ingresso `VALIDO` (para testar portaria e link) | apps/api/prisma | PRD.md §5 | [ ] |
| 1.2 | 1.2.07 | Seed: 1 ingresso já `UTILIZADO` (para testar retorno "já utilizado") | apps/api/prisma | PRD.md §5 | [ ] |
| 1.2 | 1.2.08 | Definir convenção de datas em UTC (util de data + config do Prisma) | apps/api | PRD.md §3.13 | [ ] |
| 1.2 | 1.2.09 | Testar: validar dados semeados via Prisma Studio | apps/api | - | [ ] |

**Checkpoint de revisão:** dev roda o seed e confirma visualmente os dados
no banco.

---

## Bloco 2 — Autenticação

**Objetivo:** login funcional para os 3 papéis, com rotas protegidas.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Autenticação JWT (registro, login, middleware de papéis)
Labels: back-end
Descrição: Implementar hash de senha (bcrypt), geração/verificação de
JWT, rotas POST /auth/registro (que força role=CLIENTE, conforme
docs/PRD.md §3.12), POST /auth/login, GET /auth/me, e middlewares
authenticate e requireRole(roles[]), conforme docs/SPEC.md §5.1.
Configurar também o CORS da API, já que front e back rodam em origens
distintas (Vite local / Vercel em produção).
Pronto quando: os 3 papéis semeados conseguem logar, cada rota
protegida bloqueia papéis não autorizados, e o front consegue chamar a
API sem erro de CORS.
```

```
Título: [front-end] Tela de login e contexto de autenticação
Labels: front-end
Descrição: Criar client de API base, AuthContext (token, usuário
logado, login, logout), tela de login integrada com POST /auth/login, e
componente de rota protegida por papel (PrivateRoute).
Pronto quando: login funciona na interface para os 3 papéis e rotas
protegidas redirecionam usuários sem permissão.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 2.1 | 2.1.01 | Util de hash de senha (`hashPassword`, `comparePassword` via bcrypt) | apps/api | DECISIONS.md — Autenticação | [ ] |
| 2.1 | 2.1.02 | Service `generateToken(userId, role)` via `jsonwebtoken` | apps/api | DECISIONS.md — Autenticação | [ ] |
| 2.1 | 2.1.03 | Rota `POST /auth/registro` (força `role = CLIENTE`) | apps/api | SPEC.md §5.1, PRD.md §3.12 | [ ] |
| 2.1 | 2.1.04 | Rota `POST /auth/login` | apps/api | SPEC.md §5.1 | [ ] |
| 2.1 | 2.1.05 | Middleware `authenticate` (valida JWT, popula `req.user`) | apps/api | SPEC.md §5.1 | [ ] |
| 2.1 | 2.1.06 | Middleware `requireRole(roles[])` | apps/api | SPEC.md §5.1 | [ ] |
| 2.1 | 2.1.07 | Rota `GET /auth/me` | apps/api | SPEC.md §5.1 | [ ] |
| 2.1 | 2.1.08 | Documentar endpoints de autenticação no Swagger | apps/api | SPEC.md §5.1 | [ ] |
| 2.1 | 2.1.09 | Configurar CORS na API liberando a origem do front (local e produção) — front e back rodam em origens distintas | apps/api | DECISIONS.md — Deploy | [ ] |
| 2.2 | 2.2.01 | Client de API base no front (fetch/axios configurado com `VITE_API_URL`) | apps/web | - | [ ] |
| 2.2 | 2.2.02 | `AuthContext` (token, usuário logado, login, logout) | apps/web | - | [ ] |
| 2.2 | 2.2.03 | Tela de login (formulário + integração com `POST /auth/login`) | apps/web | - | [ ] |
| 2.2 | 2.2.04 | Componente de rota protegida por papel (`PrivateRoute`) | apps/web | - | [ ] |
| 2.2 | 2.2.05 | Testar: login com os 3 papéis semeados + bloqueio de rota indevida | apps/web + apps/api | - | [ ] |

**Checkpoint de revisão:** dev testa login com os 3 papéis semeados e
confirma que rotas protegidas bloqueiam acesso indevido entre papéis.

---

## Bloco 3 — Catálogo Externo e Gestão de Eventos (Organizador)

**Objetivo:** organizador consegue buscar no catálogo externo e publicar
eventos reais.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Integração com TMDb e Ticketmaster Discovery
Labels: back-end
Descrição: Criar clients de integração com as APIs do TMDb (filmes em
cartaz) e Ticketmaster Discovery (eventos), expostos via GET
/catalogo/filmes e GET /catalogo/shows, com cache em memória (TTL ~5min)
e tratamento de rate limit, conforme docs/SPEC.md §5.8.
Pronto quando: ambos os endpoints retornam dados reais das respectivas
APIs externas, sem estourar a cota em uso normal.
```

```
Título: [back-end] CRUD de eventos (organizador)
Labels: back-end
Descrição: Implementar POST /eventos, PUT /eventos/:id, DELETE
/eventos/:id (cancelamento em cascata de reservas e ingressos, conforme
docs/SPEC.md §4.1), GET /eventos e GET /eventos/:id (sem filtro ainda),
permitindo que o organizador publique eventos a partir do catálogo
externo.
Pronto quando: organizador consegue criar, editar e cancelar um evento
via API, e o cancelamento invalida todos os ingressos vendidos.
```

```
Título: [front-end] Painel do organizador
Labels: front-end
Descrição: Criar tela de busca no catálogo externo, formulário de
criação/edição de evento e listagem de eventos do organizador.
Pronto quando: organizador consegue, pela interface, buscar um
filme/show real e publicar um evento de cada tipo.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 3.1 | 3.1.01 | Client de integração com TMDb (busca filmes em cartaz) | apps/api | DECISIONS.md — API externa Cinema | [ ] |
| 3.1 | 3.1.02 | Client de integração com Ticketmaster Discovery (busca eventos) | apps/api | DECISIONS.md — API externa Show | [ ] |
| 3.1 | 3.1.03 | Rota `GET /catalogo/filmes` | apps/api | SPEC.md §5.2 | [ ] |
| 3.1 | 3.1.04 | Rota `GET /catalogo/shows` | apps/api | SPEC.md §5.2 | [ ] |
| 3.1 | 3.1.05 | Cache em memória (TTL ~5 min) das respostas de catálogo | apps/api | SPEC.md §5.8 | [ ] |
| 3.1 | 3.1.06 | Tratamento de rate limit (HTTP 429) das APIs externas | apps/api | SPEC.md §5.8 | [ ] |
| 3.2 | 3.2.01 | Rota `POST /eventos` | apps/api | SPEC.md §5.2 | [ ] |
| 3.2 | 3.2.02 | Rota `PUT /eventos/:id` | apps/api | SPEC.md §5.2 | [ ] |
| 3.2 | 3.2.03 | Rota `DELETE /eventos/:id` — cancelamento em cascata (reservas + ingressos + reembolso) | apps/api | SPEC.md §4.1, PRD.md §3.11 | [ ] |
| 3.2 | 3.2.04 | Rota `GET /eventos` (listagem pública, sem filtro ainda) | apps/api | SPEC.md §5.2 | [ ] |
| 3.2 | 3.2.05 | Rota `GET /eventos/:id` (detalhe público) | apps/api | SPEC.md §5.2 | [ ] |
| 3.2 | 3.2.06 | Documentar endpoints de catálogo e eventos no Swagger | apps/api | SPEC.md §5.2 | [ ] |
| 3.3 | 3.3.01 | Tela de busca no catálogo externo (painel organizador, com debounce ~400ms) | apps/web | SPEC.md §5.8 | [ ] |
| 3.3 | 3.3.02 | Formulário de criação/edição de evento | apps/web | - | [ ] |
| 3.3 | 3.3.03 | Listagem de eventos do organizador | apps/web | - | [ ] |
| 3.3 | 3.3.04 | Testar: publicar 1 evento CINEMA e 1 evento SHOW reais | apps/web + apps/api | - | [ ] |

**Checkpoint de revisão:** dev, logado como organizador, busca um filme
real e um show real e publica um evento de cada tipo.

---

## Bloco 4 — Reserva do Cliente (Assento + Quantidade)

**Objetivo:** cliente navega e reserva, nos dois fluxos, com concorrência
tratada.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Reserva de assento (CINEMA) com controle de concorrência
Labels: back-end
Descrição: Implementar GET /eventos/:id/assentos e POST
/reservas/assento, com prisma.$transaction garantindo que um assento
não seja reservado por dois clientes simultaneamente (docs/SPEC.md
§2.1), e o service de expiração lazy de reservas vencidas (§2.3), com
janela de 15 minutos para pagamento.
Pronto quando: duas tentativas simultâneas de reservar o mesmo assento
resultam em apenas uma reserva bem-sucedida, e uma reserva não paga
libera o assento após 15 minutos.
```

```
Título: [back-end] Reserva por quantidade (SHOW) com controle de concorrência
Labels: back-end
Descrição: Implementar POST /reservas/quantidade e GET
/reservas/minhas, com prisma.$transaction garantindo que a soma de
ingressos reservados nunca ultrapasse a capacidade do evento, conforme
docs/SPEC.md §2.2.
Pronto quando: uma tentativa de reservar mais ingressos do que o
disponível é rejeitada.
```

```
Título: [front-end] Telas de reserva (mapa de assentos + seletor de quantidade)
Labels: front-end
Descrição: Criar listagem de eventos, tela de mapa de assentos
(CINEMA), tela de seleção de quantidade (SHOW) e tela de confirmação de
reserva.
Pronto quando: cliente consegue reservar em ambos os fluxos pela
interface.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 4.1 | 4.1.01 | Rota `GET /eventos/:id/assentos` | apps/api | SPEC.md §5.3 | [ ] |
| 4.1 | 4.1.02 | Service de expiração *lazy* de reservas vencidas (usado antes de consultas/reservas) | apps/api | SPEC.md §2.3, PRD.md §3.10 | [ ] |
| 4.1 | 4.1.03 | Lógica de reserva de assento: `updateMany` condicional (`status = DISPONIVEL`) + checagem de `count`, dentro de transação; define `expiraEm` = +15 min | apps/api | SPEC.md §2.1, §2.3 | [ ] |
| 4.1 | 4.1.04 | Rota `POST /reservas/assento` | apps/api | SPEC.md §5.4 | [ ] |
| 4.1 | 4.1.05 | Lógica de reserva por quantidade com `prisma.$transaction` (define `expiraEm` = +15 min) | apps/api | SPEC.md §2.2, §2.3 | [ ] |
| 4.1 | 4.1.06 | Rota `POST /reservas/quantidade` | apps/api | SPEC.md §5.4 | [ ] |
| 4.1 | 4.1.07 | Rota `GET /reservas/minhas` | apps/api | SPEC.md §5.4 | [ ] |
| 4.1 | 4.1.08 | Documentar endpoints de reserva no Swagger | apps/api | SPEC.md §5.3, §5.4 | [ ] |
| 4.2 | 4.2.01 | Listagem de eventos (cards, sem filtro ainda) | apps/web | - | [ ] |
| 4.2 | 4.2.02 | Tela de mapa de assentos (evento CINEMA) | apps/web | - | [ ] |
| 4.2 | 4.2.03 | Tela de seleção de quantidade (evento SHOW) | apps/web | - | [ ] |
| 4.2 | 4.2.04 | Tela de confirmação de reserva (com contador dos 15 min restantes) | apps/web | PRD.md §3.10 | [ ] |
| 4.2 | 4.2.05 | Testar: reserva nos dois fluxos + reservar mesmo assento 2x deve falhar na 2ª | apps/web + apps/api | - | [ ] |
| 4.2 | 4.2.06 | Testar: reserva não paga expira após 15 min e devolve o estoque | apps/web + apps/api | PRD.md §3.10 | [ ] |

**Checkpoint de revisão:** dev testa reserva nos dois fluxos, incluindo
tentar reservar o mesmo assento duas vezes (a segunda tentativa deve
falhar).

---

## Bloco 5 — Pagamento Simulado

**Objetivo:** reserva vira pagamento confirmado ou recusado, via Asaas
sandbox.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Integração com Asaas sandbox e endpoints de pagamento
Labels: back-end
Descrição: Integrar com o ambiente sandbox do Asaas, implementar POST
/pagamentos/:reservaId/processar, GET /pagamentos/:id (polling), POST
/webhooks/asaas (produção) e POST /pagamentos/:id/simular-callback
(dev/testes), conforme docs/SPEC.md §5.5, com lógica de confirmação
(reserva → PAGA) e recusa (reserva → RECUSADA + libera assento/estoque).
Pronto quando: os dois desfechos (confirmação e recusa) funcionam
corretamente, incluindo a liberação do estoque na recusa.
```

```
Título: [front-end] Tela de checkout
Labels: front-end
Descrição: Criar tela de checkout/pagamento simulado com feedback
visual de confirmação e recusa.
Pronto quando: cliente consegue concluir o pagamento simulado pela
interface e visualizar o resultado.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 5.1 | 5.1.01 | Client de integração com Asaas sandbox | apps/api | DECISIONS.md — Pagamento simulado | [ ] |
| 5.1 | 5.1.02 | Rota `POST /pagamentos/:reservaId/processar` | apps/api | SPEC.md §5.5 | [ ] |
| 5.1 | 5.1.03 | Rota `GET /pagamentos/:id` (consumida via polling) | apps/api | SPEC.md §5.5 | [ ] |
| 5.1 | 5.1.04 | Rota `POST /webhooks/asaas` (ativa em produção) | apps/api | SPEC.md §5.5 | [ ] |
| 5.1 | 5.1.05 | Rota `POST /pagamentos/:id/simular-callback` (dev/testes) | apps/api | SPEC.md §5.5 | [ ] |
| 5.1 | 5.1.06 | Lógica: pagamento confirmado → `Reserva.status = PAGA` e `Assento.status = VENDIDO` (CINEMA) | apps/api | SPEC.md §4.2 | [ ] |
| 5.1 | 5.1.07 | Lógica: pagamento recusado → `Reserva.status = RECUSADA`, libera assento/estoque, sem retentativa | apps/api | PRD.md §3.6, SPEC.md §4.3 | [ ] |
| 5.1 | 5.1.08 | Documentar endpoints de pagamento no Swagger | apps/api | SPEC.md §5.5 | [ ] |
| 5.2 | 5.2.01 | Tela de checkout/pagamento simulado | apps/web | - | [ ] |
| 5.2 | 5.2.02 | Polling do status do pagamento no front | apps/web | SPEC.md §5.5 | [ ] |
| 5.2 | 5.2.03 | Feedback visual de confirmação/recusa | apps/web | - | [ ] |
| 5.2 | 5.2.04 | Testar: os dois desfechos + liberação de assento/estoque na recusa | apps/web + apps/api | - | [ ] |

**Checkpoint de revisão:** dev testa os dois desfechos (confirmação e
recusa) e confirma que a recusa libera o assento/estoque corretamente.

---

## Bloco 6 — Ingresso, QR Code e "Meus Ingressos"

**Objetivo:** primeiro fluxo ponta a ponta completo do lado do cliente.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Geração de ingresso com QR assinado (JWT)
Labels: back-end
Descrição: Ao confirmar pagamento, gerar N ingressos (um por entrada,
conforme docs/PRD.md §3.7), cada um com QR próprio (JWT assinado
contendo ingressoId e eventoId, renderizado via lib qrcode) e link
compartilhável. Implementar GET /ingressos/meus, GET /ingressos/:id e
GET /ingressos/compartilhar/:linkToken.
Pronto quando: uma reserva de N ingressos gera N QRs distintos, todos
visíveis e compartilháveis.
```

```
Título: [front-end] Tela Meus Ingressos e compartilhamento via link
Labels: front-end
Descrição: Criar tela "Meus Ingressos", tela de detalhe do ingresso com
QR renderizado, e botão de compartilhamento via link.
Pronto quando: cliente completa o fluxo ponta a ponta (login → reservar
→ pagar → ver QR) pela interface.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 6.1 | 6.1.01 | Service de geração de JWT assinado do ingresso (payload `ingressoId`, `eventoId`) | apps/api | SPEC.md §3.1 | [ ] |
| 6.1 | 6.1.02 | Integração: gerar **N ingressos** ao confirmar pagamento (1 por entrada) | apps/api | SPEC.md §3.1, PRD.md §3.7 | [ ] |
| 6.1 | 6.1.03 | Service de geração de imagem QR a partir do JWT (lib `qrcode`) | apps/api | DECISIONS.md — QR Code | [ ] |
| 6.1 | 6.1.04 | Geração de `linkCompartilhavel` (token único) | apps/api | SPEC.md §1.5 | [ ] |
| 6.1 | 6.1.05 | Rota `GET /ingressos/meus` | apps/api | SPEC.md §5.6 | [ ] |
| 6.1 | 6.1.06 | Rota `GET /ingressos/:id` | apps/api | SPEC.md §5.6 | [ ] |
| 6.1 | 6.1.07 | Rota `GET /ingressos/compartilhar/:linkToken` (exibe ingresso completo com QR, sem transferir titularidade) | apps/api | SPEC.md §5.6, PRD.md §3.7 | [ ] |
| 6.1 | 6.1.08 | Documentar endpoints de ingresso no Swagger | apps/api | SPEC.md §5.6 | [ ] |
| 6.2 | 6.2.01 | Tela "Meus Ingressos" (lista) | apps/web | - | [ ] |
| 6.2 | 6.2.02 | Tela de detalhe do ingresso com QR renderizado | apps/web | - | [ ] |
| 6.2 | 6.2.03 | Botão de compartilhar link | apps/web | - | [ ] |
| 6.2 | 6.2.04 | Testar: reserva de N ingressos (SHOW) gera N QRs distintos | apps/web + apps/api | PRD.md §3.7 | [ ] |
| 6.2 | 6.2.05 | Testar: fluxo ponta a ponta completo (login cliente → reservar → pagar → ver QR) | apps/web + apps/api | - | [ ] |

**Checkpoint de revisão:** dev percorre o fluxo completo pela primeira vez.
Este é o marco de "fluxo básico rodando de ponta a ponta" que o desafio
pede como prioridade.

---

## Bloco 7 — Portaria: Validação de Ingresso

**Objetivo:** fecha o loop completo do sistema (emissão → validação).

**Issues para cadastrar no GitHub**

```
Título: [back-end] Endpoint de validação de ingresso na portaria
Labels: back-end
Descrição: Implementar POST /portaria/validar (body: codigo +
eventoId), verificando assinatura do JWT, status do ingresso e
correspondência com o evento selecionado, conforme docs/SPEC.md §3.2.
Pronto quando: os 4 cenários de retorno (válido, inválido, já
utilizado, evento errado) funcionam corretamente.
```

```
Título: [front-end] Tela de portaria (câmera + digitação manual)
Labels: front-end
Descrição: Criar tela de seleção do evento a fiscalizar, leitura de QR
via câmera (html5-qrcode), campo de digitação manual como alternativa,
e feedback visual claro dos 4 estados de validação.
Pronto quando: usuário de portaria consegue validar um ingresso pela
interface, via câmera ou digitação.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 7.1 | 7.1.01 | Service de validação de assinatura JWT do QR | apps/api | SPEC.md §3.2 | [ ] |
| 7.1 | 7.1.02 | Rota `POST /portaria/validar` — body `{ codigo, eventoId }` (assinatura + status + evento) | apps/api | SPEC.md §3.2, §5.7 | [ ] |
| 7.1 | 7.1.03 | Documentar endpoint de portaria no Swagger | apps/api | SPEC.md §5.7 | [ ] |
| 7.2 | 7.2.01 | Tela de seleção do evento a fiscalizar (início da sessão de portaria) | apps/web | PRD.md §3.9 | [ ] |
| 7.2 | 7.2.02 | Leitura via câmera (`html5-qrcode`) | apps/web | DECISIONS.md — Leitura de QR | [ ] |
| 7.2 | 7.2.03 | Campo de digitação manual como alternativa | apps/web | PRD.md §3.9 | [ ] |
| 7.2 | 7.2.04 | Feedback visual dos 4 estados (válido, inválido, já utilizado, evento errado) | apps/web | PRD.md §3.9 | [ ] |
| 7.2 | 7.2.05 | Testar: os 4 cenários de retorno usando dados semeados | apps/web + apps/api | - | [ ] |

**Checkpoint de revisão:** dev testa os 4 cenários usando os dados
semeados. Com este bloco aprovado, o fluxo ponta a ponta completo do
desafio está funcional.

---

## Bloco 8 — Cancelamento e Devolução ao Estoque

**Objetivo:** cliente cancela dentro da regra de 24h, com devolução
correta.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Cancelamento com regra de 24h e devolução ao estoque
Labels: back-end
Descrição: Implementar POST /reservas/:id/cancelar, validando a janela
de 24h antes do evento (docs/PRD.md §3.8) e devolvendo o assento
(CINEMA) ou incrementando o estoque (SHOW) ao cancelar.
Pronto quando: cancelamento dentro do prazo funciona com devolução
correta, e fora do prazo é bloqueado.
```

```
Título: [front-end] Ação de cancelamento
Labels: front-end
Descrição: Adicionar botão de cancelar em "Meus Ingressos"/"Minhas
Reservas", com feedback claro quando o cancelamento estiver fora do
prazo permitido.
Pronto quando: cliente consegue cancelar uma reserva elegível pela
interface e recebe mensagem clara quando não pode.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 8.1 | 8.1.01 | Validação da janela de 24h antes do cancelamento | apps/api | PRD.md §3.8 | [ ] |
| 8.1 | 8.1.02 | Rota `POST /reservas/:id/cancelar` | apps/api | SPEC.md §5.4, §4.0 | [ ] |
| 8.1 | 8.1.03 | Devolução de assento (`status → DISPONIVEL`) | apps/api | SPEC.md §4.0, §4.2 | [ ] |
| 8.1 | 8.1.04 | Devolução de estoque (incrementa `ingressosDisponiveis`) | apps/api | SPEC.md §4.0, §4.2 | [ ] |
| 8.1 | 8.1.05 | Cancelar **todos** os ingressos vinculados à reserva (`VALIDO → CANCELADO`) | apps/api | SPEC.md §4.0, §4.2 | [ ] |
| 8.1 | 8.1.06 | Documentar endpoint de cancelamento no Swagger | apps/api | SPEC.md §5.4 | [ ] |
| 8.2 | 8.2.01 | Botão de cancelar em "Meus Ingressos"/"Minhas Reservas" | apps/web | - | [ ] |
| 8.2 | 8.2.02 | Feedback de bloqueio quando fora do prazo | apps/web | - | [ ] |
| 8.2 | 8.2.03 | Testar: cancelamento dentro do prazo (sucesso) e fora do prazo (bloqueado) | apps/web + apps/api | - | [ ] |
| 8.2 | 8.2.04 | Testar: ingresso cancelado é rejeitado na portaria | apps/web + apps/api | SPEC.md §3.2 | [ ] |

**Checkpoint de revisão:** dev testa cancelamento dentro e fora do prazo,
confirmando que o estoque volta corretamente.

---

## Bloco 9 — Busca e Filtro de Eventos

**Objetivo:** cliente filtra o catálogo publicado.

**Issues para cadastrar no GitHub**

```
Título: [full-stack] Filtros de busca de eventos (data, categoria, local, preço)
Labels: back-end, front-end
Descrição: Adicionar suporte a filtros (data, categoria, local, faixa
de preço) em GET /eventos, e criar a UI de filtros correspondente na
listagem de eventos.
Pronto quando: cada filtro funciona isoladamente e em combinação, tanto
na API quanto na interface.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 9.1 | 9.1.01 | Query params em `GET /eventos` (`data`, `categoria`, `local`, `precoMin`, `precoMax`) | apps/api | SPEC.md §5.2, PRD.md §3.2 | [ ] |
| 9.1 | 9.1.02 | Atualizar documentação Swagger de `GET /eventos` com os query params de filtro | apps/api | SPEC.md §5.2 | [ ] |
| 9.1 | 9.1.03 | UI de filtros na listagem de eventos | apps/web | PRD.md §3.2 | [ ] |
| 9.1 | 9.1.04 | Testar: cada filtro isolado e combinado | apps/web + apps/api | - | [ ] |

**Checkpoint de revisão:** dev testa cada filtro isoladamente e combinado.

---

## Bloco 10 — Testes Automatizados

**Objetivo:** cobrir a lógica crítica de negócio.

**Issues para cadastrar no GitHub**

```
Título: [infra] Configurar ambiente de testes (Jest + ts-jest)
Labels: infra
Descrição: Configurar Jest + ts-jest em apps/api, incluindo scripts de
execução no package.json.
Pronto quando: é possível rodar a suíte de testes com um único comando.
```

```
Título: [back-end] Testes de concorrência e regras críticas
Labels: back-end
Descrição: Escrever testes cobrindo concorrência de reserva de
assento, concorrência de reserva por quantidade, validação de QR
(assinatura válida e forjada), regra de cancelamento (dentro e fora do
prazo), expiração de reserva não paga, geração de N ingressos,
cancelamento de evento em cascata, e um teste de integração do fluxo
feliz. Testes transacionais devem rodar contra um Postgres real.
Pronto quando: toda a suíte de testes passa localmente.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 10.1 | 10.1.01 | Configurar Jest + `ts-jest` em `apps/api` | apps/api | DECISIONS.md — Testes | [ ] |
| 10.1 | 10.1.02 | Configurar banco Postgres de teste (via Docker Compose) para testes transacionais | apps/api | SPEC.md §6 | [ ] |
| 10.1 | 10.1.03 | Adicionar execução da suíte de testes ao workflow de CI | raiz | - | [ ] |
| 10.2 | 10.2.01 | Teste: concorrência de reserva de assento | apps/api | SPEC.md §6 | [ ] |
| 10.2 | 10.2.02 | Teste: concorrência de reserva por quantidade (overselling) | apps/api | SPEC.md §6 | [ ] |
| 10.2 | 10.2.03 | Teste: validação de QR com assinatura válida | apps/api | SPEC.md §6 | [ ] |
| 10.2 | 10.2.04 | Teste: validação de QR com assinatura forjada | apps/api | SPEC.md §6 | [ ] |
| 10.2 | 10.2.05 | Teste: cancelamento dentro do prazo | apps/api | SPEC.md §6 | [ ] |
| 10.2 | 10.2.06 | Teste: cancelamento fora do prazo | apps/api | SPEC.md §6 | [ ] |
| 10.2 | 10.2.07 | Teste: expiração de reserva não paga após 15 min com devolução ao estoque | apps/api | SPEC.md §6, PRD.md §3.10 | [ ] |
| 10.2 | 10.2.08 | Teste: reserva de quantidade N gera N ingressos | apps/api | SPEC.md §6, PRD.md §3.7 | [ ] |
| 10.2 | 10.2.09 | Teste: cancelamento de evento em cascata (reservas + ingressos) | apps/api | SPEC.md §4.1, §6 | [ ] |
| 10.2 | 10.2.10 | Teste: pagamento recusado encerra a reserva e devolve o estoque | apps/api | SPEC.md §4.3 | [ ] |
| 10.2 | 10.2.11 | Teste de integração: criação de evento + reserva (fluxo feliz) | apps/api | SPEC.md §6 | [ ] |
| 10.2 | 10.2.12 | Testar: rodar suíte completa e confirmar 100% passando | apps/api | - | [ ] |

**Checkpoint de revisão:** dev roda a suíte de testes localmente e confirma
que todos passam.

---

## Bloco 11 — Docker Compose Final, Deploy e Documentação

**Objetivo:** projeto publicável e documentado, pronto para entrega.

**Issues para cadastrar no GitHub**

```
Título: [infra] Deploy do back-end e banco no Render
Labels: infra
Descrição: Publicar apps/api no Render como Web Service, com build
command compilando o TypeScript (tsc) e start apontando para dist/, um
banco PostgreSQL gerenciado na mesma plataforma, e variáveis de
ambiente configuradas.
Pronto quando: a API está acessível publicamente e conectada ao banco
de produção.
```

```
Título: [infra] Deploy do front-end na Vercel
Labels: infra
Descrição: Publicar apps/web na Vercel, com o root directory do
projeto apontando para apps/web (o repositório é um monorepo),
configurada para consumir a API publicada no Render.
Pronto quando: o front está acessível publicamente e funcional,
consumindo a API de produção.
```

```
Título: [docs] README completo com instruções de setup
Labels: docs
Descrição: Escrever README.md com pré-requisitos (incluindo a versão do
Node fixada no .nvmrc), setup local via Docker, instalação de
dependências via npm install na raiz do workspace, variáveis de
ambiente, como rodar o seed, links de deploy
(incluindo /api-docs), aviso sobre o cold start do free tier do Render
(~1 min no primeiro acesso após 15 min de inatividade) e aviso sobre a
expiração do Postgres free do Render (banco expira 30 dias após a
criação, com 14 dias de carência para upgrade antes de ser deletado —
https://render.com/docs/free#free-postgres).
Revisar docs/PRD.md, DECISIONS.md, SPEC.md e completar docs/AI_USAGE.md.
Pronto quando: um avaliador consegue rodar o projeto do zero seguindo
apenas o README.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 11.1 | 11.1.01 | Finalizar `docker-compose.yml` (api + postgres, web opcional) | raiz | DECISIONS.md — Containerização | [ ] |
| 11.1 | 11.1.02 | Deploy do back-end no Render (build command com `tsc`, start apontando para `dist/`) | apps/api | DECISIONS.md — Deploy Back, Linguagem | [ ] |
| 11.1 | 11.1.03 | Configurar Postgres gerenciado no Render | infra | DECISIONS.md — Deploy Back | [ ] |
| 11.1 | 11.1.04 | Deploy do front-end na Vercel | apps/web | DECISIONS.md — Deploy Front | [ ] |
| 11.1 | 11.1.05 | Confirmar dados de teste semeados também em produção | infra | PRD.md §5 | [ ] |
| 11.2 | 11.2.01 | README: pré-requisitos e setup local via Docker | raiz | - | [ ] |
| 11.2 | 11.2.02 | README: variáveis de ambiente | raiz | - | [ ] |
| 11.2 | 11.2.03 | README: como rodar o seed | raiz | - | [ ] |
| 11.2 | 11.2.04 | README: links de deploy (produção) + link do Swagger (`/api-docs`) | raiz | - | [ ] |
| 11.2 | 11.2.05 | README: aviso sobre cold start (~1 min) e sobre expiração do Postgres free do Render (30 dias + 14 de carência) | raiz | DECISIONS.md — Deploy Back | [ ] |
| 11.2 | 11.2.06 | Revisar `docs/PRD.md`, `DECISIONS.md`, `SPEC.md` (ajustar se algo mudou na implementação) | docs | - | [ ] |
| 11.2 | 11.2.07 | Preencher seções pendentes de `docs/AI_USAGE.md` | docs | - | [ ] |
| 11.2 | 11.2.08 | Testar: percorrer fluxo completo em produção, do zero, como avaliador | raiz | - | [ ] |

**Checkpoint de revisão final:** dev percorre o fluxo completo em produção,
do zero, como se fosse o avaliador — sem nenhuma configuração manual além
do que está documentado no README.

---

## Registro de Revisões

Preenchido pelo desenvolvedor a cada checkpoint de bloco aprovado.

| Bloco | Data | Aprovado por | Observações |
|---|---|---|---|
| 0 — Setup e Infraestrutura | | | |
| 1 — Modelagem de Dados | | | |
| 2 — Autenticação | | | |
| 3 — Catálogo e Gestão de Eventos | | | |
| 4 — Reserva (Assento + Quantidade) | | | |
| 5 — Pagamento Simulado | | | |
| 6 — Ingresso, QR e Meus Ingressos | | | |
| 7 — Portaria | | | |
| 8 — Cancelamento e Devolução | | | |
| 9 — Busca e Filtro | | | |
| 10 — Testes Automatizados | | | |
| 11 — Deploy e Documentação Final | | | |
