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
2. **Antes de começar a implementar uma parte do bloco**, apresentar só a
   issue correspondente a essa parte (título, labels, descrição e critério
   de "pronto") para o desenvolvedor cadastrar no GitHub — uma de cada vez,
   não todas as do bloco de uma vez, para focar a atenção do desenvolvedor
   numa resolução por vez. A IA nunca presume que a issue já existe.
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
Título: [infra] Configurar templates de Issue e CI no GitHub
Labels: infra

Os hooks locais dependem da máquina de quem commita. O CI é a camada que
roda independente disso.

O trabalho acontece direto na main, sem branches: o gatilho do workflow é
o push, e não a abertura de pull request, senão o CI nunca rodaria.

- [ ] Criar o template de issue (.github/ISSUE_TEMPLATE/)
- [ ] Criar o workflow de CI rodando lint em push na main e em pull
      request
- [ ] Fazer um push e confirmar que o workflow executa

Pronto quando: abrir uma issue carrega o template automaticamente e o
lint roda a cada push.

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
| 0.1 | 0.1.01 | Criar estrutura de pastas do monorepo (`apps/web`, `apps/api`, `docs/`) | raiz | DECISIONS.md — Estrutura de Diretórios | [x] |
| 0.1 | 0.1.02 | Criar `.gitignore` na raiz (`node_modules`, `.env` e variantes **com exceção de `.env.example`**, `dist`, `coverage`, `.claude/settings.local.json`) — **antes** de qualquer `npm install`, para o `node_modules` nunca chegar a aparecer no versionamento | raiz | - | [x] |
| 0.1 | 0.1.03 | Criar `package.json` na raiz com npm workspaces (`apps/*`) — base para Husky, lint-staged e Commitlint, que vivem na raiz junto ao `.git` | raiz | DECISIONS.md — Organização do repositório | [x] |
| 0.1 | 0.1.04 | Criar `.nvmrc` e campo `engines` fixando a versão do Node (reprodutibilidade do ambiente) | raiz | - | [x] |
| 0.1 | 0.1.05 | Criar `.env.example` em `apps/api` (DATABASE_URL, JWT_SECRET, ASAAS_API_KEY, TMDB_API_KEY, TICKETMASTER_API_KEY) | apps/api | - | [x] |
| 0.1 | 0.1.06 | Criar `.env.example` em `apps/web` (VITE_API_URL) | apps/web | - | [x] |
| 0.2 | 0.2.01 | Inicializar `apps/api` (`package.json` + Express) | apps/api | DECISIONS.md — Back-end | [x] |
| 0.2 | 0.2.02 | Configurar TypeScript em `apps/api` (`tsconfig.json`, `tsx` para dev, script de build via `tsc`, `@types/*`) | apps/api | DECISIONS.md — Linguagem | [x] |
| 0.2 | 0.2.03 | Carregamento de variáveis de ambiente via `--env-file-if-exists` nativo do Node (sem `dotenv`), nos scripts `dev` e `start` | apps/api | DECISIONS.md — Variáveis de ambiente | [x] |
| 0.2 | 0.2.04 | Criar estrutura de pastas (`routes/`, `controllers/`, `services/`, `middlewares/`, `config/`) | apps/api | - | [x] |
| 0.2 | 0.2.05 | Criar rota `GET /health` | apps/api | - | [x] |
| 0.2 | 0.2.06 | Inicializar Prisma (`prisma init`) | apps/api | DECISIONS.md — ORM | [x] |
| 0.3 | 0.3.01 | Inicializar `apps/web` com Vite + React + TypeScript (template `react-ts`) | apps/web | DECISIONS.md — Front-end, Linguagem | [x] |
| 0.3 | 0.3.02 | Instalar e configurar Tailwind CSS | apps/web | DECISIONS.md — Estilização | [x] |
| 0.3 | 0.3.03 | Instalar shadcn/ui + inicializar tema base customizado (paleta, tipografia) | apps/web | DECISIONS.md — Estilização | [x] |
| 0.4 | 0.4.01 | Criar `Dockerfile` da API (build `tsc` → `dist/`, execução do output compilado) | apps/api | DECISIONS.md — Linguagem, Containerização | [x] |
| 0.4 | 0.4.02 | Criar `.dockerignore` (`node_modules`, `.env`, `dist`) — evita inflar o contexto de build e vazar segredo para dentro da imagem. Fica na **raiz**, e não em `apps/api`, porque o contexto de build é o repositório inteiro (o Dockerfile precisa do lockfile do workspace) | raiz | - | [x] |
| 0.4 | 0.4.03 | Criar `docker-compose.yml` (serviços `api` + `postgres`) | raiz | DECISIONS.md — Containerização | [x] |
| 0.4 | 0.4.04 | Testar: `docker-compose up` compila o TypeScript e sobe API + banco sem erro | raiz | - | [x] |
| 0.4 | 0.4.05 | Testar: `GET /health` responde 200 com banco conectado | raiz | - | [x] |
| 0.5 | 0.5.01 | Criar `.editorconfig` na raiz | raiz | - | [x] |
| 0.5 | 0.5.02 | Instalar e configurar ESLint + `typescript-eslint` (`apps/api` e `apps/web`) | raiz | DECISIONS.md — Qualidade de código | [x] |
| 0.5 | 0.5.03 | Instalar e configurar Prettier | raiz | - | [x] |
| 0.5 | 0.5.04 | Instalar Husky e configurar hooks (`pre-commit`, `commit-msg`) | raiz | - | [x] |
| 0.5 | 0.5.05 | Instalar lint-staged (roda ESLint + Prettier nos arquivos staged) | raiz | - | [x] |
| 0.5 | 0.5.06 | Instalar Commitlint + `@commitlint/config-conventional` | raiz | - | [x] |
| 0.5 | 0.5.07 | Testar: commit com mensagem fora do padrão Conventional Commits deve ser rejeitado | raiz | - | [x] |
| 0.5 | 0.5.08 | Testar: commit com código mal formatado/lint quebrado deve ser bloqueado | raiz | - | [x] |
| 0.6 | 0.6.01 | Criar `.github/ISSUE_TEMPLATE/` (template de issue padronizado) | raiz | - | [x] |
| 0.6 | 0.6.02 | Criar workflow `.github/workflows/ci.yml` rodando lint em `push` na `main` e em `pull_request` | raiz | - | [x] |
| 0.6 | 0.6.03 | Testar: fazer um push e confirmar que o CI executa o lint | raiz | - | [x] |
| 0.7 | 0.7.01 | Instalar e configurar `swagger-ui-express` em `apps/api` | apps/api | DECISIONS.md — Documentação de API | [x] |
| 0.7 | 0.7.02 | Expor documentação interativa em `GET /api-docs` | apps/api | DECISIONS.md — Documentação de API | [x] |
| 0.7 | 0.7.03 | Configurar esquema de segurança Bearer JWT no Swagger | apps/api | DECISIONS.md — Documentação de API | [x] |
| 0.7 | 0.7.04 | Documentar `GET /health` no Swagger (valida o setup) | apps/api | - | [x] |
| 0.8 | 0.8.01 | Criar `README.md` inicial (título, descrição, stack, links para `docs/`) | raiz | - | [x] |

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

