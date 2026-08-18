# Decisões de Arquitetura

> Registro do que foi decidido tecnicamente e por quê. Cada escolha foi
> discutida e validada antes de qualquer implementação — este documento existe
> para que qualquer decisão que pareça não-óbvia numa leitura rápida do código
> tenha sua justificativa registrada aqui.

> **Método.** As decisões deste documento são minhas. Usei IA como ferramenta
> de análise — levantar alternativas, expor trade-offs, checar fatos contra a
> documentação oficial — mas a escolha final em cada linha foi minha, e em
> parte dos casos contrariou a recomendação inicial da ferramenta. O registro
> de onde a IA foi usada está em `docs/AI_USAGE.md`.

## Stack Principal

| Camada | Escolha | Motivo |
|---|---|---|
| Organização do repositório | Monorepo (`apps/web`, `apps/api`) | Um único clone para o avaliador rodar tudo; Docker Compose orquestra front + back + banco juntos; commits de ambos os lados ficam no mesmo histórico, mostrando o processo de forma unificada |
| Linguagem (front e back) | TypeScript | O domínio é denso em enums e transições de status (`Reservation`, `Ticket`, `Seat`, `Payment`, `Event` — ver `SPEC.md` §4.2): tipar essas transições transforma em erro de compilação o que em JavaScript seria bug silencioso descoberto só em runtime. Também é o que torna real a type-safety do Prisma citada abaixo — em JS puro os tipos gerados pelo client existem, mas nada impede passar um campo ou enum errado. Aplicado nos dois apps para manter uma linguagem só no monorepo |
| Variáveis de ambiente | `--env-file-if-exists` nativo do Node, sem `dotenv` | O Node 24 carrega arquivos `.env` por conta própria, o que elimina uma dependência. A variante `if-exists` foi escolhida em vez de `--env-file` porque em produção não existe arquivo `.env` — Render e Docker injetam as variáveis pelo próprio ambiente — e a versão estrita abortaria o processo na ausência do arquivo. Cada app tem um `.env.example` versionado como modelo; o `.env` real nunca vai para o repositório |
| Versão do TypeScript | 6.x, não a 7 | A 7 já está disponível, mas o `typescript-eslint` ainda não a suporta — a faixa que ele aceita para no 6.0. Sem ele não há lint com informação de tipo, que é justamente o que pega promise não aguardada dentro de uma transação. Ficar na 6 custa nada: o projeto não usa nenhum recurso exclusivo da versão nova |
| Datas e fuso | Tudo em UTC, com `TZ=UTC` no processo e um utilitário único | O Prisma já grava em UTC, mas o processo Node roda no fuso da máquina — o que faria a mesma regra de prazo dar respostas diferentes aqui e no servidor. Fixar o fuso elimina isso. As duas regras sensíveis a tempo (expiração de 15 minutos, janela de 24 horas para cancelar) ficam num utilitário só, em vez de cada controller fazer sua própria conta de horas |
| Formato de módulo (API) | CommonJS | Exigência do Jest — ver "Decisões Descartadas". Na prática o `tsconfig.json` usa `module: nodenext`, que emite CommonJS porque o `package.json` da API não declara `"type": "module"` |
| Front-end | Vite + React (sem framework tipo Next.js) | O back-end já é servido separadamente por Express — um framework full-stack como Next.js adicionaria complexidade (SSR, rotas de API, Server Components) sem nenhum benefício real, já que a aplicação é 100% logada e não depende de SEO |
| Roteamento (front) | React Router | Padrão maduro do ecossistema React sem framework full-stack; cobre rotas protegidas por papel e rotas dinâmicas sem fricção |
| Estilização | Tailwind CSS + shadcn/ui, customizado | Tailwind acelera estilização mantendo consistência; shadcn/ui (construído sobre Radix UI) resolve componentes complexos (modal, dropdown, select) com acessibilidade pronta — porém com paleta, tipografia e componentes customizados para fugir da aparência padrão reconhecível ("AI slop"). Tailwind 4: a configuração é feita em CSS via `@theme`, sem `tailwind.config.js` |
| Identidade visual | Editorial de alto contraste: quase branco e quase preto, um acento laranja tangerina, geometria de 8px, Outfit no texto e mono nos dados | Terceira direção testada; as duas anteriores não se sustentaram na tela. Detalhada mais adiante |
| Back-end | Node.js + Express | Framework leve e direto, adequado ao escopo do desafio sem overhead de convenções de frameworks maiores (ex: NestJS) |
| ORM | Prisma 7 | Migrations automáticas, schema versionável e transações com update condicional — o que impede vender o mesmo lugar duas vezes. Detalhes da versão 7 mais adiante |
| Banco de dados | PostgreSQL | Relacional, com suporte forte a transactions e constraints — necessário para garantir integridade em reservas concorrentes |
| Autenticação | JWT puro (sem Passport.js) | O sistema tem apenas uma estratégia de login (email/senha, 3 papéis fixos); Passport.js existe para orquestrar múltiplas estratégias (ex: OAuth), o que não se aplica aqui — JWT implementado diretamente é mais simples e mais fácil de justificar decisão por decisão |
| Expiração do token de sessão | 7 dias | Nenhum documento definia um prazo; escolhido como padrão razoável para um app de demonstração, sem fluxo de refresh token — expira, o usuário loga de novo |
| Pagamento simulado | Asaas (sandbox) | Ambiente de testes de provedor real, já com familiaridade prévia |
| Containerização | Docker + Docker Compose | Facilita reprodutibilidade do ambiente (API + Postgres) para o avaliador rodar localmente |
| Deploy — Front, Back e Banco | Render, tudo na mesma plataforma | Planejei Vercel para o front, e troquei por decisão minha na hora do deploy: uma conta a menos para gerenciar. Web Service (Docker), Static Site e PostgreSQL gerenciado, com o ambiente inteiro descrito em `render.yaml` — recriar o deploy do zero não depende de lembrar o que foi clicado no painel. Detalhe mais adiante |
| Testes | Jest | Ver "Decisões Descartadas" — Vitest foi cogitado e perdeu para o Jest |
| QR Code (geração) | Lib `qrcode` | Gera a imagem a partir do payload assinado |
| QR Code (anti-forjamento) | JWT assinado no payload | Reaproveita a mesma abordagem já usada na autenticação — o conteúdo do QR (ex: `ticketId`, `eventId`) é assinado com a chave secreta do servidor; sem essa chave, não é possível forjar um QR que passe na validação |
| Leitura de QR (portaria) | `html5-qrcode` (client-side, via `getUserMedia`) | Permite leitura por câmera direto no navegador, sem necessidade de app nativo; complementado por digitação manual como alternativa |
| API externa — Cinema | TMDb | Catálogo de filmes (nome, sinopse, poster) — sessões, sala e preço são definidos pela própria plataforma |
| API externa — Show | Ticketmaster Discovery | Catálogo de eventos ao vivo reais (nome, data, local) — mapa de assentos, quando aplicável, ainda é definido pela própria plataforma, já que a API não expõe isso |
| Autenticação com o TMDb | API Key v3 (query string), não o Read Access Token v4 (Bearer) | O TMDb aceita as duas formas para o mesmo resultado; a v3 é mais simples (um parâmetro na URL, sem header extra) e já era a que o `.env.example` previa |
| Cache do catálogo externo | Mapa em memória por processo, TTL de 5 minutos, sem Redis | Evita estourar a cota diária do TMDb/Ticketmaster em buscas repetidas. Redis seria infraestrutura extra desnecessária para esse volume — o cache não precisa sobreviver a um restart do processo |
| Documentação de API | OpenAPI via `swagger-ui-express` | Documentação interativa servida em `/api-docs` pela própria aplicação — o avaliador testa a API direto pela URL do deploy, sem instalar nada. Preferido a uma coleção Postman/Insomnia, que exigiria download + importação manual e ficaria facilmente dessincronizada do código |
| Qualidade de código | ESLint (com `typescript-eslint`) + Prettier + `.editorconfig` | Padronização automática de estilo e detecção de problemas, consistente entre editores e entre os dois apps do monorepo; o parser do `typescript-eslint` é o que permite ao ESLint entender a sintaxe de TypeScript |
| Padronização de commits | Husky + lint-staged + Commitlint | `pre-commit` roda lint/format apenas nos arquivos staged; `commit-msg` valida o padrão Conventional Commits — garante histórico legível, que o desafio avalia explicitamente |
| CI | GitHub Actions | Segunda camada de verificação: roda lint (e, a partir do Bloco 11, os testes) a cada `push`, independente da configuração local do desenvolvedor |
| Fluxo de branches | Trabalho direto na `main`, sem branches nem pull requests | O projeto tem um único autor. Pull request existe para revisão por outra pessoa; abrir e aprovar o próprio PR seria cerimônia sem função, e um `PULL_REQUEST_TEMPLATE.md` que nunca fosse usado descreveria um processo inexistente. Por isso o CI é disparado por `push` e não por `pull_request` — do contrário nunca rodaria. A proteção contra código quebrado fica com os hooks locais (que bloqueiam antes do commit) e com o CI (que verifica depois do push) |

