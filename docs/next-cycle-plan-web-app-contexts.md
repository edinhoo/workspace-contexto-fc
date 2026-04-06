# Plano do Proximo Ciclo - Web App Contextos

Veja tambem: `docs/next-cycle-web-app-closeout.md`
Veja tambem: `docs/phase-4-plan-data-api.md`

## Objetivo

Completar a primeira navegacao do web app adicionando as telas de time e jogador,
ao mesmo tempo em que o app comeca a migrar suas URLs para `slug`.

Este ciclo nao e sobre redesign do frontend. E sobre fechar o fluxo iniciado pela
busca com os contextos que a `data-api` ja entrega.

## O que este ciclo herda

- `apps/web` integrado ao monorepo
- BFF inicial funcionando para busca e partida
- `services/data-api` ja expondo `teams/:id` e `players/:id`
- banco local carregavel com `pnpm --filter @services/sofascore scrape 15237889`

## Escopo

### Entra neste ciclo

- tela de time
- tela de jogador
- novos Route Handlers do BFF para `teams` e `players`
- decisao pratica de URL por `slug` no app
- ajuste da busca para navegar quando o resultado tiver `slug`

### Fica fora deste ciclo

- busca em tempo real com debounce
- estatisticas detalhadas derivadas de `statPayload`
- cache de producao
- autenticacao
- overrides editoriais na leitura

## Decisoes fechadas antes de executar

- o app deve preferir URLs por `slug`
- a `data-api` continua sendo a unica origem de leitura do BFF
- caso a `data-api` ainda nao resolva leitura por `slug`, o proprio BFF pode fazer a resolucao inicial
- o layout segue simples e orientado a contexto, sem redesign amplo

## Frentes de execucao

## Frente 1 - BFF para times e jogadores

### Objetivo

Completar o conjunto minimo de rotas locais do app para os contextos ja existentes.

### Entregaveis

- cliente HTTP ampliado com `getTeam` e `getPlayer`
- Route Handler `GET /api/teams/[id-or-slug]`
- Route Handler `GET /api/players/[id-or-slug]`
- estrategia documentada de resolucao por `slug`

### Criterios de pronto

- os dois novos Route Handlers respondem dados reais
- fica claro como o app resolve `slug -> id` quando necessario

## Frente 2 - Tela de time

### Objetivo

Abrir o primeiro contexto navegavel para resultados do tipo `team`.

### Entregaveis

- rota `/teams/[slug]`
- cabecalho do time com identidade visual basica
- lista de partidas recentes
- lista de jogadores relacionados com limitacao conhecida documentada

### Criterios de pronto

- um resultado `team` da busca navega para a tela correta
- a tela mostra dados reais do banco atual

## Frente 3 - Tela de jogador

### Objetivo

Abrir o primeiro contexto navegavel para resultados do tipo `player`.

### Entregaveis

- rota `/players/[slug]`
- cabecalho do jogador
- lista de times atuais
- aparicoes recentes

### Criterios de pronto

- um resultado `player` da busca navega para a tela correta
- a tela mostra dados reais do banco atual

## Frente 4 - Ajuste da busca e consolidacao de URLs

### Objetivo

Fazer a busca deixar de ser um ponto de parada parcial e virar uma entrada completa do app.

### Entregaveis

- resultados `team` e `player` com links reais
- resultado `match` revisto para caminhar para `/matches/[slug]` quando o app ja tiver esse suporte
- limitacoes conhecidas documentadas no ciclo

### Criterios de pronto

- todos os tipos navegaveis da busca levam a uma tela do app
- o uso de `slug` no frontend fica coerente

## Riscos principais

- introduzir resolucao por `slug` de forma magica demais no BFF
- ampliar layout antes de fechar a navegacao
- tentar resolver `statPayload` no mesmo ciclo

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- o app navegar para time e jogador a partir da busca
- as rotas do frontend estiverem coerentes com a ideia de `slug`
- a busca deixar de ter tipos parciais sem destino
