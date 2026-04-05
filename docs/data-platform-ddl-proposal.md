# Proposta Inicial de DDL da Plataforma de Dados

## Objetivo

Traduzir o contrato, o desenho de schemas e a matriz de constraints da Fase 0 em uma proposta inicial de DDL.

Este documento ainda nao e migration executavel. Ele existe para fechar a modelagem SQL antes da Fase 1.

## Escopo desta proposta

Esta primeira proposta cobre:

- criacao dos schemas principais
- tabelas centrais de `core.*`
- tabelas operacionais principais
- convencoes gerais para `staging.*`

Ela ainda deixa em aberto:

- DDL completa de `staging.*`
- modelagem final de `player_match_stats` e `team_match_stats`
- indices secundarios de performance
- materialized views e camada `read.*`

## Convencoes SQL iniciais

- `id` como `text`
- timestamps como `timestamptz`
- campos textuais como `text`
- flags de validacao em `staging.*` como `text`
- checks simples apenas onde agregam clareza real

## Schemas

```sql
create schema if not exists core;
create schema if not exists staging;
create schema if not exists raw;
create schema if not exists read;
create schema if not exists editorial;
```

## Tabelas de `core.*`

### `core.countries`

```sql
create table core.countries (
  id text primary key,
  slug text not null,
  name text not null,
  code2 text,
  code3 text,
  source_slug text,
  source_code2 text,
  source_code3 text,
  source_name text,
  source_ref text not null unique,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.states`

```sql
create table core.states (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  country text not null references core.countries(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (country, slug)
);
```

### `core.cities`

```sql
create table core.cities (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  country text not null references core.countries(id),
  state text references core.states(id),
  source_name text,
  source_ref text not null unique,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.stadiums`

```sql
create table core.stadiums (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  city text not null references core.cities(id),
  capacity text,
  latitude text,
  longitude text,
  source_ref text not null unique,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.tournaments`

```sql
create table core.tournaments (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  country text not null references core.countries(id),
  primary_color text,
  secondary_color text,
  source_ref text not null unique,
  source_slug text,
  source_name text,
  source_primary_color text,
  source_secondary_color text,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.seasons`

```sql
create table core.seasons (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  year text,
  tournament text not null references core.tournaments(id),
  source_ref text not null unique,
  source_name text,
  source_year text,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.referees`

```sql
create table core.referees (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  country text references core.countries(id),
  source_ref text not null unique,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.managers`

```sql
create table core.managers (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  country text references core.countries(id),
  source_ref text not null unique,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.teams`

```sql
create table core.teams (
  id text primary key,
  slug text not null,
  name text not null,
  code3 text,
  short_name text,
  complete_name text,
  stadium text references core.stadiums(id),
  foundation text,
  primary_color text,
  secondary_color text,
  text_color text,
  source_ref text not null unique,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.players`

