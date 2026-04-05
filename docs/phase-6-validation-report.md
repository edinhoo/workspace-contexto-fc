# Relatorio de Validacao da Fase 6

Veja tambem: `docs/phase-6-plan-directus.md`
Veja tambem: `docs/phase-6-directus-local-setup.md`
Veja tambem: `docs/phase-6-directus-operations.md`

## Objetivo da validacao

Confirmar que o `Directus`:

- sobe localmente no mesmo `PostgreSQL`
- registra as colecoes operacionais da fase
- permite ajustes reais sem SQL manual
- sincroniza esses ajustes para `core.*` e `editorial.*`
- nao interfere na ingestao nem na API existente

## Sequencia executada

```bash
docker compose -f infra/docker/docker-compose.yml down -v
pnpm docker:up
pnpm db:migrate
pnpm --filter @services/sofascore scrape 15237889
docker compose -f infra/docker/docker-compose.yml restart directus
pnpm directus:register:phase6
pnpm directus:validate:phase6
```

## Resultado observado

### Infra e bootstrap

- `Directus` respondeu `200` em `GET /server/health`
- login administrativo local funcionou com:
  - `admin@contextofc.dev`
  - `directus-local-admin`
- as colecoes operacionais ficaram registradas:
  - `panel_states`
  - `panel_team_overrides`

### Caso 1 - States

Operacao validada:

- escrita em `panel_states` via API do `Directus`

Sincronizacao confirmada em:

- `core.states`

Registro validado:

- `id`: `phase6-state-sp`
- `slug`: `sp-validado`
- `name`: `Sao Paulo Validado`

### Caso 2 - Team overrides

Operacao validada:

- escrita em `panel_team_overrides` via API do `Directus`

Sincronizacao confirmada em:

- `editorial.team_overrides`

Registro validado:

- `id`: `phase6-team-override-atm`
- `public_slug`: `atletico-mineiro-validado`
- `public_label`: `Atletico MG Validado`

## Decisao sobre leitura editorial

Nesta fase, os overrides editoriais **nao** foram aplicados na `data-api`.

Motivo:

- o valor principal da fase era provar o fluxo operacional seguro no CMS
- a leitura atual continua correta consumindo `core.*`
- a aplicacao ampla de overrides na API merece um recorte proprio e pode entrar depois, se houver ganho claro

## Conclusao

A Fase 6 foi validada com sucesso como prova de:

- `Directus` operacional no ambiente local
- fronteira segura entre painel e canônico
- ajuste manual real sem SQL manual
- sincronizacao controlada para `core.*` e `editorial.*`

## Limitacoes conhecidas

- `panel_states` sincroniza apenas `insert` e `update`; `delete` no painel nao remove o registro correspondente de `core.states`
- as colecoes `panel_*` ficaram no `public`, junto das tabelas internas do `Directus`, por estabilidade de runtime nesta iteracao