As seis entidades do domínio, conforme docs/SPEC.md §1. Só a estrutura —
nenhuma regra de negócio ainda.

- [ ] Modelar User, Event, Seat, Reservation, Ticket e Payment
- [ ] Declarar os relacionamentos entre eles
- [ ] Adicionar a constraint de unicidade de assento por evento
- [ ] Definir a convenção de datas em UTC
- [ ] Rodar a primeira migration

Pronto quando: a migration aplica sem erro e as seis entidades aparecem
no Prisma Studio.

Detalhamento em docs/TASKS.md (Bloco 1).
```

```
Título: [back-end] Script de seed com dados de teste
Labels: back-end

Dados que permitem percorrer o sistema inteiro sem montar nada à mão,
conforme docs/PRD.md §5.

- [ ] Semear os quatro usuários: 1 organizador, 2 clientes e 1 portaria
- [ ] Semear 1 evento CINEMA com o mapa de assentos gerado
- [ ] Semear 1 evento SHOW com estoque de ingressos
- [ ] Semear 1 reserva paga com ingresso VALIDO
- [ ] Semear 1 ingresso já UTILIZADO
- [ ] Registrar o comando de seed no package.json

Pronto quando: rodar o seed popula o banco corretamente, verificado no
Prisma Studio, e os eventos têm data futura o bastante para permitir
testar o cancelamento na janela de 24h.

Detalhamento em docs/TASKS.md (Bloco 1).
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 1.1 | 1.1.01 | Definir model `User` no `schema.prisma` | apps/api | SPEC.md §1.1 | [x] |
| 1.1 | 1.1.02 | Definir model `Event` no `schema.prisma` | apps/api | SPEC.md §1.2 | [x] |
| 1.1 | 1.1.03 | Definir model `Seat` + constraint `@@unique([eventId, row, number])` | apps/api | SPEC.md §1.3 | [x] |
| 1.1 | 1.1.04 | Definir model `Reservation` (incl. `expiresAt` e status `EXPIRED`) | apps/api | SPEC.md §1.4 | [x] |
| 1.1 | 1.1.05 | Definir model `Ticket` (relação 1:N com `Reservation`) | apps/api | SPEC.md §1.5 | [x] |
| 1.1 | 1.1.06 | Definir model `Payment` | apps/api | SPEC.md §1.6 | [x] |
| 1.1 | 1.1.07 | Definir relacionamentos (FKs) entre os models | apps/api | SPEC.md §1.7 | [x] |
| 1.1 | 1.1.08 | Rodar primeira migration (`prisma migrate dev`) | apps/api | - | [x] |
| 1.1 | 1.1.09 | Definir convenção de datas em UTC (`TZ=UTC` no ambiente da API + util de data com as regras de prazo) | apps/api | PRD.md §3.13 | [x] |
| 1.2 | 1.2.01 | Seed: 1 usuário organizador | apps/api/prisma | PRD.md §5 | [x] |
| 1.2 | 1.2.02 | Seed: 2 usuários clientes | apps/api/prisma | PRD.md §5 | [x] |
| 1.2 | 1.2.03 | Seed: 1 usuário portaria | apps/api/prisma | PRD.md §5 | [x] |
| 1.2 | 1.2.04 | Seed: 1 evento tipo CINEMA com assentos | apps/api/prisma | PRD.md §5 | [x] |
| 1.2 | 1.2.05 | Seed: 1 evento tipo SHOW com estoque | apps/api/prisma | PRD.md §5 | [x] |
| 1.2 | 1.2.06 | Seed: 1 reserva paga com ingresso `VALID` (para testar portaria e link) | apps/api/prisma | PRD.md §5 | [x] |
| 1.2 | 1.2.07 | Seed: 1 ingresso já `USED` (para testar retorno "já utilizado") | apps/api/prisma | PRD.md §5 | [x] |
| 1.2 | 1.2.08 | Testar: validar dados semeados via Prisma Studio | apps/api | - | [x] |

**Checkpoint de revisão:** dev roda o seed e confirma visualmente os dados
no banco.

---

## Bloco 2 — Autenticação

**Objetivo:** login funcional para os 3 papéis, com rotas protegidas.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Autenticação JWT (registro, login, middleware de papéis)
Labels: back-end

Login por email e senha para os três papéis, com as rotas descritas em
docs/SPEC.md §5.1.

- [ ] Hash e comparação de senha com bcrypt
- [ ] Geração e verificação do token JWT
- [ ] POST /auth/registro, forçando role CLIENTE (docs/PRD.md §3.12)
- [ ] POST /auth/login
- [ ] GET /auth/me
- [ ] Middleware authenticate, populando req.user a partir do token
- [ ] Middleware requireRole, restringindo rotas por papel
- [ ] Configurar CORS para a origem do front
- [ ] Documentar os endpoints no Swagger

Pronto quando: os três papéis semeados conseguem logar, cada rota
protegida bloqueia papéis não autorizados, e o front chama a API sem
erro de CORS.
```

```
Título: [front-end] Tela de login e contexto de autenticação
Labels: front-end

Primeira integração do front com a API: autenticar, guardar a sessão e
proteger rotas por papel.

- [ ] Client de API base, lendo a URL de VITE_API_URL
- [ ] AuthContext com token, usuário logado, login e logout
- [ ] Tela de login integrada ao POST /auth/login
- [ ] Componente PrivateRoute, restringindo acesso por papel

Pronto quando: o login funciona na interface para os três papéis e uma
rota restrita redireciona quem não tem permissão.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 2.1 | 2.1.01 | Util de hash de senha (`hashPassword`, `comparePassword` via bcrypt) | apps/api | DECISIONS.md — Autenticação | [x] |
| 2.1 | 2.1.02 | Service `generateToken(userId, role)` via `jsonwebtoken` | apps/api | DECISIONS.md — Autenticação | [x] |
| 2.1 | 2.1.03 | Rota `POST /auth/registro` (força `role = CLIENTE`) | apps/api | SPEC.md §5.1, PRD.md §3.12 | [x] |
| 2.1 | 2.1.04 | Rota `POST /auth/login` | apps/api | SPEC.md §5.1 | [x] |
| 2.1 | 2.1.05 | Middleware `authenticate` (valida JWT, popula `req.user`) | apps/api | SPEC.md §5.1 | [x] |
| 2.1 | 2.1.06 | Middleware `requireRole(roles[])` | apps/api | SPEC.md §5.1 | [x] |
| 2.1 | 2.1.07 | Rota `GET /auth/me` | apps/api | SPEC.md §5.1 | [x] |
| 2.1 | 2.1.08 | Documentar endpoints de autenticação no Swagger | apps/api | SPEC.md §5.1 | [x] |
| 2.1 | 2.1.09 | Configurar CORS na API liberando a origem do front (local e produção) — front e back rodam em origens distintas | apps/api | DECISIONS.md — Deploy | [x] |
| 2.2 | 2.2.01 | Client de API base no front (fetch/axios configurado com `VITE_API_URL`) | apps/web | - | [x] |
| 2.2 | 2.2.02 | `AuthContext` (token, usuário logado, login, logout) | apps/web | - | [x] |
| 2.2 | 2.2.03 | Tela de login (formulário + integração com `POST /auth/login`) | apps/web | - | [x] |
| 2.2 | 2.2.04 | Componente de rota protegida por papel (`PrivateRoute`) | apps/web | - | [x] |
| 2.2 | 2.2.05 | Testar: login com os 3 papéis semeados + bloqueio de rota indevida | apps/web + apps/api | - | [x] |

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

