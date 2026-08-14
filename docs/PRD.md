# PRD — Plataforma de Eventos e Ingressos

> Documento de Requisitos do Produto. Consolida o que foi definido no desafio
> Elite Dev (Verzel) e as decisões de produto tomadas onde o enunciado deixava
> espaço em aberto. Este arquivo é autocontido: não é necessário ler o PDF
> original para entender o produto.

## 1. Visão Geral

Plataforma web onde **organizadores** publicam eventos (filmes em cartaz ou
shows/eventos ao vivo) a partir de catálogos externos reais, e **clientes**
navegam, reservam, pagam (de forma simulada) e recebem ingressos com QR Code.
Na entrada do evento, a **portaria** valida esses ingressos.

O produto resolve o fluxo ponta a ponta de bilheteria — desde a criação do
evento até a validação na entrada — cobrindo dois modelos de reserva distintos
(assento marcado e quantidade livre), que são os dois formatos mais comuns do
mercado de ingressos (cinema/teatro vs. shows/pista).

## 2. Usuários e Papéis

### Organizador
- Busca filmes (TMDb) ou eventos (Ticketmaster) em catálogos externos
- Cria um evento na plataforma a partir desse catálogo, definindo data, local,
  capacidade e preço
- Gerencia (edita/cancela) os eventos que criou

### Cliente
- Navega, busca e filtra eventos publicados
- Reserva um lugar (assento, se evento tipo cinema/teatro) ou uma quantidade
  de ingressos (se evento tipo show/pista)
- Paga de forma simulada (Asaas sandbox), com fluxo de confirmação e recusa
- Acessa "Meus Ingressos", com o código QR de cada ingresso válido
- Compartilha um ingresso via link
- Cancela uma reserva, dentro da regra de prazo definida (ver seção 3.8)

### Portaria
- Seleciona o evento que está fiscalizando ao iniciar a sessão
- Valida ingressos na entrada do evento, via leitura de câmera (QR) ou
  digitação manual do código
- Recebe retorno claro sobre o resultado da validação: válido, inválido, já
  utilizado, ou evento errado

## 3. Funcionalidades

### 3.1 Catálogo de Eventos
- Duas fontes externas, cada uma alimentando um tipo de evento:
  - **TMDb** → filmes em cartaz → eventos do tipo **CINEMA**
  - **Ticketmaster Discovery** → shows/eventos ao vivo → eventos do tipo
    **SHOW**
- O organizador busca no catálogo externo e usa esses dados (nome, imagem,
  sinopse/descrição) como base para criar o evento na plataforma

### 3.2 Busca e Filtro de Eventos (Cliente)
Critérios de filtro disponíveis:
- **Data** (do evento)
- **Categoria** (ex: ação, comédia, rock, teatro — depende da origem)
- **Local**
- **Faixa de preço** (mínimo/máximo)

### 3.3 Criação e Gerenciamento de Evento (Organizador)
- Organizador define, a partir do item do catálogo: data, local, capacidade
  total, preço
- O **tipo do evento** (CINEMA ou SHOW) determina automaticamente qual fluxo
  de reserva o cliente vai ver

### 3.4 Fluxo de Reserva — Assento (eventos tipo CINEMA)
- Cliente visualiza um mapa de assentos (fileira/número) com status
  (disponível, reservado, vendido)
- Cliente escolhe um assento específico
- Regra de negócio: um assento nunca pode ser reservado por dois clientes
  simultaneamente
- **Expiração da reserva**: ao reservar, o cliente tem **15 minutos** para
  concluir o pagamento. Passado esse prazo sem confirmação, a reserva expira
  automaticamente e o assento volta a ficar disponível (ver seção 3.10)

### 3.5 Fluxo de Reserva — Quantidade (eventos tipo SHOW)
- Cliente escolhe quantos ingressos deseja (sem lugar marcado — pista)
- Regra de negócio: a soma de ingressos reservados nunca pode ultrapassar a
  capacidade total do evento
- **Expiração da reserva**: mesma regra de 15 minutos — a quantidade
  reservada volta ao estoque se o pagamento não for concluído (ver seção
  3.10)

