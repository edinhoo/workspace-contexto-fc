# Contexto FC Monorepo

Base moderna para um monorepo Node.js + TypeScript preparado para futuras aplicacoes e microservicos.

## Estrutura

```text
.
|-- apps/             # Aplicacoes futuras (frontend, gateway, backoffice)
|-- infra/
|   `-- docker/       # Compose e artefatos de infraestrutura local
|-- packages/
|   |-- config/       # Configuracoes compartilhadas
|   |-- logger/       # Logger reutilizavel
|   `-- types/        # Tipos globais e contratos comuns
|-- scripts/          # Scripts utilitarios para orquestracao
|-- services/         # Microservicos futuros
|-- eslint.config.mjs
|-- package.json
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- turbo.json
```

## Tecnologias

- Node.js + TypeScript
- pnpm workspaces
- Turborepo
- Docker Compose
- ESLint + Prettier

## Como rodar

1. Instale as dependencias:

```bash
pnpm install
```

2. Execute os comandos principais:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm scrape:sofascore
pnpm test
pnpm typecheck
```

3. Scripts utilitarios equivalentes:

```bash
./scripts/dev.sh
./scripts/build.sh
./scripts/lint.sh
./scripts/test.sh
```

## Template de commit

Este repositorio inclui um template para padronizar mensagens de commit em
`.gitmessage.txt`.

Para habilitar no Git deste repositorio:

```bash
git config commit.template .gitmessage.txt
```

Para verificar a configuracao atual:

```bash
git config --get commit.template
```

## Como adicionar um novo servico

1. Crie uma nova pasta em `services/<nome-do-servico>`.
2. Adicione um `package.json` com scripts `dev`, `build`, `lint`, `test` e `typecheck`.
3. Crie um `tsconfig.json` extendendo [`tsconfig.base.json`](/Users/edinhomedeiros/Documents/GitHub/\_VIBE CODE/WORKSPACES/workspace-contexto-fc/tsconfig.base.json).
4. Exporte entradas claras em `src/index.ts`.
5. Se o servico precisar rodar localmente via Docker, registre-o em [`infra/docker/docker-compose.yml`](/Users/edinhomedeiros/Documents/GitHub/\_VIBE CODE/WORKSPACES/workspace-contexto-fc/infra/docker/docker-compose.yml).

Exemplo minimo de `package.json`:

```json
{
  "name": "@services/meu-servico",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.ts",
    "build": "tsc -p tsconfig.build.json",
    "lint": "eslint src --ext .ts",
    "test": "node --test",
    "typecheck": "tsc -p tsconfig.build.json --noEmit"
  }
}
```

## Aliases e compartilhamento

O alias `@repo/*` esta configurado na base TypeScript para facilitar o consumo de bibliotecas compartilhadas, por exemplo:

```ts
import { logger } from "@repo/logger";
import type { Identifier } from "@repo/types";
```

## Observacoes

- O primeiro servico manual foi criado em `services/sofascore`.
- O comando `pnpm scrape:sofascore` executa a entrada inicial do scraper.
- Os packages compartilhados ja possuem scripts padrao e build independente.
- O `docker-compose.yml` esta pronto para receber futuros containers sem travar a base atual.
- A Fase 1 da plataforma de dados usa `PostgreSQL` local em `localhost:54329`, banco `contexto_fc`, usuario `contexto_fc` e senha `contexto_fc`.

## Documentacao recomendada

Para reduzir releitura de codigo e consumo de contexto em tarefas futuras, consulte primeiro:

- [docs/monorepo-overview.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/docs/monorepo-overview.md)
- [docs/next-services-architecture.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/docs/next-services-architecture.md)
- [services/sofascore/README.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/README.md)
- [services/sofascore/docs/data-model.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/data-model.md)
- [services/sofascore/docs/scraper-decisions.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/scraper-decisions.md)
