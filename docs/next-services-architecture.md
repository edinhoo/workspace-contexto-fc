# Proposta de Proximos Servicos

Veja tambem: `docs/implementation-plan-data-platform.md`

## Objetivo

Evoluir o scraper atual para uma plataforma com:

- banco eficiente para consulta e cruzamento de dados
- backend capaz de expor modelos de contexto compostos para consumo por apps futuros
- CMS simples para visualizacao e pequenas edicoes operacionais

## Modelo mental do produto

O nome "Contexto FC" reflete o produto que a plataforma viabiliza.

O dado nao e exposto como CRUD de entidade. Ele e exposto como **contexto**: uma combinacao de entidade focal + dimensoes opcionais que o consumidor ativa progressivamente.

Exemplos:

- equipe sozinha → estatisticas gerais da equipe
- equipe + outra equipe → visao do confronto entre elas
- equipe + arbitro → como a equipe performa com aquele arbitro
- arbitro sozinho → numeros gerais do arbitro na plataforma
- arbitro + equipe → os mesmos dados do arbitro, filtrados pelos jogos com aquela equipe

O **ponto de entrada** define a entidade focal e a estrutura de apresentacao. As **dimensoes adicionais** refinam e recontextualizam os dados. Mesmo dados brutos sobrepostos geram contextos e modelos de resposta diferentes dependendo de qual e a entidade focal.

O frontend (hipotetico por enquanto) e informado por esse modelo — paginas adaptam sua estrutura conforme as dimensoes ativas — mas o backend deve ser estruturado para atender as regras de negocio independentemente de qualquer frontend especifico.

## Decisoes ja tomadas

- **CSV nao e camada permanente.** Os arquivos CSV foram uteis para organizar ideias e validar a modelagem, mas o destino final dos dados e o banco. Nao ha `catalog-sync` como servico estrutural permanente.
- **Os CSVs existentes serao usados uma unica vez como bootstrap de validacao.** Antes de adaptar o scraper, os CSVs atuais serao importados para o PostgreSQL para validar schema, DDLs, constraints e relacionamentos com dados reais. Esse passo e temporario, nao uma etapa recorrente da arquitetura.
- **Estado final da ingestao: scraper → PostgreSQL, sem intermediario CSV.** A porta de entrada e `staging.*`, com promocao controlada para `core.*` apos validacao. O intermediario que deixa de existir e o arquivo CSV — o staging dentro do banco e desejavel e intencional.
- **Fonte unica por ora: Sofascore.** A arquitetura deve prever adicao de novas fontes no futuro (validacao de dados entre fontes, informacoes ineditas de origens diferentes), mas nesse primeiro momento so o Sofascore sera implementado.
- **Directus fica para depois.** Sera introduzido somente quando houver protecao adequada contra edicoes indevidas nos dados canonicos. Por enquanto nao e prioridade.

## Recomendacao principal

### Banco

Usar `PostgreSQL` como banco principal.

Motivos:

- funciona muito bem para dados relacionais e analiticos leves
- suporta `JSONB` para preservar payloads brutos ou enriquecimentos parciais
- permite `views` e `materialized views` para expor modelos prontos sem duplicar logica no backend
- conversa bem com `Directus` quando ele for introduzido
- reduz risco de lock-in e deixa a modelagem evoluir com seguranca

### Backend

Criar um servico dedicado de API, separado do scraper.

- `services/data-api`
- Node.js + TypeScript
- `Fastify` para endpoints e performance
- `Kysely` para SQL tipado

`Kysely` e a preferencia por deixar a camada `read` com views e SQL mais expressivo sem abstracao excessiva de ORM.

### CMS

`Directus` conectado no mesmo `PostgreSQL`.

Papel previsto (quando for introduzido):

- visualizar entidades e relacionamentos
- fazer pequenas correcoes manuais
- editar tabelas `editorial.*`

O Directus nao deve editar diretamente tabelas de ingestao nem colunas que dependem de reimportacao.

## Arquitetura sugerida

### 1. Scraper com persistencia no banco

O `services/sofascore` passa a ser o unico responsavel pela ingestao, persistindo diretamente no PostgreSQL — sem intermediario CSV.

A porta de entrada operacional e `staging.*`, nao `core.*`. O scraper escreve em staging, validacoes executam, e so entao os dados sao promovidos para o modelo canonico.

