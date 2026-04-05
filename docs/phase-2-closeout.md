# Encerramento da Fase 2

Veja tambem: `docs/phase-2-plan-ingestion-pipeline.md`
Veja tambem: `docs/phase-2-validation-report.md`
Veja tambem: `docs/phase-2-dry-run-report.md`

## Status

Fase 2 concluida.

## O que foi entregue

- matriz de compatibilidade entre o payload atual do scraper e `staging.*`
- validacao reutilizavel por entidade e por lote
- promocao transacional de `staging.*` para `core.*`
- `ops.ingestion_run_details` com contadores detalhados por entidade
- ingestao permanente via CLI
- `dry-run` com relatorio e `rollback` explicito

## Execucao validada

- primeira ingestao em banco limpo com `354` insercoes e `0` inconsistencias
- validacao independente por entidade com `0` registros invalidos
- segunda ingestao sem duplicidade no canonico
- `dry-run` concluido com sucesso sem alterar `core.*`

## O que a Fase 2 confirmou

- o pipeline permanente do banco esta pronto antes da migracao do scraper
- a politica atual de idempotencia por `upsert` impede duplicidade estrutural
- o detalhamento em `ops.*` ja e suficiente para auditoria por entidade
- a base esta pronta para a Fase 3, que passa a escrever do scraper para o banco

## Pendencias nao bloqueantes

- `core.states` permanece previsto, mas fora da ingestao
- o `staging.*` ainda opera como area de um unico lote por vez nesta versao
- a classificacao entre `updated` e `skipped` ainda pode evoluir para ignorar atualizacoes puramente operacionais de timestamp

## Decisao de encerramento

A Fase 2 fica formalmente encerrada.

O proximo passo recomendado e a Fase 3, com foco em:

- adaptar `services/sofascore` para escrever em `staging.*`
- reaproveitar a validacao e a promocao ja materializadas
- aposentar o bootstrap CSV como mecanismo operacional
