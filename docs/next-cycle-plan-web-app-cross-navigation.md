# Plano do Próximo Ciclo - Web App Navegação Cruzada

Veja também: `docs/next-cycle-plan-web-app-search-tests.md`
Veja também: `docs/next-cycle-web-app-contexts-closeout.md`

## Objetivo

Melhorar a navegação funcional entre os contextos já existentes do `apps/web`:

- `match`
- `team`
- `player`

O foco deste ciclo é validar fluxo de uso e arquitetura de informação sem abrir
novos endpoints na `data-api` e sem criar contextos novos ainda.

## O que este ciclo herda

- busca, partida, time e jogador já existem como superfícies reais do app
- `match`, `team` e `player` já usam URL pública por `slug`
- a busca já entrega navegação inicial por contexto
- `team` e `player` já expõem listas relacionadas suficientes para navegação cruzada
- `player.recentAppearances` e `player.statEntries` já incluem `matchSlug`

## Escopo

### Entra neste ciclo

- reforço da navegação de `match` para `team`
- consolidação da navegação de `team` para `match` e `player`
- consolidação da navegação de `player` para `team` e `match`
- pequenos blocos de contexto relacionado nas telas existentes
- documentação curta do ciclo no plano geral

### Fica fora deste ciclo

- novos endpoints na `data-api`
- novos contextos como `tournament` e `season`
- redesign amplo do frontend
- navegação global nova
- breadcrumbs complexos

## Decisões fechadas antes de executar

- este ciclo é só frontend
- nenhuma mudança nova de contrato entra na `data-api`
- o app continua usando URLs públicas por `slug`
- `recentAppearances` de jogador pode navegar para `/matches/[slug]` porque o contrato atual já expõe `matchSlug`
- `tournament` e `season` ficam separados como Ciclo B para manter este PR curto e revisável

## Frentes de execução

## Frente 1 - Navegação a partir de `match`

### Objetivo

Deixar explícito o caminho de ida da partida para seus contextos relacionados.

### Entregáveis

- links claros para:
  - time mandante
  - time visitante
- tratamento mais claro do que é contexto navegável e do que é apenas dado exibido

### Critérios de pronto

- a tela de partida deixa claro para onde o usuário pode seguir
- a ida de `match -> team` funciona sem ambiguidade

## Frente 2 - Navegação a partir de `team`

### Objetivo

Consolidar `team` como ponto de passagem entre partida e jogador.

### Entregáveis

- `recentMatches` navegando para `/matches/[slug]`
- `relatedPlayers` navegando para `/players/[slug]`
- manutenção explícita da nota de limitação de `relatedPlayers`

### Critérios de pronto

- a tela de time funciona como superfície de exploração para partidas e jogadores
- continua claro que `relatedPlayers` não representa elenco canônico atual

## Frente 3 - Navegação a partir de `player`

### Objetivo

Consolidar `player` como ponto de passagem entre time e partida.

### Entregáveis

- `currentTeams` navegando para `/teams/[slug]`
- `recentAppearances` navegando para `/matches/[slug]`
- `statEntries` navegando para `/matches/[slug]` quando o bloco fizer sentido como superfície navegável

### Critérios de pronto

- a tela de jogador permite voltar para times e partidas sem fluxo morto
- qualquer bloco que permanecer não navegável fica justificado por limitação real do dado

## Frente 4 - Estrutura funcional das telas

### Objetivo

Padronizar pequenos blocos de navegação contextual sem transformar o ciclo em redesign.

### Entregáveis

- listas clicáveis mais claras
- estados vazios mais legíveis
- blocos simples de “contexto relacionado” onde isso ajudar a leitura

### Critérios de pronto

- as três telas deixam mais claro “de onde posso ir a partir daqui”
- a navegação melhora sem introduzir arquitetura visual pesada

## Validação esperada

- `pnpm --filter @apps/web test`
- `pnpm --filter @apps/web typecheck`
- `pnpm --filter @apps/web build`
- smoke manual com:
  - busca -> partida -> time
  - time -> partida
  - time -> jogador
  - jogador -> time
  - jogador -> partida

## Riscos principais

- assumir que todo dado exibido também é dado navegável
- misturar este ciclo com novos contextos cedo demais
- inflar a mudança visual além do necessário para um wireframe funcional

## Critério de encerramento

Este ciclo pode ser considerado concluído quando:

- `match`, `team` e `player` estiverem conectados por navegação funcional clara
- as limitações reais do dado estiverem explícitas onde a navegação não puder existir
- o próximo passo ficar naturalmente preparado para o Ciclo B:
  - `tournament`
  - `season`
