# Desenho Inicial dos Schemas da Plataforma de Dados

## Objetivo

Detalhar o desenho tabular inicial de `core.*` e `staging.*` para a Fase 0, sem ainda transformar este documento em SQL definitivo.

Este documento complementa:

- `docs/data-platform-contract.md`
- `docs/implementation-plan-data-platform.md`
- `docs/checklist-phase-0-data-platform.md`

## Principios de desenho

- `staging.*` e a porta de entrada da ingestao
- `core.*` e a camada canonica promovida
- `read.*` fica fora deste documento porque depende mais das queries de consumo
- `raw.*` entra depois e nao precisa de detalhamento tabular completo nesta rodada
- o desenho abaixo privilegia clareza de relacao, identidade e validacao

## Convencoes gerais

### Identidade

- toda tabela de `core.*` tera `id` interno
- tabelas simples usam `source_ref`
- tabelas relacionais usam `source_*_id`

### Auditoria

Padrao alvo de auditoria em `core.*`:

- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Padrao minimo em `staging.*`:

- `run_id`
- `ingested_at`
- `validation_status`

### Status em staging

Valores iniciais sugeridos:

- `pending`
- `validated`
- `invalid`
- `promoted`

## Desenho inicial de `core.*`

### `core.countries`

Colunas:

- `id`
- `slug`
- `name`
- `code2`
- `code3`
- `source_slug`
- `source_code2`
- `source_code3`
- `source_name`
- `source_ref`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- `source = 'sofascore'` por enquanto

### `core.states`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `country`
- `created_at`
- `updated_at`

Observacao:

- `states` nao e alimentado pelo scraper
- esta entidade nasce como cadastro manual do sistema
- a manutencao operacional pode acontecer via `Directus`

Constraints iniciais:

- PK em `id`
- UNIQUE em `country, slug`
- FK `country -> core.countries.id`

### `core.cities`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `country`
- `state`
- `source_name`
- `source_ref`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `country -> core.countries.id`
- FK opcional `state -> core.states.id`

### `core.stadiums`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `city`
- `capacity`
- `latitude`
- `longitude`
- `source_ref`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `city -> core.cities.id`

### `core.tournaments`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `country`
- `primary_color`
- `secondary_color`
- `source_ref`
- `source_slug`
- `source_name`
- `source_primary_color`
- `source_secondary_color`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Observacao:

- o legado ainda tem `translated`; o contrato alvo substitui isso por auditoria consistente

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `country -> core.countries.id`

### `core.seasons`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `year`
- `tournament`
- `source_ref`
- `source_name`
- `source_year`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `tournament -> core.tournaments.id`

### `core.referees`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `country`
- `source_ref`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `country -> core.countries.id`

### `core.managers`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `country`
- `source_ref`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `country -> core.countries.id`

### `core.teams`

Colunas:

- `id`
- `slug`
- `name`
- `code3`
- `short_name`
- `complete_name`
- `stadium`
- `foundation`
- `primary_color`
- `secondary_color`
- `text_color`
- `source_ref`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `stadium -> core.stadiums.id`

### `core.players`

Colunas:

- `id`
- `slug`
- `name`
- `short_name`
- `first_name`
- `last_name`
- `position`
- `height`
- `country`
- `date_of_birth`
- `source`
- `source_ref`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `country -> core.countries.id`

### `core.matches`

Colunas:

- `id`
- `tournament`
- `season`
- `round`
- `stadium`
- `referee`
- `home_team`
- `home_manager`
- `home_formation`
- `home_score_period_1`
- `home_score_period_2`
- `home_score_normaltime`
- `home_score_extra_1`
- `home_score_extra_2`
- `home_score_overtime`
- `home_score_penalties`
- `away_team`
- `away_manager`
- `away_formation`
- `away_score_period_1`
- `away_score_period_2`
- `away_score_normaltime`
- `away_score_extra_1`
- `away_score_extra_2`
- `away_score_overtime`
- `away_score_penalties`
- `start_time`
- `period_start_time`
- `injury_time_1`
- `injury_time_2`
- `injury_time_3`
- `injury_time_4`
- `source_ref`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_ref`
- FK `tournament -> core.tournaments.id`
- FK `season -> core.seasons.id`
- FK `stadium -> core.stadiums.id`
- FK `referee -> core.referees.id`
- FK `home_team -> core.teams.id`
- FK `away_team -> core.teams.id`

Observacao:

- `home_manager` e `away_manager` podem entrar como FK na primeira versao se os dados estiverem suficientemente estaveis no bootstrap

### `core.lineups`

Colunas:

- `id`
- `match`
- `team`
- `player`
- `jersey_number`
- `position`
- `substitute`
- `is_missing`
- `slot`
- `minutes_played`
- `rating`
- `source_match_id`
- `source_team_id`
- `source_player_id`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_match_id, source_team_id, source_player_id`
- FK `match -> core.matches.id`
- FK `team -> core.teams.id`
- FK `player -> core.players.id`

### `core.player_match_stats`

Colunas:

- `id`
- `match`
- `team`
- `player`
- `stat_payload`
- `source_match_id`
- `source_team_id`
- `source_player_id`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Observacao:

