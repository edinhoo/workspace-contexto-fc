# Plano do Proximo Ciclo - Web App Slugs e Testes

Veja tambem: `docs/next-cycle-web-app-contexts-closeout.md`
Veja tambem: `docs/phase-4-plan-data-api.md`

## Objetivo

Fechar a consistencia de URL do web app e remover a dependencia de `?id=` nas rotas
publicas, sem quebrar a separacao entre app, BFF e `data-api`.

Este ciclo tambem deve introduzir os primeiros testes do cliente HTTP/BFF do app,
agora que o padrao de integracao ja se repetiu o suficiente.

## O que este ciclo herda

- `apps/web` com busca, partida, time e jogador funcionando
- URLs publicas por `slug` ja adotadas para `team` e `player`
- BFF interno ainda orientado por `id`
- `match` ainda com URL publica por `id`
- `services/data-api` ainda sem lookup por `slug`

## Escopo

### Entra neste ciclo

- lookup por `slug` na `data-api` para `teams` e `players`
- suporte correspondente no BFF do app
- remocao de `?id=` das rotas publicas de time e jogador
- migracao da rota publica de partida para `slug`
- primeiros testes do cliente HTTP/BFF

### Fica fora deste ciclo

- redesign de telas
- busca em tempo real com debounce
- estrategia completa de cache
- autenticacao
- overrides editoriais na leitura

## Decisoes fechadas antes de executar

- a URL publica do app deve ser totalmente amigavel:
  - `/matches/[slug]`
  - `/teams/[slug]`
  - `/players/[slug]`
- a `data-api` ganha endpoints explicitos por `slug`; o BFF nao deve improvisar lookup no banco
- `match` usa o slug gerado como URL publica; `source_ref` permanece como identidade tecnica de origem
- os endpoints por `id` podem continuar existindo para compatibilidade interna
- os primeiros testes devem cobrir o cliente HTTP/BFF, nao a UI inteira
- o `apps/web` usa `Vitest` como framework inicial de teste para este ciclo

## Frentes de execucao

## Frente 1 - `data-api` com lookup por slug

### Objetivo

Dar suporte canonico ao lookup por `slug` antes de simplificar as rotas do app.

### Entregaveis

- `GET /teams/by-slug/:slug`
- `GET /players/by-slug/:slug`
- `GET /matches/by-slug/:slug`

### Criterios de pronto

- a `data-api` resolve os tres contextos necessarios por `slug`
- `404` e erros continuam no mesmo padrao da API atual

## Frente 2 - BFF e rotas publicas sem `?id=`

### Objetivo

Remover a ponte tecnica de `id` da URL publica do app.

### Entregaveis

- BFF usando lookup por `slug`
- telas de time e jogador sem depender de `searchParams.id`
- rota de partida migrada para `/matches/[slug]`
- busca atualizada para apontar sempre para URLs publicas completas

### Criterios de pronto

- `team`, `player` e `match` navegam sem `?id=`
- links do app ficam consistentes entre si

## Frente 3 - Primeiros testes do cliente HTTP/BFF

### Objetivo

Adicionar cobertura minima para o padrao de integracao antes do app crescer mais.

### Entregaveis

- teste do cliente HTTP para sucesso e erro upstream
- teste de Route Handler para ao menos um contexto por `slug`
- convencao documentada de como expandir esses testes nas proximas telas

### Criterios de pronto

- existe um caminho claro de teste para o BFF
- regressao de contrato basico nao depende mais so de smoke test manual

## Riscos principais

- introduzir lookup por `slug` na API sem manter o padrao de erro existente
- tentar redesenhar a UI no mesmo ciclo
- misturar teste de UI, teste de BFF e teste de `data-api` no mesmo bloco

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- o app usar URLs publicas coerentes para `match`, `team` e `player`
- `team` e `player` nao dependerem mais de `?id=`
- o BFF tiver testes iniciais cobrindo sucesso e erro
