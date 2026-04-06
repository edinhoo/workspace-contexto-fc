# Plano de Implementacao da Plataforma de Dados

Veja tambem: `docs/checklist-phase-0-data-platform.md`
Veja tambem: `docs/data-platform-contract.md`
Veja tambem: `docs/data-platform-schema-design.md`
Veja tambem: `docs/data-platform-constraints-matrix.md`
Veja tambem: `docs/data-platform-ddl-proposal.md`
Veja tambem: `docs/data-platform-ddl-review.md`
Veja tambem: `docs/data-platform-ddl-v1.md`
Veja tambem: `docs/phase-0-decisions-for-validation.md`
Veja tambem: `docs/phase-1-plan-bootstrap-and-db.md`
Veja tambem: `docs/phase-1-closeout.md`
Veja tambem: `docs/phase-2-plan-ingestion-pipeline.md`
Veja tambem: `docs/phase-2-closeout.md`
Veja tambem: `docs/phase-3-plan-scraper-to-db.md`
Veja tambem: `docs/phase-3-closeout.md`
Veja tambem: `docs/phase-4-plan-data-api.md`
Veja tambem: `docs/phase-4-closeout.md`
Veja tambem: `docs/phase-4-validation-report.md`
Veja tambem: `docs/phase-5-plan-scrape-automation.md`
Veja tambem: `docs/phase-5-automation-states.md`
Veja tambem: `docs/phase-5-validation-report.md`
Veja tambem: `docs/phase-5-closeout.md`
Veja tambem: `docs/phase-6-plan-directus.md`
Veja tambem: `docs/phase-6-validation-report.md`
Veja tambem: `docs/phase-6-closeout.md`
Veja tambem: `docs/phase-7-plan-robustness-and-scale.md`
Veja tambem: `docs/phase-7-performance-review.md`
Veja tambem: `docs/phase-7-source-extension-notes.md`
Veja tambem: `docs/phase-7-validation-report.md`
Veja tambem: `docs/phase-7-closeout.md`
Veja tambem: `docs/data-platform-program-closeout.md`
Veja tambem: `docs/next-cycle-plan-web-app.md`
Veja tambem: `docs/next-cycle-web-app-closeout.md`
Veja tambem: `docs/next-cycle-plan-web-app-contexts.md`
Veja tambem: `docs/next-cycle-web-app-contexts-closeout.md`
Veja tambem: `docs/next-cycle-plan-web-app-slugs-and-tests.md`
Veja tambem: `docs/next-cycle-web-app-slugs-and-tests-closeout.md`
Veja tambem: `docs/next-cycle-plan-web-app-search-and-cache.md`
Veja tambem: `docs/next-cycle-web-app-search-and-cache-closeout.md`
Veja tambem: `docs/next-cycle-plan-resident-scheduler.md`

## Objetivo

Transformar a arquitetura descrita em `docs/next-services-architecture.md` em um plano pratico de execucao, com fases claras, dependencias, entregaveis e criterios de validacao.

## Resultado esperado

Ao final do plano, o projeto deve ter:

- `PostgreSQL` como base principal de persistencia
- ingestao segura via `staging.*` com promocao para `core.*`
- `services/sofascore` escrevendo no banco sem intermediario CSV
- `services/data-api` expondo contextos compostos para consumo
- automacao orientada a partidas
- base preparada para `Directus` e futuras fontes

## Principios de execucao

- implementar por fases pequenas e verificaveis
- nao misturar mudanca de modelo, mudanca de storage e automacao no mesmo passo
- proteger `core.*` com staging, validacoes e transacoes
- preferir marcos com dados reais antes de expandir escopo
- documentar contratos e regras junto com a implementacao

## Fase 0 - Preparacao e contrato de dados

### Objetivo

Fechar o contrato tecnico antes de subir servicos novos.

### Entregaveis

- definicao dos schemas `staging`, `core`, `read`, `raw` e `editorial`
- mapeamento entre CSVs atuais e tabelas futuras
- lista de chaves naturais para `upsert`
- definicao das constraints obrigatorias
- definicao inicial de `ingestion_runs`, `planned_matches` e `scheduled_scrapes`