Os dois catálogos externos que alimentam a criação de eventos, expostos
pela API para que as chaves não cheguem ao navegador. Estratégia de
cache e rate limit em docs/SPEC.md §5.8.

- [ ] Client de integração com o TMDb (filmes em cartaz)
- [ ] Client de integração com o Ticketmaster Discovery (eventos)
- [ ] GET /catalogo/filmes
- [ ] GET /catalogo/shows
- [ ] Cache em memória das respostas, com TTL curto
- [ ] Tratar rate limit (HTTP 429) com mensagem clara
- [ ] Documentar os endpoints no Swagger

Pronto quando: os dois endpoints retornam dados reais das respectivas
APIs, e uma sequência de buscas não esgota a cota.
```

```
Título: [back-end] CRUD de eventos (organizador)
Labels: back-end

Publicação e gestão de eventos a partir do catálogo externo. O
cancelamento não apaga o evento: ele dispara a cascata descrita em
docs/SPEC.md §4.1, que reembolsa e invalida o que já foi vendido.

- [ ] POST /eventos
- [ ] PUT /eventos/:id
- [ ] DELETE /eventos/:id, com a cascata sobre reservas e ingressos
- [ ] GET /eventos (listagem pública, ainda sem filtros)
- [ ] GET /eventos/:id
- [ ] Documentar os endpoints no Swagger

Pronto quando: o organizador cria, edita e cancela um evento pela API, e
o cancelamento faz os ingressos vendidos deixarem de ser aceitos.
```

```
Título: [front-end] Painel do organizador
Labels: front-end

Onde o organizador encontra um filme ou show real e o transforma em
evento publicado.

- [ ] Tela de busca no catálogo, com debounce no campo de texto
- [ ] Formulário de criação e edição de evento
- [ ] Listagem dos eventos do organizador

Pronto quando: é possível, pela interface, buscar um filme e um show
reais e publicar um evento de cada tipo.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 3.1 | 3.1.01 | Client de integração com TMDb (busca filmes em cartaz) | apps/api | DECISIONS.md — API externa Cinema | [x] |
| 3.1 | 3.1.02 | Client de integração com Ticketmaster Discovery (busca eventos) | apps/api | DECISIONS.md — API externa Show | [x] |
| 3.1 | 3.1.03 | Rota `GET /catalogo/filmes` | apps/api | SPEC.md §5.2 | [x] |
| 3.1 | 3.1.04 | Rota `GET /catalogo/shows` | apps/api | SPEC.md §5.2 | [x] |
| 3.1 | 3.1.05 | Cache em memória (TTL ~5 min) das respostas de catálogo | apps/api | SPEC.md §5.8 | [x] |
| 3.1 | 3.1.06 | Tratamento de rate limit (HTTP 429) das APIs externas | apps/api | SPEC.md §5.8 | [x] |
| 3.2 | 3.2.01 | Rota `POST /eventos` | apps/api | SPEC.md §5.2 | [x] |
| 3.2 | 3.2.02 | Rota `PUT /eventos/:id` | apps/api | SPEC.md §5.2 | [x] |
| 3.2 | 3.2.03 | Rota `DELETE /eventos/:id` — cancelamento em cascata (reservas + ingressos + reembolso) | apps/api | SPEC.md §4.1, PRD.md §3.11 | [x] |
| 3.2 | 3.2.04 | Rota `GET /eventos` (listagem pública, sem filtro ainda) | apps/api | SPEC.md §5.2 | [x] |
| 3.2 | 3.2.05 | Rota `GET /eventos/:id` (detalhe público) | apps/api | SPEC.md §5.2 | [x] |
| 3.2 | 3.2.06 | Documentar endpoints de catálogo e eventos no Swagger | apps/api | SPEC.md §5.2 | [x] |
| 3.3 | 3.3.01 | Tela de busca no catálogo externo (painel organizador, com debounce ~400ms) | apps/web | SPEC.md §5.8 | [x] |
| 3.3 | 3.3.02 | Formulário de criação/edição de evento | apps/web | - | [x] |
| 3.3 | 3.3.03 | Listagem de eventos do organizador | apps/web | - | [x] |
| 3.3 | 3.3.04 | Testar: publicar 1 evento CINEMA e 1 evento SHOW reais | apps/web + apps/api | - | [x] |

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

Reserva de lugar marcado. A exclusividade vem de um update condicional
dentro de transação, não de constraint — a estratégia está detalhada em
docs/SPEC.md §2.1, e a expiração de reservas vencidas em §2.3.

- [ ] GET /eventos/:id/assentos, com o status de cada lugar
- [ ] Service de expiração das reservas vencidas, executado antes de
      consultar disponibilidade ou criar reserva
- [ ] Lógica de reserva em transação, com prazo de 15 minutos para pagar
- [ ] POST /reservas/assento
- [ ] Documentar os endpoints no Swagger

Pronto quando: duas tentativas simultâneas no mesmo assento resultam em
uma única reserva, e um assento reservado e não pago volta a ficar
disponível depois de 15 minutos.
```

```
Título: [back-end] Reserva por quantidade (SHOW) com controle de concorrência
Labels: back-end

Reserva de pista, sem lugar marcado. A verificação de estoque e o
decremento precisam ser atômicos, ou o evento vende mais do que cabe —
ver docs/SPEC.md §2.2.

- [ ] Lógica de reserva por quantidade em transação, com prazo de 15
      minutos para pagar
- [ ] POST /reservas/quantidade
- [ ] GET /reservas/minhas
- [ ] Documentar os endpoints no Swagger

Pronto quando: uma tentativa de reservar mais ingressos do que o
disponível é rejeitada, inclusive sob requisições simultâneas.
```

```
Título: [front-end] Telas de reserva (mapa de assentos + seletor de quantidade)
Labels: front-end

