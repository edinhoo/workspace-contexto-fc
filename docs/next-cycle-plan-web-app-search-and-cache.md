# Plano do Proximo Ciclo - Web App Busca e Cache

Veja tambem: `docs/next-cycle-web-app-slugs-and-tests-closeout.md`
Veja tambem: `docs/phase-4-plan-data-api.md`

## Objetivo

Melhorar a experiencia de busca do web app e introduzir uma estrategia inicial de
cache, sem misturar as duas mudancas num bloco unico de implementacao.

Este ciclo deve melhorar a experiencia percebida de leitura do app, mas manter a
arquitetura atual:

- `apps/web` como camada de produto
- BFF local em Route Handlers
- `data-api` como origem canonica de leitura

## O que este ciclo herda

- URLs publicas coerentes por `slug` para `match`, `team` e `player`
- lookup por `slug` ja suportado na `data-api`
- cliente HTTP centralizado em `apps/web/src/lib/api/data-api.ts`
- cobertura inicial de teste para cliente HTTP/BFF
- busca ainda baseada em submit
- cliente HTTP ainda usando `cache: "no-store"` como padrao geral

## Escopo

### Entra neste ciclo

- melhora de UX da busca
- busca interativa com debounce
- estados de carregamento e vazio mais refinados
- estrategia inicial de cache para leitura do app
- testes adicionais cobrindo os novos comportamentos do BFF/cliente

### Fica fora deste ciclo

- redesign visual grande das telas
- filtros avancados de busca
- autenticacao
- invalidacao distribuida de cache
- alteracoes estruturais no schema da `data-api`
- scheduler residente

## Decisoes fechadas antes de executar

- busca interativa e cache entram no mesmo documento, mas em frentes separadas
- a frente de cache deve poder ser entregue independentemente da frente de debounce
- a busca pode migrar para `use client` na tela ou em componente isolado, desde que a
  pagina nao perca clareza arquitetural
- a busca interativa nao deve reescrever a URL a cada tecla; a URL continua sendo
  estado derivado e so muda em submissao explicita
- a estrategia inicial de cache deve ser pequena e explicita por rota, nao uma camada
  magica global
- o BFF continua sendo o ponto certo para concentrar decisoes de leitura do app

## Frentes de execucao

## Frente 1 - Estrategia inicial de cache

### Objetivo

Parar de tratar todas as leituras como `no-store` e definir um comportamento mais
intencional por contexto.

### Entregaveis

- revisao do cliente HTTP/BFF para suportar politicas diferentes de cache
- definicao inicial por rota, por exemplo:
  - busca: sem cache forte
  - partida: cacheavel
  - time: cacheavel
  - jogador: cacheavel
- documentacao curta da estrategia adotada

### Criterios de pronto

- o app nao depende mais de `cache: "no-store"` como regra universal
- existe uma regra simples e legivel de cache por tipo de leitura

## Frente 2 - Busca interativa com debounce

### Objetivo

Melhorar a busca para uma experiencia mais fluida, sem transformar o app inteiro
numa superficie client-side.

### Entregaveis

- componente de busca interativa
- debounce explicito
- resultados em tempo real no cliente
- atualizacao da URL apenas em submissao explicita como `enter` ou clique
- estados claros de:
  - digitando
  - carregando
  - sem resultados

### Criterios de pronto

- a busca responde durante a digitacao com debounce
- o comportamento nao depende de reload completo da pagina
- a URL continua refletindo a busca confirmada pelo usuario, sem piscar a cada tecla

## Frente 3 - Endurecimento de contrato e testes

### Objetivo

Expandir a protecao automatizada agora que o app passa a ter mais comportamento
dinamico.

### Entregaveis

- testes adicionais para:
  - `matches/by-slug`
  - `players/by-slug`
- testes do cliente HTTP cobrindo a politica inicial de cache
- documentacao curta de como expandir a suite

### Criterios de pronto

- o padrao de teste deixa de cobrir so um handler por `slug`
- a nova camada de busca/cache nao fica sustentada apenas por smoke manual

## Riscos principais

- misturar debounce, cache e redesign no mesmo bloco
- empurrar o app inteiro para `use client` por conveniencia
- introduzir cache cedo demais sem criterio de rota
- esconder a estrategia de cache em helpers opacos

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- a busca tiver uma experiencia mais fluida e previsivel
- a estrategia inicial de cache estiver explicita e aplicada
- a cobertura de testes acompanhar o novo comportamento do BFF/cliente
