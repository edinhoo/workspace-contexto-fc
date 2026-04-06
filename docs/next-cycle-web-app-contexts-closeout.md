# Fechamento do Ciclo Incremental - Web App Contextos

Veja tambem: `docs/next-cycle-plan-web-app-contexts.md`
Veja tambem: `docs/next-cycle-web-app-closeout.md`

## Objetivo do ciclo

Completar a primeira navegacao do web app adicionando os contextos de time e jogador,
sem reabrir discussoes de infraestrutura e sem mudar o papel da `data-api`.

## O que foi entregue

- cliente HTTP ampliado com:
  - `getTeam`
  - `getPlayer`
- BFF local ampliado com:
  - `GET /api/teams/[id]`
  - `GET /api/players/[id]`
- tela de time em `/teams/[slug]`
- tela de jogador em `/players/[slug]`
- busca atualizada para navegar:
  - `team -> /teams/[slug]?id=...`
  - `player -> /players/[slug]?id=...`

## Decisao consolidada de URL

- a URL publica do app usa `slug`
- o BFF interno continua operando por `id`
- a `data-api` nao precisou ganhar lookup por `slug` nesta iteracao

Isso manteve o ciclo pequeno, previsivel e aderente ao contrato atual.

## O que foi validado

- a busca por `palmeiras` abre o contexto de time
- a busca por `vitor` abre o contexto de jogador
- as telas de time e jogador renderizam dados reais do banco
- a navegacao cruzada entre busca, time, jogador e partida funciona

## Limitacoes conhecidas

- `match` continua em rota publica baseada em `id`
- a busca ainda e por submit, nao interativa em tempo real
- `statPayload` segue sem shape de leitura consolidado
- o transporte de `id` via query string ainda e uma ponte tecnica temporaria

## Resultado do ciclo

O fluxo iniciado pela busca pode ser considerado completo para os tres tipos
principais de entidade visual:

- partida
- time
- jogador

## Proximo passo natural

O proximo ciclo mais natural agora e escolher entre:

- migrar tambem a experiencia de `match` para URL publica mais amigavel
- melhorar a experiencia de busca com interacao incremental e estados melhores
- comecar uma estrategia de cache por rota para leitura

## Conclusao

O ciclo pode ser considerado concluido.

O web app agora nao e mais apenas uma prova de conceito de busca e partida;
ele passou a oferecer a primeira navegacao coerente entre os contextos principais
ja expostos pela `data-api`.