Os dois fluxos de reserva na interface, escolhidos conforme o tipo do
evento.

- [ ] Listagem de eventos em cards
- [ ] Mapa de assentos, com estado visual por lugar
- [ ] Seletor de quantidade para eventos de pista
- [ ] Tela de confirmação, com o contador do tempo restante da reserva

Pronto quando: o cliente reserva pelos dois fluxos na interface, e
tentar um assento já ocupado mostra erro em vez de falhar em silêncio.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 4.1 | 4.1.01 | Rota `GET /eventos/:id/assentos` | apps/api | SPEC.md §5.3 | [x] |
| 4.1 | 4.1.02 | Service de expiração *lazy* de reservas vencidas (usado antes de consultas/reservas) | apps/api | SPEC.md §2.3, PRD.md §3.10 | [x] |
| 4.1 | 4.1.03 | Lógica de reserva de assento: `updateMany` condicional (`status = DISPONIVEL`) + checagem de `count`, dentro de transação; define `expiresAt` = +15 min | apps/api | SPEC.md §2.1, §2.3 | [x] |
| 4.1 | 4.1.04 | Rota `POST /reservas/assento` | apps/api | SPEC.md §5.4 | [x] |
| 4.1 | 4.1.05 | Lógica de reserva por quantidade com `prisma.$transaction` (define `expiresAt` = +15 min) | apps/api | SPEC.md §2.2, §2.3 | [x] |
| 4.1 | 4.1.06 | Rota `POST /reservas/quantidade` | apps/api | SPEC.md §5.4 | [x] |
| 4.1 | 4.1.07 | Rota `GET /reservas/minhas` | apps/api | SPEC.md §5.4 | [x] |
| 4.1 | 4.1.08 | Documentar endpoints de reserva no Swagger | apps/api | SPEC.md §5.3, §5.4 | [x] |
| 4.2 | 4.2.01 | Listagem de eventos (cards, sem filtro ainda) | apps/web | - | [x] |
| 4.2 | 4.2.02 | Tela de mapa de assentos (evento CINEMA) | apps/web | - | [x] |
| 4.2 | 4.2.03 | Tela de seleção de quantidade (evento SHOW) | apps/web | - | [x] |
| 4.2 | 4.2.04 | Tela de confirmação de reserva (com contador dos 15 min restantes) | apps/web | PRD.md §3.10 | [x] |
| 4.2 | 4.2.05 | Testar: reserva nos dois fluxos + reservar mesmo assento 2x deve falhar na 2ª | apps/web + apps/api | - | [x] |
| 4.2 | 4.2.06 | Testar: reserva não paga expira após 15 min e devolve o estoque | apps/web + apps/api | PRD.md §3.10 | [x] |

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

Cobrança simulada no ambiente de testes do Asaas, com PIX e cartão de
crédito de teste. A confirmação chega por três caminhos — polling,
webhook e um endpoint de simulação — porque o webhook não alcança um
servidor local; ver docs/SPEC.md §5.5.

- [ ] Client de integração com o Asaas sandbox
- [ ] POST /pagamentos/:reservaId/processar
- [ ] GET /pagamentos/:id, consumido por polling
- [ ] POST /webhooks/asaas
- [ ] POST /pagamentos/:id/simular-callback, para desenvolvimento e testes
- [ ] Pagamento confirmado: reserva vira PAID e o assento vira SOLD
- [ ] Pagamento recusado: reserva vira DECLINED e o estoque volta
- [ ] Documentar os endpoints no Swagger
- [ ] Client: buscar o QR Code PIX real da cobrança (GET /payments/:id/pixQrCode)
- [ ] Client: pagamento com cartão de crédito de teste (POST /payments/:id/payWithCreditCard)
- [ ] Cliente criado no Asaas com notificationDisabled: true (sem e-mails)
- [ ] Expor invoiceUrl da cobrança (comprovante)

Pronto quando: os dois desfechos funcionam nas duas formas de
pagamento, a recusa devolve o assento ou a quantidade ao estoque, e
nenhum e-mail do Asaas é disparado.
```

```
Título: [front-end] Tela de checkout
Labels: front-end

Pagamento simulado na interface, com PIX ou cartão de crédito de
teste, e o resultado visível para o cliente e para quem for avaliar o
projeto.

- [ ] Tela de checkout com escolha entre PIX e cartão de crédito
- [ ] PIX: exibir o QR Code e o copia-e-cola reais devolvidos pelo Asaas
- [ ] Cartão: usar um número de cartão de teste do Asaas sandbox
- [ ] Botão "confirmar pagamento" (aciona /simular-callback), visível
      porque o webhook do Asaas não alcança localhost — é assim que o
      avaliador consegue ver o desfecho sem precisar de um túnel público
- [ ] Polling do status do pagamento enquanto ele estiver pendente
- [ ] Retorno visual distinto para confirmação e para recusa
- [ ] Link "ver comprovante" (invoiceUrl) quando o pagamento é confirmado

Pronto quando: o cliente conclui o pagamento pela interface, nas duas
formas, e vê o desfecho e o comprovante sem precisar recarregar a página.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 5.1 | 5.1.01 | Client de integração com Asaas sandbox | apps/api | DECISIONS.md — Pagamento simulado | [x] |
| 5.1 | 5.1.02 | Rota `POST /pagamentos/:reservaId/processar` | apps/api | SPEC.md §5.5 | [x] |
| 5.1 | 5.1.03 | Rota `GET /pagamentos/:id` (consumida via polling) | apps/api | SPEC.md §5.5 | [x] |
| 5.1 | 5.1.04 | Rota `POST /webhooks/asaas` (ativa em produção) | apps/api | SPEC.md §5.5 | [x] |
| 5.1 | 5.1.05 | Rota `POST /pagamentos/:id/simular-callback` (dev/testes) | apps/api | SPEC.md §5.5 | [x] |
| 5.1 | 5.1.06 | Lógica: pagamento confirmado → `Reserva.status = PAGA` e `Assento.status = VENDIDO` (CINEMA) | apps/api | SPEC.md §4.2 | [x] |
| 5.1 | 5.1.07 | Lógica: pagamento recusado → `Reserva.status = RECUSADA`, libera assento/estoque, sem retentativa | apps/api | PRD.md §3.6, SPEC.md §4.3 | [x] |
| 5.1 | 5.1.08 | Documentar endpoints de pagamento no Swagger | apps/api | SPEC.md §5.5 | [x] |
| 5.1 | 5.1.09 | Client: QR Code PIX real da cobrança | apps/api | DECISIONS.md — Pagamento simulado | [x] |
| 5.1 | 5.1.10 | Client: pagamento com cartão de crédito de teste | apps/api | DECISIONS.md — Pagamento simulado | [x] |
| 5.1 | 5.1.11 | Cliente Asaas criado com `notificationDisabled: true` | apps/api | DECISIONS.md — Pagamento simulado | [x] |
| 5.1 | 5.1.12 | Expor `invoiceUrl` da cobrança (comprovante) | apps/api | DECISIONS.md — Pagamento simulado | [x] |
| 5.2 | 5.2.01 | Tela de checkout com escolha PIX/cartão | apps/web | - | [x] |
| 5.2 | 5.2.02 | PIX: exibir QR Code + copia-e-cola reais | apps/web | - | [x] |
| 5.2 | 5.2.03 | Cartão: formulário com número de teste do Asaas | apps/web | - | [x] |
| 5.2 | 5.2.04 | Botão "confirmar pagamento" (aciona /simular-callback) | apps/web | SPEC.md §5.5 | [x] |
| 5.2 | 5.2.05 | Polling do status do pagamento no front | apps/web | SPEC.md §5.5 | [x] |
| 5.2 | 5.2.06 | Feedback visual de confirmação/recusa | apps/web | - | [x] |
| 5.2 | 5.2.07 | Link "ver comprovante" (invoiceUrl) | apps/web | - | [x] |
| 5.2 | 5.2.08 | Testar: os dois desfechos, nas duas formas de pagamento + liberação de assento/estoque na recusa | apps/web + apps/api | - | [x] |

