# Matriz de Constraints e Validacoes da Plataforma de Dados

## Objetivo

Consolidar, por entidade, as constraints iniciais esperadas em `core.*` e as validacoes minimas esperadas em `staging.*`.

Este documento existe para aproximar a Fase 0 de uma futura DDL e de um pipeline de bootstrap/ingestao com regras objetivas.

## Como ler esta matriz

### Constraints de `core.*`

Cada entidade lista:

- PK
- unicidade
- FKs
- colunas candidatas a `NOT NULL`
- checks simples candidatos

### Validacoes de `staging.*`

Cada entidade lista:

- bloqueantes
- warnings operacionais

## Convencoes gerais

### `NOT NULL`

Nesta matriz, `NOT NULL` significa:

- deve entrar na primeira versao se a ausencia do valor invalidar a identidade ou a relacao principal

### Warning

Warning significa:

- deve ser registrado em `ingestion_runs`
- nao bloqueia promocao automaticamente

## Cadastros base

### `core.countries`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- `NOT NULL`: `id`, `slug`, `name`, `source_ref`, `source`
- CHECK candidato: `source = 'sofascore'`

Validacoes em `staging.countries`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio

- warnings:
- `code2` vazio
- `code3` vazio

### `core.states`

Constraints:

- PK: `id`
- UNIQUE: `country, slug`
- FK: `country -> core.countries.id`
- `NOT NULL`: `id`, `slug`, `name`, `country`, `created_at`, `updated_at`

Validacoes:

- como `states` nao vem do scraper, a validacao inicial e de cadastro manual
- bloqueantes:
- `country` ausente
- `slug` vazio
- `name` vazio

- warnings:
- `short_name` vazio

### `core.cities`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK: `country -> core.countries.id`
- FK opcional: `state -> core.states.id`
- `NOT NULL`: `id`, `slug`, `name`, `country`, `source_ref`, `source`

Validacoes em `staging.cities`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio
- `country` irresoluvel

- warnings:
- `short_name` vazio
- `state` vazio

### `core.stadiums`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK: `city -> core.cities.id`
- `NOT NULL`: `id`, `slug`, `name`, `city`, `source_ref`, `source`

Validacoes em `staging.stadiums`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio
- `city` irresoluvel

- warnings:
- `capacity` vazio
- `latitude` vazio
- `longitude` vazio

### `core.tournaments`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK: `country -> core.countries.id`
- `NOT NULL`: `id`, `slug`, `name`, `country`, `source_ref`, `source`

Validacoes em `staging.tournaments`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio
- `country` irresoluvel

- warnings:
- `short_name` vazio
- `primary_color` vazio
- `secondary_color` vazio

### `core.seasons`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK: `tournament -> core.tournaments.id`
- `NOT NULL`: `id`, `slug`, `name`, `tournament`, `source_ref`, `source`

Validacoes em `staging.seasons`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio
- `tournament` irresoluvel

- warnings:
- `year` vazio
- `short_name` vazio

### `core.referees`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK candidata: `country -> core.countries.id`
- `NOT NULL`: `id`, `slug`, `name`, `source_ref`, `source`

Validacoes em `staging.referees`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio

- warnings:
- `country` vazio
- `country` nao resolvido se essa FK ainda nao for obrigatoria

### `core.managers`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK candidata: `country -> core.countries.id`
- `NOT NULL`: `id`, `slug`, `name`, `source_ref`, `source`

Validacoes em `staging.managers`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio

- warnings:
- `country` vazio
- `country` nao resolvido se essa FK ainda nao for obrigatoria

### `core.teams`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK: `stadium -> core.stadiums.id`
- `NOT NULL`: `id`, `slug`, `name`, `source_ref`, `source`

Validacoes em `staging.teams`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio

- warnings:
- `stadium` vazio
- `foundation` vazio
- `code3` vazio

### `core.players`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK: `country -> core.countries.id`
- `NOT NULL`: `id`, `slug`, `name`, `source_ref`, `source`

Validacoes em `staging.players`:

- bloqueantes:
- `source_ref` vazio
- `name` vazio

- warnings:
- `country` vazio
- `height` vazio
- `date_of_birth` vazio
- `position` vazio

## Contexto de partida

### `core.matches`

Constraints:

- PK: `id`
- UNIQUE: `source_ref`
- FK: `tournament -> core.tournaments.id`
- FK: `season -> core.seasons.id`
- FK: `stadium -> core.stadiums.id`
- FK candidata: `referee -> core.referees.id`
- FK: `home_team -> core.teams.id`
- FK: `away_team -> core.teams.id`
- FK candidata: `home_manager -> core.managers.id`
- FK candidata: `away_manager -> core.managers.id`
- `NOT NULL`: `id`, `tournament`, `season`, `home_team`, `away_team`, `start_time`, `source_ref`, `source`
- CHECK candidato: `home_team <> away_team`