Responsabilidades:

- coletar dados dos endpoints publicos do Sofascore
- manter a normalizacao que hoje ja existe no scraper
- escrever em `staging.*`
- executar validacoes automaticas
- promover para `core.*` somente se as validacoes passarem
- registrar metadados de sincronizacao em `ingestion_runs`
- manter rastreabilidade via `source_ref` e `source_*_id`

Nao ha servico intermediario de sync. Os CSVs existentes sao usados apenas na Fase 1 como bootstrap de validacao — um script temporario de migracao, nao uma peca estrutural do monorepo.

No futuro, novas fontes devem seguir o mesmo contrato de ingestao, escrevendo em `staging.*` antes de promover para `core.*`.

### 2. Banco em camadas

Separar o banco em tres niveis logicos.

#### Camada raw

Guarda a origem quase bruta.

Exemplos:

- `raw.sofascore_events`
- `raw.sofascore_lineups`
- `raw.sofascore_event_payloads`

Objetivo:

- auditoria
- replay
- debugging
- comparacao entre origem e modelo final

#### Camada core

Guarda o modelo relacional canonico do projeto.

Exemplos:

- `core.countries`
- `core.cities`
- `core.stadiums`
- `core.tournaments`
- `core.seasons`
- `core.teams`
- `core.players`
- `core.managers`
- `core.matches`
- `core.lineups`
- `core.player_match_stats`
- `core.team_match_stats`
- `core.events`
- `core.player_career_teams`

Objetivo:

- consolidar IDs internos
- preservar `source_ref` e `source_*_id`
- permitir joins previsiveis
- virar a base de APIs e CMS

#### Camada read

Guarda modelos prontos para consulta.

Exemplos:

- `read.match_details`
- `read.match_timeline`
- `read.team_season_summary`
- `read.player_profile`
- `read.team_last_matches`

Objetivo:

- responder rapido para frontends e automacoes
- centralizar mesclas complexas em SQL
- evitar que cada endpoint reconstrua o mesmo modelo

Essa camada pode usar `views` no inicio e `materialized views` onde houver agregacao pesada. `Materialized views` exigem refresh explicito — disparado apos cada execucao de ingestao ou via cron.

## Estrategia de edicao manual

Para nao perder confianca na origem, separar claramente:

- dado bruto da origem
- dado canonico calculado
- override editorial/manual

Padrao recomendado:

- tabelas `core.*` recebem o valor canonico atual
- tabelas `editorial.*` guardam overrides pequenos
- `views` finais aplicam override quando existir

Exemplos de overrides uteis:

- nome amigavel de time, campeonato ou estadio
- slug publico
- correcao de nacionalidade ou cidade
- flags de publicacao
- labels e traducoes

## Como o Directus deve entrar (quando for o momento)

- navegar nas tabelas `core`
- editar tabelas `editorial`
- expor colecoes internas de apoio
- criar filtros simples e relatorios operacionais

Boa divisao de permissoes:

- somente leitura: `raw.*`
- leitura e edicao controlada: `core.teams`, `core.players`, `core.tournaments`, `core.stadiums`
- edicao livre: `editorial.*`

## Endpoints recomendados

O backend nao deve expor apenas CRUD de tabela. Ele deve expor **contextos** — modelos compostos organizados por entidade focal e dimensoes opcionais.

### Estrutura geral

Cada entidade principal tem sua propria rota de origem. Dimensoes adicionais sao passadas como query params e alteram o modelo de resposta.

```
GET /teams/:id?referee=78&season=2024
GET /referees/:id?team=123
GET /players/:id?tournament=5&season=2024
GET /tournaments/:id?team=123
GET /matches/:id
```

### Rotas de origem por entidade focal

- `GET /teams/:id` — contexto de equipe, com dimensoes opcionais: opponent, referee, season, tournament
- `GET /players/:id` — contexto de jogador, com dimensoes opcionais: team, season, tournament
- `GET /referees/:id` — contexto de arbitro, com dimensoes opcionais: team, tournament, season
- `GET /tournaments/:id` — contexto de campeonato, com dimensoes opcionais: team, season
- `GET /stadiums/:id` — contexto de estadio
- `GET /managers/:id` — contexto de tecnico, com dimensoes opcionais: team, season
- `GET /matches/:id` — partida completa com metadata, placar, lineups, eventos e agregados
- `GET /search?q=...` — busca global por entidade

