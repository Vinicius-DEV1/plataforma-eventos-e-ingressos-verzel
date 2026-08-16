# Uso de IA no Projeto

> Este documento descreve como ferramentas de IA foram usadas ao longo do
> desenvolvimento deste projeto, seguindo a recomendação do próprio desafio
> Elite Dev. Ele complementa `docs/DECISIONS.md` (que registra **o quê** foi
> decidido tecnicamente) descrevendo especificamente **como** a IA participou
> desse processo.

## Ferramentas Utilizadas

- **Claude Code (Anthropic)** — usado como agente no terminal, não como chat
  de copiar e colar: ele lê e escreve arquivos do projeto e roda comandos
  diretamente. Isso muda a natureza do controle necessário, e é o que motivou
  as regras da seção seguinte.

## Fluxo de Trabalho Adotado

O desenvolvimento seguiu o plano em `docs/TASKS.md`: blocos sequenciais de
tarefas atômicas, com um checkpoint obrigatório ao final de cada bloco em que
eu testava manualmente as funcionalidades antes de autorizar o avanço. A IA
não marcava uma tarefa como concluída por conta própria — cada item só era
validado após minha verificação.

Como a ferramenta escreve arquivos e executa comandos sozinha, estabeleci três
regras no começo e as reforcei quando foram desrespeitadas:

**Nada é feito sem aprovação explícita, uma ação de cada vez.** Recomendação e
execução não vêm no mesmo passo — mais de uma vez a ferramenta respondeu a uma
pergunta minha e já implementou a resposta junto, e eu pedi que voltasse a
apenas propor.

**Comandos de git e da minha conta no GitHub são meus.** Ela escreve o comando,
eu leio e executo. Isso vale inclusive para verificações de leitura.

Essa regra começou restrita a git/GitHub, mas foi ampliada no Bloco 1: a
ferramenta vinha rodando por conta própria tudo que classificava como "só
verificação" — instalar dependências, rodar o próprio seed, abrir o Prisma
Studio, checagens avulsas de lint e de tipo. Pedi para parar. Além do
controle sobre o que entra no repositório, preciso saber rodar cada comando
sozinho, porque posso ser questionado sobre o projeto numa entrevista técnica
— e isso não se aprende vendo a IA rodar por mim.

Essa restrição é sobre comandos de terminal, não sobre editar arquivo. As
chaves gratuitas do TMDb e do Ticketmaster, por exemplo, eu colei no chat e
pedi para a IA salvar direto no `apps/api/.env` — um arquivo local, fora do
Git (`.gitignore` cobre `.env`), então não há risco de ir para o
repositório. A IA nunca reexibiu essas chaves depois de salvas.

**Comentários no código só quando necessários.** O código vinha com blocos
longos explicando o óbvio; pedi para enxugar, deixando comentário apenas onde
há decisão não-óbvia ou armadilha conhecida. A justificativa longa foi para
`DECISIONS.md`, que é o lugar dela.