**Checkpoint de revisão:** dev testa os dois desfechos (confirmação e
recusa), nas duas formas de pagamento (PIX e cartão), e confirma que a
recusa libera o assento/estoque corretamente.

---

## Bloco 6 — Ingresso, QR Code e "Meus Ingressos"

**Objetivo:** primeiro fluxo ponta a ponta completo do lado do cliente.

**Issues para cadastrar no GitHub**

```
Título: [back-end] Geração de ingresso com QR assinado (JWT)
Labels: back-end

Emissão dos ingressos na confirmação do pagamento: um por entrada, cada
um com QR e ciclo de validação próprios (docs/PRD.md §3.7). O QR carrega
um JWT assinado, o que impede forjar um ingresso sem a chave do
servidor.

- [ ] Service que assina o JWT do ingresso
- [ ] Gerar N ingressos ao confirmar o pagamento, um por entrada
- [ ] Service que renderiza o QR a partir do JWT
- [ ] Gerar o token do link compartilhável
- [ ] GET /ingressos/meus
- [ ] GET /ingressos/:id
- [ ] GET /ingressos/compartilhar/:linkToken, público
- [ ] Documentar os endpoints no Swagger

Pronto quando: uma reserva de N ingressos gera N QRs distintos, e o link
de compartilhamento exibe o ingresso completo para quem o abre.
```

```
Título: [front-end] Tela Meus Ingressos e compartilhamento via link
Labels: front-end

Onde o cliente encontra o que comprou. Fecha o primeiro fluxo completo:
entrar, reservar, pagar e ter o ingresso em mãos.

- [ ] Lista de ingressos do cliente
- [ ] Detalhe do ingresso, com o QR renderizado
- [ ] Botão de compartilhar o link

Pronto quando: é possível percorrer login, reserva, pagamento e
visualização do QR inteiramente pela interface.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 6.1 | 6.1.01 | Service de geração de JWT assinado do ingresso (payload `ticketId`, `eventId`) | apps/api | SPEC.md §3.1 | [x] |
| 6.1 | 6.1.02 | Integração: gerar **N ingressos** ao confirmar pagamento (1 por entrada) | apps/api | SPEC.md §3.1, PRD.md §3.7 | [x] |
| 6.1 | 6.1.03 | Service de geração de imagem QR a partir do JWT (lib `qrcode`) | apps/api | DECISIONS.md — QR Code | [x] |
| 6.1 | 6.1.04 | Geração de `shareToken` (token único) | apps/api | SPEC.md §1.5 | [x] |
| 6.1 | 6.1.05 | Rota `GET /ingressos/meus` | apps/api | SPEC.md §5.6 | [x] |
| 6.1 | 6.1.06 | Rota `GET /ingressos/:id` | apps/api | SPEC.md §5.6 | [x] |
| 6.1 | 6.1.07 | Rota `GET /ingressos/compartilhar/:linkToken` (exibe ingresso completo com QR, sem transferir titularidade) | apps/api | SPEC.md §5.6, PRD.md §3.7 | [x] |
| 6.1 | 6.1.08 | Documentar endpoints de ingresso no Swagger | apps/api | SPEC.md §5.6 | [x] |
| 6.2 | 6.2.01 | Tela "Meus Ingressos" (lista) | apps/web | - | [x] |
| 6.2 | 6.2.02 | Tela de detalhe do ingresso com QR renderizado | apps/web | - | [x] |
| 6.2 | 6.2.03 | Botão de compartilhar link | apps/web | - | [x] |
| 6.2 | 6.2.04 | Testar: reserva de N ingressos (SHOW) gera N QRs distintos | apps/web + apps/api | PRD.md §3.7 | [x] |
| 6.2 | 6.2.05 | Testar: fluxo ponta a ponta completo (login cliente → reservar → pagar → ver QR) | apps/web + apps/api | - | [x] |

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

Validação na entrada do evento. O código chega junto do evento que está
sendo fiscalizado, e é essa comparação que distingue um ingresso de
outro evento de um ingresso inválido — a ordem completa das verificações
está em docs/SPEC.md §3.2.

- [ ] Service que verifica a assinatura do JWT lido do QR
- [ ] POST /portaria/validar, recebendo o código e o evento
- [ ] Marcar como utilizado em transação, para que duas leituras
      simultâneas do mesmo QR não sejam ambas aceitas
- [ ] Documentar o endpoint no Swagger

Pronto quando: os quatro retornos possíveis funcionam — válido,
inválido, já utilizado e evento errado.
```

