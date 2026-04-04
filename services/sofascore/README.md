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

- `/api/v1/event/{eventId}`
- `/api/v1/event/{eventId}/lineups`
- `/api/v1/event/{eventId}/average-positions`
- `/api/v1/event/{eventId}/incidents`
- `/api/v1/event/{eventId}/shotmap`

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
- `team-match-stats.csv`
- `events.csv`

## Fluxo geral

1. carrega os CSVs existentes
2. faz fetch dos metadados da partida
3. faz fetch de lineups e average positions
4. faz fetch de incidents e shotmap
5. faz upsert por `source_id`
6. relinka referencias para IDs internos
7. recalcula `team-match-stats` a partir de `player-match-stats`
8. salva os CSVs normalizados

## Leituras recomendadas

- [docs/data-model.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/data-model.md)
- [docs/scraper-decisions.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/scraper-decisions.md)