### 3.6 Pagamento (Simulado)
- Processado via Asaas (ambiente sandbox), sem transação financeira real
- Contempla dois desfechos: confirmação (reserva vira ingressos) e recusa
- **Em caso de recusa, a reserva é encerrada** (`RECUSADA`) e o estoque
  devolvido imediatamente. Não há retentativa sobre a mesma reserva — o
  cliente refaz o fluxo do início. Manter o lugar bloqueado após uma falha de
  pagamento conflitaria com a devolução imediata do estoque

### 3.7 Ingresso e QR Code
- Gerado automaticamente após confirmação do pagamento
- **Um ingresso por lugar/entrada**: uma reserva de N ingressos (evento tipo
  SHOW) gera **N ingressos independentes**, cada um com seu próprio QR e seu
  próprio ciclo de validação. Isso permite que N pessoas distintas entrem no
  evento, e evita que a validação do primeiro invalide os demais
- Contém um código QR não-forjável (payload assinado com JWT — ver
  `docs/SPEC.md` para detalhes técnicos)
- Fica disponível na área "Meus Ingressos" do cliente

**Compartilhamento via link**

Cada ingresso possui um link único gerado pela aplicação. Quem acessa o link
visualiza o ingresso completo, **incluindo o QR Code**, e pode usá-lo para
entrar no evento.

Decisão de produto: o compartilhamento **não transfere titularidade**. O
ingresso continua vinculado ao cliente que o comprou; o link apenas permite
que ele repasse a entrada a outra pessoa, equivalente a enviar o PDF do
ingresso por mensagem. Transferência formal entre contas caracterizaria
revenda entre usuários, explicitamente fora do escopo (seção 4).

### 3.8 Cancelamento e Devolução ao Estoque
- **Regra**: o cliente pode cancelar uma reserva/ingresso até **24 horas
  antes** do horário do evento, com **reembolso total** (simulado)
- Após esse prazo, o cancelamento **não é permitido**
- Ao cancelar dentro do prazo, o assento (CINEMA) ou a quantidade (SHOW)
  correspondente volta a ficar disponível para outros clientes

> Nota sobre a origem da regra: baseada em padrões comuns de mercado
> (Ticketmaster, Eventim, Sympla costumam usar janelas de 24–48h). Optamos
> pela versão mais simples (janela única de 24h, reembolso sempre total) por
> ser suficiente para o escopo do desafio e por o pagamento já ser simulado —
> uma lógica de reembolso parcial escalonado adicionaria complexidade sem
> benefício real de demonstração técnica.

### 3.9 Validação na Portaria
- **Seleção de evento**: ao iniciar a sessão, o usuário de portaria escolhe
  qual evento está fiscalizando. Toda validação subsequente é feita no
  contexto desse evento — é isso que permite o retorno "evento errado"
- Leitura do QR via câmera do dispositivo (navegador), com digitação manual
  do código como alternativa
- Retornos possíveis:
  - **Válido** — ingresso aceito, marcado como utilizado
  - **Inválido** — assinatura do QR não confere (possível forjamento)
  - **Já utilizado** — ingresso já foi validado anteriormente
  - **Evento errado** — ingresso pertence a outro evento

### 3.10 Expiração de Reserva Não Paga

- Toda reserva criada recebe um prazo de **15 minutos** para ter o pagamento
  confirmado
- Expirado o prazo sem confirmação, a reserva passa ao status `EXPIRADA` e o
  estoque é devolvido automaticamente: assento volta a `DISPONIVEL` (CINEMA)
  ou a quantidade é reincorporada ao estoque (SHOW)
- A liberação é verificada de forma preguiçosa (*lazy*): sempre que assentos
  ou disponibilidade de um evento são consultados, ou quando uma nova reserva
  é tentada, as reservas vencidas daquele evento são expiradas antes da
  operação

> Justificativa: sem expiração, uma reserva nunca paga travaria o lugar
> indefinidamente. Plataformas de bilheteria usam janelas semelhantes
> (tipicamente 10–15 minutos) pelo mesmo motivo. A abordagem *lazy* foi
> escolhida em vez de um job agendado por não exigir infraestrutura
> adicional (cron/worker) para um comportamento que só precisa estar correto
> no momento da consulta.

### 3.11 Cancelamento de Evento pelo Organizador

Quando o organizador cancela um evento, o sistema segue o padrão adotado por
plataformas de bilheteria: o evento é cancelado e **todos os ingressos são
reembolsados automaticamente**, sem exigir ação do cliente.