### Comportamento das dimensoes

O ponto de entrada define a entidade focal e a estrutura de apresentacao do contexto. Dimensoes adicionais filtram e recontextualizam os dados sem mudar a entidade focal.

Exemplo:
- `GET /teams/123` → estatisticas gerais da equipe 123
- `GET /teams/123?opponent=456` → visao do confronto direto entre equipe 123 e equipe 456
- `GET /teams/123?referee=78` → como a equipe 123 performa nos jogos com o arbitro 78
- `GET /referees/78?team=123` → atuacao do arbitro 78 nos jogos que envolveram a equipe 123

Os dados brutos podem ser os mesmos, mas o modelo de resposta e diferente porque a entidade focal e diferente.

## Decisoes tecnicas

### Banco

- `PostgreSQL 16`
- indices em `source_ref`, `source_*_id`, chaves estrangeiras e colunas de filtro frequente
- `GIN` apenas onde `JSONB` fizer sentido real
- `materialized views` para agregados mais pesados

### ORM ou query builder

- preferencia: `Kysely`
- alternativa: `Drizzle`

`Prisma` seria limitante aqui. O modelo de contexto exige **composicao dinamica de queries**: a estrutura da query (quais joins, quais selects, quais agregacoes) muda conforme as dimensoes ativas na requisicao. Prisma trata queries como objetos declarativos fixos, o que dificulta esse tipo de composicao sem perda de tipagem.

`Kysely` foi desenhado para isso. A query e construida de forma encadeada e o TypeScript mantem os tipos corretos ao longo de toda a composicao:

```ts
let query = db.selectFrom('core.matches as m').where('m.home_team_id', '=', teamId)

if (opponentId) {
  query = query.where('m.away_team_id', '=', opponentId).select([...confrontoFields])
}

if (refereeId) {
  query = query
    .innerJoin('core.referees as r', 'r.id', 'm.referee_id')
    .where('r.id', '=', refereeId)
    .select([...refereeStatsFields])
}
```

Cada dimensao ativa e um modificador de query. O modelo de contexto cresce de forma organizada sem perder coerencia de tipos.

### API

- `Fastify`
- validacao com `zod`
- contratos de resposta explicitamente tipados

### Jobs e automacao

O metodo de ingestao e unico. O que muda e o gatilho — manual via CLI ou automatico via fila agendada. As camadas de validacao e protecao existem independente do gatilho, justamente porque o sistema precisa ser seguro sem depender de supervisao humana.

#### Modelo de agendamento por partida

A automacao e orientada a partidas, nao a crons genericos.

Fluxo:

1. operador cadastra uma partida futura no sistema com o horario marcado
2. o sistema cria automaticamente os scrapes agendados com base nesse horario
3. os scrapes executam o mesmo metodo de ingestao que o CLI usaria

Exemplo de passes para uma partida marcada para as 16:00:

- 18:30 — primeiro scrape (partida provavelmente encerrada)
- 19:00 — segundo scrape (ajuste e complemento)
- 19:30 — terceiro scrape (consolidacao final)

O horario de referencia e sempre o horario marcado da partida, nao o timestamp real do inicio. Isso torna o agendamento previsivel mesmo quando o jogo comeca atrasado.

#### Batching por janela de tempo

Quando multiplas partidas se sobrepõem, os passes podem ser agrupados na mesma execucao para reduzir atrito com o banco e com o Sofascore.

Exemplo com duas partidas (19:30 e 20:00):

- 22:00 — scrape da partida 1 (pass 1)
- 22:30 — scrape da partida 1 (pass 2) + partida 2 (pass 1)
- 23:00 — scrape da partida 1 (pass 3) + partida 2 (pass 2)
- 23:30 — scrape da partida 2 (pass 3)

Essa otimizacao entra depois que o fluxo de uma partida estiver estavel.

#### Dados live

Os dados podem ser modelados para receber informacoes de jogos em andamento, mas o foco central e analise pos-jogo. O primeiro scrape ja ocorre ~2h30 apos o horario marcado — a partida provavelmente ja encerrou. Os passes seguintes refinam dados ja completos, nao atualizam em tempo real. Isso simplifica o modelo: sem necessidade de delta incremental complexo ou atualizacao em tempo real.