### Tarefas

- derivar do scraper atual os campos exatos de cada entidade
- decidir quais colunas sao `NOT NULL`, `UNIQUE`, FK e `CHECK`
- mapear quais regras de negocio precisam virar validacoes automatizadas
- definir identificadores de origem, especialmente `source_ref` e `source_*_id`
- definir como `staging.*` espelha ou simplifica o payload normalizado

### Dependencias

- documentacao atual do scraper
- leitura dos tipos e records persistidos em `services/sofascore`

### Criterios de pronto

- todas as tabelas principais possuem desenho inicial aprovado
- regras de identidade e relacionamento estao documentadas
- nao existe ambiguidade entre o que entra em `staging.*` e o que vira `core.*`

## Fase 1 - Banco e bootstrap de validacao

### Objetivo

Validar o desenho do banco com dados reais usando os CSVs atuais uma unica vez.

### Status

Concluida.

### Entregaveis

- `PostgreSQL` disponivel localmente no `docker-compose`
- scripts ou migracoes para criar schemas e tabelas iniciais
- script temporario de bootstrap a partir dos CSVs existentes
- primeira carga validada no banco

### Tarefas

- adicionar `postgres` na infra local
- criar DDLs iniciais do schema
- implementar script descartavel para carregar CSVs em `staging.*` e promover para `core.*`
- validar integridade referencial e invariantes principais
- registrar divergencias entre CSVs atuais e schema proposto

### Dependencias

- Fase 0 concluida

### Criterios de pronto

- carga inicial executa sem corromper o banco
- relacionamentos essenciais batem com os dados reais
- o fluxo `staging.* -> core.*` foi validado pelo bootstrap
- o bootstrap pode ser removido depois sem deixar dependencia estrutural

### Resultado consolidado

- banco local executado com sucesso
- migrations SQL versionadas validadas em banco limpo
- bootstrap temporario executado com `354` registros promovidos
- checks relacionais, de unicidade e semantica basica retornaram `0` inconsistencias
- endurecimentos pos-execucao aplicados ainda na propria Fase 1

## Fase 2 - Pipeline de ingestao seguro

### Objetivo

Criar o fluxo permanente de ingestao no banco com staging, validacao e promocao.

### Status

Concluida.

### Entregaveis

- tabelas `staging.*`
- mecanismos de validacao estrutural, relacional e de negocio
- promocao transacional de `staging.*` para `core.*`
- tabela `ingestion_runs`
- suporte a `dry-run`

### Tarefas

- confirmar compatibilidade entre payload real do scraper e `staging.*`
- implementar validacoes automaticas reutilizando as regras ja consolidadas no projeto
- implementar promocao controlada para `core.*`
- definir politica explicita de idempotencia para o canonico
- registrar resultado de cada execucao em `ingestion_runs`
- adicionar `ops.ingestion_run_details` com contadores por entidade
- implementar `dry-run` com validacao, relatorio e `rollback`

### Dependencias

- Fase 1 concluida

### Criterios de pronto

- uma execucao falha nao altera `core.*`
- a mesma execucao pode ser repetida sem duplicar dados
- existe visibilidade clara do que mudou em cada lote
- existe `dry-run` confiavel sem impacto em `core.*`

### Resultado consolidado

- compatibilidade entre o payload do scraper e `staging.*` confirmada
- validacao reutilizavel por entidade implementada
- promocao transacional para `core.*` implementada
- `ops.ingestion_run_details` materializado e populado por execucao
- primeira ingestao concluida com `354` insercoes e `0` invalidacoes
- segunda ingestao sem duplicidade no canonico
- `dry-run` validado com `rollback` explicito e relatorio proprio

## Fase 3 - Migracao do scraper para o banco

### Objetivo

Fazer `services/sofascore` deixar de depender de CSV como etapa operacional.

### Status

Concluida.

### Entregaveis

