# Contrato Inicial da Plataforma de Dados

## Objetivo

Registrar o contrato inicial de dados da Fase 0 com base no estado real do scraper do Sofascore, dos tipos TypeScript e dos CSVs atuais.

Este documento fecha a primeira camada de definicao para:

- entidades canonicas
- papel de cada schema futuro
- chaves de identidade e `upsert`
- relacionamentos principais
- inconsistencias legadas que afetam a migracao

## Escopo desta primeira rodada

Esta rodada cobre o que ja foi confirmado no codigo atual de `services/sofascore`.

Ela nao implementa banco, migracoes nem scheduler. O foco e transformar o estado atual em contrato tecnico.

## Estado atual confirmado

O scraper atual:

- coleta dados do Sofascore
- normaliza entidades e relacionamentos em memoria
- persiste em CSVs locais
- faz `upsert` por chaves de origem
- relinka referencias para IDs internos antes de salvar
- deriva `team-match-stats` a partir de `player-match-stats`

Entidades atualmente persistidas:

- `countries`
- `cities`
- `stadiums`
- `tournaments`
- `seasons`
- `referees`
- `managers`
- `teams`
- `players`
- `matches`
- `lineups`
- `player_match_stats`
- `team_match_stats`
- `events`
- `player_career_teams`

## Schemas alvo da plataforma

### `staging.*`

Porta de entrada operacional da ingestao.

Responsabilidade:

- receber dados normalizados do scraper
- aceitar estados ainda nao promovidos
- servir de base para validacoes estruturais, relacionais e de negocio

Regra:

- o scraper escreve primeiro aqui
- `core.*` nao recebe escrita direta do scraper

### `core.*`

Modelo canonico relacional do projeto.

Responsabilidade:

- consolidar IDs internos
- preservar `source_ref` e `source_*_id`
- sustentar a API, o CMS e os modelos de leitura

Regra:

- so recebe dados promovidos de `staging.*`

### `read.*`

Camada de leitura e composicao.

Responsabilidade:

- expor modelos de contexto
- centralizar joins e agregacoes repetidas

### `raw.*`

Camada opcional de persistencia quase bruta.

Responsabilidade:

- auditoria
- replay
- comparacao com a origem

Observacao:

- o contrato desta camada precisa existir desde a Fase 0
- a implementacao pode entrar depois

### `editorial.*`

Camada de overrides e ajustes operacionais.

Responsabilidade:

- separar ajustes manuais do dado canonico de ingestao

## Entidades canonicas iniciais de `core.*`

### Cadastros base

- `core.countries`
- `core.cities`
- `core.stadiums`
- `core.tournaments`
- `core.seasons`
- `core.referees`
- `core.managers`
- `core.teams`
- `core.players`

### Contexto de partida

- `core.matches`
- `core.lineups`
- `core.player_match_stats`
- `core.team_match_stats`
- `core.events`
- `core.player_career_teams`

## Papel inicial de `staging.*`

Na Fase 0, o staging deve espelhar as entidades que entram pela ingestao recorrente do scraper:

- `staging.matches`
- `staging.lineups`
- `staging.player_match_stats`
- `staging.events`
- `staging.player_career_teams`

Tambem faz sentido prever staging para cadastros atualizados pelo scrape:

- `staging.countries`
- `staging.cities`
- `staging.stadiums`
- `staging.tournaments`
- `staging.seasons`
- `staging.referees`
- `staging.managers`
- `staging.teams`
- `staging.players`

`staging.team_match_stats` pode existir, mas como o agregado e derivado, a preferencia inicial e recalcula-lo dentro do pipeline a partir de `staging.player_match_stats`.

## Estrategia de identidade

### Regra geral

- toda tabela canonica tera `id` interno do projeto
- o `id` interno nao deve depender do identificador externo
- toda identidade de ingestao deve ser rastreavel por `source_ref` ou `source_*_id`

### Entidades simples

Entidades simples usam `source_ref` como chave principal de origem.

Grupo:

- countries
- cities
- stadiums
- referees
- managers
- teams
- players
- tournaments
- seasons
- matches

Regra:

- `source_ref` deve ser mantido em `core.*`
- `upsert` deve usar `source_ref`

### Entidades relacionais

Entidades relacionais usam colunas explicitas `source_*_id`.

Grupo:

- lineups
- player_match_stats
- team_match_stats
- events
- player_career_teams

Regra:

- `upsert` nao deve depender de `source_ref` composto opaco
- as colunas de origem devem permanecer separadas

## Chaves naturais iniciais de `upsert`

Estas chaves foram confirmadas a partir do comportamento atual dos storages.

| Entidade | Chave natural inicial |
| --- | --- |
| countries | `source_ref` |
| cities | `source_ref` |
| stadiums | `source_ref` |
| tournaments | `source_ref` |
| seasons | `source_ref` |
| referees | `source_ref` |
| managers | `source_ref` |
| teams | `source_ref` |
| players | `source_ref` |
| matches | `source_ref` |
| lineups | `source_match_id + source_team_id + source_player_id` |
| player_match_stats | `source_match_id + source_team_id + source_player_id` |
| team_match_stats | `source_match_id + source_team_id` |
| events | `source_match_id + source_incident_id` |
| player_career_teams | `source_player_id + source_team_id` |

