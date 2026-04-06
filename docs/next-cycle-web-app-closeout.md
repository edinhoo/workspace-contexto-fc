# Fechamento do Ciclo Incremental - Web App Inicial

Veja tambem: `docs/next-cycle-plan-web-app.md`
Veja tambem: `docs/phase-4-closeout.md`

## Objetivo do ciclo

Provar a primeira camada visual do Contexto FC sobre a `data-api`, sem abrir
escopo demais e sem reescrever contratos de leitura.

## O que foi entregue

- `apps/web` criado com `Next.js` e App Router
- base visual inicial em estilo `shadcn/ui`
- CORS local configurado na `data-api` para `localhost:3000`
- cliente HTTP centralizado em `apps/web/src/lib/api/data-api.ts`
- BFF inicial via Route Handlers:
  - `GET /api/search`
  - `GET /api/matches/[id]`
- tela de busca em `/search`
- tela de partida em `/matches/[id]`

## O que foi validado

- a busca responde com dados reais do banco
- a tela `/search` renderiza resultados mistos com discriminador de tipo
- a navegacao de um resultado `match` abre a pagina de partida
- a pagina de partida renderiza:
  - cabecalho
  - eventos
  - lineups por time

## O que ficou bom

- o padrao `lib/api -> app/api -> tela` ficou claro
- o BFF usa a `data-api` como unica origem de leitura
- os contratos da `data-api` sao reutilizados como tipos TypeScript
- as telas principais usam Server Components sem cair em `useEffect` para dados

## Limitacoes conhecidas

- a busca ainda e por submit, nao interativa em tempo real
- a navegacao da busca so fecha para `match`; `team` e `player` ficam para o proximo ciclo
- a rota atual de partida ainda usa `id` interno e nao `slug`
- todas as chamadas do cliente HTTP usam `cache: "no-store"` nesta iteracao
- `teamStats.statPayload` continua fora da tela de partida

## Decisao consolidada sobre URL

Para o app, o caminho desejado e por `slug`, nao por `id`.

Isso significa que os proximos contextos devem preferir:

- `/matches/[slug]`
- `/teams/[slug]`
- `/players/[slug]`

Mesmo quando a `data-api` continuar internamente orientada a `id`, o web app deve
evoluir para URLs de produto mais legiveis.

## Proximo ciclo recomendado

Completar a navegacao da busca com:

- contexto de time
- contexto de jogador
- transicao progressiva de rotas do app para `slug`

## Conclusao

O ciclo pode ser considerado concluido.

O objetivo de estabelecer a fundacao do web app foi atingido, e as proximas
iteracoes passam a ser ampliacoes incrementais da navegacao e da leitura.
