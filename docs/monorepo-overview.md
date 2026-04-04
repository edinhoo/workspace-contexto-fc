# Monorepo Overview

## Objetivo

Este repositorio e a base do projeto `Contexto FC`, organizado como monorepo Node.js + TypeScript com `pnpm` e `turbo`.

Hoje o elemento funcional mais importante e o scraper manual do Sofascore em `services/sofascore`.

## Estrutura

```text
.
|-- apps/                  # Aplicacoes futuras
|-- docs/                  # Documentacao geral do monorepo
|-- infra/docker/          # Infraestrutura local
|-- packages/              # Bibliotecas compartilhadas
|-- scripts/               # Scripts utilitarios
`-- services/              # Servicos de negocio e coleta
```

## Comandos principais

Na raiz:

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm scrape:sofascore 15237889
```

## Papel do scraper

O scraper do Sofascore:

- coleta dados de eventos de futebol a partir de endpoints publicos do Sofascore
- normaliza relacionamentos entre entidades
- persiste tudo em CSVs como camada intermediaria de estruturacao
- nao pretende ser ainda o modelo final de backend ou banco

## Principios atuais do projeto

- priorizar clareza e rastreabilidade de dados sobre modelagem excessivamente definitiva
- usar IDs internos nos CSVs sempre que o relacionamento puder ser resolvido
- manter `source_id` para rastrear a origem bruta
- usar CSV como artefato de verificacao e inspecao manual
- documentar decisoes importantes para evitar reanalise repetida

## Onde continuar lendo

- [services/sofascore/README.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/README.md)
- [services/sofascore/docs/data-model.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/data-model.md)
- [services/sofascore/docs/scraper-decisions.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/scraper-decisions.md)