```sql
create table core.players (
  id text primary key,
  slug text not null,
  name text not null,
  short_name text,
  first_name text,
  last_name text,
  position text,
  height text,
  country text references core.countries(id),
  date_of_birth text,
  source text not null check (source = 'sofascore'),
  source_ref text not null unique,
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

### `core.matches`

```sql
create table core.matches (
  id text primary key,
  tournament text not null references core.tournaments(id),
  season text not null references core.seasons(id),
  round text,
  stadium text references core.stadiums(id),
  referee text references core.referees(id),
  home_team text not null references core.teams(id),
  home_manager text references core.managers(id),
  home_formation text,
  home_score_period_1 text,
  home_score_period_2 text,
  home_score_normaltime text,
  home_score_extra_1 text,
  home_score_extra_2 text,
  home_score_overtime text,
  home_score_penalties text,
  away_team text not null references core.teams(id),
  away_manager text references core.managers(id),
  away_formation text,
  away_score_period_1 text,
  away_score_period_2 text,
  away_score_normaltime text,
  away_score_extra_1 text,
  away_score_extra_2 text,
  away_score_overtime text,
  away_score_penalties text,
  start_time timestamptz not null,
  period_start_time timestamptz,
  injury_time_1 text,
  injury_time_2 text,
  injury_time_3 text,
  injury_time_4 text,
  source_ref text not null unique,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (home_team <> away_team)
);
```

### `core.lineups`

```sql
create table core.lineups (
  id text primary key,
  match text not null references core.matches(id),
  team text not null references core.teams(id),
  player text not null references core.players(id),
  jersey_number text,
  position text,
  substitute text,
  is_missing text,
  slot text,
  minutes_played text,
  rating text,
  source_match_id text not null,
  source_team_id text not null,
  source_player_id text not null,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (source_match_id, source_team_id, source_player_id)
);
```

### `core.player_match_stats`

```sql
create table core.player_match_stats (
  id text primary key,
  match text not null references core.matches(id),
  team text not null references core.teams(id),
  player text not null references core.players(id),
  stat_payload jsonb not null,
  source_match_id text not null,
  source_team_id text not null,
  source_player_id text not null,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (source_match_id, source_team_id, source_player_id)
);
```

### `core.team_match_stats`

```sql
create table core.team_match_stats (
  id text primary key,
  match text not null references core.matches(id),
  team text not null references core.teams(id),
  stat_payload jsonb not null,
  source_match_id text not null,
  source_team_id text not null,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (source_match_id, source_team_id)
);
```

### `core.events`

```sql
create table core.events (
  id text primary key,
  match text not null references core.matches(id),
  sort_order text,
  team text references core.teams(id),
  player text references core.players(id),
  related_player text references core.players(id),
  manager text references core.managers(id),
  incident_type text not null,
  incident_class text,
  period text,
  minute text,
  added_time text,
  reversed_period_time text,
  is_home text,
  impact_side text,
  is_confirmed text,
  is_rescinded text,
  reason text,
  description text,
  is_injury text,
  home_score text,
  away_score text,
  length text,
  body_part text,
  goal_type text,
  situation text,
  shot_type text,
  player_x text,
  player_y text,
  pass_end_x text,
  pass_end_y text,
  shot_x text,
  shot_y text,
  goal_mouth_x text,
  goal_mouth_y text,
  goalkeeper_x text,
  goalkeeper_y text,
  source_match_id text not null,
  source_incident_id text not null,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (source_match_id, source_incident_id)
);
```

### `core.player_career_teams`

```sql
create table core.player_career_teams (
  id text primary key,
  player text not null references core.players(id),
  team text not null references core.teams(id),
  source_player_id text not null,
  source_team_id text not null,
  source text not null check (source = 'sofascore'),
  first_scraped_at timestamptz not null,
  last_scraped_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (source_player_id, source_team_id)
);
```

## Tabelas operacionais

### `core.ingestion_runs`

```sql
create table core.ingestion_runs (
  run_id text primary key,
  source text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null,
  rows_inserted integer,
  rows_updated integer,
  rows_skipped integer,
  validation_errors jsonb,
  warnings jsonb
);
```

### `core.planned_matches`

```sql
create table core.planned_matches (
  id text primary key,
  provider text not null,
  provider_event_id text not null,
  scheduled_at timestamptz not null,
  core_match_id text references core.matches(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (provider, provider_event_id)
);
```

### `core.scheduled_scrapes`

```sql
create table core.scheduled_scrapes (
  id text primary key,
  planned_match_id text not null references core.planned_matches(id),
  scheduled_for timestamptz not null,
  pass_number integer not null check (pass_number > 0),
  status text not null,
  triggered_by text,
  run_id text references core.ingestion_runs(run_id),
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

## Convencao inicial para `staging.*`

Cada tabela de staging deve seguir esta base:

```sql
create table staging.<entity> (
  id text primary key,
  run_id text not null references core.ingestion_runs(run_id),
  ingested_at timestamptz not null,
  validation_status text not null,
  validation_errors jsonb,
  warnings jsonb,
  payload jsonb not null
);
```

Observacao:

- para entidades menores, podemos abrir as colunas em vez de usar `payload jsonb`
- para a primeira rodada, o importante e fechar a interface de validacao e promocao

## Decisoes assumidas nesta proposta

- `states` entra desde o inicio em `core.*`
- `cities.state` e opcional
- `player_match_stats` e `team_match_stats` usam `jsonb` nesta proposta inicial
- `referee`, `manager` e `stadium` podem comecar como relacionamentos opcionais em `matches`

## Decisoes ainda em aberto

- se `ingestion_runs`, `planned_matches` e `scheduled_scrapes` devem ficar em `core.*` ou em schema operacional separado
- se `staging.*` sera majoritariamente tabular ou baseada em `payload jsonb`
- se as tabelas de stats devem ser abertas em colunas desde a primeira migration
- quais indices secundarios entram na primeira versao

## Proximo passo

Se esta proposta estiver alinhada, o proximo artefato natural e uma `ddl-v1` mais concreta, ja organizada para virar migration inicial da Fase 1.
