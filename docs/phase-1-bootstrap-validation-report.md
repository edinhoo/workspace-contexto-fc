# Relatorio de Validacao da Fase 1

## Execucao

- run_id: `phase1-c71de575-b13c-4acc-8ed3-fb88dd5c625d`
- status: `completed`
- started_at: `2026-04-05 10:10:42.534+00`
- finished_at: `2026-04-05 10:10:42.666181+00`
- rows_inserted: `354`

## Contagens staging vs core

| Entidade | Staging | Core |
| --- | ---: | ---: |
| countries | 8 | 8 |
| states | 0 | 0 |
| cities | 2 | 2 |
| stadiums | 2 | 2 |
| tournaments | 1 | 1 |
| seasons | 1 | 1 |
| referees | 1 | 1 |
| managers | 2 | 2 |
| teams | 105 | 105 |
| players | 53 | 53 |
| matches | 1 | 1 |
| lineups | 53 | 53 |
| player_match_stats | 46 | 46 |
| team_match_stats | 2 | 2 |
| events | 24 | 24 |
| player_career_teams | 53 | 53 |

## Checks principais

| Check | Resultado |
| --- | ---: |
| matches com home/away invalidos | 0 |
| lineups sem match/team/player | 0 |
| player_match_stats sem contexto | 0 |
| events sem match valido | 0 |
| events com team invalido | 0 |
| events com player invalido | 0 |
| events com related_player invalido | 0 |
| events com manager invalido | 0 |
| countries com source_ref duplicado | 0 |
| cities com source_ref duplicado | 0 |
| teams com source_ref duplicado | 0 |
| players com source_ref duplicado | 0 |
| matches com source_ref duplicado | 0 |
| stadiums com capacity invalida | 0 |
| stadiums com coordenadas invalidas | 0 |
| matches com scores invalidos | 0 |
| lineups com metricas invalidas | 0 |

## Observacoes

- `core.states` permanece vazio na Fase 1, conforme esperado, porque nao existe fonte CSV atual para esse cadastro.
- O bootstrap passou por `staging.*` antes de promover para `core.*`.
- `team_match_stats` foi carregado do CSV atual nesta fase, conforme a decisao baseline da V1.
- A validacao agora cobre unicidade de `source_ref` nas entidades principais e checks semanticos basicos de estadio, placar e lineup.
