# Sofascore Data Model

## Visao geral

Os CSVs do scraper sao a camada canonica atual de persistencia local.

Regras gerais:

- `id` e interno ao projeto
- entidades simples usam `source_ref` para preservar a referencia original do Sofascore
- tabelas relacionais usam colunas explicitas `source_*_id`
- `source` identifica o provedor do registro
- relacionamentos finais devem apontar para IDs internos sempre que possivel
- campos sem informacao ficam em branco
- a leitura dos CSVs deve preservar colunas quoted com `;` literal e aspas escapadas
- os CSVs mais novos usam auditoria com:
  - `first_scraped_at`
  - `last_scraped_at`
  - `created_at`
  - `updated_at`

## Convencoes de origem

- quando o payload tem ID explicito do Sofascore:
  - em entidades simples, ele tende a virar `source_ref`
  - em tabelas relacionais, ele tende a ser separado em colunas como `source_match_id`, `source_team_id`, `source_player_id` e `source_incident_id`
- quando nao ha ID explicito:
  - preferir `slug`
  - se nao houver `slug`, usar `name`
- em entidades com colunas `source_*`, o dado canonico pode divergir do bruto da origem quando houver ajuste manual futuro

## Entidades base

### countries.csv

- paises usados por torneios, estadios, arbitros, managers e players

### cities.csv

- cidades relacionadas principalmente a estadios

### stadiums.csv

- estadio vinculado a uma cidade

### tournaments.csv

- torneio base da competicao

### seasons.csv

- temporada vinculada ao torneio

### referees.csv

- arbitros da partida

### managers.csv

- apenas managers principais vindos do endpoint base do evento

### teams.csv

- times participantes, com estadio e cores

### players.csv

- cadastro basico de atletas

### matches.csv

- registro central da partida, com placares por periodo e formacoes

## Entidades da partida

### lineups.csv

Campos principais:

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

Notas:

- `is_missing=true` identifica itens vindos de `missingPlayers`
- `slot` e calculado para titulares com base em `formation + average-positions`
- o time e definido pelo lado `home/away` do bloco da lineup, nao pelo `teamId` isolado do item
- a origem da relacao fica explicita em `source_match_id`, `source_team_id` e `source_player_id`
- esta tabela ainda esta em migracao para o modelo completo de auditoria

### player-match-stats.csv

- contem estatisticas individuais vindas de `lineups.statistics`
- uma linha so e criada quando existe objeto `statistics`
- campos ausentes ficam em branco
- a origem da relacao fica explicita em `source_match_id`, `source_team_id` e `source_player_id`
- esta tabela ainda esta em migracao para o modelo completo de auditoria

### player-career-teams.csv

Campos principais:

- `player`
- `team`
- `source_player_id`
- `source_team_id`

Notas:

- registra apenas a relacao basica entre jogador e clube
- nao tenta inferir periodo de passagem
- nasce das relacoes `player + team` observadas durante o scrape, principalmente em `lineups`
- preserva separadamente os ids brutos de jogador e time da origem
- serve para responder se o atleta ja atuou por um clube

### team-match-stats.csv

- agregado derivado de `player-match-stats`
- soma metricas acumulativas
- faz media em campos de nota e valores normalizados
- a origem da relacao fica explicita em `source_match_id` e `source_team_id`
- esta tabela ainda esta em migracao para o modelo completo de auditoria

### events.csv

Schema atual:

```text
id;match;sort_order;team;player;related_player;manager;incident_type;incident_class;period;minute;added_time;reversed_period_time;is_home;impact_side;is_confirmed;is_rescinded;reason;description;is_injury;home_score;away_score;length;body_part;goal_type;situation;shot_type;player_x;player_y;pass_end_x;pass_end_y;shot_x;shot_y;goal_mouth_x;goal_mouth_y;goalkeeper_x;goalkeeper_y;source_match_id;source_incident_id;source;...
```

Interpretacao:

- `incident_type` e o tipo principal do evento
- `incident_class` e o subtipo
- `player` e o ator principal
- `related_player` varia por evento:
  - assistente em gol
  - jogador que saiu na substituicao
- `team` representa o contexto do evento
- `impact_side` indica quem foi favorecido
- a origem do evento fica explicita em `source_match_id` e `source_incident_id`

## Casos especiais documentados

### Own goal

- `player` aponta para o autor do gol contra
- `team` e invertido no relink para ficar consistente com o time do autor
- `impact_side` continua apontando para o lado beneficiado

### Manager cards

- eventos de manager so permanecem se o manager for exatamente o `home_manager` ou `away_manager` da partida
- eventos de staff/comissao fora desses dois sao descartados

### Period e injuryTime

- alguns incidents nao possuem `id` nativo
- nesses casos, o scraper cria `source_incident_id` sintetico para nao perder o evento
