# Relatorio de Validacao da Fase 4

## Objetivo da validacao

Confirmar que `services/data-api`:

- sobe localmente
- responde os endpoints iniciais previstos para a fase
- usa o banco local validado nas fases anteriores
- mantem contratos tipados e testes iniciais cobrindo rota e consulta critica

## Ambiente usado

- branch: `phase-4-data-api`
- banco local em `localhost:54329`
- massa carregada via scraper em modo `db`
- evento de referencia: `15237889`

## Preparacao do banco

Comandos executados:

```bash
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d postgres
pnpm db:migrate
pnpm --filter @services/sofascore scrape 15237889
```

Resultado:

- `PostgreSQL` iniciado com healthcheck ok
- migrations aplicadas com sucesso ate `0004_phase2_ingestion_run_details.sql`
- scraper persistiu no banco com run `phase3-afab7d4a-e274-4abe-b206-bfc47e7a25ca`

Contagens reportadas pelo scraper:

- `countries`: `10`
- `cities`: `2`
- `stadiums`: `2`
- `tournaments`: `1`
- `seasons`: `1`
- `referees`: `1`
- `managers`: `2`
- `teams`: `2`
- `players`: `53`
- `matches`: `1`
- `lineups`: `53`
- `events`: `26`
- `player-match-stats`: `46`
- `player-career-teams`: `53`
- `team-match-stats`: `2`

## Validacao do servico

Checks executados:

```bash
pnpm --filter @services/data-api build
pnpm --filter @services/data-api lint
pnpm --filter @services/data-api typecheck
env DATA_API_ENABLE_DB_TESTS=1 pnpm --filter @services/data-api test
```

Resultado:

- `build`: ok
- `lint`: ok
- `typecheck`: ok
- `test`: ok

Resumo da suite:

- `6` testes executados
- `6` testes aprovados
- `0` falhas

Cobertura exercitada na suite:

- `GET /health`
- erro padrao para rota inexistente
- `GET /search?q=...`
- `GET /matches/:id`
- `GET /teams/:id`
- `GET /players/:id`

## Validacao live da API

Comandos executados:

```bash
env DATA_API_PORT=3101 pnpm --filter @services/data-api start
curl -fsSL http://127.0.0.1:3101/health
curl -fsSL 'http://127.0.0.1:3101/search?q=palmeiras&limit=3'
curl -fsSL http://127.0.0.1:3101/matches/01KNEYT5S4SCGE3V65JC7X9XC1
```

Resultado observado:

- `GET /health` respondeu `{"status":"healthy","service":"data-api"}`
- `GET /search` retornou itens mistos com discriminador `type`
- `GET /matches/:id` retornou contexto completo com:
  - metadados da partida
  - torneio e temporada
  - times e placar
  - estadio e arbitro
  - lineups
  - events
  - `teamStats`

## Ajustes feitos durante a validacao

- testes de integracao passaram a resolver IDs internos via `source_ref`, para nao depender de ULIDs especificos de uma unica carga
- contratos de resposta foram ajustados para aceitar campos numericos reais vindos do banco
- o output de testes foi isolado em `dist-test`
- warnings de `orderBy('column asc')` foram eliminados

## Conclusao

A Fase 4 foi validada com sucesso.

O `services/data-api`:

- sobe localmente
- responde os endpoints iniciais da fase
- usa o banco local real como fonte
- entrega modelos orientados a contexto em vez de CRUD bruto
- possui trilha inicial de testes de contrato e consulta
