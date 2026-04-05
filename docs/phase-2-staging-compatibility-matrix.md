# Matriz de Compatibilidade - Scraper para `staging.*`

Veja tambem: `docs/phase-2-plan-ingestion-pipeline.md`
Veja tambem: `services/sofascore/src/index.ts`
Veja tambem: `services/sofascore/src/types.ts`
Veja tambem: `infra/db/migrations/0001_phase1_init.sql`
Veja tambem: `infra/db/migrations/0003_phase1_hardening.sql`

## Objetivo

Confirmar se o payload real emitido hoje pelo `services/sofascore` pode ser escrito em `staging.*` sem ambiguidade antes da adaptacao do scraper na Fase 3.

## Fonte de verdade analisada

- fluxo de agregacao atual em `services/sofascore/src/index.ts`
- tipos finais persistidos hoje em `services/sofascore/src/types.ts`
- shape de `staging.*` materializado nas migrations da Fase 1

## Leitura geral

O payload atual do scraper e compativel com o `staging.*` existente.

Nao foi identificado gap estrutural bloqueante entre:

- records finais hoje produzidos pelo scraper
- colunas atuais de `staging.*`

Os pontos de atencao encontrados sao de transformacao e politica de ingestao, nao de falta de tabela.

## Matriz por entidade

| Entidade | Payload atual do scraper | Destino em `staging.*` | Status | Observacoes |
| --- | --- | --- | --- | --- |
| `countries` | `CountryRecord` | `staging.countries` | compativel | shape tabular direto |
| `cities` | `CityRecord` | `staging.cities` | compativel | `state` continua fora da ingestao nesta fase |
| `stadiums` | `StadiumRecord` | `staging.stadiums` | compativel com cast | `capacity`, `latitude` e `longitude` saem como string no scraper e entram tipados no banco apos endurecimento |
| `tournaments` | `TournamentRecord` | `staging.tournaments` | compativel | `translated` existe no legado e segue suportado em staging |
| `seasons` | `SeasonRecord` | `staging.seasons` | compativel | `translated` segue suportado em staging |
| `referees` | `RefereeRecord` | `staging.referees` | compativel | `edited` legado ainda suportado em staging |
| `managers` | `ManagerRecord` | `staging.managers` | compativel | shape tabular direto |
| `teams` | `TeamRecord` | `staging.teams` | compativel | shape tabular direto |
| `players` | `PlayerRecord` | `staging.players` | compativel | shape tabular direto |
| `matches` | `MatchRecord` | `staging.matches` | compativel com cast | placares e `injury_time_*` saem como string no scraper e entram tipados no banco apos endurecimento |
| `lineups` | `LineupRecord` | `staging.lineups` | compativel com cast | `jersey_number`, `minutes_played` e `rating` saem como string no scraper e entram tipados no banco apos endurecimento |
| `events` | `EventRecord` | `staging.events` | compativel | shape tabular direto; ids de referencia ja existem no payload |
| `player_career_teams` | `PlayerCareerTeamRecord` | `staging.player_career_teams` | compativel | shape tabular direto |
| `player_match_stats` | `PlayerMatchStatRecord` | `staging.player_match_stats` | compativel | payload largo continua apropriado para `stat_payload jsonb` |
| `team_match_stats` | `TeamMatchStatRecord` | `staging.team_match_stats` | compativel | payload largo continua apropriado para `stat_payload jsonb` |

## Gaps reais encontrados

### 1. Casts continuam parte do pipeline

O scraper atual ainda trabalha majoritariamente com strings.

Isso nao bloqueia a Fase 2, mas significa que o pipeline permanente precisa continuar tratando:

- `stadiums.capacity`
- `stadiums.latitude`
- `stadiums.longitude`
- placares e `injury_time_*` de `matches`
- `jersey_number`, `minutes_played` e `rating` de `lineups`

Conclusao:

- o scraper nao precisa mudar esses tipos agora
- a camada de ingestao da Fase 2 precisa assumir a responsabilidade por normalizar esses campos antes da promocao

### 2. Flags legadas nao sao o centro da ingestao

Algumas entidades ainda carregam sinais herdados do fluxo em CSV, como:

- `edited`
- `translated`

Esses campos aparecem em partes do legado e seguem suportados em `staging.*`, mas nao devem dirigir a logica principal do pipeline permanente.

Conclusao:

- a Fase 2 pode preservar essas flags quando existirem
- mas a promocao para `core.*` deve continuar orientada por identidade, validacao e canonicidade, nao por semantica editorial legada

### 3. `states` continua fora da ingestao

`core.states` existe por decisao de modelo, mas nao ha payload atual do scraper para essa entidade.

Conclusao:

- nao criar expectativa de ingestao de `states` na Fase 2
- manter `cities.state` opcional

## Decisao para seguir

A Frente 1 pode ser considerada concluida com a seguinte conclusao:

- `staging.*` cobre o payload atual do scraper
- nao ha migration bloqueante adicional necessaria antes de implementar validacao, promocao e auditoria
- os pontos restantes sao de regra de pipeline, especialmente:
  - casts e normalizacao
  - idempotencia
  - `dry-run`
  - detalhamento por entidade em `ops.*`