```
Título: [front-end] Tela de portaria (câmera + digitação manual)
Labels: front-end

A tela usada na entrada do evento. É operada às pressas, com fila
esperando: o retorno precisa ser legível em um relance, não lido com
atenção.

- [ ] Seleção do evento a fiscalizar, no início da sessão
- [ ] Leitura do QR pela câmera do dispositivo
- [ ] Campo de digitação manual como alternativa
- [ ] Retorno visual distinto para os quatro estados de validação

Pronto quando: é possível validar um ingresso pela câmera e pela
digitação, e os quatro estados são distinguíveis à primeira vista.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 7.1 | 7.1.01 | Service de validação de assinatura JWT do QR | apps/api | SPEC.md §3.2 | [x] |
| 7.1 | 7.1.02 | Rota `POST /portaria/validar` — body `{ codigo, eventoId }` (assinatura + status + evento) | apps/api | SPEC.md §3.2, §5.7 | [x] |
| 7.1 | 7.1.03 | Documentar endpoint de portaria no Swagger | apps/api | SPEC.md §5.7 | [x] |
| 7.2 | 7.2.01 | Tela de seleção do evento a fiscalizar (início da sessão de portaria) | apps/web | PRD.md §3.9 | [x] |
| 7.2 | 7.2.02 | Leitura via câmera (`html5-qrcode`) | apps/web | DECISIONS.md — Leitura de QR | [x] |
| 7.2 | 7.2.03 | Campo de digitação manual como alternativa | apps/web | PRD.md §3.9 | [x] |
| 7.2 | 7.2.04 | Feedback visual dos 4 estados (válido, inválido, já utilizado, evento errado) | apps/web | PRD.md §3.9 | [x] |
| 7.2 | 7.2.05 | Testar: os 4 cenários de retorno usando dados semeados | apps/web + apps/api | - | [x] |

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

Cancelamento por iniciativa do cliente, permitido até 24 horas antes do
evento (docs/PRD.md §3.8). Cancelar não basta: o lugar precisa voltar
ao mercado e os ingressos emitidos deixarem de valer.

- [ ] Validar a janela de 24 horas antes de permitir o cancelamento
- [ ] POST /reservas/:id/cancelar
- [ ] Devolver o assento à disponibilidade
- [ ] Devolver a quantidade ao estoque
- [ ] Cancelar todos os ingressos vinculados à reserva
- [ ] Documentar o endpoint no Swagger

Pronto quando: cancelar dentro do prazo devolve o lugar corretamente,
fora do prazo é recusado, e o ingresso cancelado passa a ser rejeitado
na portaria.
```

```
Título: [front-end] Ação de cancelamento
Labels: front-end

Cancelamento pela interface. Quando não for permitido, o cliente
precisa entender o motivo — "não foi possível" deixa a pessoa sem saber
se o problema é dela ou do sistema.

- [ ] Botão de cancelar na lista de reservas e ingressos
- [ ] Mensagem explicando o bloqueio quando estiver fora do prazo

Pronto quando: uma reserva elegível é cancelada pela interface, e uma
fora do prazo exibe o motivo da recusa.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 8.1 | 8.1.01 | Validação da janela de 24h antes do cancelamento | apps/api | PRD.md §3.8 | [~] |
| 8.1 | 8.1.02 | Rota `POST /reservas/:id/cancelar` | apps/api | SPEC.md §5.4, §4.0 | [~] |
| 8.1 | 8.1.03 | Devolução de assento (`status → DISPONIVEL`) | apps/api | SPEC.md §4.0, §4.2 | [~] |
| 8.1 | 8.1.04 | Devolução de estoque (incrementa `availableTickets`) | apps/api | SPEC.md §4.0, §4.2 | [~] |
| 8.1 | 8.1.05 | Cancelar **todos** os ingressos vinculados à reserva (`VALIDO → CANCELADO`) | apps/api | SPEC.md §4.0, §4.2 | [~] |
| 8.1 | 8.1.06 | Documentar endpoint de cancelamento no Swagger | apps/api | SPEC.md §5.4 | [~] |
| 8.2 | 8.2.01 | Botão de cancelar em "Meus Ingressos"/"Minhas Reservas" | apps/web | - | [~] |
| 8.2 | 8.2.02 | Feedback de bloqueio quando fora do prazo | apps/web | - | [~] |
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

Navegação no catálogo publicado, pelos quatro critérios definidos em
docs/PRD.md §3.2.

- [ ] Query params em GET /eventos: data, categoria, local e faixa de preço
- [ ] Atualizar a documentação do endpoint no Swagger
- [ ] Controles de filtro na listagem de eventos

Pronto quando: cada filtro funciona sozinho e combinado com os demais,
tanto pela API quanto pela interface.
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

## Bloco 10 — Refinamento de UX

**Objetivo:** revisar a experiência visual e de interação em todas as telas
já construídas (Blocos 2 a 9), agora que o catálogo completo de
funcionalidades existe. Rodar depois das telas todas prontas, e não
intercalado bloco a bloco, para refinar o app como um todo em vez de cada
tela isolada — e porque um padrão criado aqui deve valer para as telas
seguintes.

Escopo, issues e tarefas atômicas ainda não definidos — a ser detalhado
quando o bloco começar, depois do Bloco 9.

---

## Bloco 11 — Testes Automatizados

**Objetivo:** cobrir a lógica crítica de negócio.

**Issues para cadastrar no GitHub**

```
Título: [infra] Configurar ambiente de testes (Jest + ts-jest)
Labels: infra

Ambiente para a suíte da API. Os testes que importam aqui exercitam
transações e concorrência, e mock de ORM não reproduz esse
comportamento — por isso eles rodam contra um PostgreSQL real, em banco
separado do de desenvolvimento (docs/SPEC.md §6).

- [ ] Configurar Jest com ts-jest em apps/api
- [ ] Provisionar o banco de teste
- [ ] Acrescentar a suíte ao workflow de CI

Pronto quando: a suíte roda com um único comando, contra um banco real,
sem interferir no banco de desenvolvimento.
```

```
Título: [back-end] Testes de concorrência e regras críticas
Labels: back-end

Cobertura das regras cuja falha só aparece em produção: disputa por
lugar, venda acima da capacidade e ingresso forjado. A ordem abaixo é de
prioridade, do mais crítico ao mais opcional (docs/SPEC.md §6).

- [ ] Dois clientes disputando o mesmo assento
- [ ] Reservas simultâneas que somadas excedem a capacidade
- [ ] Validação de QR com assinatura válida
- [ ] Validação de QR com assinatura forjada
- [ ] Cancelamento dentro do prazo
- [ ] Cancelamento fora do prazo
- [ ] Expiração de reserva não paga, com devolução ao estoque
- [ ] Reserva de quantidade N gerando N ingressos
- [ ] Cancelamento de evento em cascata
- [ ] Pagamento recusado encerrando a reserva
- [ ] Integração do fluxo feliz: criar evento e reservar

