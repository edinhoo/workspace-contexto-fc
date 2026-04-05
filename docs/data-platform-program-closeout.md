# Encerramento do Plano da Plataforma de Dados

Veja tambem: `docs/implementation-plan-data-platform.md`
Veja tambem: `docs/next-services-architecture.md`
Veja tambem: `docs/phase-7-closeout.md`

## Status

Plano original de 7 fases concluido.

## Objetivo original

Transformar a arquitetura descrita em `docs/next-services-architecture.md` em uma base operacional real, com banco, ingestao, API, automacao e trilha editorial validados em etapas pequenas.

## O que foi concluido

### Fundacao de dados

- `PostgreSQL` como base principal de persistencia
- contrato de dados fechado antes da implementacao
- schema canônico organizado em `core.*`, com apoio de `staging.*`, `ops.*` e `editorial.*`

### Ingestao e pipeline

- ingestao segura via `staging.* -> validacao -> core.*`
- `ops.ingestion_runs` e `ops.ingestion_run_details` como trilha de auditoria
- scraper escrevendo no banco sem depender de CSV operacional
- contrato estavel entre scraper e scheduler com `SCRAPE_RESULT {json}`

### Leitura e consumo

- `services/data-api` inicial entregue com contextos compostos
- leituras principais servidas a partir de `core.*`
- `read.*` mantido fora do escopo por falta de necessidade real

### Automacao e operacao

- automacao orientada a partidas com `planned_matches` e `scheduled_scrapes`
- scheduler serial validado e endurecido para claim concorrente seguro
- `warnings` com uso operacional concreto

### Camada editorial

- `Directus` local validado como interface operacional
- superfícies controladas `panel_*`
- overrides editoriais e manutencao manual provados sem abrir escrita ampla no canônico

## O que ficou melhor do que o plano inicial

- a migracao do scraper para o banco foi feita com uma camada nova de writer, preservando a normalizacao existente
- `read.*` e `raw.*` nao foram materializados sem necessidade real
- a Fase 7 fechou as tres maiores dividas acumuladas:
  - contrato estavel do scraper
  - concorrencia segura no scheduler
  - warnings com papel util

## Desvios conscientes

- o `Directus` ficou mais estavel com tabelas internas no `public`, apoiado por superfícies `panel_*`, em vez de schema dedicado
- `core.states` permaneceu como cadastro manual e controlado, nao como entidade populada pelo scraper

## O que sobra a partir daqui

O que resta nao sao fases fundacionais pendentes. Sao evolucoes incrementais sobre uma base ja estavel:

- processo residente para o scheduler
- ampliacao de `warnings`
- aplicacao de overrides editoriais na `data-api`
- introducao de uma segunda fonte por adaptador para `staging.*`
- observabilidade e operacao mais profundas

## Conclusao

O plano de 7 fases terminou com a fundacao da plataforma entregue e auditavel.

O projeto deixa de estar em modo de implantacao estrutural e passa a estar em modo de evolucao incremental, sem necessidade de reescrita do desenho central.
