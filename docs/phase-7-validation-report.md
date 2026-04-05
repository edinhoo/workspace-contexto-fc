# Relatorio de Validacao da Fase 7

Veja tambem: `docs/phase-7-plan-robustness-and-scale.md`
Veja tambem: `docs/phase-7-performance-review.md`
Veja tambem: `docs/phase-7-closeout.md`

## Resumo

A validacao da Fase 7 confirmou quatro pontos centrais:

- o scraper passa a emitir saida estruturada estavel em `stdout`
- o scheduler consegue disputar itens vencidos sem duplicar claim
- `warnings` deixam de ser coluna ociosa e aparecem nos runs
- a query critica do scheduler passa a ter indice proprio

## Validacao do contrato do scraper

Comando:

```bash
pnpm --filter @services/sofascore scrape 15237889
```

Resultado esperado:

- ultima linha do `stdout` em formato `SCRAPE_RESULT {json}`
- `run_id` legivel sem depender de regex fragil

## Validacao da concorrencia do scheduler

Base usada:

- `planned_match_id`: `planned-match-3ef8c30e-823b-4fc9-ab6f-620bee6c5c76`
- passes gerados:
  - `scheduled-scrape-2ccd94f2-9cdc-4030-af56-f473d7f31d88`
  - `scheduled-scrape-7c6065c5-8099-46a6-a296-76539b353787`
  - `scheduled-scrape-d09e8da7-efa6-4ef0-b67f-fe9fa8a52cc8`

Dois schedulers foram executados em paralelo.

Resultado observado:

- pass 1:
  - `run_id`: `sofascore-7d72d424-6355-445b-aa36-23bf27893fb7`
- pass 2:
  - `run_id`: `sofascore-84a0f4b9-6769-446e-81c2-da3683fdc93e`
- o pass 3 permaneceu pendente ate a execucao seguinte

Estado no banco apos a disputa concorrente:

- `pass_number = 1` -> `done`
- `pass_number = 2` -> `done`
- `pass_number = 3` -> `pending`

Isso confirmou que dois executores nao pegaram o mesmo `scheduled_scrape`.

## Validacao de warnings e relatorio operacional

Run de referencia para warnings:

- `run_id`: `sofascore-84a0f4b9-6769-446e-81c2-da3683fdc93e`

Comandos:

```bash
pnpm db:validate:phase2 sofascore-84a0f4b9-6769-446e-81c2-da3683fdc93e
pnpm db:report:phase7 sofascore-84a0f4b9-6769-446e-81c2-da3683fdc93e
```

Resultado observado:

- `lineups`
  - `missing_jersey_number = 7`
  - `missing_lineup_rating = 22`
- `player_match_stats`
  - `missing_player_stat_rating = 15`

Os warnings passaram a aparecer:

- por entidade em `ops.ingestion_run_details`
- agregados no nivel do run em `ops.ingestion_runs`
- resumidos no script `db:report:phase7`

## Validacao do indice do scheduler

Migration aplicada:

- `0009_phase7_scheduler_pending_index.sql`

Query verificada com `EXPLAIN`:

```sql
select ss.id
from ops.scheduled_scrapes ss
join ops.planned_matches pm on pm.id = ss.planned_match_id
where ss.status = 'pending'
  and ss.scheduled_for <= now()
  and pm.status <> 'cancelled'
order by ss.scheduled_for asc, ss.pass_number asc
limit 1;
```

Plano observado:

- uso de `idx_ops_scheduled_scrapes_pending_due_order`

## Endurecimento observado durante a validacao

Durante a validacao ponta a ponta apareceu um caso ruim:

- um scrape podia terminar como `completed` com `0` linhas se nenhum evento valido fosse materializado

A fase foi ajustada para impedir isso:

- `services/sofascore` agora falha quando todos os eventos solicitados falham antes de produzir snapshot valido

Depois desse ajuste, o passe pendente foi reexecutado com sucesso:

- `run_id`: `sofascore-d6cadc82-7b17-41e1-9c7b-eb8c29f3732d`
- `rows_inserted = 0`
- `rows_updated = 0`
- `rows_skipped = 251`

## Conclusao

A validacao da Fase 7 confirmou o recorte final do plano:

- contrato estavel entre scraper e scheduler
- claim concorrente seguro
- observabilidade operacional melhorada
- apoio de performance pontual e justificado
- caminho documentado para novas fontes