## Decisões que Precisam de Mais Espaço

Três escolhas da tabela acima têm consequências espalhadas pelo código, e
resumi-las numa linha esconderia o que importa.

### Prisma 7: quatro surpresas que aparecem no código

- Driver não vem mais embutido: exige adapter explícito
  (`@prisma/adapter-pg`, `new PrismaClient({ adapter })` em
  `src/config/prisma.ts`) — sem isso, nem compila.
- Client gerado é ESM por padrão e usaria `import.meta`, incompatível com o
  CommonJS da API — por isso `moduleFormat = "cjs"` no gerador.
- Client é gerado em `src/`, não em `node_modules`: por isso está no
  `.gitignore`, fora do ESLint/Prettier, e `prisma generate` roda antes do
  `tsc` no build.
- Runtime usa `import()` dinâmico, que o Jest bloqueia por padrão — daí
  `NODE_OPTIONS=--experimental-vm-modules` nos scripts `test`/`test:watch`,
  e o mapeamento de imports `.js` para os `.ts` gerados.

### Identidade visual: editorial de alto contraste

Testei duas outras direções antes desta, uma delas de ingresso impresso, com
papel, grão e picote. Nenhuma se sustentou na tela: com pôster de verdade no
catálogo, a textura disputava atenção com a arte em vez de emoldurá-la.