**Toda edição precisa ser explicada no chat, não só feita.** No Bloco 2,
percebi que a ferramenta escrevia bastante código (contexto de autenticação,
rotas protegidas) e só listava os arquivos, sem explicar o que cada peça
fazia ou por quê. Pedi para parar: preciso entender o projeto inteiro para
poder defendê-lo numa entrevista técnica, não só ter certeza de que ele
funciona. A primeira tentativa de explicação veio densa demais — um resumo
arquivo por arquivo, tudo de uma vez, difícil de acompanhar. Funcionou melhor
quando a explicação seguiu a ordem em que as coisas realmente acontecem
(ex: "o usuário manda a senha, aqui ela vira hash, aqui é comparada, aqui
nasce o token..."), com o trecho de código de cada passo, e parando em
pontos digestíveis para eu confirmar que entendi antes de continuar.

## Como Conduzi o Processo

Atuei como arquiteto do projeto do início ao fim: todas as decisões de stack,
estrutura de dados, fluxos de negócio e organização do repositório foram
minhas, tomadas após discutir prós e contras com a IA — nunca aceitas por
padrão. O processo completo de decisão está registrado em
`docs/DECISIONS.md`.

Exemplos de decisões em que optei deliberadamente por uma alternativa mais
simples ou diferente da primeira sugestão, justamente para evitar escolhas
"padrão de ferramenta de IA" sem propósito:

- **Vite em vez de Next.js**: a sugestão inicial explorou os dois lados: mesmo
  sendo o framework mais comum do mercado, Next.js não teria função real no
  projeto já que o back-end é servido separadamente por Express. Optei pela
  arquitetura mais enxuta e coerente com o problema.
- **JWT puro em vez de Passport.js**: mesma lógica — evitar camada de
  abstração para um problema (múltiplas estratégias de login) que o projeto
  não tem.
- **shadcn/ui customizado, não "puro"**: percebi o risco de o resultado
  parecer uma interface genérica reconhecível como gerada por IA, e a decisão
  final foi usar a base de componentes (Radix, via shadcn) mas com paleta,
  tipografia e adaptações visuais próprias.
- **Swagger em vez de coleção Postman**: optei pela documentação servida pela
  própria aplicação, acessível pela URL do deploy, em vez de um arquivo
  exportado que o avaliador teria de baixar e importar.

Além das decisões de stack, conduzi uma revisão crítica do planejamento antes
de escrever código, que expôs lacunas de regra de negócio não cobertas pelo
enunciado. Cada uma foi decidida por mim e registrada na documentação:
expiração de reserva não paga (15 min), geração de um ingresso por entrada,
restrição de papéis no cadastro público, contexto de evento na portaria,
comportamento do pagamento recusado, e cancelamento de evento em cascata.

## Onde a IA Ajudou

- Estruturação do checklist de decisões técnicas, com explicação de
  trade-offs entre alternativas em cada camada da stack
- Modelagem de dados e desenho das rotas da API, a partir dos requisitos do
  desafio e das decisões já tomadas
- Geração da documentação (`PRD.md`, `DECISIONS.md`, `SPEC.md`)
- Escrita do código de infraestrutura: configuração de ESLint e Prettier,
  hooks de commit, Dockerfile, workflow de CI e o schema do Prisma. Tudo
  passou pela minha revisão antes de virar commit.
- Diagnóstico de falhas. Quando o CI quebrou, a hipótese foi reproduzida
  localmente antes de qualquer correção — apaguei o client gerado, rodei o
  lint e vi os mesmos cinco erros do runner. Só então mexemos no workflow.
- Antecipação de problemas que eu não teria previsto. Antes de eu testar o
  Docker, apareceu que o `npm ci` falharia porque o arquivo de lock descreve
  os dois apps e o `.dockerignore` estava excluindo um deles.
- Transparência quando uma ferramenta de busca na web falhou (erro interno,
  não relacionado à pergunta): em vez de insistir ou inventar uma resposta,
  a IA respondeu com o que já sabia (como gerar chaves gratuitas do TMDb e
  do Ticketmaster), avisando explicitamente que não conseguiu confirmar ao
  vivo, para eu checar direto na fonte se quisesse.
- Identificação de uma lacuna de configuração no Bloco 1: `prisma/` ficava
  fora tanto do ESLint quanto do `tsc` do back-end — os dois cobrem só
  `src/`. Um script real como o de seed nunca seria checado no CI. Corrigi o
  ESLint (regra type-aware com projeto sintético, sem tocar no
  `tsconfig.json`); o ajuste do `tsc` fica pendente porque mexe no `rootDir`
  que hoje separa o que entra no build do servidor do resto.
- No script de seed, o QR Code de cada ingresso já nasce como um JWT
  assinado de verdade — mesma chave e mesmo payload que a validação da
  portaria vai usar quando esse endpoint existir — e a senha das quatro
  contas é hash bcrypt real. Nenhum placeholder: o seed já serve de teste do
  fluxo real assim que o Bloco correspondente for implementado.
- Depuração de um bug de ambiente que não tinha nada a ver com o código: o
  login retornava 404 mesmo com o servidor local rodando e sem erro nenhum.
  A causa era um container Docker antigo da API, de 17 horas atrás, ainda
  segurando a porta 3333 — o `curl` estava batendo nesse container, não no
  `npm run dev` novo. A ferramenta isolou a hipótese (`docker compose ps`)
  antes de eu precisar adivinhar.
- Scripts de verificação de concorrência (Bloco 4,
  `apps/api/scripts/test-seat-concurrency.ts` e
  `test-quantity-concurrency.ts`, `npm run test:concurrency:seat` /
  `test:concurrency:quantity`): disparam duas reservas simultâneas
  (`Promise.all`) a partir de dois clientes distintos — no assento, as duas
  disputam o mesmo lugar; na quantidade, cada uma pede um pouco mais da
  metade do estoque restante, de forma que juntas excedem o disponível, mas
  nenhuma sozinha seria rejeitada por uma checagem ingênua (não atômica).
  Em ambos os casos, o script confirma que uma recebe `201` e a outra
  `409`. Escritos pela IA, mas rodados e conferidos por mim — é a forma de
  validar manualmente as garantias dos §2.1 e §2.2 do `SPEC.md` antes da
  suíte automatizada do Bloco 10 existir.

## O Que Fiz Sem IA / Com Maior Intervenção Manual

- **Todos os commits e operações de git.** Nenhum comando que tocasse o
  repositório ou minha conta no GitHub foi executado pela ferramenta — ela
  escrevia os comandos, eu conferia e rodava.
- **Instalação e configuração do Docker** na máquina.
- **Toda verificação funcional.** Os testes dos hooks de commit (tentar
  commitar com mensagem errada e com lint quebrado, e confirmar que os dois
  são bloqueados), a conferência da interface no navegador, a execução do CI,
  a inspeção das tabelas no Prisma Studio. A ferramenta não tinha acesso ao
  meu Docker nem à tela, então nada disso podia ser validado por ela.
- **A direção visual do produto.** Recebi três propostas — cinema noturno,
  ingresso impresso e editorial de alto contraste — e escolhi a segunda. A
  paleta e a fonte saíram dessa escolha.
- **Cadastro e fechamento das issues** no GitHub.
- **Confirmação e execução do reset do banco (`prisma migrate reset`).** A
  própria ferramenta do Prisma bloqueou a IA de rodar o comando sozinha, por
  ser destrutivo — recebi a explicação do que o comando faz e por quê, e
  rodei eu mesmo.
- **Revisão do que ficou de fato pronto.** Numa das entregas a ferramenta
  afirmou que a issue podia ser fechada; conferi os itens um a um e um deles
  não tinha sido feito. Voltamos e completamos antes de fechar.

## Decisões que Rejeitei ou Modifiquei em Relação à Sugestão Inicial da IA

- **Jest no lugar de Vitest.** Detalhe completo em `DECISIONS.md`, seção
  "Decisões Descartadas".

- **Ordem do Bloco 0.** O plano deixava lint, formatação e hooks de commit
  para depois do banco e do Docker. Questionei, e ficou claro que era melhor
  antes: o projeto já tinha inconsistência de estilo com quatro arquivos, e
  formatar depois significaria um commit tocando o projeto inteiro. Trocamos a
  ordem.

- **Trabalho direto na `main`, sem pull requests.** O plano previa PRs e um
  template para eles. Como sou o único autor, abrir e aprovar o próprio PR
  seria cerimônia sem função. Removemos o template e o CI passou a ser
  disparado por push — do contrário nunca rodaria.

- **Código todo em inglês.** A especificação estava escrita em português,
  incluindo nomes de campo e enums. Decidi padronizar o código em inglês e
  manter em português só o que é do produto: rotas, interface e a prosa dos
  documentos. Foi feito antes de o schema existir, que era o momento mais
  barato.

- **Formato das issues.** O primeiro formato proposto trazia os códigos
  internos do plano dentro do texto da issue, o que só faz sentido para quem
  leu o `TASKS.md`. Pedi para reescrever; a segunda versão ficou vaga demais e
  a terceira, explicativa demais. Fechamos num formato onde cada item diz o
  que fazer e nomeia o arquivo, sem explicar o óbvio.

- **Um dado citado sem fonte.** A ferramenta afirmou um limite do plano
  gratuito do Render como se fosse fato. Pedi a fonte, ela não conseguiu
  confirmar e admitiu que era de memória. Fui à documentação oficial e trouxe
  os números corretos, que estão hoje registrados no plano de tarefas.

- **Não reescrever o histórico para esconder um erro.** Dois commits ficaram
  com o CI vermelho até a causa ser encontrada. Dava para juntar tudo e forçar
  o envio, deixando o histórico limpo. Preferi manter: a sequência de quebra e
  correção, com a mensagem explicando o quê e por quê, é mais honesta do que um
  repositório onde nada nunca falhou.

## Artefatos de Processo Versionados

Como recomendado pelo desafio, os seguintes artefatos do processo de
planejamento foram versionados junto ao código, e não descartados após o uso:

- `docs/PRD.md` — requisitos de produto, incluindo decisões de regra de
  negócio tomadas onde o desafio deixava espaço em aberto (ex: critérios de
  filtro, regra de cancelamento)
- `docs/DECISIONS.md` — decisões de arquitetura e tecnologias, com
  alternativas descartadas e motivo
- `docs/SPEC.md` — especificação técnica de modelo de dados, rotas e regras
  de concorrência
- `docs/TASKS.md` — plano de execução em blocos, com tarefas atômicas,
  checkpoints obrigatórios de revisão e as regras que a IA seguiu durante a
  implementação
- `docs/AI_USAGE.md` — este documento

O `TASKS.md` também guarda um registro de revisões, preenchido a cada bloco
aprovado, com a data e o que mudou em relação ao plano original.

## Uma Observação Sobre Versões

Boa parte do atrito do Bloco 0 não veio da IA nem do projeto, mas de trabalhar
com versões recém-lançadas. O TypeScript 7 removeu três opções de configuração
que praticamente todo tutorial ainda ensina; o Prisma 7 mudou o construtor do
client, passou a gerar código dentro de `src/` e removeu uma flag do Prisma
Studio. Cada uma dessas quebrou o build ou um comando antes de ser resolvida.

Registro isso porque explica escolhas que, sem contexto, pareceriam
arbitrárias — por exemplo, o TypeScript estar fixado na versão 6: a 7 está
instalável, mas o `typescript-eslint` ainda não a suporta, e sem ele não há
lint com informação de tipo.

## Linha do Tempo

Dias 1 e 2: análise do desafio, planejamento e escolha das tecnologias,
estudo de como estruturar o processo. Foi quando nasceram PRD.md, SPEC.md,
DECISIONS.md e TASKS.md, antes de qualquer linha de código.

Dias 3 e 4 (em andamento): execução do plano, com a IA conduzindo o
desenvolvimento enquanto reviso cada funcionalidade entregue, comparo com o
planejado e corrijo pequenas lacunas que aparecem no caminho.

(Seção em atualização conforme os próximos dias do projeto acontecem.)

## Nota Final

Agradeço a oportunidade de participar deste processo seletivo. Dediquei
bastante tempo a este projeto, testando cada funcionalidade, revisando
decisões e me certificando de entender o que foi construído, não só de que
funciona.

Sei que ainda tenho muito a aprender e me esforcei ao máximo em cada etapa
deste projeto. Estou aberto a receber feedback e dicas sobre como conduzir
melhor o desenvolvimento. Toda ferramenta ou tecnologia sugerida que eu não
conhecia entrou no projeto só depois de eu estudar e pesquisar se realmente
fazia sentido aplicá-la aqui, em vez de aceitar a sugestão por aceitar.
