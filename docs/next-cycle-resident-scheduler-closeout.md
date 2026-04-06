# Fechamento do Ciclo Incremental - Scheduler Residente

Veja tambem: `docs/next-cycle-plan-resident-scheduler.md`
Veja tambem: `docs/phase-5-closeout.md`
Veja tambem: `docs/phase-7-closeout.md`
Veja tambem: `services/resident-scheduler/README.md`

## Objetivo do ciclo

Evoluir o scheduler de CLI pontual para um processo residente simples e auditavel, sem mudar o metodo de ingestao ja validado.

## O que foi entregue

- novo servico Node dedicado em `services/resident-scheduler`
- comando raiz `pnpm scheduler:resident`
- loop residente com polling configuravel
- logs operacionais minimos para:
  - boot
  - idle
  - item concluido
  - item falho
  - shutdown
- extracao do processamento de um item para runtime compartilhado em `scripts/db/automation/runtime.mjs`
- reutilizacao do runtime compartilhado no scheduler CLI existente
- README operacional do servico

## O que foi validado

- `node --check scripts/db/automation/runtime.mjs`
- `node --check scripts/db/automation/run-scheduler.mjs`
- `pnpm --filter @services/resident-scheduler test`
- `pnpm --filter @services/resident-scheduler build`
- `pnpm --filter @services/resident-scheduler lint`
- `docker compose -f infra/docker/docker-compose.yml down -v`
- `pnpm docker:up`
- `pnpm db:migrate`
- `node scripts/db/automation/plan-match.mjs --event-id=15237889 --scheduled-at=2026-04-05T12:00:00-03:00`
- `CONTEXTO_FC_SCHEDULER_POLL_INTERVAL_MS=1000 pnpm --filter @services/resident-scheduler start`
- restart manual do processo em modo idle
- `pnpm db:report:phase7 sofascore-33d355cd-5a7b-48b1-8e8c-527ef12f7b67`

## Resultado consolidado

- o scheduler residente processa itens vencidos sem invocacao manual por item
- backlog inicial vencido e tratado pelo mesmo loop normal, um item por vez
- o mesmo claim seguro continua protegendo a fila
- a trilha `scheduled_scrape -> run_id -> core_match_id` foi preservada
- o restart do processo em modo idle nao gerou comportamento ambiguo

## Evidencia pratica

- partida planejada:
  - `planned-match-a25462b9-1e55-46db-b4ef-2ddb02dcfb27`
- passes processados:
  - `scheduled-scrape-59db5be5-61f2-4a12-ae7c-7f4d8df00125`
  - `scheduled-scrape-815036e8-d381-4ce8-a907-8cc9f606532f`
  - `scheduled-scrape-0cd28c33-d56b-40b9-96d2-81cc836adfee`
- runs gerados:
  - `sofascore-33d355cd-5a7b-48b1-8e8c-527ef12f7b67`
  - `sofascore-092843af-be3d-462f-af1b-9caba4a2aa1f`
  - `sofascore-37f3d6c1-42d7-47e2-a929-63996da07951`

## O que ficou bom

- o servico nasceu pequeno e com responsabilidade unica
- o boot nao ganhou um modo operacional especial so para backlog
- o reaproveitamento do runtime compartilhado reduziu duplicacao entre o modo CLI e o modo residente
- o shutdown gracioso ficou claro para operacao local

## Limitacoes conhecidas

- a iteracao continua com concorrencia efetiva `1`
- o polling ainda e por intervalo fixo simples
- o servico foi validado localmente, nao em ambiente de deploy permanente
- nao houve tentativa de distribuicao horizontal ou batching

## Proximo passo recomendado

O ciclo pode ser considerado concluido.

Daqui para frente, os passos mais naturais voltam a ser incrementais:

- refinamentos do web app
- observabilidade operacional mais profunda do scheduler, se a necessidade real aparecer

## Conclusao

O scheduler residente aproximou a automacao de um modo continuo de operacao sem reabrir o desenho estrutural da plataforma.
