# Relatorio de Validacao da Fase 2

Veja tambem: `docs/phase-2-plan-ingestion-pipeline.md`
Veja tambem: `docs/phase-2-dry-run-report.md`

## Execucao principal

- banco reiniciado em estado limpo com `docker compose down -v` seguido de `docker compose up -d postgres`
- migrations reaplicadas com `pnpm db:migrate`
- ingestao permanente executada com `pnpm db:ingest:phase2`
- validacao independente executada com `pnpm db:validate:phase2`
- `dry-run` executado com `pnpm db:dry-run:phase2`

## Resultado da primeira ingestao

- `run_id`: `phase2-f41f9bb7-c96e-4d74-8bfd-2557e3f2f4c6`
- status: `completed`
- `rows_inserted`: `354`
- `rows_updated`: `0`
- `rows_skipped`: `0`

### Resumo por entidade

- `countries`: `8` vistos, `8` validos, `0` invalidos
- `cities`: `2` vistos, `2` validos, `0` invalidos
- `stadiums`: `2` vistos, `2` validos, `0` invalidos
- `tournaments`: `1` visto, `1` valido, `0` invalido
- `seasons`: `1` visto, `1` valido, `0` invalido
- `referees`: `1` visto, `1` valido, `0` invalido
- `managers`: `2` vistos, `2` validos, `0` invalidos
- `teams`: `105` vistos, `105` validos, `0` invalidos
- `players`: `53` vistos, `53` validos, `0` invalidos
- `matches`: `1` visto, `1` valido, `0` invalido
- `lineups`: `53` vistos, `53` validos, `0` invalidos
- `player_match_stats`: `46` vistos, `46` validos, `0` invalidos
- `team_match_stats`: `2` vistos, `2` validos, `0` invalidos
- `events`: `24` vistos, `24` validos, `0` invalidos
- `player_career_teams`: `53` vistos, `53` validos, `0` invalidos

## Confirmacao de idempotencia

Uma segunda ingestao foi executada sobre a mesma base:

- `run_id`: `phase2-1fcf10c0-f184-4d58-b432-79aa910996ad`
- status: `completed`
- `rows_inserted`: `0`
- `rows_updated`: `130`
- `rows_skipped`: `224`

Interpretacao:

- nao houve duplicidade no canonico
- a repeticao do mesmo lote manteve `0` insercoes novas
- parte dos registros foi marcada como `updated` porque a promocao atualiza campos operacionais de frescor, especialmente `last_scraped_at` e `updated_at`

## Resultado do dry-run

- `run_id`: `phase2-dry-run-377f63b8-7487-4cf2-847c-c59fae483b95`
- status: `dry-run`
- `rows_inserted`: `0`
- `rows_updated`: `130`
- `rows_skipped`: `224`

O `dry-run` confirmou:

- carga em `staging.*`
- validacao completa por entidade
- calculo de impacto antes da promocao
- `rollback` explicito ao final da transacao

## O que a validacao confirmou

- o pipeline permanente `staging.* -> validacao -> core.*` funciona com dados reais
- `ops.ingestion_runs` e `ops.ingestion_run_details` registram o lote e os detalhes por entidade
- uma execucao com falha de validacao pode ser barrada antes da promocao
- o `dry-run` oferece simulacao confiavel sem alterar `core.*`

## Observacoes

- `core.states` continua fora do escopo de ingestao desta fase
- o `staging.*` foi tratado nesta versao como area de trabalho de um unico lote por vez
- a classificacao entre `updated` e `skipped` ainda reflete atualizacao de timestamps operacionais, nao apenas mudanca semantica de dominio