A direção que ficou faz o contrário. Superfície neutra de altíssimo contraste
(quase branco no tema claro, obsidiana no escuro) e uma única cor quente — a
cor da tela vem do cartaz, e o laranja tangerina só aparece onde há ação ou
estado.

**Tipografia em dois registros.** Outfit no texto, e monoespaçada em tudo que é
dado gerado por máquina: rótulo, data, preço, assento e número de série do
ingresso. A separação é semântica, não decorativa — o que está em mono é dado,
não prosa. Numerais de largura fixa em todos eles, para os dígitos não dançarem
a cada atualização; o contador de quinze minutos do checkout torna isso
visível.

**Ação e perigo em matizes distintos.** Laranja para reservar, pagar e validar;
carmim para cancelar e recusar. Nunca a mesma cor para as duas coisas.

**Uma cor mais escura do laranja, só para texto pequeno.** No tema claro, o
laranja da marca não atinge o contraste mínimo exigido (WCAG AA) para texto
pequeno, só para título. Criei uma variante mais escura dele (`--label`) para
esse caso; no tema escuro não é necessário, o laranja original já basta.

**Geometria.** Cantos de 8px e sombras discretas: a interface é operada no
celular e precisa de hierarquia visível entre card, campo, diálogo e barra
superior.

Da direção anterior ficou o picote do ingresso, único lugar em que a referência
física descreve o objeto que está na tela. O modo escuro tem alternador, com a
escolha guardada no navegador e aplicada antes da primeira pintura, para não
piscar claro a cada recarga. O padrão é o tema claro.

### Deploy no Render: o TLS que a migration escondia

Conduzi o deploy eu mesmo pelo painel do Render. Três problemas apareceram:

- **Build do front falhava** porque o Husky (ferramenta de hooks de commit)
  não existe no ambiente de deploy. Corrigido tornando o script `prepare`
  tolerante a essa ausência.
- **Seed em produção era recusado** com um erro que parecia de permissão, mas
  era falta de TLS na conexão com o banco — o Render exige conexão segura e
  essa configuração não estava explícita no código. Corrigido, e a tempo:
  sem isso, a API publicada falharia em qualquer consulta ao banco, não só
  no seed.
