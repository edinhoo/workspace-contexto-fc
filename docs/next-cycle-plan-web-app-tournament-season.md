# Plano do Proximo Ciclo - Web App Tournament e Season

Veja tambem: `docs/next-cycle-plan-web-app-cross-navigation.md`
Veja tambem: `docs/next-cycle-web-app-cross-navigation-closeout.md`

## Objetivo

Criar os primeiros contextos novos de leitura do web app:

- `tournament`
- `season`

O foco deste ciclo e expandir a arquitetura de informacao do produto com o menor
recorte util possivel:

- `tournament` como contexto por `slug`
- `season` como contexto por `id`

## O que este ciclo herda

- `match`, `team` e `player` ja formam navegacao cruzada funcional
- o app ja usa URLs publicas por `slug` onde esse identificador e claramente
  parte do contexto publico
- a tela de partida ja expõe `tournament` e `season` como metadados, mas ainda
  sem superficie propria de leitura

## Escopo

### Entra neste ciclo

- novos endpoints na `data-api` para `tournament` e `season`
- novas telas no `apps/web`:
  - `/tournaments/[slug]`
  - `/seasons/[id]`
- navegacao a partir de `/matches/[slug]` para os novos contextos
- testes de integracao na `data-api`
- testes leves de helper de rota no `apps/web`

### Fica fora deste ciclo

- standings
- tabelas agregadas de temporada
- top scorers
- metricas derivadas pouco confiaveis com banco ainda pequeno
- redesign amplo do frontend

## Decisoes fechadas antes de executar

- `tournament` navega por `slug`: `/tournaments/[slug]`
- `season` navega por `id`: `/seasons/[id]`
- nao criar `slug` artificial para `season` nesta iteracao
- o contexto de `season` deve continuar sendo tratado como suporte de navegacao,
  nao como entidade primaria de descoberta
- a relacao `season -> tournament` deve ser inferida via `core.matches`
- os dois contextos entram com politica de cache de conteudo

## Contratos minimos esperados

## `GET /tournaments/by-slug/:slug`

Deve retornar:

- `tournament`: `id`, `name`, `slug`
- `seasons`: temporadas com pelo menos uma partida nesse torneio
- `recentMatches`: ultimas `10` partidas do torneio com:
  - `id`
  - `slug`
  - `startTime`
  - `homeTeamId`
  - `homeTeamName`
  - `homeTeamSlug`
  - `awayTeamId`
  - `awayTeamName`
  - `awayTeamSlug`
  - `homeScore`
  - `awayScore`
  - `seasonName`

## `GET /seasons/:id`

Deve retornar:

- `season`: `id`, `name`, `year`
- `tournament`: torneio pai inferido via partidas
- `recentMatches`: ultimas `10` partidas da temporada com:
  - `id`
  - `slug`
  - `startTime`
  - `homeTeamId`
  - `homeTeamName`
  - `homeTeamSlug`
  - `awayTeamId`
  - `awayTeamName`
  - `awayTeamSlug`
  - `homeScore`
  - `awayScore`
  - `round`

## Frentes de execucao

## Frente 1 - `services/data-api`

### Objetivo

Abrir suporte minimo para os dois novos contextos antes de tocar no frontend.

### Entregaveis

- `src/contracts/tournaments.ts`
- `src/contracts/seasons.ts`
- `src/queries/tournaments.ts`
- `src/queries/seasons.ts`
- `src/routes/tournaments.ts`
- `src/routes/seasons.ts`
- registro das rotas em `src/app.ts`
- testes de integracao para os novos endpoints

### Criterios de pronto

- a `data-api` responde os dois contextos com contratos tipados
- os contextos retornam apenas o necessario para leitura e navegacao relacionada

## Frente 2 - `apps/web`

### Objetivo

Criar as superficies minimas de leitura para os novos contextos e conecta-las a
partir da tela de partida.

### Entregaveis

- `apps/web/src/app/tournaments/[slug]/page.tsx`
- `apps/web/src/app/tournaments/[slug]/loading.tsx`
- `apps/web/src/app/seasons/[id]/page.tsx`
- `apps/web/src/app/seasons/[id]/loading.tsx`
- `getTournamentBySlug` no cliente HTTP
- `getSeason` no cliente HTTP
- `getTournamentHref` em `routes.ts`
- `getSeasonHref` em `routes.ts`
- links na tela de partida:
  - `tournament.name -> /tournaments/[slug]`
  - `season.name -> /seasons/[id]`

### Criterios de pronto

- os dois contextos podem ser acessados a partir de uma partida
- cada tela mostra identidade do contexto e lista de partidas recentes
- a navegacao para os times envolvidos continua coerente dentro desses contextos

## Frente 3 - Documentacao e fechamento

### Objetivo

Registrar o recorte entregue e as limitacoes que ainda devem ficar fora desta
iteracao.

### Entregaveis

- closeout do ciclo
- atualizacao do plano geral

### Criterios de pronto

- o historico do web app registra `tournament` e `season` como primeiros
  contextos secundarios de leitura
- o proximo passo fica claro sem misturar esta iteracao com refinamento visual

## Validacao esperada

- `pnpm --filter @services/data-api test`
- `pnpm --filter @services/data-api typecheck`
- `pnpm --filter @services/data-api build`
- `pnpm --filter @apps/web test`
- `pnpm --filter @apps/web typecheck`
- `pnpm --filter @apps/web build`
- smoke manual com:
  - `/matches/[slug] -> /tournaments/[slug]`
  - `/matches/[slug] -> /seasons/[id]`
  - navegacao das listas de partidas recentes para `/matches/[slug]`

## Riscos principais

- inflar os contextos com agregacoes pouco confiaveis para o volume atual de dado
- misturar sem necessidade rota publica por `slug` e por `id`
- criar telas novas sem deixar claro que `season` ainda e contexto de suporte

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- `tournament` e `season` existirem como contextos navegaveis reais
- a tela de partida conseguir abrir os dois contextos
- cada contexto mostrar apenas o minimo util para leitura e navegacao
