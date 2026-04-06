# Fechamento do Ciclo Incremental - Web App Slugs e Testes

Veja tambem: `docs/next-cycle-plan-web-app-slugs-and-tests.md`
Veja tambem: `docs/next-cycle-web-app-contexts-closeout.md`

## Objetivo do ciclo

Fechar a consistencia de URL do web app, remover a dependencia de `?id=` das
rotas publicas e introduzir a primeira camada de testes do cliente HTTP/BFF.

## O que foi entregue

- `services/data-api` ampliado com lookup por `slug`:
  - `GET /matches/by-slug/:slug`
  - `GET /teams/by-slug/:slug`
  - `GET /players/by-slug/:slug`
- cliente HTTP do app ampliado com:
  - `getMatchBySlug`
  - `getTeamBySlug`
  - `getPlayerBySlug`
- Route Handlers locais ampliados com lookup por `slug`
- rota publica de partida migrada para `/matches/[slug]`
- telas de time e jogador simplificadas para resolver diretamente por `slug`
- helper central de rotas atualizado para URLs publicas sempre amigaveis
- primeira base de testes em `Vitest` no `apps/web`

## Decisao consolidada de URL

- as URLs publicas do app usam `slug`
- a `data-api` agora oferece lookup canonico por `slug`
- os endpoints por `id` continuam existindo para compatibilidade interna

Com isso, o app deixa de depender de `?id=` como ponte tecnica para navegacao.

## O que foi validado

- `pnpm --filter @services/data-api typecheck`
- `pnpm --filter @services/data-api build`
- `pnpm --filter @apps/web typecheck`
- `pnpm --filter @apps/web build`
- `pnpm --filter @apps/web test`
- `curl http://127.0.0.1:3000/api/search?q=palmeiras&limit=5`
- `curl http://127.0.0.1:3000/api/teams/by-slug/palmeiras`
- `curl http://127.0.0.1:3000/teams/palmeiras`
- `curl http://127.0.0.1:3000/players/vitor-roque`
- `curl http://127.0.0.1:3000/matches/atletico-mineiro-vs-palmeiras-2026-01-28`

## O que ficou bom

- a `data-api` passou a sustentar URLs de produto sem lookup improvisado no app
- o helper `src/lib/routes.ts` agora concentra a convencao completa de hrefs
- `team`, `player` e `match` ficaram coerentes entre busca, cards e navegacao cruzada
- os testes ja cobrem:
  - sucesso e erro do cliente HTTP
  - mapeamento de erro em Route Handler por `slug`

## Limitacoes conhecidas

- a busca continua orientada a submit, nao a digitacao em tempo real
- o cliente HTTP ainda usa `cache: "no-store"` em todas as leituras
- os testes ainda cobrem cliente/BFF, nao UI renderizada
- `statPayload` segue livre nas telas de partida e jogador

## Proximo ciclo recomendado

O proximo passo mais natural agora e escolher entre:

- melhorar UX da busca com estado mais interativo
- introduzir estrategia inicial de cache por rota
- ampliar testes do app para mais handlers e fluxos de erro

## Conclusao

O ciclo pode ser considerado concluido.

O web app agora tem URLs publicas coerentes nos tres contextos principais e um
primeiro nivel de protecao automatizada para o contrato do BFF.
