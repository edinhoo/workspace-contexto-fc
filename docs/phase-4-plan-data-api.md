# Plano da Fase 4 - API de Leitura e Contextos

Veja tambem: `docs/implementation-plan-data-platform.md`
Veja tambem: `docs/next-services-architecture.md`
Veja tambem: `docs/phase-3-closeout.md`
Veja tambem: `docs/phase-3-validation-report.md`

## Objetivo

Construir a primeira versao de `services/data-api`, expondo modelos de contexto compostos a partir do banco ja validado nas fases anteriores.

A Fase 4 nao existe para criar CRUD generico sobre `core.*`. Ela existe para provar que o banco e a ingestao ja conseguem sustentar respostas orientadas a contexto, com contratos estaveis para futuras aplicacoes.

## O que entra na fase

- criacao do servico `services/data-api`
- conexao tipada com o `PostgreSQL`
- contrato de entrada e saida para os primeiros endpoints
- queries compostas usando `core.*` e, quando fizer sentido, `read.*`
- primeira trilha de testes de contrato e consultas criticas

## O que nao entra na fase

- automacao de scraping
- concorrencia de multiplos runs em `staging.*`
- `Directus`
- autenticacao e autorizacao
- edicao manual de dados
- API publica ampla para todas as entidades do dominio

## Premissas herdadas

- a Fase 3 concluiu a migracao do scraper para o banco
- `services/sofascore` ja popula `staging.*`, valida e promove para `core.*`
- o pipeline segue com `warnings` pouco explorados; a API nao deve depender deles nesta fase
- a validacao do scraper no banco foi feita com recorte controlado; a Fase 4 deve priorizar contratos previsiveis sobre cobertura total de casuisticas
- `staging.*` continua sendo area de lote unico, mas isso nao bloqueia a API de leitura
- o banco atual foi validado com cobertura limitada de eventos; alguns contextos, como "ultimas partidas" de um time, podem retornar pouco volume sem que isso signifique erro da API

## Objetivo de produto da fase

Provar a ideia central do Contexto FC:

- a API responde com **contextos**
- a entidade focal define a estrutura principal da resposta
- dimensoes adicionais refinam os dados sem transformar a resposta em CRUD de tabela

Em outras palavras, a Fase 4 precisa entregar pelo menos alguns endpoints que demonstrem:

- leitura previsivel de dados compostos
- filtros e dimensoes opcionais coerentes
- contratos tipados que apps futuros possam consumir

## Decisoes recomendadas

### Stack

- `Fastify` para o servidor HTTP
- `Kysely` para queries tipadas
- `zod` para validacao de params e contratos de resposta

### Estrategia de consulta

- ler de `core.*` como base padrao
- introduzir `read.*` apenas onde a composicao em SQL melhorar clareza ou reuso
- evitar criar `views` demais cedo; primeiro provar quais modelos realmente se repetem

### Forma dos endpoints

- preferir rotas por entidade focal
- aceitar dimensoes opcionais via query string
- manter respostas com estrutura de contexto, nao dump de tabelas

### Decisoes fechadas para a execucao da fase

- escopo inicial oficial:
  - `GET /health`
  - `GET /search?q=...`
  - `GET /matches/:id`
  - `GET /teams/:id`
  - `GET /players/:id`
- `read.*` nao entra por padrao; so deve ser introduzido se houver repeticao concreta de consulta ou ganho nitido de clareza
- nivel minimo de testes da fase:
  - contratos de rota
  - queries criticas
- `search` deve usar discriminador explicito de tipo desde a primeira versao

## Frentes da fase

## Frente 1 - Fundacao do servico

### Objetivo

Criar o servico `services/data-api` com infraestrutura minima para rodar localmente, conectar no banco e organizar rotas, schemas e queries.

### Tarefas

- criar `services/data-api`
- configurar `package.json`, `tsconfig`, `eslint` e scripts padrao
- configurar conexao com `PostgreSQL`
- definir a organizacao inicial de modulos:
  - `src/server.ts`
  - `src/app.ts`
  - `src/routes/*`
  - `src/contracts/*`
  - `src/queries/*`
  - `src/db/*`

### Entregaveis

- servico criado e inicializado
- endpoint basico de healthcheck
- conexao com banco funcionando localmente

### Criterios de pronto

- a API sobe localmente
- existe conexao valida com o banco
- a estrutura interna suporta adicionar contextos sem acoplamento excessivo

## Frente 2 - Contratos e padroes de resposta

### Objetivo

Definir a linguagem da API antes de multiplicar endpoints.

### Tarefas

- definir padrao de erro HTTP
- definir paginacao inicial para buscas/listagens
- definir como filtros opcionais entram nos endpoints de contexto
- criar schemas `zod` para params, query strings e respostas
- documentar a diferenca entre:
  - contexto focal
  - lista simples de apoio
  - busca global
- definir o shape base de `search`, com discriminador explicito, por exemplo:
  - `id`
  - `type`
  - `label`
  - `subtitle`
  - `slug?`

### Entregaveis

