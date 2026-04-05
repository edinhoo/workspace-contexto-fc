# Plano de Implementacao da Plataforma de Dados

Veja tambem: `docs/checklist-phase-0-data-platform.md`
Veja tambem: `docs/data-platform-contract.md`
Veja tambem: `docs/data-platform-schema-design.md`
Veja tambem: `docs/data-platform-constraints-matrix.md`
Veja tambem: `docs/data-platform-ddl-proposal.md`
Veja tambem: `docs/data-platform-ddl-review.md`
Veja tambem: `docs/data-platform-ddl-v1.md`
Veja tambem: `docs/phase-0-decisions-for-validation.md`
Veja tambem: `docs/phase-2-plan-ingestion-pipeline.md`

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

### Entregaveis

- `PostgreSQL` disponivel localmente no `docker-compose`
- scripts ou migracoes para criar schemas e tabelas iniciais
- script temporario de bootstrap a partir dos CSVs existentes
- primeira carga validada no banco

### Tarefas

- adicionar `postgres` na infra local
- criar DDLs iniciais do schema
- implementar script descartavel para carregar CSVs no banco
- validar integridade referencial e invariantes principais
- registrar divergencias entre CSVs atuais e schema proposto

### Dependencias

- Fase 0 concluida

### Criterios de pronto

- carga inicial executa sem corromper o banco
- relacionamentos essenciais batem com os dados reais
- o bootstrap pode ser removido depois sem deixar dependencia estrutural

## Fase 2 - Pipeline de ingestao seguro

### Objetivo

Criar o fluxo permanente de ingestao no banco com staging, validacao e promocao.

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

## Fase 3 - Migracao do scraper para o banco

### Objetivo

Fazer `services/sofascore` deixar de depender de CSV como etapa operacional.

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

## Fase 4 - API de leitura e contextos

### Objetivo

Expor os primeiros modelos compostos para consumo de apps futuros.

### Entregaveis

- `services/data-api`
- conexao com `PostgreSQL`
- contratos tipados de entrada e saida
- primeiros endpoints por entidade focal
- primeiras `views` ou queries da camada `read`

### Tarefas

- criar o servico `data-api`
- configurar `Fastify`, `Kysely` e `zod`
- implementar endpoints iniciais como `teams`, `matches`, `players` e `search`
- encapsular consultas compostas na camada `read`
- definir padroes de paginação, filtros e erros

### Dependencias

- Fase 3 concluida

### Criterios de pronto

- a API responde com modelos de contexto, nao apenas CRUD bruto
- as consultas principais usam `core.*` e `read.*` de forma previsivel
- existe cobertura inicial para contratos e consultas criticas

## Fase 5 - Planejamento e automacao da ingestao

### Objetivo

Automatizar a coleta por partida sem mudar o metodo de ingestao.

### Entregaveis

- tabela `planned_matches`
- tabela `scheduled_scrapes`
- fluxo de cadastro de partidas futuras
- scheduler ou worker de execucao

### Tarefas

- modelar `planned_matches` com `provider_event_id`
- gerar passes agendados a partir de `scheduled_at`
- disparar o mesmo metodo de ingestao usado pelo CLI
- registrar execucoes automaticas em `ingestion_runs`
- tratar retries, falhas e estados pendentes

### Dependencias

- Fase 3 concluida

### Criterios de pronto

- partidas futuras podem ser cadastradas e gerar scrapes automaticamente
- cada execucao fica auditavel
- automacao nao contorna staging nem validacoes

## Fase 6 - CMS e edicao operacional

### Objetivo

Introduzir o `Directus` sem comprometer o modelo canonico.

### Entregaveis

- `Directus` conectado ao banco
- permissoes por camada
- tabelas `editorial.*`
- colecoes operacionais basicas

### Tarefas

- subir `Directus` na infra local
- configurar acesso somente leitura para `raw.*`
- permitir edicao controlada em partes de `core.*`
- liberar edicao principal em `editorial.*`
- validar como overrides impactam `read.*`

### Dependencias

- Fase 4 concluida
- Fase 2 madura o suficiente para proteger o canonico

### Criterios de pronto

- o CMS nao escreve onde nao deveria
- overrides editoriais nao quebram ingestao
- equipe consegue navegar e ajustar dados com seguranca

## Fase 7 - Robustez e escala

### Objetivo

Preparar a plataforma para crescer com mais volume, automacao e novas fontes.

### Entregaveis

- camada `raw` consolidada
- batching por janela de tempo
- observabilidade melhorada
- modelo pronto para multiplas fontes

### Tarefas

- adicionar persistencia bruta onde fizer sentido
- otimizar janelas de execucao para multiplas partidas
- revisar indices e performance das queries principais
- materializar agregados mais pesados quando necessario
- preparar contrato de ingestao para novas origens

### Dependencias

- Fases 3, 4 e 5 em operacao estavel

### Criterios de pronto

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
