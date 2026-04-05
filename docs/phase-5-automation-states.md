# Estados operacionais da Fase 5

Veja tambem: `docs/phase-5-plan-scrape-automation.md`

## `ops.planned_matches`

### Estados

- `planned`
  - partida futura cadastrada e com agenda ativa
- `linked`
  - o primeiro scrape bem-sucedido ja vinculou a partida a `core.matches`
- `cancelled`
  - a partida planejada foi cancelada operacionalmente

### Transicoes

- `planned -> linked`
  - ocorre quando um `scheduled_scrape` concluido encontra ou gera o `core_match_id`
- `planned -> cancelled`
  - ocorre quando a partida planejada e cancelada
- `linked -> cancelled`
  - permitido apenas como decisao operacional explicita

## `ops.scheduled_scrapes`

### Estados

- `pending`
  - passe agendado e elegivel para execucao quando `scheduled_for <= now()`
- `running`
  - scheduler iniciou a execucao
- `done`
  - scrape executado com sucesso e vinculado a um `run_id`
- `failed`
  - scrape falhou e nao deve mais entrar em retry automatico
- `cancelled`
  - scrape foi invalidado por remarcacao ou cancelamento operacional

### Transicoes

- `pending -> running`
  - scheduler reserva o item antes de chamar o scraper
- `running -> done`
  - scraper conclui e a execucao fica vinculada a `ops.ingestion_runs`
- `running -> pending`
  - apenas para falha operacional com retry automatico ainda disponivel
- `running -> failed`
  - falha bloqueante de validacao ou esgotamento das tentativas automaticas
- `pending -> cancelled`
  - remarcacao ou cancelamento antes da execucao

## Regras operacionais fechadas

- retries automaticos: no maximo `2`
- retry automatico: apenas para falha operacional
- falha de validacao bloqueante: vai direto para `failed`
- remarcacao: cancela apenas scrapes futuros pendentes e regenera a agenda
- execucao: serial, um lote por vez

## Cadeia de rastreabilidade

O caminho minimo de investigacao da automacao fica:

`planned_match_id -> scheduled_scrape_id -> run_id -> ops.ingestion_runs`
