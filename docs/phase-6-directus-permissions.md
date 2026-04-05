# Permissoes e fronteiras do Directus na Fase 6

Veja tambem: `docs/phase-6-plan-directus.md`

## Papel do `directus_app`

O `Directus` conecta ao banco com um usuario dedicado:

- usuario: `directus_app`
- senha: `directus_app`

Esse usuario existe apenas para desenvolvimento local na Fase 6.

## Schemas visiveis

- `public`
  - schema das tabelas internas do CMS nesta iteracao
  - schema das superficies operacionais `panel_*`
- `core`
  - leitura geral
- `editorial`
  - leitura dos overrides canonicos

## Schemas fora de edicao

- `raw.*`
  - fora do escopo desta fase
- `staging.*`
  - sem edicao
- `ops.*`
  - sem edicao

## Superficies operacionais da fase

Na implementacao validada da Fase 6, o painel escreve nestas colecoes do `public`:

- `panel_states`
- `panel_team_overrides`

Essas colecoes sincronizam para:

- `core.states`
- `editorial.team_overrides`

A sincronizacao acontece por triggers `SECURITY DEFINER`.

## Regra para `editorial.*`

Toda nova necessidade de override deve preferir `editorial.*` em vez de multiplicar excecoes em `core.*`.

## Guardrails

- ingestao continua passando apenas pelo pipeline do scraper
- `Directus` nao substitui `staging.*`
- `Directus` nao deve operar `scheduled_scrapes` nem `ingestion_runs`
- o `directus_app` nao recebe escrita ampla em `core.*` nem `editorial.*`
- a permissao de banco reforca a fronteira mesmo que o painel seja mal configurado