- **Variáveis de ambiente não apareceram sozinhas** nos serviços criados
  depois do deploy inicial. Precisei cadastrar `VITE_API_URL`,
  `ASAAS_API_KEY`, `TMDB_API_KEY` e `TICKETMASTER_API_KEY` manualmente pelo
  painel.

## Convenções de Código

**Idioma.** Todo o código é escrito em inglês: models, campos, enums, tipos,
variáveis, funções, nomes de arquivo e pasta, e comentários. Fica em português
tudo aquilo que é conteúdo do produto e não estrutura — as rotas da API, o
texto da interface, as descrições dos endpoints no Swagger e a prosa destes
documentos.

A fronteira é essa: quem escreve o sistema lê inglês, porque é a língua das
bibliotecas e das ferramentas com que o código convive (`prisma.event
.findMany()` não deveria misturar dois idiomas na mesma linha). Quem usa o
sistema lê português, porque o produto é brasileiro.

**Comentários.** Só onde há algo que o código não diz sozinho: uma decisão
não-óbvia, uma armadilha conhecida, o motivo de uma abordagem ter sido
escolhida em vez da mais direta. Comentário que reafirma o que a linha ao lado
já expressa é ruído, e envelhece mal — o código muda, o comentário fica.
Nomear bem é preferível a explicar depois.

## Decisões de Produto (fluxos)

