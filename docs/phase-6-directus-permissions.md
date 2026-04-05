# Permissoes e fronteiras do Directus na Fase 6

Veja tambem: `docs/phase-6-plan-directus.md`

## Papel do `directus_app`

O `Directus` conecta ao banco com um usuario dedicado:

- usuario: `directus_app`
- senha: `directus_app`

Esse usuario existe apenas para desenvolvimento local na Fase 6.

## Schemas visiveis

- `directus`
  - schema interno do CMS
  - leitura e escrita para as tabelas de sistema do Directus
- `core`
  - leitura geral
  - escrita excepcional apenas em `core.states`
- `editorial`
  - leitura e escrita para overrides controlados

## Schemas fora de edicao

- `raw.*`
  - fora do escopo desta fase
- `staging.*`
  - sem edicao
- `ops.*`
  - sem edicao

## Regra de excecao em `core.*`

Na primeira iteracao, a unica excecao de escrita direta em `core.*` e:

- `core.states`

Permissoes:

- `select`
- `insert`
- `update`

Nao entra nesta frente:

- escrita manual em tabelas alimentadas pelo scraper
- abertura ampla de CRUD em `core.*`

## Regra para `editorial.*`

Toda nova necessidade de override deve preferir `editorial.*` em vez de multiplicar excecoes em `core.*`.

## Guardrails

- ingestao continua passando apenas pelo pipeline do scraper
- `Directus` nao substitui `staging.*`
- `Directus` nao deve operar `scheduled_scrapes` nem `ingestion_runs`
- a permissao de banco reforca a fronteira mesmo que o painel seja mal configurado
