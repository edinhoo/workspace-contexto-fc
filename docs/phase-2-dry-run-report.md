# Relatorio de Dry-Run da Fase 2

## Execucao

- run_id: `phase2-dry-run-377f63b8-7487-4cf2-847c-c59fae483b95`
- status: `dry-run`
- rows_inserted: `0`
- rows_updated: `130`
- rows_skipped: `224`

## Detalhes por entidade

| Entidade | Seen | Valid | Invalid | Inserted | Updated | Skipped |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cities | 2 | 2 | 0 | 0 | 0 | 2 |
| countries | 8 | 8 | 0 | 0 | 0 | 8 |
| events | 24 | 24 | 0 | 0 | 24 | 0 |
| lineups | 53 | 53 | 0 | 0 | 53 | 0 |
| managers | 2 | 2 | 0 | 0 | 0 | 2 |
| matches | 1 | 1 | 0 | 0 | 0 | 1 |
| player_career_teams | 53 | 53 | 0 | 0 | 0 | 53 |
| player_match_stats | 46 | 46 | 0 | 0 | 46 | 0 |
| players | 53 | 53 | 0 | 0 | 0 | 53 |
| referees | 1 | 1 | 0 | 0 | 1 | 0 |
| seasons | 1 | 1 | 0 | 0 | 1 | 0 |
| stadiums | 2 | 2 | 0 | 0 | 2 | 0 |
| team_match_stats | 2 | 2 | 0 | 0 | 2 | 0 |
| teams | 105 | 105 | 0 | 0 | 0 | 105 |
| tournaments | 1 | 1 | 0 | 0 | 1 | 0 |

## Observacoes

- este relatorio foi gerado com `rollback` explicito ao final da transacao
- `core.*` nao foi alterado por esta execucao