| Decisão | Escolha | Motivo |
|---|---|---|
| Fluxo de reserva | Implementados os dois (assento + quantidade) | O tipo de local do evento determina o fluxo aplicável — eventos com assento marcado (cinema/teatro) usam mapa de assentos; eventos sem assento marcado (pista/show) usam seleção por quantidade. Implementar os dois cobre a variação real de tipos de evento em vez de simplificar para um caso só |
| Busca e filtro de eventos | Implementado (opcional) | Data, categoria, local e faixa de preço — considerado essencial para a experiência de navegação, mesmo sendo opcional no desafio |
| Cancelamento com devolução ao estoque | Implementado (opcional) | Ver regra completa em `docs/PRD.md`, seção 3.8 |
| Expiração de reserva não paga | 15 minutos, verificação *lazy* | Sem expiração, uma reserva nunca paga travaria o lugar indefinidamente. A verificação preguiçosa (no momento da consulta/disputa) evita a necessidade de cron job ou worker — infraestrutura adicional que não se justifica para um comportamento que só precisa estar correto na leitura. Ver `PRD.md` §3.10 |
| Ingressos por reserva | 1 ingresso por entrada (1:N) | Uma reserva de N ingressos gera N ingressos independentes. Com um único ingresso compartilhado, a validação do primeiro portador marcaria o registro como `USED` e barraria os demais. Ver `PRD.md` §3.7 |
| Papéis no cadastro público | Apenas `CUSTOMER` | Permitir auto-cadastro como `ORGANIZER` ou `GATEKEEPER` seria uma falha de controle de acesso: qualquer visitante poderia publicar eventos ou validar ingressos. Esses papéis vêm exclusivamente do seed. Ver `PRD.md` §3.12 |
| Compartilhamento de ingresso | Link exibe o ingresso completo, sem transferir titularidade | Atende ao requisito de compartilhamento sem entrar em revenda/transferência entre contas, explicitamente fora do escopo do desafio. Ver `PRD.md` §3.7 |
| Pagamento recusado | Encerra a reserva, sem retentativa | Manter a reserva viva após uma recusa exigiria bloquear o lugar por tempo indeterminado, conflitando com a devolução imediata do estoque. Preferimos devolver o lugar ao mercado e deixar o cliente reservar novamente. Ver `SPEC.md` §4.3 |
| Cancelamento de evento | Cascata com reembolso automático | Padrão de mercado: quando a falha é do organizador, o cliente não deve precisar agir nem ficar sujeito à janela de 24h. Ver `PRD.md` §3.11 |
| Reembolso no cancelamento (cliente e organizador) | Estorno real na Asaas sandbox (`POST /payments/:id/refund`), não só uma marcação local | Mesmo padrão de integração verdadeira do Bloco 5 (PIX/cartão reais no sandbox) — "simulado" é o dinheiro da sandbox, não a chamada à API. Novo status `REFUNDED` no enum `PaymentStatus`. Ver `AI_USAGE.md` — "Auditoria do próprio processo" |
| Opções dos filtros do catálogo | Endpoint próprio (`GET /eventos/filtros`) com as categorias e locais existentes | Derivar as opções da listagem já filtrada faria a lista encolher a cada filtro aplicado — escolher uma categoria apagaria as demais da lista. O custo é uma chamada a mais no carregamento da tela. Ver `SPEC.md` §5.2 |
| Campo de data | Máscara própria em pt-BR, com o seletor nativo num botão ao lado | O `<input type="date">` renderiza no idioma do navegador, não no do app — num navegador em inglês, a interface em português exibia `mm/dd/yyyy`. O texto passa a ser da aplicação; o calendário nativo continua disponível, porque é o que serve no celular |
| Banco dos testes | PostgreSQL real, em container próprio na porta 5433, atrás de um profile do Compose | O que a suíte precisa provar é update condicional resolvendo disputa por linha — mock de ORM devolveria o que eu mandasse e o teste passaria mesmo com a lógica errada. O profile mantém esse banco fora do `docker compose up` do dia a dia, e ele não tem volume: é descartável de propósito |
| Testes com o provedor de pagamento | Duas suítes separadas: a principal com o provedor substituído, e uma de contrato que fala com o sandbox de verdade | As duas falham por motivos diferentes e precisam ser lidas diferente — vermelho na principal é erro do nosso código, vermelho na de contrato é mudança no provedor ou rede fora. Numa suíte só, uma queda de conexão apontaria para o teste de disputa de assento, que não tem pagamento nenhum no meio. A de contrato fica fora do `npm test` e roda no CI apenas se a chave existir |
| Categoria como entidade própria | Tabela `Category`, com `Event.categoryId` opcional e `ON DELETE SET NULL` | Apontei uma falha de UX: categoria era texto livre, sem como listar o que já existe nem apagar uma criada errada. Virar entidade exige migration em produção, então validei em três camadas antes de aplicar: SQL bruto contra um cenário forjado no banco de testes, a suíte completa, e um smoke test HTTP contra a API dev com dados reais. `ON DELETE SET NULL` na própria constraint do banco resolve "apagar categoria não pode quebrar evento" sem lógica de cascata na aplicação |
| Criação de categoria pelo formulário | `POST /categorias` idempotente por nome (sem diferenciar caixa) | Pedi que o campo aceitasse escolher uma categoria existente ou criar uma nova sem sair da tela. Idempotência resolve isso num único endpoint: o formulário chama sempre o mesmo POST, existindo ou não, sem precisar saber qual dos dois casos é o seu |
| Reserva/compra restrita a `CUSTOMER` | Bloqueio na interface, não só no back-end | O back-end já recusava `ORGANIZER` e `GATEKEEPER` com 403 em todas as rotas de reserva, pagamento e ingresso — a falha era só de UX: nada impedia esses papéis de verem o mapa de assentos e tentarem reservar, topando com o erro só depois de clicar. Corrigido escondendo o fluxo de reserva na tela do evento e protegendo `/reservas/checkout` por papel, com o mesmo `PrivateRoute` já usado em `/organizador` e `/portaria` |
| Estorno chamado dentro da transação do banco | Mantido, com a limitação assumida | Estornar fora da transação exigiria um estado intermediário no `Payment` ("cancelado, estorno pendente") e um mecanismo de reprocessamento, o que é desenho de sistema de pagamento e não cabe no escopo do desafio. O custo é a transação ficar aberta durante a chamada de rede, multiplicado por reserva paga no cancelamento em cascata de um evento. Em troca, cancelamento e estorno são atômicos: nunca existe reserva cancelada sem dinheiro devolvido |
| Aviso de depreciação do `pg` nos testes | Não tratado, e o motivo registrado | O aviso dispara quando `client.query()` é chamado com a fila da conexão não vazia (`pg/lib/client.js`), e quem enfileira é o `@prisma/adapter-pg` dentro da transação — não há `Promise.all` em `apps/api/src`. Nada a corrigir do nosso lado, e sem efeito no comportamento: o `pg` 8 mantém o suporte, a remoção está anunciada para o `pg` 9. Ponto a reverificar quando o adapter ou o `pg` forem atualizados |
| Contexto da portaria | Evento selecionado no início da sessão | O retorno "evento errado" só é possível se a validação ocorrer no contexto de um evento conhecido; o `eventId` acompanha cada requisição de validação. Ver `PRD.md` §3.9 |
| Confirmação de pagamento | Polling como caminho principal | O webhook do Asaas não alcança `localhost`. Polling em `GET /pagamentos/:id` funciona em qualquer ambiente; o webhook fica ativo apenas em produção, e um endpoint de simulação cobre desenvolvimento e testes. Ver `SPEC.md` §5.5 |
| Fuso horário | UTC no armazenamento e transporte | Regras sensíveis a tempo (janela de 24h, expiração de 15 min) precisam de referência única para não divergir conforme o fuso do cliente ou do servidor. Conversão apenas na apresentação. Ver `PRD.md` §3.13 |
| Rate limit de APIs externas | Debounce no front + cache curto no back | TMDb e Ticketmaster impõem limites diários; buscar a cada tecla digitada esgotaria a cota rapidamente. Ver `SPEC.md` §5.8 |
| Ativação da câmera na portaria | Só após clique explícito em "Escanear QR Code" | Pedir permissão de câmera sem uma ação do usuário é um padrão ruim de UX (o navegador pode até ignorar o pedido por não vir de um gesto do usuário) — a leitura por câmera e a digitação manual aparecem como dois botões de escolha igual, não uma com prioridade escondida atrás da outra. Rejeitava um primeiro rascunho que ligava a câmera sozinha ao selecionar o evento; ver `AI_USAGE.md` — "Decisões que Rejeitei" |
| Navegação do papel portaria | Redireciona direto para `/portaria` ao logar, não passa pela home genérica | Quem fiscaliza não precisa navegar pelo catálogo de compra do cliente; a home genérica é a tela certa para CUSTOMER/ORGANIZER, não para GATEKEEPER. Ver `AI_USAGE.md` — "Decisões que Rejeitei" |