- O evento passa a `CANCELADO` e deixa de aparecer na listagem pública
- Todas as reservas ativas (`PENDENTE` ou `PAGA`) passam a `CANCELADA`
- Todos os ingressos `VALIDO` do evento passam a `CANCELADO`, deixando de
  ser aceitos na portaria
- Reservas pagas geram reembolso total simulado, **independentemente da
  janela de 24 horas** — essa restrição se aplica apenas ao cancelamento
  por iniciativa do cliente (seção 3.8), nunca quando a falha é do
  organizador
- Ingressos já `UTILIZADO` não são alterados (preservam a trilha de
  auditoria de quem efetivamente entrou)

### 3.12 Cadastro de Usuários e Papéis

O cadastro público (`/auth/registro`) cria **exclusivamente** usuários com o
papel `CLIENTE`. Usuários `ORGANIZADOR` e `PORTARIA` existem apenas via seed.

> Justificativa: permitir que qualquer visitante se cadastrasse como
> organizador ou portaria seria uma falha de controle de acesso — qualquer
> pessoa poderia publicar eventos ou validar ingressos. Em um produto real,
> esses papéis seriam criados por convite ou por um administrador; para o
> escopo deste desafio, o seed cumpre esse papel sem adicionar uma camada de
> administração não solicitada.

### 3.13 Convenção de Data e Hora

- Todas as datas são **armazenadas e transmitidas em UTC** (ISO 8601)
- A conversão para o fuso local acontece apenas na camada de apresentação
  (front-end)
- Regras sensíveis a tempo — janela de 24h para cancelamento (3.8) e
  expiração de 15 minutos da reserva (3.10) — são sempre calculadas em UTC,
  evitando divergência conforme o fuso do cliente ou do servidor

## 4. Fora de Escopo

Itens explicitamente não implementados, por definição do próprio desafio:
- Emissão de nota fiscal
- Revenda de ingressos entre usuários
- Aplicativo nativo (mobile)
- Recuperação de senha
- Envio de ingresso por e-mail

## 5. Dados de Teste (seed obrigatório)

Para permitir que o fluxo seja percorrido sem configuração manual:

**Usuários**
- 1 organizador
- 2 clientes
- 1 usuário de portaria

**Eventos**
- 1 evento tipo `CINEMA` publicado, com mapa de assentos gerado e lugares
  disponíveis
- 1 evento tipo `SHOW` publicado, com estoque de ingressos disponível

**Estado pré-existente** (permite testar cada tela isoladamente, sem
percorrer o fluxo inteiro antes)
- 1 reserva paga do cliente 1, com ingresso `VALIDO` — permite testar a tela
  de portaria e o compartilhamento por link imediatamente
- 1 ingresso já `UTILIZADO` — permite verificar o retorno "já utilizado" sem
  consumir o ingresso válido acima

> Os dois eventos devem ter data futura o bastante para que o cancelamento
> pelo cliente (janela de 24h, seção 3.8) seja testável.

## 6. Métricas de Sucesso (critérios de aceite informais)

O fluxo é considerado completo quando um avaliador consegue, usando apenas os
dados semeados:

**Fluxo principal**
1. Logar como cliente, buscar/filtrar um evento, reservar (assento ou
   quantidade), pagar (simulado) e visualizar o ingresso com QR em "Meus
   Ingressos"
2. Logar como portaria, selecionar o evento e validar esse ingresso,
   recebendo o retorno correto
3. Tentar validar o mesmo ingresso novamente e receber "já utilizado"
4. Apresentar à portaria um ingresso de outro evento e receber "evento
   errado"
5. Logar como organizador e criar um novo evento a partir do catálogo externo

**Regras de negócio**
6. Reservar N ingressos em um evento `SHOW` e confirmar que são gerados N
   ingressos com QRs distintos (§3.7)
7. Reservar sem pagar e confirmar que, após 15 minutos, o lugar volta a ficar
   disponível (§3.10)
8. Como cliente, cancelar uma reserva dentro do prazo permitido e confirmar
   que o estoque foi devolvido (§3.8)
9. Tentar cancelar fora da janela de 24h e confirmar que a operação é
   bloqueada (§3.8)
10. Como organizador, cancelar um evento e confirmar que os ingressos
    vendidos deixam de ser aceitos na portaria (§3.11)
11. Ter um pagamento recusado e confirmar que a reserva é encerrada e o
    estoque devolvido (§3.6)