#### Tabela de controle

O agendamento nao pressupoe que a partida ja existe em `core.matches`. Quando o operador cadastra uma partida futura, o registro canonico ainda nao foi criado — ele so existira apos o primeiro scrape.

Por isso, o agendamento usa uma tabela de partidas planejadas separada:

`planned_matches`:
- `id`
- `provider` — ex: sofascore
- `provider_event_id` — o ID da partida no Sofascore
- `scheduled_at` — horario marcado da partida
- `core_match_id` — preenchido apos o primeiro scrape bem-sucedido

`scheduled_scrapes`:
- `id`
- `planned_match_id` — referencia a `planned_matches`
- `scheduled_for` — calculado a partir de `planned_matches.scheduled_at`
- `pass_number` — 1, 2, 3
- `status` — pending, running, done, failed
- `triggered_by` — cli, scheduler
- `run_id` — referencia ao log em `ingestion_runs` (preenchido apos execucao)

## Validacao e protecao da base

Como a ingestao altera dados canonicos, ela nao deve escrever no banco sem camadas de seguranca.

### Principio geral

Toda execucao de ingestao deve passar por:

1. validacao estrutural
2. validacao relacional
3. validacao de consistencia de negocio
4. promocao controlada para as tabelas canonicas

### Fluxo recomendado

#### 1. Staging antes do core

Nao escrever primeiro em `core.*`.

O caminho mais seguro e:

1. carregar dados em tabelas de `staging.*`
2. executar validacoes automaticas
3. promover para `core.*` somente se a execucao passar

Isso reduz o risco de uma automacao parcialmente quebrada desestruturar a base principal.

#### 2. Execucao idempotente

Toda ingestao deve ser idempotente.

Isso significa:

- mesma entrada nao pode gerar duplicacao
- `upsert` deve usar chaves naturais bem definidas, como `source_ref` e `source_*_id`
- reprocessar o mesmo evento deve preservar o estado esperado

#### 3. Dry-run e relatorio de diff

Antes de promover alteracoes, a ingestao deve conseguir rodar em modo `dry-run`.

O `dry-run` deve informar pelo menos:

- quantos registros seriam inseridos
- quantos seriam atualizados
- quantos seriam ignorados
- quais colunas canonicas mudariam
- quantos relacionamentos ficaram sem resolucao

Esse diff e importante para detectar regressao antes da escrita real.

### Validacoes minimas recomendadas

#### Estruturais

- schema de entrada confere com o esperado
- tipos obrigatorios presentes
- colunas obrigatorias nao vazias
- datas e numeros parseados corretamente

#### Relacionais

- toda FK candidata existe antes da promocao
- `matches` referenciam `teams`, `tournaments`, `seasons`, `stadiums` validos
- `lineups` referenciam `match`, `team` e `player` validos
- `player_match_stats` referenciam contexto existente em `lineups`
- `events` referenciam apenas `players`, `managers` e `teams` validos

#### De negocio

- `team_match_stats` bate com a agregacao final de `player_match_stats`
- eventos de substituicao possuem `related_player`
- eventos de gol carregam placar
- `ownGoal` respeita a semantica documentada
- managers fora de `home_manager` e `away_manager` continuam descartados

### Protecoes no banco

O banco tambem deve ajudar a bloquear escrita ruim.

Recomendacoes:

- `NOT NULL` onde a ausencia do campo torna o registro invalido
- `UNIQUE` nas chaves de identidade e nas chaves naturais de `upsert`
- FKs reais nas tabelas `core.*` sempre que o relacionamento ja for obrigatorio
- `CHECK CONSTRAINTS` para invariantes simples
- transacao por lote de ingestao

Se uma etapa critica falhar, a transacao inteira deve ser revertida.

### Promocao controlada

Mesmo depois de validar `staging.*`, a promocao para `core.*` deve ocorrer com regras claras:

- promover em transacao
- atualizar apenas colunas permitidas
- preservar overrides editoriais
- registrar contadores da execucao
- registrar amostras de erro e warnings

### Auditoria da ingestao

