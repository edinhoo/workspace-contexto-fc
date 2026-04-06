# Resident Scheduler

Servico Node dedicado para manter o scheduler da automacao de ingestao em execucao continua.

## Objetivo

O servico reaproveita o mesmo claim seguro e o mesmo scraper ja validados nas fases anteriores.

Fluxo:

`scheduled_scrapes -> claim seguro -> scraper -> staging -> validacao -> core`

Nesta primeira iteracao:

- concorrencia efetiva `1`
- polling por intervalo fixo
- backlog inicial tratado pelo mesmo loop normal
- sem modo especial de `drain` no boot

## Comandos

Na raiz do monorepo:

```bash
pnpm scheduler:resident
```

Ou diretamente no pacote:

```bash
pnpm --filter @services/resident-scheduler start
```

Para desenvolvimento com reload local:

```bash
pnpm --filter @services/resident-scheduler dev
```

## Variaveis de ambiente

- `CONTEXTO_FC_SCHEDULER_POLL_INTERVAL_MS`
  - intervalo entre iteracoes quando o worker estiver idle
  - padrao: `15000`
- `CONTEXTO_FC_SCHEDULER_IDLE_LOG_EVERY`
  - controla a frequencia do log de idle
  - padrao: `4`
- `CONTEXTO_FC_SCHEDULER_TRIGGERED_BY`
  - valor registrado em `ops.scheduled_scrapes.triggered_by`
  - padrao: `resident-scheduler`

## Operacao local

Exemplo de roteiro:

```bash
pnpm docker:up
pnpm db:migrate
node scripts/db/automation/plan-match.mjs --event-id=15237889 --scheduled-at=2026-04-05T12:00:00-03:00
pnpm scheduler:resident
```

Depois, para encerrar:

- use `Ctrl+C` para shutdown gracioso do processo
- use `pnpm docker:down` para desligar a infraestrutura local

## Observacoes

- o servico nao substitui o scraper nem o pipeline de ingestao
- o loop residente continua processando um item por vez
- se o processo iniciar com backlog vencido, ele escoa gradualmente no comportamento steady-state