- pasta de contratos com schemas tipados
- convencao unica de validacao e serializacao
- documento curto ou README interno do servico com os padroes adotados

### Criterios de pronto

- toda rota nova nasce com contrato tipado
- erros e formatos de resposta seguem padrao consistente

## Frente 3 - Primeiros contextos

### Objetivo

Entregar um conjunto pequeno, mas representativo, de endpoints focados em contexto.

### Escopo recomendado da V1

- `GET /health`
- `GET /search?q=...`
- `GET /matches/:id`
- `GET /teams/:id`
- `GET /players/:id`

### Justificativa do escopo

- `matches/:id` valida a resposta mais completa e transversal do dominio
- `teams/:id` prova o conceito principal de entidade focal com dimensoes opcionais
- `players/:id` cobre outra entidade central com perfil e agregados
- `search` cria o ponto de entrada para navegacao futura
- `health` reduz atrito operacional desde o primeiro dia do servico

### Tarefas

- implementar `GET /matches/:id` com:
  - metadados da partida
  - times
  - placar
  - lineups
  - eventos
  - estatisticas agregadas disponiveis
- implementar `GET /teams/:id` com:
  - perfil da equipe
  - ultimas partidas, mesmo que o snapshot atual retorne volume pequeno
  - contexto basico de temporada
  - dimensoes opcionais iniciais, se viaveis: `season`, `tournament`, `opponent`
- implementar `GET /players/:id` com:
  - perfil
  - equipe atual quando disponivel
  - historico basico ou partidas recentes
  - estatisticas de partida disponiveis
- implementar `GET /search?q=...` retornando tipos mistos com shape estavel

### Entregaveis

- quatro endpoints iniciais funcionais
- queries compostas encapsuladas fora da camada de rota

### Criterios de pronto

- a resposta de `matches/:id` e composta e util sem exigir multiplas chamadas auxiliares
- `teams/:id` e `players/:id` respondem contexto, nao apenas row unica
- `search` permite descobrir entidades reais para navegar na API

## Frente 4 - Camada read e reuso de consulta

### Objetivo

Introduzir a primeira camada de reuso de leitura apenas se as consultas reais da fase mostrarem repeticao concreta.

### Tarefas

- identificar queries que estao ficando repetidas ou longas demais
- decidir caso a caso entre:
  - query builder direto em `core.*`
  - `view` em `read.*`
  - helper SQL isolado no servico
- materializar no banco apenas o que melhorar nitidamente a legibilidade ou o desempenho

### Entregaveis

- primeira iteracao de `read.*` quando realmente necessaria
- queries compartilhadas encapsuladas no servico

### Criterios de pronto

- a Frente 4 pode ser pulada sem prejuizo se nao houver repeticao concreta
- se ela entrar, a materializacao escolhida reduz duplicacao real ou melhora nitidamente a clareza de consulta

## Frente 5 - Validacao e confianca operacional

### Objetivo

Fechar a fase com confianca minima em contratos, consultas e comportamento local.

### Tarefas

- adicionar testes para contratos de rota
- adicionar testes para queries criticas
- validar os endpoints com dados reais do banco local
- registrar exemplos de resposta em documentacao curta da fase
- verificar se os endpoints se mantem uteis mesmo com as pendencias conhecidas da ingestao:
  - `warnings` ainda pouco explorados
  - coverage limitada de snapshots
  - `states` ainda sem populacao real

### Entregaveis

- suite inicial de testes da API
- relatorio ou closeout da fase

### Criterios de pronto

- existe cobertura para contratos e consultas principais
- a API funciona localmente com o banco ja preparado pelas fases anteriores
- os limites conhecidos da base estao documentados sem ambiguidades

## Ordem recomendada de execucao

1. fundacao do servico
2. contratos e padroes de resposta
3. `matches/:id`
4. `search`
5. `teams/:id`
6. `players/:id`
7. camada `read.*` apenas se alguma consulta realmente pedir isso
8. testes, relatorio e encerramento

## Riscos principais

- cair em CRUD bruto por pressa de expor tudo
- criar `views` demais antes de saber o que realmente se repete
- acoplar demais a API ao snapshot atual do scraper
- deixar contratos frouxos e depender de shape implícito
- tentar cobrir muitas entidades na primeira versao

## Decisoes praticas antes de executar

- escopo inicial oficial fechado com `health`, `search`, `matches/:id`, `teams/:id` e `players/:id`
- a fase comeca somente com `core.*`; `read.*` entra apenas se surgir repeticao concreta
- o nivel minimo de testes da fase esta fechado em contratos de rota + queries criticas
- `search` deve nascer com discriminador explicito de tipo no contrato da resposta

## Criterio de encerramento da Fase 4

A Fase 4 fica concluida quando:

- `services/data-api` sobe localmente
- o servico responde pelo menos `health`, `search`, `matches/:id`, `teams/:id` e `players/:id`
- as respostas sao orientadas a contexto e nao a CRUD bruto
- existe cobertura inicial de contrato e consulta
- o servico fica pronto para ser consumido pelas fases seguintes sem depender de CSV ou acesso direto ao banco pelo consumidor
