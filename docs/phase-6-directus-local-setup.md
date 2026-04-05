# Directus local na Fase 6

Veja tambem: `docs/phase-6-plan-directus.md`

## Objetivo

Subir o `Directus` localmente contra o mesmo `PostgreSQL` do projeto para validar a fase de edicao operacional.

## Credenciais locais

- URL: `http://127.0.0.1:8055`
- email: `admin@contextofc.dev`
- senha: `directus-local-admin`

Esses valores sao apenas para desenvolvimento local.

## Como subir

```bash
pnpm docker:up
pnpm db:migrate
pnpm directus:up
pnpm directus:register:phase6
```

## Como acompanhar

```bash
pnpm directus:logs
```

## Como parar

```bash
pnpm directus:down
pnpm docker:down
```

## Observacoes

- o `Directus` usa o mesmo banco `contexto_fc`
- as tabelas internas do CMS ficam no `public` nesta iteracao, por compatibilidade pratica com o runtime validado
- a operacao do painel acontece nas colecoes `panel_states` e `panel_team_overrides`
- a fase nao abre edicao em `staging.*` nem `ops.*`
