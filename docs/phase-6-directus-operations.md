# Operacao guiada do Directus na Fase 6

Veja tambem: `docs/phase-6-plan-directus.md`
Veja tambem: `docs/phase-6-directus-local-setup.md`
Veja tambem: `docs/phase-6-directus-permissions.md`

## Objetivo

Provar uma operacao real no `Directus` sem expor escrita direta nas tabelas canonicas.

## Superficies operacionais da fase

Nesta iteracao, o painel usa duas colecoes operacionais no `public`:

- `panel_states`
- `panel_team_overrides`

Essas colecoes existem apenas para o `Directus` operar com previsibilidade.

## Como a sincronizacao funciona

- `panel_states`
  - escrita no painel sincroniza para `core.states`
- `panel_team_overrides`
  - escrita no painel sincroniza para `editorial.team_overrides`

Os writes acontecem por triggers `SECURITY DEFINER`, mantendo o `directus_app` sem permissao ampla de escrita no canônico.

## Por que nao usar `core.states` diretamente no painel

Durante a execucao da Fase 6, o comportamento real do `Directus` mostrou melhor estabilidade quando:

- suas tabelas internas ficam no `public`
- a operacao do painel passa por colecoes controladas tambem no `public`

Isso reduz acoplamento com detalhes de introspecao multi-schema do CMS e preserva a fronteira operacional pretendida pela fase.

## Como registrar as colecoes da fase

Depois de subir o `Directus`, execute:

```bash
pnpm directus:register:phase6
```

Esse script registra no CMS:

- `panel_states`
- `panel_team_overrides`

## Fluxos provados

### Cadastro manual de state

1. abrir `panel_states`
2. criar ou editar um registro
3. confirmar a sincronizacao em `core.states`

### Override editorial de time

1. abrir `panel_team_overrides`
2. criar ou editar um registro apontando para um `team`
3. confirmar a sincronizacao em `editorial.team_overrides`

## Guardrail operacional

- o operador usa `panel_*`, nao `core.*` nem `editorial.*` diretamente
- `raw.*`, `staging.*` e `ops.*` continuam fora do painel
- ingestao, scheduler e API nao dependem dessas colecoes para funcionar
