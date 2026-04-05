# Revisao Critica da Proposta de DDL

## Objetivo

Avaliar a proposta inicial de DDL e fechar as principais decisoes abertas da Fase 0 antes de uma futura `ddl-v1`.

## Resumo executivo

Direcao recomendada para a primeira migration:

1. manter `core.*` para entidades canonicas
2. manter `staging.*` como porta de entrada
3. mover tabelas operacionais para um schema proprio `ops.*`
4. usar `jsonb` em `player_match_stats` e `team_match_stats` na primeira versao
5. entrar com FKs obrigatorias apenas nas relacoes realmente estaveis no bootstrap inicial

## Decisoes fechadas nesta revisao

### 1. Tabelas operacionais nao devem ficar em `core.*`

Recomendacao:

- `ingestion_runs` -> `ops.ingestion_runs`
- `planned_matches` -> `ops.planned_matches`
- `scheduled_scrapes` -> `ops.scheduled_scrapes`

Motivo:

- essas tabelas nao fazem parte do dominio canonico de futebol
- elas pertencem ao funcionamento da plataforma
- isso deixa `core.*` mais limpo e mais previsivel

### 2. `player_match_stats` e `team_match_stats` ficam em `jsonb` na primeira versao

Recomendacao:

- manter `stat_payload jsonb not null` na primeira migration

Motivo:

- o conjunto de metricas e muito largo
- o schema atual ainda carrega herancas e campos nem sempre estaveis
- a Fase 1 precisa validar ingestao e relacoes antes de otimizar analytics
- `team_match_stats` ja e derivado, entao endurecer sua estrutura cedo demais aumenta retrabalho

Trade-off:

- piora um pouco a ergonomia de SQL analitico bruto
- melhora muito a velocidade e seguranca da primeira modelagem

### 3. `core.states` entra na primeira migration

Recomendacao:

- criar `core.states` desde a primeira migration
- manter `core.cities.state` como FK opcional

Motivo:

- `state` ja foi assumido como necessidade estrutural
- colocar isso depois criaria migracao corretiva desnecessaria

### 4. `cities.state` deve continuar opcional no bootstrap

Motivo:

- esse dado nao vem do scraper
- ele sera preenchido manualmente
- nao faz sentido travar bootstrap por ausencia desse valor

## Recomendacao de rigidez para FKs na primeira migration

### Entram como FK obrigatoria desde o inicio

- `cities.country`
- `states.country`
- `stadiums.city`
- `tournaments.country`
- `seasons.tournament`
- `players.country`
- `matches.tournament`
- `matches.season`
- `matches.home_team`
- `matches.away_team`
- `lineups.match`
- `lineups.team`
- `lineups.player`
- `player_match_stats.match`
- `player_match_stats.team`
- `player_match_stats.player`
- `team_match_stats.match`
- `team_match_stats.team`
- `player_career_teams.player`
- `player_career_teams.team`

### Entram como FK opcional na primeira migration

- `cities.state`
- `teams.stadium`
- `matches.stadium`
- `matches.referee`
- `matches.home_manager`
- `matches.away_manager`
- `events.team`
- `events.player`
- `events.related_player`
- `events.manager`

Motivo:

- esses relacionamentos podem existir com qualidade irregular no legado ou depender de preenchimento manual
- e melhor endurecer depois de validar bootstrap e ingestao recorrente

## Recomendacao sobre `staging.*`

### Primeira versao

Recomendacao:

- `staging.*` hibrido

Padrao:

- entidades simples: colunas abertas proximas de `core.*`
- entidades largas: `payload jsonb` + chaves minimas + colunas de controle

Aplicacao inicial:

- `staging.countries`, `staging.cities`, `staging.stadiums`, `staging.tournaments`, `staging.seasons`, `staging.referees`, `staging.managers`, `staging.teams`, `staging.players`, `staging.matches`, `staging.lineups`
  podem nascer mais tabulares
- `staging.player_match_stats` e `staging.events`
  podem nascer com `payload jsonb`

Motivo:

- isso reduz complexidade sem perder rastreabilidade

## Recomendacao sobre tipos SQL

### Pode entrar como `timestamptz`

- auditoria
- `matches.start_time`
- `matches.period_start_time`
- `ops.ingestion_runs.started_at`
- `ops.ingestion_runs.finished_at`
- `ops.planned_matches.scheduled_at`
- `ops.scheduled_scrapes.scheduled_for`

### Pode continuar como `text` na primeira migration

- placares por periodo
- `injury_time_*`
- coordenadas e campos numericos de eventos
- metricas dentro de `stat_payload`

Motivo:

- converter tudo cedo demais aumenta risco no bootstrap
- tipagem numerica pode entrar depois nas camadas analiticas ou views derivadas

## Ajustes recomendados na proposta de DDL

### 1. Adicionar schema `ops`

```sql
create schema if not exists ops;
```

### 2. Mover tabelas operacionais

- `core.ingestion_runs` -> `ops.ingestion_runs`
- `core.planned_matches` -> `ops.planned_matches`
- `core.scheduled_scrapes` -> `ops.scheduled_scrapes`

### 3. Ajustar referencias de `staging.*`

- `run_id` deve referenciar `ops.ingestion_runs(run_id)`

### 4. Tornar explicito o hibrido de staging

Recomendacao:

- nao usar um unico modelo generico `payload jsonb` para todo staging
- descrever duas familias:
  - staging tabular
  - staging com payload

## O que ainda fica aberto mesmo apos esta revisao

- se `teams.stadium` entra como FK opcional ja na `ddl-v1` ou num patch logo apos bootstrap
- se `referees.country` e `managers.country` entram opcionais ou sem FK na primeira migration
- se `events` deve ganhar alguns campos fortemente tipados na primeira versao

## Resultado esperado apos esta revisao

Depois desta etapa, a Fase 0 fica pronta para produzir uma `ddl-v1` mais fechada, com:

- schemas finais definidos
- tabelas operacionais no lugar certo
- estatisticas modeladas de forma segura para a primeira migration
- nivel de rigidez inicial das FKs bem definido
