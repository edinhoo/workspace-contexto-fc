# Plano do Proximo Ciclo - Web App Testes de Busca e UX

Veja tambem: `docs/next-cycle-web-app-search-and-cache-closeout.md`
Veja tambem: `docs/next-cycle-plan-web-app-search-and-cache.md`

## Objetivo

Endurecer a experiencia de busca do `apps/web` sem mudar backend, URLs publicas
ou contratos da `data-api`.

O foco deste ciclo e transformar a busca atual em uma base de frontend mais
confiavel e facil de evoluir:

- testes de componente para `SearchExperience`
- refinamentos leves de UX nos estados da busca
- consolidacao da politica inicial de cache ja existente

## O que este ciclo herda

- busca interativa com debounce ja implementada
- URL da busca continua mudando apenas em submissao explicita
- `match`, `team` e `player` ja usam URL publica por `slug`
- cliente HTTP ja diferencia busca em tempo real e leituras cacheaveis
- suite atual cobre cliente HTTP e BFF, mas ainda nao cobre o componente cliente da busca

## Escopo

### Entra neste ciclo

- testes de componente para `SearchExperience`
- refinamentos leves de UX dos estados de busca
- consolidacao da politica de cache no cliente HTTP
- documentacao curta do ciclo no plano geral

### Fica fora deste ciclo

- mudancas na `data-api`
- mudancas de URL publica do app
- redesign amplo do frontend
- novos contextos de tela
- scheduler residente

## Decisoes fechadas antes de executar

- o ciclo continua inteiramente no `apps/web`
- `SearchExperience` permanece como componente cliente isolado
- a URL da busca continua mudando apenas em submissao explicita
- a busca continua com `cache: "no-store"`
- `match`, `team` e `player` continuam com `force-cache` + `revalidate`
- a politica de cache deve ficar consolidada em helpers ou constantes nomeadas, sem regra espalhada
- os testes de componente usam:
  - `jsdom`
  - `@testing-library/react`
  - `@testing-library/user-event`
- a suite deve tratar como parte delicada:
  - uso de `vi.useFakeTimers()` para o debounce de `250ms`
  - uso de `act()` ao avancar timers para sincronizar corretamente `useDeferredValue`
  - mock de `fetch` respeitando `AbortController.signal` no teste de cancelamento

## Frentes de execucao

## Frente 1 - Base de testes do componente de busca

### Objetivo

Adicionar protecao automatizada para o comportamento cliente de `SearchExperience`.

### Entregaveis

- configuracao do `vitest` para teste de componente com `jsdom`
- dependencias de teste de componente no `apps/web`
- suite inicial para `SearchExperience`

### Cobertura esperada

- estado `idle`
- transicao `typing -> loading -> ready`
- estado `empty`
- estado `error`
- submit atualizando a URL
- ausencia de atualizacao da URL durante digitacao

### Criterios de pronto

- o comportamento principal da busca cliente deixa de depender apenas de smoke manual
- o debounce e o submit ficam protegidos por testes deterministas

## Frente 2 - Refino de UX da busca

### Objetivo

Melhorar a legibilidade e a percepcao dos estados de busca sem redesign amplo.

### Entregaveis

- ajustes de copy e helper text para os estados:
  - `typing`
  - `loading`
  - `empty`
  - `error`
- microinteracoes mais claras no botao e nos cards clicaveis
- consistencia melhor entre “resultado instantaneo” e “busca confirmada”

### Criterios de pronto

- os estados da busca ficam mais claros sem mudar o fluxo de navegacao
- a experiencia parece mais intencional sem reestruturar a pagina

## Frente 3 - Consolidacao do cache inicial

### Objetivo

Deixar a estrategia de cache atual mais explicita e menos espalhada.

### Entregaveis

- helpers ou constantes nomeadas para politica de cache no cliente HTTP
- uso consistente das politicas em busca, `match`, `team` e `player`

### Criterios de pronto

- a politica de cache fica facil de localizar e entender
- o ciclo nao introduz camada opaca nem `next.config` para resolver cache

## Validacao esperada

- `pnpm --filter @apps/web test`
- `pnpm --filter @apps/web typecheck`
- `pnpm --filter @apps/web build`
- smoke manual opcional com:
  - `pnpm web:up`
  - `/search?q=palmeiras`

## Riscos principais

- subestimar a dificuldade de testar `useDeferredValue` com timers
- criar mocks de `fetch` que nao respeitam `AbortController.signal`
- misturar teste de componente com redesign amplo
- espalhar a politica de cache em multiplos pontos do cliente HTTP

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- `SearchExperience` tiver testes de componente cobrindo seu comportamento central
- os estados de busca estiverem mais claros na UI
- a estrategia inicial de cache estiver consolidada de forma explicita
