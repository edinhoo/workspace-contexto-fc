# Scraper Decisions

## Papel do scraper

O scraper nao e o modelo final de backend.

Ele existe para:

- capturar os dados relevantes do Sofascore
- estruturar a informacao em entidades coerentes
- preservar rastreabilidade com `source_ref`
- permitir validacao manual e evolucao posterior

## Endpoints e papeis

### `/api/v1/event/{eventId}`

- endpoint base da partida
- dele saem os cadastros e o contexto principal do jogo
- abastece:
  - countries
  - cities
  - stadiums
  - tournaments
  - seasons
  - referees
  - managers
  - teams
  - players
  - matches

### `/api/v1/event/{eventId}/lineups`

- traz jogadores relacionados a partida
- inclui titulares, reservas, missingPlayers e estatisticas individuais
- abastece:
  - lineups
  - player-match-stats

### `/api/v1/event/{eventId}/average-positions`

- complementa lineups com posicao media em campo
- usado principalmente para calcular `slot`

### `/api/v1/event/{eventId}/incidents`

- timeline principal da partida
- abastece events com:
  - goals
  - cards
  - substitutions
  - period
  - injuryTime
  - varDecision
  - inGamePenalty

### `/api/v1/event/{eventId}/shotmap`

- enriquecimento de finalizacoes
- nao substitui `incidents`
- complementa events com:
  - `shot_type`
  - `situation`
  - `body_part`
- `goal_type`
- coordenadas do lance

## Regras de modelagem adotadas

### 1. Campos ausentes ficam em branco

Nao zerar artificialmente campos que nao vieram no payload.

Motivo:

- preserva a diferenca entre `zero real` e `nao informado`

### 2. `lineups` usa lado home/away como fonte principal do time

Nao confiar no `teamId` isolado de cada item.

Motivo:

- alguns itens de `missingPlayers` podem vir com IDs que nao representam o time canonico da partida
- o bloco `home` e `away` do endpoint e mais confiavel

### 3. `team-match-stats` e derivado, nao coletado

Motivo:

- evita endpoint adicional
- mantem coerencia com `player-match-stats`

### 4. `events` usa `incidents` como timeline principal

`shotmap` e enriquecimento, nao timeline base.

Motivo:

- `incidents` cobre gols, cartoes, substituicoes, VAR, periodos e acrescimos
- `shotmap` e especializado em finalizacoes

### 5. `events` aceita um unico CSV amplo

Campos nao aplicaveis ficam vazios.

Motivo:

- simplifica inspecao
- evita dividir muito cedo o modelo em tabelas especializadas

### 6. `goal_type` pode ser enriquecido por `shotmap`

Exemplo:

- gol de falta pode aparecer como `incident_class=regular` em `incidents`
- mas `shotmap.situation=free-kick`
- nesse caso, a tipagem consolidada do gol pode refletir `free-kick`

### 7. `footballPassingNetworkAction` nao e achatado por completo

Apenas campos derivados relevantes entram no CSV principal.

Motivo:

- o bloco pode variar muito
- ele tem granularidade de subacao, nao de evento principal

### 8. `impact_side` e diferente de `is_home`

- `is_home` informa o lado do evento
- `impact_side` informa quem foi favorecido

Exemplo:

- cartao para o mandante:
  - `is_home=true`
  - `impact_side=away`

### 9. `source_ref` substitui `source_id`

- a referencia da origem deve ficar em `source_ref`
- quando nao houver ID explicito, preferir:
  - `slug`
  - depois `name`

### 10. auditoria substitui `edited` e `translated` nos CSVs novos

Nos CSVs que ja migraram, usar:

- `first_scraped_at`
- `last_scraped_at`
- `created_at`
- `updated_at`

Esses campos registram:

- primeiro momento em que o registro apareceu
- ultima vez em que foi visto pelo scraper
- data de criacao do registro local
- data da ultima alteracao efetiva do registro local

### 11. campos canonicos com espelho `source_*` nao devem ser sobrescritos cegamente

Regra:

- se o valor canonico atual ainda for igual ao `source_*` anterior
- e o novo valor da origem for diferente
- entao o valor canonico pode ser atualizado

Motivo:

- preservar possiveis ajustes manuais futuros sem perder a origem bruta

### 12. historico de clubes do jogador fica reduzido a relacao jogador-clube

Regra:

- o scraper observa as relacoes `player + team` que ja apareceram nos dados coletados
- a origem principal dessa relacao hoje e `lineups`
- o scraper nao tenta inferir inicio ou fim de passagem
- a tabela final guarda apenas se aquele jogador apareceu associado ao clube

Motivo:

- isso evita depender de endpoint adicional
- a relacao simples jogador-clube e segura e util

## Regras de consistencia atuais

- `lineups`, `player-match-stats`, `events` e `matches` devem relinkar para IDs internos
- `player-match-stats` deve ter contexto correspondente em `lineups`
- `team-match-stats` deve ser recalculado a partir do estado final de `player-match-stats`
- `events` de substituicao devem ter `related_player`
- `events` de gol devem carregar placar

## Validacoes que ja se mostraram importantes

- verificar se existem times crus remanescentes em `lineups` e `player-match-stats`
- verificar se `events` referencia apenas players e managers validos
- tratar `ownGoal` como excecao semantica no cruzamento
- ignorar eventos de comissao nao principal
- ao migrar schema, preferir rebuild limpo dos CSVs quando o legado atrapalhar a leitura correta

## Quando atualizar esta documentacao

Atualize estes docs sempre que houver mudanca em:

- schema de CSV
- regra de relink
- criterio de deduplicacao
- criterio de enriquecimento por `shotmap`
- validacao cruzada entre entidades