Pronto quando: a suíte inteira passa localmente e no CI.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 11.1 | 11.1.01 | Configurar Jest + `ts-jest` em `apps/api` | apps/api | DECISIONS.md — Testes | [ ] |
| 11.1 | 11.1.02 | Configurar banco Postgres de teste (via Docker Compose) para testes transacionais | apps/api | SPEC.md §6 | [ ] |
| 11.1 | 11.1.03 | Adicionar execução da suíte de testes ao workflow de CI | raiz | - | [ ] |
| 11.2 | 11.2.01 | Teste: concorrência de reserva de assento | apps/api | SPEC.md §6 | [ ] |
| 11.2 | 11.2.02 | Teste: concorrência de reserva por quantidade (overselling) | apps/api | SPEC.md §6 | [ ] |
| 11.2 | 11.2.03 | Teste: validação de QR com assinatura válida | apps/api | SPEC.md §6 | [ ] |
| 11.2 | 11.2.04 | Teste: validação de QR com assinatura forjada | apps/api | SPEC.md §6 | [ ] |
| 11.2 | 11.2.05 | Teste: cancelamento dentro do prazo | apps/api | SPEC.md §6 | [ ] |
| 11.2 | 11.2.06 | Teste: cancelamento fora do prazo | apps/api | SPEC.md §6 | [ ] |
| 11.2 | 11.2.07 | Teste: expiração de reserva não paga após 15 min com devolução ao estoque | apps/api | SPEC.md §6, PRD.md §3.10 | [ ] |
| 11.2 | 11.2.08 | Teste: reserva de quantidade N gera N ingressos | apps/api | SPEC.md §6, PRD.md §3.7 | [ ] |
| 11.2 | 11.2.09 | Teste: cancelamento de evento em cascata (reservas + ingressos) | apps/api | SPEC.md §4.1, §6 | [ ] |
| 11.2 | 11.2.10 | Teste: pagamento recusado encerra a reserva e devolve o estoque | apps/api | SPEC.md §4.3 | [ ] |
| 11.2 | 11.2.11 | Teste de integração: criação de evento + reserva (fluxo feliz) | apps/api | SPEC.md §6 | [ ] |
| 11.2 | 11.2.12 | Testar: rodar suíte completa e confirmar 100% passando | apps/api | - | [ ] |

**Checkpoint de revisão:** dev roda a suíte de testes localmente e confirma
que todos passam.

---

## Bloco 12 — Docker Compose Final, Deploy e Documentação

**Objetivo:** projeto publicável e documentado, pronto para entrega.

**Issues para cadastrar no GitHub**

```
Título: [infra] Deploy do back-end e banco no Render
Labels: infra

API e banco publicados na mesma plataforma. O build precisa compilar o
TypeScript e gerar o client do Prisma antes de iniciar o processo, que
roda a partir de dist/.

- [ ] Publicar a API como Web Service, com build e start configurados
- [ ] Provisionar o PostgreSQL gerenciado
- [ ] Configurar as variáveis de ambiente
- [ ] Aplicar as migrations no banco de produção
- [ ] Semear os dados de teste em produção

Pronto quando: a API responde publicamente, conectada ao banco, com os
dados de teste disponíveis.
```

```
Título: [infra] Deploy do front-end na Vercel
Labels: infra

Front publicado, consumindo a API de produção. Por ser um monorepo, o
diretório raiz do projeto precisa apontar para apps/web.

- [ ] Publicar apps/web, com o diretório raiz configurado
- [ ] Apontar a URL da API para o ambiente publicado
- [ ] Liberar a origem do front no CORS da API

Pronto quando: o front está acessível publicamente e conversa com a API
de produção sem erro de origem.
```

```
Título: [docs] README completo com instruções de setup
Labels: docs

Revisão final da documentação, com o README cobrindo tudo que alguém
precisa para rodar o projeto sem conhecê-lo. Inclui as duas limitações
conhecidas do plano gratuito do Render, que afetam quem for testar o
ambiente publicado.

- [ ] Atualizar o README com o seed e os links do ambiente publicado
- [ ] Avisar sobre o cold start (~1 min após 15 min de inatividade)
- [ ] Avisar que o banco gratuito expira 30 dias após a criação, com 14
      dias de carência antes de ser removido
      (https://render.com/docs/free#free-postgres)
- [ ] Revisar PRD, SPEC e DECISIONS contra o que foi de fato implementado
- [ ] Percorrer o fluxo completo em produção, do zero

Pronto quando: alguém que nunca viu o projeto consegue rodá-lo seguindo
apenas o README.
```

**Tabela de Controle de Tarefas Atômicas**

| Código | ID | Descrição da Tarefa Atômica | Pasta | Referência | Verificado? |
|---|---|---|---|---|---|
| 12.1 | 12.1.01 | Finalizar `docker-compose.yml` (api + postgres, web opcional) | raiz | DECISIONS.md — Containerização | [ ] |
| 12.1 | 12.1.02 | Deploy do back-end no Render (build command com `tsc`, start apontando para `dist/`) | apps/api | DECISIONS.md — Deploy Back, Linguagem | [ ] |
| 12.1 | 12.1.03 | Configurar Postgres gerenciado no Render | infra | DECISIONS.md — Deploy Back | [ ] |
| 12.1 | 12.1.04 | Deploy do front-end na Vercel | apps/web | DECISIONS.md — Deploy Front | [ ] |
| 12.1 | 12.1.05 | Confirmar dados de teste semeados também em produção | infra | PRD.md §5 | [ ] |
| 12.2 | 12.2.01 | README: pré-requisitos e setup local via Docker | raiz | - | [ ] |
| 12.2 | 12.2.02 | README: variáveis de ambiente | raiz | - | [ ] |
| 12.2 | 12.2.03 | README: como rodar o seed | raiz | - | [ ] |
| 12.2 | 12.2.04 | README: links de deploy (produção) + link do Swagger (`/api-docs`) | raiz | - | [ ] |
| 12.2 | 12.2.05 | README: aviso sobre cold start (~1 min) e sobre expiração do Postgres free do Render (30 dias + 14 de carência) | raiz | DECISIONS.md — Deploy Back | [ ] |
| 12.2 | 12.2.06 | Revisar `docs/PRD.md`, `DECISIONS.md`, `SPEC.md` (ajustar se algo mudou na implementação) | docs | - | [ ] |
| 12.2 | 12.2.07 | Preencher seções pendentes de `docs/AI_USAGE.md` | docs | - | [ ] |
| 12.2 | 12.2.08 | Testar: percorrer fluxo completo em produção, do zero, como avaliador | raiz | - | [ ] |

**Checkpoint de revisão final:** dev percorre o fluxo completo em produção,
do zero, como se fosse o avaliador — sem nenhuma configuração manual além
do que está documentado no README.

---

## Dívidas Técnicas

Registro de lacunas conhecidas que não bloqueiam o bloco em que apareceram,
mas precisam ficar visíveis em vez de esquecidas. Cada uma tem uma forma
definida de ser resolvida, mesmo que ainda não tenha sido.

| Item | Onde apareceu | Descrição | Como tratar | Status |
|---|---|---|---|---|
| Organizador não via eventos cancelados | Bloco 3.3 | `GET /eventos` só lista eventos `PUBLISHED` (é a listagem pública); o painel do organizador inicialmente reaproveitava essa rota e filtrava por `organizerId` no cliente, então um evento cancelado pelo próprio organizador desaparecia da lista dele | Criado `GET /eventos/meus` (organizador autenticado, retorna todos os status) e o front passou a consumir essa rota em vez de filtrar a listagem pública | **Resolvido** |
| `apps/api/prisma/` fora da checagem de tipos do `tsc` | Bloco 1 | O ESLint foi corrigido para cobrir `prisma/` (regra type-aware com projeto sintético), mas o `tsc` do back-end ainda restringe a checagem a `src/` via `rootDir` — um erro de tipo em `prisma/seed.ts` não quebraria o build | Ajustar o `tsconfig.json` para incluir `prisma/` sem misturar esse código com o `rootDir` usado pelo build de produção (`dist/`), provavelmente com um `tsconfig` secundário só para checagem, sem `outDir` | Pendente |
| `Payment` não é tocado no cancelamento de evento | Bloco 3.2 | A cascata de `DELETE /eventos/:id` cancela reservas e ingressos e libera assentos (SPEC.md §4.1), mas não existe integração de pagamento ainda (Bloco 5) — o registro de `Payment` de uma reserva que estava `PAID` fica com status desatualizado depois do cancelamento | Resolvido no Bloco 8: `refundPayment` (Asaas sandbox, estorno real) chamado tanto na cascata do organizador quanto no cancelamento do cliente, com `Payment.status → REFUNDED` | **Resolvido** |

