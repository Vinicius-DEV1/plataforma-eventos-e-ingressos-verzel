# Uso de IA no Projeto

> Este documento descreve como ferramentas de IA foram usadas ao longo do
> desenvolvimento deste projeto, seguindo a recomendação do próprio desafio
> Elite Dev. Ele complementa `docs/DECISIONS.md` (que registra **o quê** foi
> decidido tecnicamente) descrevendo especificamente **como** a IA participou
> desse processo.

## Ferramentas Utilizadas

- **Claude (Anthropic)** — planejamento arquitetural, discussão de trade-offs
  entre tecnologias, geração de código e documentação sob orientação direta.

## Fluxo de Trabalho Adotado

O desenvolvimento seguiu o plano em `docs/TASKS.md`: blocos sequenciais de
tarefas atômicas, com um checkpoint obrigatório ao final de cada bloco em que
eu testava manualmente as funcionalidades antes de autorizar o avanço. A IA
não marcava uma tarefa como concluída por conta própria — cada item só era
validado após minha verificação.

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
- **Revisão do que ficou de fato pronto.** Numa das entregas a ferramenta
  afirmou que a issue podia ser fechada; conferi os itens um a um e um deles
  não tinha sido feito. Voltamos e completamos antes de fechar.

## Decisões que Rejeitei ou Modifiquei em Relação à Sugestão Inicial da IA

- **Jest no lugar de Vitest.** A recomendação era Vitest, por ser mais rápido
  e exigir menos configuração. Escolhi Jest porque os testes que importam
  neste projeto rodam contra um Postgres de verdade, e ali pesa mais a
  maturidade da ferramenta do que a economia de setup. A consequência apareceu
  depois: para o Jest funcionar sem contorno, a API precisou ficar em
  CommonJS.

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