Validacoes em `staging.matches`:

- bloqueantes:
- `source_ref` vazio
- `home_team` vazio ou irresoluvel
- `away_team` vazio ou irresoluvel
- `tournament` irresoluvel
- `season` irresoluvel
- `home_team = away_team`

- warnings:
- `stadium` vazio
- `referee` vazio
- `home_manager` vazio
- `away_manager` vazio
- `period_start_time` vazio

### `core.lineups`

Constraints:

- PK: `id`
- UNIQUE: `source_match_id, source_team_id, source_player_id`
- FK: `match -> core.matches.id`
- FK: `team -> core.teams.id`
- FK: `player -> core.players.id`
- `NOT NULL`: `id`, `match`, `team`, `player`, `source_match_id`, `source_team_id`, `source_player_id`, `source`

Validacoes em `staging.lineups`:

- bloqueantes:
- qualquer parte da chave natural vazia
- `match` irresoluvel
- `team` irresoluvel
- `player` irresoluvel

- warnings:
- `jersey_number` vazio
- `slot` vazio
- `rating` vazio

### `core.player_match_stats`

Constraints:

- PK: `id`
- UNIQUE: `source_match_id, source_team_id, source_player_id`
- FK: `match -> core.matches.id`
- FK: `team -> core.teams.id`
- FK: `player -> core.players.id`
- `NOT NULL`: `id`, `match`, `team`, `player`, `source_match_id`, `source_team_id`, `source_player_id`, `source`

Validacoes em `staging.player_match_stats`:

- bloqueantes:
- qualquer parte da chave natural vazia
- `match` irresoluvel
- `team` irresoluvel
- `player` irresoluvel
- ausencia de contexto correspondente em `lineups`

- warnings:
- metricas opcionais vazias
- `rating` vazio

### `core.team_match_stats`

Constraints:

- PK: `id`
- UNIQUE: `source_match_id, source_team_id`
- FK: `match -> core.matches.id`
- FK: `team -> core.teams.id`
- `NOT NULL`: `id`, `match`, `team`, `source_match_id`, `source_team_id`, `source`

Validacoes:

- bloqueantes:
- qualquer parte da chave natural vazia
- `match` irresoluvel
- `team` irresoluvel
- agregado final nao bate com `player_match_stats`

- warnings:
- metricas opcionais vazias

Observacao:

- como a tabela e derivada, a validacao ideal compara o resultado recalculado com o que seria promovido

### `core.events`

Constraints:

- PK: `id`
- UNIQUE: `source_match_id, source_incident_id`
- FK: `match -> core.matches.id`
- FK opcionais: `team`, `player`, `related_player`, `manager`
- `NOT NULL`: `id`, `match`, `incident_type`, `source_match_id`, `source_incident_id`, `source`

Validacoes em `staging.events`:

- bloqueantes:
- `source_match_id` vazio
- `source_incident_id` vazio
- `match` irresoluvel
- evento de substituicao sem `related_player`
- evento de gol sem placar
- manager invalido fora de `home_manager` e `away_manager`

- warnings:
- coordenadas ausentes
- `team` nao resolvido em eventos onde isso for opcional
- `player` nao resolvido em eventos de contexto mais administrativo

### `core.player_career_teams`

Constraints:

- PK: `id`
- UNIQUE: `source_player_id, source_team_id`
- FK: `player -> core.players.id`
- FK: `team -> core.teams.id`
- `NOT NULL`: `id`, `player`, `team`, `source_player_id`, `source_team_id`, `source`

Validacoes em `staging.player_career_teams`:

- bloqueantes:
- `source_player_id` vazio
- `source_team_id` vazio
- `player` irresoluvel
- `team` irresoluvel

- warnings:
- nenhum por enquanto

## Constraints minimas de tabelas operacionais

### `ingestion_runs`

Constraints iniciais:

- PK: `run_id`
- `NOT NULL`: `run_id`, `source`, `started_at`, `status`

### `planned_matches`

Constraints iniciais:

- PK: `id`
- UNIQUE: `provider, provider_event_id`
- FK opcional: `core_match_id -> core.matches.id`
- `NOT NULL`: `id`, `provider`, `provider_event_id`, `scheduled_at`

### `scheduled_scrapes`

Constraints iniciais:

- PK: `id`
- FK: `planned_match_id -> planned_matches.id`
- FK opcional: `run_id -> ingestion_runs.run_id`
- `NOT NULL`: `id`, `planned_match_id`, `scheduled_for`, `pass_number`, `status`
- CHECK candidato: `pass_number > 0`

## Pontos ainda em aberto antes da DDL

- quais FKs candidatas entram ja na primeira migracao
- quais checks simples valem a pena endurecer no banco e quais devem ficar na camada de validacao
- como modelar fisicamente `player_match_stats` e `team_match_stats`
- se `state` em `cities` entra com FK desde a primeira migracao ou num passo posterior