## Registro de Revisões

Preenchido pelo desenvolvedor a cada checkpoint de bloco aprovado.

| Bloco | Data | Aprovado por | Observações |
|---|---|---|---|
| 0 — Setup e Infraestrutura | 14/08/2026 | Vinicius | 36 tarefas concluídas. Desvios do plano original, todos registrados em `DECISIONS.md`: TypeScript adotado nos dois apps; Jest escolhido no lugar do Vitest; trabalho direto na `main`, sem pull requests, com o CI disparado por push; `.dockerignore` movido para a raiz (o contexto de build é o repositório inteiro). O TypeScript ficou na versão 6 porque o `typescript-eslint` ainda não suporta a 7. `AI_USAGE.md` adiado. |
| 1 — Modelagem de Dados | 15/08/2026 | Vinicius | Schema completo com as 6 entidades, migration aplicada, convenção UTC. Seed com as 3 decisões do PRD.md §5 fixadas (sala 8×12, eventos a 30/45 dias, senha123) e expandido para 8 eventos no catálogo (além do mínimo de 2) para testar busca e filtro. Lacuna de configuração corrigida: `apps/api/prisma/` ficava fora do ESLint e do `tsc`. |
| 2 — Autenticação | 15/08/2026 | Vinicius | Back-end (registro/login/me, middlewares `authenticate`/`requireRole`, CORS) e front-end (`AuthProvider`, tela de login, `PrivateRoute`, roteamento) testados manualmente com os 3 papéis semeados. Expiração do token de sessão (7 dias) definida durante a implementação, sem prazo prévio nos documentos — registrada em `DECISIONS.md`. |
| 3 — Catálogo e Gestão de Eventos | 15/08/2026 | Vinicius | Catálogo (TMDb/Ticketmaster) com cache e tratamento de rate limit; CRUD de eventos do organizador com cancelamento em cascata; painel do organizador no front (busca com debounce, formulário de criação/edição, listagem). Dívida técnica identificada e corrigida no processo: `GET /eventos` pública só mostra `PUBLISHED`, então foi criada `GET /eventos/meus` para o organizador ver também os eventos que ele mesmo cancelou. Dívidas pendentes registradas na seção "Dívidas Técnicas". |
| 4 — Reserva (Assento + Quantidade) | 15/08/2026 | Vinicius | Back-end: `GET /eventos/:id/assentos`, expiração *lazy* de reservas vencidas, `POST /reservas/assento` e `POST /reservas/quantidade` com controle de concorrência (update condicional em transação nos dois fluxos), `GET /reservas/minhas`. Concorrência comprovada com dois scripts (`test:concurrency:seat`, `test:concurrency:quantity`) disputando o mesmo assento/estoque simultaneamente — só uma requisição vence em cada caso. Front-end: listagem de eventos, mapa de assentos, seletor de quantidade, tela de confirmação com contador dos 15 min. Correção no meio do bloco: `GET /eventos/:id` não rodava a expiração lazy que o `SPEC.md §2.3` exige — corrigido, pois a própria tela de detalhe dependia disso pra mostrar disponibilidade correta. |
| 5 — Pagamento Simulado | 16/08/2026 | Vinicius | Integração real com o Asaas sandbox (não mockada): cliente com CPF de teste fixo e `notificationDisabled: true`, cobrança PIX com QR Code e copia-e-cola reais, pagamento com cartão de teste resolvido de forma síncrona pelo próprio Asaas (aprovação/recusa determinística pelo número usado), `POST /pagamentos/:reservaId/processar`, `GET /pagamentos/:id`, `POST /webhooks/asaas`, `POST /pagamentos/:id/simular-callback`, comprovante (`invoiceUrl`) exposto quando confirmado. Front-end: tela de checkout com escolha entre PIX e cartão, QR Code real, botão de confirmação manual (o webhook não alcança localhost), polling do status, comprovante. Escopo ampliado por decisão minha em relação ao plano original (só previa uma tela genérica) — detalhe em `AI_USAGE.md`. Testados os dois desfechos (confirmação e recusa) nas duas formas de pagamento, com devolução de assento/estoque na recusa confirmada. |
| 6 — Ingresso, QR e Meus Ingressos | 16/08/2026 | Vinicius | Back-end: emissão de N ingressos (um por entrada) dentro da mesma transação de confirmação do pagamento, JWT assinado por ingresso sem expiração (validade controlada pelo `status` no banco, não pelo prazo do token), renderização do QR via lib `qrcode`, `GET /ingressos/meus`, `GET /ingressos/:id` e `GET /ingressos/compartilhar/:shareToken` (público, sem transferir titularidade). Front-end: tela "Meus Ingressos", detalhe com QR renderizado, botão de compartilhar que copia o link. Este é o marco de fluxo básico ponta a ponta (login → reservar → pagar → ver ingresso) que o desafio pede como prioridade, testado e confirmado, incluindo reserva SHOW gerando N QRs distintos. |
| 7 — Portaria | 16/08/2026 | Vinicius | Back-end: `verifyTicketToken` reaproveitado do Bloco 6, `POST /portaria/validar` seguindo a ordem exata do `SPEC.md §3.2` (assinatura → evento → status), marcação como `USED` por update condicional dentro de transação (mesmo idioma de concorrência dos Blocos 4/5). Front-end: seleção do evento no início da sessão, dois botões explícitos (escanear câmera via `html5-qrcode` ou digitar manualmente) em vez de ligar a câmera sozinha — decisão revisada depois de um primeiro rascunho ser rejeitado, ver `AI_USAGE.md` e `DECISIONS.md`. Papel GATEKEEPER redireciona direto para `/portaria`, sem passar pela home do cliente. Testados os 4 retornos (válido, inválido, já utilizado, evento errado) pela interface. Fecha o loop emissão → validação. |
| 8 — Cancelamento e Devolução | | | |
| 9 — Busca e Filtro | | | |
| 10 — Refinamento de UX | | | |
| 11 — Testes Automatizados | | | |
| 12 — Deploy e Documentação Final | | | |
