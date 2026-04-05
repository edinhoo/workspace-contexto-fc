# Decisoes Para Validacao - Fase 0

## Objetivo

Separar claramente:

- o que ja foi pesquisado e mapeado
- o que ainda depende de aceite explicito antes de considerar a Fase 0 fechada

Este documento nao reexplica toda a arquitetura. Ele resume apenas as decisoes que precisam de curadoria.

## Decisoes que precisam de aceite

### 1. Chaves naturais de `upsert`

Estado atual proposto:

- entidades simples usam `source_ref`
- entidades relacionais usam combinacoes de `source_*_id`
- `states` usa `country + slug`

Precisa validar:

- se esse criterio representa corretamente a identidade de negocio esperada
- se existe alguma entidade que precisa de chave mais conservadora

### 2. `states` como entidade estrutural

Estado atual proposto:

- `core.states` entra ja na primeira migration
- `core.cities.state` entra como FK opcional
- `states` nao vem do scraper
- `states` pode ser mantido manualmente, futuramente via `Directus`

Precisa validar:

- se `states` realmente deve existir em `core.*`
- se `cities.state` deve entrar agora ou num passo posterior

### 3. `ops.*` para tabelas operacionais

Estado atual proposto:

- `ops.ingestion_runs`
- `ops.planned_matches`
- `ops.scheduled_scrapes`

Precisa validar:

- se a separacao entre dominio canonico e operacao da plataforma esta do jeito desejado

### 4. `jsonb` para stats na V1

Estado atual proposto:

- `core.player_match_stats.stat_payload jsonb`
- `core.team_match_stats.stat_payload jsonb`

Precisa validar:

- se a prioridade atual e velocidade e seguranca da primeira migration
- ou se vale o custo de abrir colunas desde o inicio

### 5. Rigidez inicial das FKs

Estado atual proposto:

- FKs estaveis entram obrigatorias na primeira migration
- FKs com legado irregular ou preenchimento manual entram opcionais

Exemplos de opcionais propostos:

- `cities.state`
- `teams.stadium`
- `matches.stadium`
- `matches.referee`
- `matches.home_manager`
- `matches.away_manager`
- `events.team`
- `events.player`
- `events.related_player`
- `events.manager`

Precisa validar:

- se esse nivel inicial de rigidez faz sentido para o bootstrap
- se alguma dessas FKs deve subir de nivel ja na V1

### 6. `staging.*` hibrido

Estado atual proposto:

- entidades simples em formato mais tabular
- entidades largas com `payload jsonb`

Precisa validar:

- se esse equilibrio esta bom para a primeira migration
- ou se voce prefere padronizar mais cedo

### 7. Equivalencia entre bootstrap e ingestao futura

Estado atual proposto:

- comparar integridade relacional
- comparar contagens
- comparar regras de negocio principais
- usar equivalencia semantica, nao igualdade literal cega

Precisa validar:

- o que o projeto vai considerar “equivalente o bastante”
- quais divergencias sao aceitaveis e quais bloqueiam a migracao

## Decisoes que ja parecem suficientemente estaveis

Estas decisoes ja estao bem sustentadas pelo que foi lido no scraper e nos CSVs:

- `staging.*` como porta de entrada da ingestao
- `core.*` como camada canonica promovida
- fim do CSV como intermediario operacional permanente
- bootstrap com CSVs atuais como etapa unica de validacao
- `team_match_stats` como dado derivado
- `Directus` entrando depois, nao antes do pipeline seguro

## Recomendacao de fechamento da Fase 0

A Fase 0 pode ser considerada realmente fechada quando houver aceite explicito sobre:

1. chaves de `upsert`
2. modelagem de `states`
3. schema `ops.*`
4. `jsonb` para stats na V1
5. rigidez inicial das FKs
6. criterio de equivalencia entre bootstrap e ingestao futura

## Referencias

- `docs/data-platform-contract.md`
- `docs/data-platform-schema-design.md`
- `docs/data-platform-constraints-matrix.md`
- `docs/data-platform-ddl-review.md`
- `docs/data-platform-ddl-v1.md`