Cada execucao deve gerar um log estruturado, idealmente em uma tabela como `ingestion_runs`.

Campos uteis:

- `run_id`
- `source`
- `started_at`
- `finished_at`
- `status`
- `rows_inserted`
- `rows_updated`
- `rows_skipped`
- `validation_errors`
- `warnings`

Isso permite rastrear quando uma degradacao comecou e qual lote a introduziu.

### Estrategia pratica para este projeto

Como a ingestao pode ocorrer de forma automatica sem supervisao humana, o staging deixa de ser opcional e passa a ser a protecao padrao.

Fluxo de ingestao independente do gatilho (CLI ou scheduler):

1. scraper coleta dados do Sofascore
2. dados sao carregados em `staging.*`
3. validacoes automaticas executam
4. se passarem, promocao para `core.*` em transacao
5. resultado registrado em `ingestion_runs`

Se a validacao falhar, nenhum dado e promovido e o erro e registrado com contexto suficiente para inspecao posterior — mesmo que nao haja ninguem olhando no momento da execucao.

## Servicos sugeridos no monorepo

- `services/sofascore`
  continua como coletor, passa a persistir diretamente no banco
- `services/data-api`
  expoe endpoints consolidados
- `apps/directus` *(fase futura)*
  sobe o CMS conectado ao mesmo Postgres

## Infra local sugerida

Adicionar ao `docker-compose`:

- `postgres`
- `directus` *(fase futura)*
- opcionalmente `data-api`

Fluxo local:

1. scraper coleta e persiste diretamente no Postgres
2. API le do banco
3. Directus visualiza e edita o que for permitido *(fase futura)*

## Ordem recomendada de implementacao

### Fase 0 — Contrato de dados

- Derivar do codigo atual do scraper os tipos exatos de cada entidade
- Escrever as DDLs do schema `core` antes de subir qualquer servico
- Validar que todos os relacionamentos resolvem corretamente

### Fase 1 — Bootstrap e validacao

- Subir `PostgreSQL` no docker-compose
- Criar schema `core` com as DDLs validadas na Fase 0
- Rodar carga inicial a partir dos CSVs existentes via script temporario de migracao
- Validar chaves, constraints e relacionamentos com dados reais
- Esse script e descartavel apos a validacao — nao e um servico do monorepo

### Fase 2 — Migracao do scraper

- Adaptar `services/sofascore` para persistir diretamente no banco via `upsert`
- Remover dependencia de gerar CSVs como etapa de producao
- Validar que os dados ingeridos pelo scraper batem com o bootstrap da Fase 1

### Fase 3 — API

- Criar `services/data-api`
- Publicar endpoints de leitura principais com entidade focal + dimensoes opcionais
- Modelar primeiras `views` compostas na camada `read`

### Fase 4 — Directus

- Subir `Directus` somente quando houver controle de permissoes definido
- Definir colecoes editaveis e restricoes por camada
- Introduzir tabelas `editorial.*`

### Fase 5 — Automacao da ingestao

- Implementar `scheduled_scrapes` e a fila de agendamento por partida
- Cadastro manual de partidas futuras gerando scrapes agendados automaticamente
- O metodo de ingestao ja existe desde a Fase 2 — o que muda e apenas o gatilho

### Fase 6 — Robustez

- Adicionar camada `raw` e sincronizacao incremental mais robusta
- Migrar modelos de leitura repetitivos para `read.*`
- Preparar contrato de ingestao para recepcao de novas fontes no futuro
- Implementar batching de partidas por janela de tempo

## Recomendacao final

1. `PostgreSQL` como banco unico principal
2. CSVs existentes usados uma unica vez como bootstrap de validacao — script temporario, nao servico permanente
3. Estado final: `services/sofascore` → `staging.*` → `core.*` — sem intermediario CSV, com staging dentro do banco como camada de protecao
4. `Fastify + Kysely` para a API, com modelo de contexto por entidade focal + dimensoes
5. Arquitetura em camadas `raw`, `core`, `read` para separar ingestao, canonico e consumo
6. `Directus` introduzido apenas quando as protecoes de edicao estiverem definidas

Esse desenho elimina a indirection do CSV, usa os dados existentes de forma inteligente para validar a migracao, e deixa o projeto com um fluxo limpo e previsivel para crescer.