- na implementacao inicial, `stat_payload` pode ser um agrupamento logico das muitas metricas atuais
- fisicamente o banco pode escolher entre colunas abertas ou `JSONB`; essa decisao fica para a DDL

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_match_id, source_team_id, source_player_id`
- FK `match -> core.matches.id`
- FK `team -> core.teams.id`
- FK `player -> core.players.id`

### `core.team_match_stats`

Colunas:

- `id`
- `match`
- `team`
- `stat_payload`
- `source_match_id`
- `source_team_id`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_match_id, source_team_id`
- FK `match -> core.matches.id`
- FK `team -> core.teams.id`

Observacao:

- esta tabela e derivada; o contrato precisa existir, mas a estrategia de recalculo deve ser a fonte da verdade

### `core.events`

Colunas:

- `id`
- `match`
- `sort_order`
- `team`
- `player`
- `related_player`
- `manager`
- `incident_type`
- `incident_class`
- `period`
- `minute`
- `added_time`
- `reversed_period_time`
- `is_home`
- `impact_side`
- `is_confirmed`
- `is_rescinded`
- `reason`
- `description`
- `is_injury`
- `home_score`
- `away_score`
- `length`
- `body_part`
- `goal_type`
- `situation`
- `shot_type`
- `player_x`
- `player_y`
- `pass_end_x`
- `pass_end_y`
- `shot_x`
- `shot_y`
- `goal_mouth_x`
- `goal_mouth_y`
- `goalkeeper_x`
- `goalkeeper_y`
- `source_match_id`
- `source_incident_id`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_match_id, source_incident_id`
- FK `match -> core.matches.id`
- FK `team -> core.teams.id` quando aplicavel
- FK `player -> core.players.id` quando aplicavel
- FK `related_player -> core.players.id` quando aplicavel
- FK `manager -> core.managers.id` quando aplicavel

### `core.player_career_teams`

Colunas:

- `id`
- `player`
- `team`
- `source_player_id`
- `source_team_id`
- `source`
- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Constraints iniciais:

- PK em `id`
- UNIQUE em `source_player_id, source_team_id`
- FK `player -> core.players.id`
- FK `team -> core.teams.id`

## Desenho inicial de `staging.*`

## Regra geral

Cada tabela de staging deve ter:

- colunas de negocio minimas equivalentes a sua entidade
- `run_id`
- `ingested_at`
- `validation_status`
- opcionalmente `validation_errors`
- opcionalmente `warnings`

### Estrategia de granularidade

- para cadastros e entidades pequenas, `staging.*` pode espelhar quase 1:1 `core.*`
- para entidades muito largas, `staging.*` pode aceitar carga semantica mais crua e ser normalizada antes da promocao

### Tabelas iniciais

- `staging.countries`
- `staging.cities`
- `staging.stadiums`
- `staging.tournaments`
- `staging.seasons`
- `staging.referees`
- `staging.managers`
- `staging.teams`
- `staging.players`
- `staging.matches`
- `staging.lineups`
- `staging.player_match_stats`
- `staging.events`
- `staging.player_career_teams`

Observacao:

- `staging.states` nao e necessario na primeira versao porque `states` nao vem do scraper
- `state` em `staging.cities` pode permanecer vazio quando a cidade ainda nao tiver vinculacao manual definida

## Validacoes iniciais por severidade

### Bloqueantes

Devem impedir promocao para `core.*`.

- chave natural de `upsert` ausente
- FK obrigatoria irresoluvel
- `match` sem `home_team` ou `away_team`
- `lineup` sem `source_match_id`, `source_team_id` ou `source_player_id`
- `player_match_stats` sem contexto correspondente
- `event` sem `source_incident_id` ou sem `source_match_id`
- erro de parsing estrutural que troque tipo ou coluna

### Warnings operacionais

Nao impedem promocao automaticamente, mas devem ser registrados.

- campo opcional ausente
- `city.state` vazio
- coordenadas faltando em `events`
- `stadium.capacity` vazio
- `player.height` vazio
- `manager.country` ou `referee.country` nao resolvido em fase inicial, se essa relacao for opcional no primeiro ciclo
- divergencias pequenas entre payload e valores canonicos onde override editorial possa existir depois

## Pontos que ainda precisam de fechamento

- quais tabelas terao coluna aberta versus `JSONB` na primeira versao
- quais FKs entram ja na primeira migracao e quais entram depois do bootstrap
- se `manager` e `referee` entram com FK obrigatoria desde o inicio
- se `team_match_stats` nasce fisicamente persistida ou como derivado materializado
- se `states` fica apenas em `core.*` ou ganha uma camada `editorial.*` dedicada quando o `Directus` entrar

## Resultado desta rodada

Este documento fecha:

- desenho inicial das tabelas de `core.*`
- papel minimo das tabelas de `staging.*`
- constraints candidatas
- classificacao inicial entre erro bloqueante e warning

O proximo passo natural da Fase 0 e transformar isso em:

- matriz de constraints por entidade
- proposta de DDL inicial
- definicao de como modelar `player_match_stats` e `team_match_stats` entre colunas abertas e `JSONB`
