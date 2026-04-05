# Primeira camada editorial da Fase 6

Veja tambem: `docs/phase-6-plan-directus.md`
Veja tambem: `docs/phase-6-directus-permissions.md`

## Objetivo

Introduzir uma primeira tabela `editorial.*` pequena e concreta, sem antecipar uma estrategia de override genérica demais.

## Tabela inicial

`editorial.team_overrides`

Campos:

- `id`
- `team`
- `public_slug`
- `public_label`
- `is_published`
- `notes`
- `created_at`
- `updated_at`

## Papel da tabela

Essa tabela existe para guardar ajustes pequenos de apresentacao e publicacao que:

- nao devem sobrescrever o valor bruto ou canônico em `core.teams`
- podem ser mantidos manualmente por operacao/editorial
- poderao ser aplicados pela API em fase futura, se fizer sentido

## O que ela nao faz

- nao substitui a ingestao
- nao recria o modelo inteiro de `core.teams`
- nao entra automaticamente na resposta da API nesta fase

## Decisao de uso na Fase 6

- o primeiro caso provado no painel passa por `panel_states`, com sincronizacao para `core.states`
- `panel_team_overrides` entra como superficie operacional sincronizada para `editorial.team_overrides`
- a aplicacao dos overrides em leitura fica como decisao posterior, documentada no encerramento da fase