## Relacionamentos canonicos principais

### Cadastros

- `cities.country -> countries.id`
- `stadiums.city -> cities.id`
- `tournaments.country -> countries.id`
- `seasons.tournament -> tournaments.id`
- `referees.country -> countries.id`
- `managers.country -> countries.id`
- `teams.stadium -> stadiums.id`
- `players.country -> countries.id`

### Partidas

- `matches.tournament -> tournaments.id`
- `matches.season -> seasons.id`
- `matches.stadium -> stadiums.id`
- `matches.referee -> referees.id`
- `matches.home_team -> teams.id`
- `matches.away_team -> teams.id`
- `matches.home_manager -> managers.id`
- `matches.away_manager -> managers.id`

### Lineups e stats

- `lineups.match -> matches.id`
- `lineups.team -> teams.id`
- `lineups.player -> players.id`
- `player_match_stats.match -> matches.id`
- `player_match_stats.team -> teams.id`
- `player_match_stats.player -> players.id`
- `team_match_stats.match -> matches.id`
- `team_match_stats.team -> teams.id`

### Eventos

- `events.match -> matches.id`
- `events.team -> teams.id`
- `events.player -> players.id`
- `events.related_player -> players.id`
- `events.manager -> managers.id`

### Relacao jogador-clube

- `player_career_teams.player -> players.id`
- `player_career_teams.team -> teams.id`

## Regras de negocio confirmadas que devem virar validacao

### Regras relacionais

- `lineups` deve relinkar `match`, `team` e `player` para IDs internos
- `player_match_stats` deve apontar para contexto existente em `lineups`
- `team_match_stats` deve ser recalculado a partir de `player_match_stats`
- `events` deve referenciar apenas players, managers e teams validos

### Regras semanticas

- eventos de substituicao devem ter `related_player`
- eventos de gol devem carregar placar
- `ownGoal` exige tratamento especial do `team`
- eventos de manager so valem para `home_manager` e `away_manager`
- `lineups` usa lado `home/away` como definicao principal do time

## Auditoria e legado

### Estado desejado

O padrao preferido para entidades novas ou migradas e:

- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

### Estado atual observado

Os CSVs ainda nao estao 100% homogeneos.

Exemplos confirmados:

- `countries`, `cities`, `matches`, `player_career_teams`, `teams` usam auditoria completa
- `events`, `lineups`, `player_match_stats`, `team_match_stats` ainda carregam `edited`
- `referees`, `seasons`, `stadiums`, `tournaments` ainda possuem headers legados diferentes

Decisao de contrato:

- `core.*` deve convergir para auditoria consistente
- a Fase 1 precisa tratar headers legados como bootstrap, nao como contrato futuro

## Tabelas operacionais que ja entram no contrato

Mesmo sem implementacao imediata, estas tabelas ja fazem parte do contrato da plataforma:

### `ingestion_runs`

Finalidade:

- registrar execucoes
- guardar status, contagens, warnings e erros

### `planned_matches`

Finalidade:

- registrar partidas futuras cadastradas manualmente
- guardar `provider_event_id`
- ligar ao `core_match_id` depois do primeiro scrape bem-sucedido

### `scheduled_scrapes`

Finalidade:

- registrar passes agendados por partida
- controlar `status`, `pass_number` e `run_id`

## Primeiros modelos de leitura que o schema precisa atender

Para evitar schema desalinhado com consumo futuro, estes modelos entram desde ja como referencia de design:

- contexto de equipe
- contexto de partida
- contexto de jogador
- busca global

Primeiras entidades focais:

- `teams`
- `matches`
- `players`

Primeiras dimensoes opcionais esperadas:

- `opponent`
- `referee`
- `season`
- `tournament`
- `team`

## Inconsistencias e decisoes abertas que precisam continuar visiveis

### Inconsistencias confirmadas

- alguns CSVs ainda possuem headers legados e campos antigos como `translated` e `edited`
- nem todas as entidades simples usam hoje o mesmo nivel de espelhamento `source_*`
- `team_match_stats` e derivado, o que impacta a necessidade de staging proprio

### Decisoes abertas

- quais tabelas de `raw.*` entram ja no primeiro ciclo
- quais entidades terao `editorial.*` desde a primeira entrega
- quanto do `read.*` vira `view` e quanto fica inicialmente na camada da API

## Resultado desta rodada da Fase 0

Este documento fecha a primeira camada do contrato em torno de:

- lista inicial de entidades
- papel dos schemas
- chaves naturais de `upsert`
- relacionamentos centrais
- regras de validacao mais importantes
- ponto de atencao para legado

O proximo passo natural dentro da Fase 0 e detalhar:

- desenho tabular inicial de `core.*`
- desenho tabular inicial de `staging.*`
- constraints obrigatorias por entidade
- classificacao entre erro bloqueante e warning operacional
