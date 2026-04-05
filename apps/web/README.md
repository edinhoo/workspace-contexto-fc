# Web App

## Objetivo

Primeiro frontend do Contexto FC consumindo a `data-api` por meio de um BFF local em Next.js.

## Desenvolvimento local

1. Garanta a `data-api` rodando em `http://127.0.0.1:3100`
2. Copie `.env.example` para `.env.local`
3. Execute:

```bash
pnpm --filter @apps/web dev
```

## Convencao do BFF

- Route Handlers em `src/app/api/*` sao a unica superficie HTTP usada pelo frontend.
- O BFF chama somente a `data-api`; ele nao acessa o banco diretamente.
- Respostas de erro da `data-api` sao preservadas no BFF com o mesmo `status` e `error.code`.
- Para telas server-side:
  - `404` pode virar `notFound()`
  - falhas de rede ou `5xx` devem subir para a error boundary
