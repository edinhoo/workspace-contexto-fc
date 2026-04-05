# Revisao de Performance da Fase 7

Veja tambem: `docs/phase-7-plan-robustness-and-scale.md`
Veja tambem: `docs/phase-5-closeout.md`

## Objetivo

Registrar o recorte de performance realmente atacado na Fase 7 e o que foi explicitamente deixado de fora.

## Gargalo tratado

O gargalo mais claro desta fase apareceu no claim do scheduler:

- consulta frequente em `ops.scheduled_scrapes`
- filtro recorrente por `status = 'pending'`
- ordenacao por `scheduled_for`, com desempate por `pass_number`
- necessidade de reserva concorrente previsivel

Para isso, a fase adiciona o indice:

- `idx_ops_scheduled_scrapes_pending_due_order`

Definicao:

```sql
create index if not exists idx_ops_scheduled_scrapes_pending_due_order
  on ops.scheduled_scrapes(scheduled_for, pass_number)
  where status = 'pending';
```

Motivo:

- combina com o predicado mais quente do scheduler
- reduz custo de busca do proximo item vencido
- evita ampliar indices genericos onde a necessidade real ainda nao apareceu

## Queries revisadas sem mudanca estrutural

Foram revisadas as consultas principais de:

- `scripts/db/automation/run-scheduler.mjs`
- `services/data-api/src/queries/search.ts`
- `services/data-api/src/queries/matches.ts`
- `services/data-api/src/queries/teams.ts`

Resultado:

- os indices ja existentes de `core.*` seguem suficientes para a massa atual
- nao apareceu repeticao concreta que justificasse `read.*`
- nao apareceu necessidade real de `raw.*` para replay ou rastreabilidade alem do que ja existe em `staging.*` e `ops.*`

## Decisoes mantidas

- `read.*` continua fora da Fase 7
- `raw.*` continua fora da Fase 7
- novos indices entram apenas por evidencia de consulta quente, nao por antecipacao

## Consequencia pratica

A Fase 7 fecha a frente de performance com uma melhoria pontual e justificavel:

- o scheduler fica mais alinhado com sua query critica
- a plataforma nao ganha camadas auxiliares sem problema real a resolver
