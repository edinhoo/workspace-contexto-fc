# Data API

## Objetivo

Servico de leitura da plataforma de dados do Contexto FC.

Ele existe para:

- expor contextos compostos a partir do banco
- responder com modelos orientados a entidade focal
- evitar que consumidores precisem consultar `core.*` diretamente

## Endpoints iniciais

- `GET /health`
- `GET /search?q=...`
- `GET /matches/:id`
- `GET /teams/:id`
- `GET /players/:id`

## Comandos

Da raiz do monorepo:

```bash
pnpm --filter @services/data-api build
pnpm --filter @services/data-api lint
pnpm --filter @services/data-api test
pnpm --filter @services/data-api typecheck
pnpm --filter @services/data-api start
```

## Banco local

Por padrao o servico usa:

```text
postgresql://contexto_fc:contexto_fc@127.0.0.1:54329/contexto_fc
```

Voce pode sobrescrever via `DATABASE_URL`.

## Observacoes

- a API usa `core.*` como base principal de leitura nesta fase
- `read.*` ainda nao foi materializado; o reuso ficou na camada de queries da aplicacao
- alguns contextos podem retornar volume pequeno com a massa atual do banco; isso reflete a cobertura limitada de dados validada ate aqui