- scraper escrevendo em `staging.*`
- pipeline completo `scraper -> staging -> validacao -> core`
- remocao da necessidade de gerar CSVs em execucao normal

### Tarefas

- adaptar o storage atual do scraper para escrita no banco
- preservar normalizacao e regras semanticas ja existentes
- comparar o resultado do scraper novo com o bootstrap validado na Fase 1
- manter logs e rastreabilidade da origem

### Dependencias

- Fase 2 concluida

### Criterios de pronto

- o scraper popula o banco de forma consistente
- os resultados batem com a referencia validada
- CSV deixa de ser obrigatorio no fluxo normal

### Resultado consolidado

- `services/sofascore` integrado ao pipeline permanente do banco
- escrita em `staging.*` sem intermediario CSV obrigatorio
- erro cedo para conflitos de identidade no lote
- segunda execucao do mesmo snapshot com `0` updates semanticos e `251` registros marcados como `skipped`
- validacao concluida com recorte controlado do evento `15237889`

## Fase 4 - API de leitura e contextos

### Objetivo

Expor os primeiros modelos compostos para consumo de apps futuros.

### Status

Concluida.

### Entregaveis

- `services/data-api`
- conexao com `PostgreSQL`
- contratos tipados de entrada e saida
- primeiros endpoints por entidade focal
- primeiras `views` ou queries da camada `read`

### Tarefas

- criar o servico `data-api`
- configurar `Fastify`, `Kysely` e `zod`
- implementar endpoints iniciais como `health`, `search`, `matches`, `teams` e `players`
- encapsular consultas compostas na camada `read`
- definir padroes de paginação, filtros e erros
- definir `search` com discriminador explicito de tipo na resposta
- cobrir contratos de rota e queries criticas desde a primeira iteracao

### Dependencias

- Fase 3 concluida

### Criterios de pronto

- a API responde com modelos de contexto, nao apenas CRUD bruto
- as consultas principais usam `core.*` e `read.*` de forma previsivel
- existe cobertura inicial para contratos e consultas criticas

### Precisao de escopo

- comecar com `core.*` como base padrao de leitura
- introduzir `read.*` apenas onde houver ganho claro de reuso ou clareza
- manter a API orientada a entidade focal com dimensoes opcionais
- nao incluir automacao, `Directus` ou autenticacao nesta fase
- assumir que alguns contextos terao baixo volume no banco atual sem tratar isso como bug da API

### Resultado consolidado

- `services/data-api` criado e validado localmente
- endpoints iniciais entregues: `health`, `search`, `matches/:id`, `teams/:id` e `players/:id`
- contratos tipados e padrao de erro definidos
- queries compostas implementadas sobre `core.*`
- `read.*` ainda nao precisou ser materializado
- suite inicial de testes com `6` testes aprovados, incluindo integracao com banco local

## Fase 5 - Planejamento e automacao da ingestao

### Objetivo

Automatizar a coleta por partida sem mudar o metodo de ingestao.

### Status

Concluida.

### Entregaveis

- `ops.planned_matches`
- `ops.scheduled_scrapes`
- fluxo de cadastro de partidas futuras
- scheduler ou worker serial de execucao
- vinculo entre automacao e `ops.ingestion_runs`

### Tarefas

- modelar `planned_matches` com `provider_event_id`
- gerar passes agendados a partir de `scheduled_at`
- disparar o mesmo metodo de ingestao usado pelo CLI
- registrar execucoes automaticas em `ingestion_runs`
- preencher `scheduled_scrapes.run_id` e `planned_matches.core_match_id`
- tratar retries, falhas e estados pendentes
- manter a execucao automatica em modo serial na primeira iteracao

### Dependencias

- Fase 3 concluida
- Fase 4 concluida

### Criterios de pronto

- partidas futuras podem ser cadastradas e gerar scrapes automaticamente
- cada execucao fica auditavel
- automacao nao contorna staging nem validacoes
- um passe executado pelo scheduler deixa rastro claro por `planned_match_id`, `scheduled_scrape_id` e `run_id`