## Decisões Descartadas (e por quê)

- **Next.js** — descartado por redundância: o back-end Express já cumpre o
  papel de servidor; usar Next.js só para o front significaria carregar
  complexidade extra (App Router, Server/Client Components) sem aproveitar
  nenhuma feature que o diferencia do React puro no contexto deste projeto.
- **Passport.js** — descartado por não haver múltiplas estratégias de
  autenticação a orquestrar (só email/senha, 3 papéis fixos).
- **shadcn/ui "puro" (sem customização)** — descartado como está; optamos por
  customizar paleta, tipografia e componentes para evitar a aparência
  genérica associada a interfaces geradas por ferramentas de IA sem nenhuma
  decisão visual própria.
- **JavaScript puro** — descartado apesar de dispensar setup de build e
  tipagem. Seria mais rápido de iniciar, mas deixaria a type-safety do Prisma
  como benefício apenas nominal e transformaria cada engano de enum de status
  (`PAID` vs. `PAGO`) em bug de runtime, num domínio que tem cinco conjuntos
  de status distintos. O custo de TypeScript é concentrado no setup inicial; o
  benefício se acumula ao longo de todos os blocos seguintes.
- **Vitest** — descartado em favor do Jest. Seria mais rápido e exigiria
  menos configuração (ESM e TypeScript nativos, sem `ts-jest`), mas os testes
  decisivos deste projeto — dois clientes disputando o mesmo assento,
  reservas simultâneas estourando a capacidade — precisam rodar contra um
  Postgres de verdade (`SPEC.md` §6), porque mock de ORM não reproduz o
  comportamento de uma transação. Nesse terreno pesa mais maturidade do que
  velocidade: preparação/limpeza do banco entre execuções e controle de
  paralelismo entre workers para os testes não embaralharem dados uns dos
  outros. Custo aceito: `ts-jest` para rodar sobre TypeScript, e a API em
  CommonJS — Jest sobre ESM exige `--experimental-vm-modules` no Node e
  configuração extra no `ts-jest`.
