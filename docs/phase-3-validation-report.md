# Relatorio de Validacao da Fase 3

Veja tambem: `docs/phase-3-plan-scraper-to-db.md`
Veja tambem: `docs/phase-3-integration-decision.md`
Veja tambem: `docs/phase-2-validation-report.md`

## Recorte validado

A validacao da Fase 3 foi feita com um recorte fixo e reproduzivel:

- `eventId`: `15237889`
- target de persistencia: `db`
- banco local reiniciado em volume limpo antes da execucao

Esse recorte foi mantido fixo para evitar comparacao ambigua contra estado ao vivo irrestrito.

## Execucao realizada

Passos executados:

- `docker compose -f infra/docker/docker-compose.yml down -v`
- `docker compose -f infra/docker/docker-compose.yml up -d postgres`
- `pnpm db:migrate`
- `pnpm --filter @services/sofascore build`
- `pnpm --filter @services/sofascore scrape --target=db 15237889`
- segunda execucao do mesmo comando para validar idempotencia

## Resultado do primeiro run do scraper no banco

- `run_id`: `phase3-3326a1a9-e70e-4968-9f4f-685b590cbe55`
- status: `completed`
- `rows_inserted`: `251`
- `rows_updated`: `0`
- `rows_skipped`: `0`

### Detalhes por entidade

- `countries`: `8` vistos, `8` validos, `8` inseridos
- `cities`: `2` vistas, `2` validas, `2` inseridas
- `stadiums`: `2` vistos, `2` validos, `2` inseridos
- `tournaments`: `1` visto, `1` valido, `1` inserido
- `seasons`: `1` vista, `1` valida, `1` inserida
- `referees`: `1` visto, `1` valido, `1` inserido
- `managers`: `2` vistos, `2` validos, `2` inseridos
- `teams`: `2` vistos, `2` validos, `2` inseridos
- `players`: `53` vistos, `53` validos, `53` inseridos
- `matches`: `1` vista, `1` valida, `1` inserida
- `lineups`: `53` vistas, `53` validas, `53` inseridas
- `player_match_stats`: `46` vistos, `46` validos, `46` inseridos
- `team_match_stats`: `2` vistos, `2` validos, `2` inseridos
- `events`: `24` vistos, `24` validos, `24` inseridos
- `player_career_teams`: `53` vistos, `53` validos, `53` inseridos

## Resultado do segundo run com o mesmo lote

- `run_id`: `phase3-74a260f0-0747-40ab-a5f0-d453a2ae5db3`
- status: `completed`
- `rows_inserted`: `0`
- `rows_updated`: `0`
- `rows_skipped`: `251`

Interpretacao:

- nao houve duplicidade estrutural
- o mesmo lote foi reconhecido como semanticamente equivalente
- o diff deixou de marcar updates apenas por `last_scraped_at` e `updated_at`

## Comparacao com a referencia conhecida

No `core.*` resultante do primeiro run:

- `matches`: `1`
- `lineups`: `53`
- `player_match_stats`: `46`
- `team_match_stats`: `2`
- `events`: `24`

Essas contagens batem com o recorte validado anteriormente na Fase 1/Fase 2 para esse conjunto principal de entidades da partida.

## Observacoes sobre raw processed counts

Durante a execucao do scraper, os logs de processamento bruto mostraram:

- `countries processados: 10`
- `events processados: 26`

No lote final promovido, esses conjuntos ficaram em:

- `countries`: `8`
- `events`: `24`

Isso e esperado neste desenho porque:

- o scraper observa mais itens brutos ao longo do pipeline
- o snapshot normalizado consolida duplicidades e descartes ja previstos pelas regras do dominio

## Decisao sobre warnings na Fase 3

Nesta fase, a decisao adotada foi:

- manter apenas erros bloqueantes como requisito operacional
- nao introduzir `warnings` novos sem criterio claro de uso

Consequencia:

- `warnings` continua sem populacao relevante nos runs desta fase
- a trilha oficial de bloqueio continua sendo `validation_errors`

## Conclusao

A Fase 3 validou com sucesso que:

- o scraper escreve no banco sem CSV intermediario obrigatorio
- a validacao e a promocao sao acionadas a partir da execucao real do scraper
- duplicidade de identidade pode falhar cedo antes da promocao
- o diff do segundo run fica semanticamente mais legivel
- o resultado final do recorte testado bate com a referencia conhecida
