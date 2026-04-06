# Plano do Proximo Ciclo - Web App

Veja tambem: `docs/phase-4-plan-data-api.md`
Veja tambem: `docs/phase-4-closeout.md`

## Objetivo

Criar `apps/web` com Next.js e shadcn/ui, consumindo a `data-api` via BFF interno,
com escopo minimo de telas para entender a organizacao do app antes de acelerar.

Este ciclo nao e sobre cobertura total. E sobre estabelecer:

- estrutura de projeto reproducivel
- padrao de consumo da `data-api` pelo BFF
- organizacao de rotas e telas que vai se repetir

## O que este ciclo herda

- `services/data-api` rodando em `localhost:3100` com endpoints documentados
- contratos `zod` exportados dos modulos da `data-api`
- dados reais carregaveis via `pnpm --filter @services/sofascore scrape 15237889`

## Escopo

### Entra neste ciclo

- criacao de `apps/web` com Next.js (App Router) e shadcn/ui
- configuracao de CORS na `data-api` para desenvolvimento local
- BFF via Route Handlers do Next.js chamando a `data-api`
- duas telas: busca e partida
- organizacao de pastas e convencoes que o app vai seguir daqui para frente

### Fica fora deste ciclo

- tela de time e tela de jogador
- autenticacao
- deploy
- scheduler residente
- overrides editoriais na leitura
- dark mode, i18n e outras preocupacoes de produto

## Decisoes fechadas antes de executar

- o app fica em `apps/web` no monorepo
- Next.js com App Router
- shadcn/ui como unica biblioteca de componentes; sem instalar outras UI libs
- o BFF nao consulta o banco diretamente; toda leitura passa pela `data-api`
- a `data-api` roda em `localhost:3100` durante o desenvolvimento
- os contratos de resposta da `data-api` sao reutilizados diretamente no BFF via tipos TypeScript; sem reescrever schemas
- a URL da `data-api` entra via variavel de ambiente `DATA_API_URL` no `.env.local`

## Frentes de execucao

## Frente 1 - Setup do projeto

### Objetivo

Criar `apps/web` com estrutura minima funcional integrada ao monorepo.

### Entregaveis

- `apps/web` criado com Next.js (App Router) e TypeScript
- shadcn/ui instalado com Tailwind configurado
- `package.json` integrado ao workspace pnpm
- script de dev disponivel via `pnpm --filter @apps/web dev`
- variavel `DATA_API_URL` documentada em `.env.example`
- CORS configurado na `data-api` para `localhost:3000`

### Criterios de pronto

- `pnpm --filter @apps/web dev` sobe sem erros
- a pagina inicial renderiza sem erro
- a `data-api` aceita requests de `localhost:3000`

## Frente 2 - Organizacao de rotas e BFF

### Objetivo

Estabelecer o padrao de BFF que vai se repetir em todas as telas futuras.

### Entregaveis

- pasta `src/lib/api/` com cliente tipado para chamar a `data-api`
- pasta `src/app/api/` com Route Handlers como BFF
- convencao documentada de tratamento de erro entre BFF e tela

### Tarefas

- criar cliente HTTP em `src/lib/api/data-api.ts` para chamar a `data-api`
- reutilizar os tipos exportados da `data-api` sem reescrever schemas
- criar Route Handler `GET /api/search` chamando `data-api GET /search`
- criar Route Handler `GET /api/matches/[id]` chamando `data-api GET /matches/:id`
- definir como erros da `data-api` chegam ate o frontend (ex: 404 vira notFound(), erro de rede vira error boundary)

### Criterios de pronto

- os dois Route Handlers respondem dados reais
- o cliente HTTP centraliza cabecalhos, base URL e tratamento de erro
- um novo Route Handler pode ser criado seguindo o mesmo padrao sem ambiguidade

## Frente 3 - Tela de busca

### Objetivo

Primeira tela funcional: campo de busca que consulta o BFF e exibe resultados navegaveis.

### Rota

`/search` ou como pagina inicial `/`

### Entregaveis

- campo de busca com input controlado
- exibicao de resultados com discriminador de tipo (`match`, `team`, `player`)
- navegacao para `/matches/[id]` ao clicar em um resultado do tipo `match`
- estado de loading e estado vazio tratados

### Notas de implementacao

- usar componentes primitivos do shadcn: `Input`, `Card`, `Badge` ou equivalente
- nao inventar componente de busca complexo; comecar simples
- os itens de resultado sao links, nao acoes JavaScript

### Criterios de pronto

- busca por "palmeiras" retorna resultados reais do banco
- clicar em um resultado do tipo `match` navega para a tela de partida
- a tela funciona localmente com o banco populado

## Frente 4 - Tela de partida

### Objetivo

Tela mais completa do ciclo: contexto da partida com os dados que a `data-api` ja entrega.

### Rota

`/matches/[id]`

### Entregaveis

- cabecalho com times, placar, torneio e data
- lista de eventos ordenados por `sortOrder`
- lineups separadas por time
- sem estatisticas detalhadas neste ciclo (o `statPayload` e um JSONB livre; adiar para depois)

### Notas de implementacao

- os dados vem de `GET /api/matches/[id]` (BFF) que chama a `data-api`
- usar Server Components para busca inicial; sem `useEffect` para dados
- usar componentes primitivos do shadcn conforme necessario
- o `id` da URL e o ULID interno; a busca ja resolve o caminho para chegar aqui

### Criterios de pronto

- a tela renderiza dados reais para o evento `15237889`
- cabecalho, eventos e lineups aparecem de forma legivel
- a navegacao vinda da busca funciona ponta a ponta

## Ordem recomendada

1. setup do projeto e CORS
2. cliente HTTP e Route Handlers
3. tela de busca
4. tela de partida

## Riscos principais

- instalar UI libs alem do shadcn antes de entender o que realmente faz falta
- consultar o banco diretamente no BFF em vez de passar pela `data-api`
- usar `useEffect` para buscar dados que poderiam ser Server Components
- criar abstraccao de cliente HTTP complexa demais antes de ter dois casos de uso reais

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- `apps/web` esta integrado ao monorepo e sobe localmente
- os dois Route Handlers de BFF estao funcionando
- as telas de busca e partida renderizam dados reais
- a organizacao de pastas e o padrao de BFF estao claros o suficiente para adicionar novas telas sem ambiguidade
