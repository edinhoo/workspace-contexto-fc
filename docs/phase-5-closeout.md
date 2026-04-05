# Encerramento da Fase 5

Veja tambem: `docs/phase-5-plan-scrape-automation.md`
Veja tambem: `docs/phase-5-validation-report.md`
Veja tambem: `docs/phase-5-automation-states.md`

## Status

Concluida.

## Objetivo da fase

Automatizar a ingestao por partida sem alterar o pipeline seguro ja validado nas fases anteriores.

## O que foi entregue

- migration de `ops.planned_matches`
- migration de `ops.scheduled_scrapes`
- documento de estados e transicoes operacionais
- comando de cadastro e replanejamento de partidas planejadas
- geracao automatica de tres passes por partida
- executor serial do scheduler
- retry automatico minimo para falha operacional
- rerun manual e cancelamento operacional de passes

## Decisoes confirmadas na execucao

- a automacao pode nascer via CLI/script sem precisar de UI
- tres passes fixos foram suficientes para provar a fase
- o scheduler serial e compativel com o limite atual de `staging.*`
- o vinculo `planned_match -> scheduled_scrape -> run_id` ficou claro no banco
- a automacao nao precisou alterar o metodo de ingestao do scraper

## Resultado pratico

- uma partida futura pode ser cadastrada e gerar agenda automaticamente
- um passe vencido pode ser executado pelo scheduler sem intervencao no pipeline
- o primeiro run automatico vincula `core_match_id` em `ops.planned_matches`
- cancelamento e rerun manual permitem operacao minima sem SQL direto

## Pendencias conhecidas

- nao existe ainda um processo residente do scheduler
- retries automaticos continuam minimos e voltados apenas a falha operacional
- `warnings` seguem sem papel central na automacao
- batching por janela de tempo continua fora de escopo

## Proximo passo recomendado

Planejar e executar a Fase 6, focada em `Directus`, edicao operacional e camada `editorial.*`.