### Precisao de escopo

- comecar com cadastro operacional via CLI ou script
- manter tres passes fixos por partida na primeira iteracao
- usar offsets fixos `+2h30`, `+3h` e `+3h30`
- manter o scheduler em modo serial, sem concorrencia entre lotes
- permitir ate `2` retries automaticos apenas para falhas operacionais
- falhas bloqueantes de validacao vao direto para `failed`
- remarcacao de partida cancela scrapes futuros pendentes e regenera a agenda
- adiar batching por janela de tempo para a Fase 7
- nao introduzir UI, `Directus` ou logica live nesta fase

### Resultado consolidado

- `ops.planned_matches` e `ops.scheduled_scrapes` materializados
- agenda automatica de tres passes por partida implementada
- scheduler serial validado com o mesmo pipeline do scraper manual
- `planned_match_id -> scheduled_scrape_id -> run_id` confirmado na pratica
- primeiro run automatico com `251` insercoes
- runs seguintes sem duplicidade no canônico
- cancelamento e rerun manual validados

## Fase 6 - CMS e edicao operacional

### Objetivo

Introduzir o `Directus` sem comprometer o modelo canonico.

### Status

Concluida.

### Entregaveis

- `Directus` conectado ao banco
- permissoes por camada
- tabelas `editorial.*`
- colecoes operacionais basicas
- primeiro fluxo real de ajuste manual controlado

### Tarefas

- subir `Directus` na infra local
- configurar acesso somente leitura para `raw.*`, `staging.*` e `ops.*`
- permitir edicao controlada apenas onde houver excecao justificada em `core.*`
- liberar edicao principal em `editorial.*`
- decidir o primeiro caso real de override/manual
- validar como overrides impactam `read.*` ou a camada de leitura da API

### Dependencias

- Fase 4 concluida
- Fase 5 concluida

### Criterios de pronto

- o CMS nao escreve onde nao deveria
- overrides editoriais nao quebram ingestao
- equipe consegue navegar e ajustar dados com seguranca

### Precisao de escopo

- iniciar com poucos casos editoriais e nao com abertura ampla do banco
- manter `raw.*`, `staging.*` e `ops.*` fora de edicao
- manter as tabelas internas do CMS no setup validado em runtime
- usar superficies operacionais `panel_*` como ponto de contato do painel
- sincronizar `panel_states -> core.states`
- sincronizar `panel_team_overrides -> editorial.team_overrides`
- aplicar override em leitura final apenas se houver ganho claro nesta fase

### Resultado consolidado

- `Directus` local validado no mesmo banco do projeto
- permissoes aplicadas sem abrir escrita ampla em `core.*`, `raw.*`, `staging.*` ou `ops.*`
- `panel_states` validado como fluxo manual sincronizado para `core.states`
- `panel_team_overrides` validado como fluxo editorial sincronizado para `editorial.team_overrides`
- decisao explicita de nao aplicar overrides ainda na `data-api`

## Fase 7 - Robustez e escala

### Objetivo

Preparar a plataforma para crescer com mais volume, automacao e novas fontes.

### Entregaveis

- camada `raw` consolidada
- batching por janela de tempo
- observabilidade melhorada
- modelo pronto para multiplas fontes

### Tarefas

- estabilizar o contrato de saida do scraper para o scheduler
- migrar a reserva transacional do scheduler para conexao direta em `Node.js`
- endurecer a reserva do proximo `scheduled_scrape` para cenarios concorrentes
- melhorar observabilidade, diffs e papel de `warnings`
- adicionar persistencia bruta onde fizer sentido
- revisar indices e performance das queries principais
- materializar `read.*` apenas quando houver repeticao concreta
- preparar contrato de ingestao para novas origens

### Dependencias

- Fases 3, 4, 5 e 6 em operacao estavel

### Criterios de pronto

- o scheduler deixa de depender de contrato textual fragil
- a reserva do proximo scrape fica segura em concorrencia
- a observabilidade das execucoes melhora de forma verificavel
- a plataforma aguenta crescer sem reescrita estrutural
- gargalos principais estao mapeados
- novas fontes podem entrar sem quebrar o modelo atual

