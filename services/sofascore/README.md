# Sofascore Scraper

## Objetivo

Servico manual de coleta e estruturacao de dados do Sofascore.

Ele existe para:

- buscar dados de partidas por `eventId`
- normalizar relacionamentos entre entidades
- salvar o resultado em CSVs locais
- servir como camada intermediaria antes de um backend e banco definitivos

## Comandos

Da raiz do monorepo:

```bash
pnpm scrape:sofascore 15237889
```

Direto no servico:

```bash
pnpm --filter @services/sofascore scrape 15237889
pnpm --filter @services/sofascore lint
pnpm --filter @services/sofascore typecheck
```

## Arquitetura resumida

- [src/index.ts](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/src/index.ts)
  coordena o pipeline inteiro
- [src/sofascore-client.ts](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/src/sofascore-client.ts)
  faz os fetches e transforma payloads do Sofascore em records internos
- [src/storage/*.ts](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/src/storage)
  carregam, fazem upsert, relinkam referencias e salvam CSVs
- [src/types.ts](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/src/types.ts)
  define os records persistidos e os payloads externos principais

## Endpoints atualmente consumidos

- `GET /api/v1/event/{eventId}`
  - payload base da partida
  - abastece countries, cities, stadiums, tournaments, seasons, referees, managers, teams, players e matches
- `GET /api/v1/event/{eventId}/lineups`
  - lineups, missingPlayers e statistics por jogador
  - abastece lineups e player-match-stats
- `GET /api/v1/event/{eventId}/average-positions`
  - posicoes medias dos jogadores
  - enriquece o calculo de `slot` em lineups
- `GET /api/v1/event/{eventId}/incidents`
  - timeline principal da partida
  - abastece events com gols, cartoes, substituicoes, VAR, periodos e injuryTime
- `GET /api/v1/event/{eventId}/shotmap`
  - enriquecimento de finalizacoes
  - complementa events com `shot_type`, `situation`, `body_part`, `goal_type` e coordenadas
## CSVs atualmente gerados

Metadados:

- `countries.csv`
- `cities.csv`
- `stadiums.csv`
- `tournaments.csv`
- `seasons.csv`
- `referees.csv`
- `managers.csv`
- `teams.csv`
- `players.csv`
- `matches.csv`

Partida:

- `lineups.csv`
- `player-match-stats.csv`
- `player-career-teams.csv`
- `team-match-stats.csv`
- `events.csv`

## Fluxo geral

1. carrega os CSVs existentes
2. faz fetch dos metadados da partida
3. faz fetch de lineups e average positions
4. faz fetch de incidents e shotmap
5. deriva relacoes jogador-clube observadas no scrape
6. faz upsert por `source_ref`
7. relinka referencias para IDs internos
8. recalcula `team-match-stats` a partir de `player-match-stats`
9. salva os CSVs normalizados

## Regras de persistencia

- `id` e sempre interno ao projeto
- `source_ref` preserva a referencia principal da origem
- `source` identifica o provedor, hoje `sofascore`
- quando o payload nao traz um ID explicito:
  - prefira `slug`
  - se nao houver `slug`, use `name`
- os CSVs mais novos usam auditoria com:
  - `first_scraped_at`
  - `last_scraped_at`
  - `created_at`
  - `updated_at`
- em entidades com colunas `source_*`, o valor canonico so e sobrescrito automaticamente quando ele ainda coincide com o valor bruto anterior da origem

## Leituras recomendadas

- [docs/data-model.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/data-model.md)
- [docs/scraper-decisions.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/scraper-decisions.md)