- **oxlint** — apareceu sem ser convidado: o template do Vite passou a
  instalá-lo como linter padrão do front. É bem mais rápido que o ESLint, por
  ser escrito em Rust. Removido mesmo assim, porque a API ia usar ESLint de
  qualquer forma, e manter um linter de cada lado significaria duas
  configurações, duas entradas nos hooks de commit e dois passos no CI para
  resolver o mesmo problema. Um linter só, nos dois apps.
- **Sequelize** — descartado em favor do Prisma, pela melhor DX, migrations
  automáticas e type-safety.
- **UUID + HMAC para o QR** — descartado em favor de JWT assinado, por
  reaproveitar a mesma abordagem já usada na autenticação, evitando introduzir
  um mecanismo de assinatura adicional só para essa funcionalidade.
- **Coleção Postman/Insomnia** — descartada em favor de OpenAPI/Swagger:
  uma coleção exportada é um artefato solto que precisa ser mantido
  manualmente em sincronia com o código e exige que o avaliador baixe,
  importe e configure variáveis de ambiente antes de testar. A documentação
  servida pela própria aplicação em `/api-docs` elimina esse atrito.
- **Railway / Fly.io para deploy do back-end** — descartados em favor do
  Render, por permitir back-end + Postgres gerenciado na mesma plataforma com
  menor fricção de configuração.

## Diagrama de Arquitetura

```mermaid
graph TB
    subgraph Cliente["Navegador"]
        WEB["apps/web<br/>Vite + React + TypeScript + React Router<br/>Tailwind + shadcn/ui"]
        CAM["Câmera do dispositivo<br/>(html5-qrcode)"]
    end

    subgraph Servidor["Render"]
        API["apps/api<br/>Node.js + Express + TypeScript"]
        DB[("PostgreSQL<br/>via Prisma ORM")]
    end

    subgraph Externos["Serviços Externos"]
        TMDB["TMDb API<br/>catálogo de filmes"]
        TM["Ticketmaster Discovery<br/>catálogo de shows"]
        ASAAS["Asaas Sandbox<br/>pagamento simulado"]
    end

    WEB -->|"HTTP / JSON<br/>Bearer JWT"| API
    CAM -.->|"lê QR → texto (JWT)"| WEB
    API --> DB
    API -->|"busca catálogo"| TMDB
    API -->|"busca catálogo"| TM
    API -->|"cobrança simulada"| ASAAS
    ASAAS -.->|"webhook"| API
```

**Pontos-chave da arquitetura:**

- **Separação estrita front/back**: `apps/web` é uma SPA que consome exclusivamente a API REST em `apps/api`. Nenhuma lógica de negócio ou acesso a banco acontece no front.
- **APIs externas nunca são chamadas pelo navegador**: todas as integrações (TMDb, Ticketmaster, Asaas) passam pelo back-end, mantendo as chaves de API fora do cliente.
- **Leitura de QR é client-side**: a câmera decodifica o QR no navegador (`html5-qrcode`) e envia apenas o texto resultante (o JWT) para validação no back-end — nenhuma imagem trafega.
- **Deploy separado**: front na Vercel (estático), back + banco no Render, comunicando-se por HTTP.

## Estrutura de Diretórios (monorepo)

```
elite-dev-verzel/
├── apps/
│   ├── web/                 # Front-end (Vite + React + TypeScript)
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── services/    # chamadas à API Express
│   │       └── contexts/
│   └── api/                 # Back-end (Express + TypeScript)
│       └── src/
│           ├── routes/
│           ├── controllers/
│           ├── services/
│           ├── middlewares/
│           └── config/
├── docs/
│   ├── PRD.md          # requisitos de produto e regras de negócio
│   ├── DECISIONS.md    # decisões de arquitetura e alternativas descartadas
│   ├── SPEC.md         # modelo de dados, rotas e regras técnicas
│   ├── TASKS.md        # plano de execução em blocos e checklist
│   └── AI_USAGE.md     # registro do uso de IA no processo
├── docker-compose.yml
├── README.md
└── .gitignore
```

`packages/shared/` foi deliberadamente deixado de fora por ora — não há
necessidade real sem um segundo cliente (ex: app mobile) consumindo tipos
compartilhados. A estrutura em `apps/` já comporta essa expansão futura sem
necessidade de reorganização, caso venha a ser necessária.
