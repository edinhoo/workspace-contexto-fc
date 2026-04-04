# Sofascore Data Model

## Visao geral

Os CSVs do scraper sao a camada canonica atual de persistencia local.

Regras gerais:

- `id` e interno ao projeto
- `source_id` preserva a referencia original do Sofascore
- relacionamentos finais devem apontar para IDs internos sempre que possivel
- campos sem informacao ficam em branco

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

### player-match-stats.csv

- contem estatisticas individuais vindas de `lineups.statistics`
- uma linha so e criada quando existe objeto `statistics`
- campos ausentes ficam em branco

### team-match-stats.csv

- agregado derivado de `player-match-stats`
- soma metricas acumulativas
- faz media em campos de nota e valores normalizados

### events.csv

Schema atual:

```text
id;match;sort_order;team;player;related_player;manager;incident_type;incident_class;period;minute;added_time;reversed_period_time;is_home;impact_side;is_confirmed;is_rescinded;reason;description;is_injury;home_score;away_score;length;body_part;goal_type;situation;shot_type;player_x;player_y;pass_end_x;pass_end_y;shot_x;shot_y;goal_mouth_x;goal_mouth_y;goalkeeper_x;goalkeeper_y;source_id;source;edited
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
- nesses casos, o scraper cria `source_id` sintetico para nao perder o evento

