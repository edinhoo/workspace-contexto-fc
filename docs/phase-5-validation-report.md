# Relatorio de Validacao da Fase 5

Veja tambem: `docs/phase-5-plan-scrape-automation.md`
Veja tambem: `docs/phase-5-closeout.md`

## Ambiente validado

- banco local em container `postgres:16-alpine`
- schema recriado em banco limpo
- evento de referencia: `15237889`
- provider: `sofascore`

## Comandos executados

```bash
docker compose -f infra/docker/docker-compose.yml down -v
pnpm docker:up
pnpm db:migrate
node scripts/db/automation/plan-match.mjs --event-id=15237889 --scheduled-at=2026-01-28T16:00:00-03:00
node scripts/db/automation/run-scheduler.mjs
node scripts/db/automation/cancel-scheduled-scrape.mjs --scheduled-scrape-id=scheduled-scrape-b53e8a80-8889-4a00-aca3-75f561ae5e96
node scripts/db/automation/rerun-scheduled-scrape.mjs --scheduled-scrape-id=scheduled-scrape-b53e8a80-8889-4a00-aca3-75f561ae5e96
node scripts/db/automation/run-scheduler.mjs --drain
docker compose -f infra/docker/docker-compose.yml down
```

## Resultado operacional

### `ops.planned_matches`

```text
planned_match_id: planned-match-723cd9f6-6978-4e5c-abef-09b66073d39d
status: linked
provider_event_id: 15237889
core_match_id: 01KNF28XA95SS6KNAES950P5E9
```

### `ops.scheduled_scrapes`

```text
pass 1 -> done -> sofascore-50171b57-c0e0-4fd0-b704-a120ff8a8dc7
pass 2 -> done -> sofascore-4de16e9d-0720-460d-9709-3c7a4446a51e
pass 3 -> cancelado e rearmado manualmente -> done -> sofascore-9e4d7c42-c8f5-4a23-876c-3b808daa463b
```

### `ops.ingestion_runs`

```text
sofascore-50171b57-c0e0-4fd0-b704-a120ff8a8dc7 -> completed -> inserted=251 updated=0 skipped=0
sofascore-4de16e9d-0720-460d-9709-3c7a4446a51e -> completed -> inserted=0 updated=0 skipped=251
sofascore-9e4d7c42-c8f5-4a23-876c-3b808daa463b -> completed -> inserted=0 updated=0 skipped=251
```

## O que foi provado

- a automacao reutiliza o mesmo pipeline do scraper manual
- uma partida planejada gera automaticamente tres passes
- o scheduler serial executa os passes vencidos sem bypass de `staging.*`
- cada passe fica rastreavel ate `ops.ingestion_runs`
- `core_match_id` e vinculado apos o primeiro scrape bem-sucedido
- cancelamento e rerun manual funcionam sem SQL manual

## Limitacoes observadas

- o scheduler ainda depende de execucao manual via CLI nesta fase
- `warnings` continuam fora do fluxo principal
- `scheduled_scrapes` continuam operando com um lote por vez
- o caso validado usa um unico `provider_event_id` de referencia
