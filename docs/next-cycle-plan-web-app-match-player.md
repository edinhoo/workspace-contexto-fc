# Plano do Proximo Ciclo - Web App Match para Player

Veja tambem: `docs/next-cycle-plan-web-app-tournament-season.md`
Veja tambem: `docs/next-cycle-web-app-tournament-season-closeout.md`

## Objetivo

Fechar a lacuna mais visivel de navegacao funcional do app:

- permitir navegacao de `match` para `player`

O foco deste ciclo e cirurgico:

- completar a navegacao nos cards de lineup da tela de partida
- aproveitar `events` para o mesmo comportamento apenas se o contrato continuar
  simples

## O que este ciclo herda

- `match`, `team`, `player`, `tournament` e `season` ja existem como contextos
  reais do app
- a tela de partida ja navega para:
  - `team`
  - `tournament`
  - `season`
- a limitacao de `match -> player` ficou documentada porque o contrato atual de
  `lineups` e `events` nao expõe `playerSlug`

## Escopo

### Entra neste ciclo

- adicionar `playerSlug` ao array `lineups` na `data-api`
- atualizar a query de `match` para trazer `p.slug`
- transformar `player.playerName` em link nos cards de lineup da tela de partida
- adicionar `playerSlug` e `relatedPlayerSlug` em `events` apenas se isso nao
  complicar a query de forma relevante
- ajustes de teste e documentacao do ciclo

### Fica fora deste ciclo

- novos contextos
- redesign da tela de partida
- enriquecimento de `teamStats.statPayload`
- qualquer busca nova ou indexacao adicional

## Decisoes fechadas antes de executar

- `lineups.playerSlug` entra obrigatoriamente neste ciclo
- `events.playerSlug` e `events.relatedPlayerSlug` entram apenas se o join
  continuar trivial
- se `events` exigir complexidade extra relevante, o ciclo fecha so com lineup
- o frontend continua usando `getPlayerHref(slug)`
- a navegacao nova deve seguir o padrao de links publicos por `slug`

## Frentes de execucao

## Frente 1 - `services/data-api`

### Objetivo

Completar o contrato de `match` com o minimo necessario para navegação até
`player`.

### Entregaveis

- `playerSlug` em `matchResponseSchema.lineups`
- query de `matches.ts` trazendo `p.slug`
- opcionalmente:
  - `playerSlug` em `events`
  - `relatedPlayerSlug` em `events`
- cobertura dos testes de integracao ja existente via `matchResponseSchema.parse`

### Criterios de pronto

- o contrato de `match` passa a expor `playerSlug` em lineup
- a resposta continua simples e sem joins desnecessarios

## Frente 2 - `apps/web`

### Objetivo

Transformar o nome do jogador na partida em navegacao real para o perfil.

### Entregaveis

- links nos cards de lineup para `/players/[slug]`
- links em eventos apenas se `playerSlug` estiver disponivel sem gambiarra
- ajustes de render e copy para diferenciar:
  - jogador navegavel
  - jogador ainda apenas exibido

### Criterios de pronto

- a tela de partida deixa de ter lineup como fluxo morto
- a navegacao `match -> player` funciona com URL publica por `slug`

## Frente 3 - Documentacao e fechamento

### Objetivo

Registrar o fechamento da lacuna de navegacao e o que ainda sobrar em `events`.

### Entregaveis

- closeout do ciclo
- atualizacao do plano geral

### Criterios de pronto

- o historico deixa claro que o gap `match -> player` foi tratado
- qualquer limitacao remanescente em `events` fica explicitamente documentada

## Validacao esperada

- `pnpm --filter @services/data-api test`
- `pnpm --filter @services/data-api typecheck`
- `pnpm --filter @services/data-api build`
- `pnpm --filter @apps/web test`
- `pnpm --filter @apps/web typecheck`
- `pnpm --filter @apps/web build`
- smoke manual com:
  - `/matches/[slug]`
  - clique em jogador da lineup
  - abertura correta de `/players/[slug]`

## Riscos principais

- expandir demais a query de `events` por querer fechar tudo no mesmo ciclo
- confundir dado navegavel com dado apenas exibido
- misturar este recorte pequeno com refinamentos visuais da tela de partida

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- `lineups` expuserem `playerSlug`
- a tela de partida navegar para `/players/[slug]` a partir de lineup
- o ciclo permanecer pequeno o suficiente para nao reabrir o escopo de `match`
  como um todo