## Ordem resumida

1. contrato de dados
2. banco e bootstrap com CSVs atuais
3. pipeline seguro com staging e promocao
4. migracao do scraper
5. API de leitura
6. automacao por partidas
7. Directus
8. robustez e escala

## Riscos principais

- subir automacao antes de validar o pipeline de ingestao
- escrever em `core.*` sem staging e rollback adequado
- modelar o schema cedo demais sem conferir dados reais
- acoplar API demais ao schema interno
- abrir edicao no CMS antes de isolar overrides editoriais

## Recomendacao pratica

Se a meta for reduzir risco e ganhar velocidade real, o melhor recorte inicial e:

1. Fase 0 completa
2. Fase 1 com bootstrap real no Postgres
3. Fase 2 com staging, validacao e `ingestion_runs`
4. Fase 3 com o scraper escrevendo no banco

Depois disso, o projeto ja sai da dependencia operacional de CSV e entra numa base muito mais segura para construir API, automacao e CMS.

## Depois do plano original

Com o plano de 7 fases concluido, os proximos trabalhos deixam de ser fases fundacionais e passam a ser ciclos incrementais.

## Ciclos incrementais do Web App

### Ciclo 1 - Fundacao inicial

Concluido.

### Resultado consolidado

- `apps/web` criado com `Next.js`
- BFF inicial funcionando sobre a `data-api`
- busca validada com dados reais
- contexto inicial de partida validado com dados reais

### Limitacoes conhecidas

- navegacao da busca ainda fecha apenas para `match`
- a URL atual de partida ainda usa `id` interno, nao `slug`
- busca continua orientada a submit, nao a interacao em tempo real

### Ciclo 2 - Contextos principais

Concluido.

#### Resultado consolidado

- busca, partida, time e jogador passaram a ter navegacao cruzada funcional
- `team` e `player` adotaram URL publica por `slug`
- o app ainda dependia de `?id=` para lookup interno

### Ciclo 3 - Slugs e testes

Concluido.

#### Resultado consolidado

- `services/data-api` ganhou lookup canonico por `slug`
- o app passou a usar URLs publicas coerentes para:
  - `/matches/[slug]`
  - `/teams/[slug]`
  - `/players/[slug]`
- `team` e `player` deixaram de depender de `?id=`
- o `apps/web` ganhou a primeira base de testes com `Vitest`

#### Limitacoes conhecidas

- busca ainda e por submit, nao por digitacao incremental
- `cache: "no-store"` continua sendo a estrategia padrao do cliente HTTP
- a cobertura de testes ainda esta concentrada em cliente HTTP e BFF

## Ciclo incremental mais recente

### Busca e cache do web app

Concluido.

#### Resultado consolidado

- a busca passou a ter resultados em tempo real com debounce
- a URL continua representando apenas a busca confirmada
- o cliente HTTP ganhou uma estrategia inicial de cache por contexto
- a cobertura de testes do BFF/cliente foi ampliada

#### Limitacoes conhecidas

- a busca cliente ainda nao possui testes especificos de componente
- a estrategia de cache ainda e inicial e deliberadamente simples

## Ordem sugerida agora

1. scheduler residente
2. refinamentos incrementais do web app

### Motivo

- o web app ja tem base, contexto, slugs, testes e busca mais fluida
- o scheduler residente volta a ser o proximo ganho mais evidente fora da camada de produto
- os refinamentos restantes do app agora sao incrementais, nao travas estruturais

### Recorte sugerido

- servico Node proprio no monorepo
- concorrencia efetiva `1`
- polling fixo e previsivel
- mesmo scraper e mesmo claim seguro ja validados

## Contexto do ciclo concluido

### Busca e cache do web app

O ciclo entregue fez:

- melhorar a busca para uma experiencia interativa com debounce
- introduzir uma estrategia inicial de cache por rota
- ampliar os testes do BFF/cliente para acompanhar esse comportamento
