# Planejamento da Fase 2 - Pipeline Permanente de Ingestao

Veja tambem: `docs/phase-2-staging-compatibility-matrix.md`

## Objetivo

Transformar o fluxo validado na Fase 1 em um pipeline permanente de ingestao no banco, com:

- escrita controlada em `staging.*`
- validacao estrutural, relacional e de negocio
- promocao transacional para `core.*`
- idempotencia explicita
- `dry-run` com relatorio do que mudaria
- auditoria detalhada por execucao e por entidade

## Base herdada da Fase 1

A Fase 2 nao parte do zero.

Ela ja recebe:

- `PostgreSQL` local configurado
- migrations SQL versionadas
- `core.*`, `staging.*` e `ops.*` materializados
- bootstrap temporario validado com dados reais
- `ops.ingestion_runs` em uso real
- validacao basica e endurecimentos iniciais de schema

## O que a Fase 2 precisa confirmar antes de implementar

### 1. Cobertura real de `staging.*`

O schema de `staging.*` ja existe, mas precisa ser comparado com o payload real que hoje sai do scraper.

Objetivo:

- confirmar se o scraper atual produz exatamente o que `staging.*` espera
- detectar lacunas entre dados emitidos pelo scraper e colunas hoje existentes
- confirmar onde o modelo hibrido com `jsonb` ainda e suficiente

Saida esperada:

- matriz de compatibilidade `scraper payload -> staging table`
- lista curta de ajustes necessarios antes da escrita direta do scraper

### 2. Politica de idempotencia

Esta e a decisao mais critica da fase.

O bootstrap da Fase 1 usou `truncate + reinsert`, o que foi adequado para validacao inicial. A Fase 2 precisa de politica permanente.

Decisao recomendada:

- `upsert` em `core.*` usando as chaves naturais ja definidas
- evitar `truncate` no fluxo normal
- promover somente o lote validado da execucao corrente
- garantir que repetir a mesma execucao nao duplique nem corrompa o canonico

Implicacoes:

- cada entidade precisa ter chave natural confirmada
- a promocao deve distinguir `inserted`, `updated` e `skipped`
- a comparacao precisa acontecer por entidade, nao apenas no lote inteiro

### 3. Contrato minimo de `dry-run`

O `dry-run` da Fase 2 deve permitir:

- carregar dados em `staging.*`
- executar validacoes
- calcular o que seria inserido, atualizado ou ignorado
- gerar relatorio
- finalizar com `rollback`, sem alterar `core.*`

Objetivo:

- testar ingestao com seguranca
- apoiar depuracao
- dar visibilidade antes da promocao

## Resultado esperado da Fase 2

Ao final da Fase 2, o projeto deve ter:

- pipeline permanente `staging.* -> validacao -> core.*`
- promocao transacional por lote
- idempotencia validada
- `dry-run` funcional
- contadores por entidade em `ops.*`
- visibilidade clara do que mudou em cada execucao

## Entregaveis

- documento de compatibilidade entre payload do scraper e `staging.*`
- ajustes pontuais em `staging.*` se o payload real do scraper exigir
- mecanismo de validacao reutilizavel por entidade
- mecanismo de promocao transacional para `core.*`
- migration SQL versionada para `ops.ingestion_run_details`
- relatorio estruturado de `dry-run`
- scripts ou modulos que executem ingestao, promocao e validacao de forma repetivel

## Escopo por frente

### Frente 1 - Compatibilidade entre scraper e `staging.*`

Objetivo:

- mapear o payload real do scraper atual
- comparar com o schema ja materializado
- decidir se a Fase 2 precisa de migrations complementares antes da integracao

Tarefas:

- ler o fluxo atual de persistencia do `services/sofascore`
- mapear os records finais por entidade
- comparar com colunas e tabelas atuais de `staging.*`
- registrar gaps e ajustes necessarios

Entregavel obrigatorio:

- `docs/phase-2-staging-compatibility-matrix.md`

Criterio de pronto:

- nao ha ambiguidade entre o que o scraper produz e o que o banco espera

### Frente 2 - Validacao por entidade

Objetivo:

- transformar as validacoes hoje espalhadas em um fluxo reutilizavel por lote

Tarefas:

- separar validacoes estruturais, relacionais e de negocio
- classificar erros bloqueantes vs warnings
- registrar resultado de validacao por entidade e por execucao
- reaproveitar os checks ja validados na Fase 1

Criterio de pronto:

- cada entidade ingerida tem checks minimos padronizados
- uma falha relevante impede promocao para `core.*`

### Frente 3 - Promocao transacional

Objetivo:

- promover somente dados validados da execucao corrente

Tarefas:

- adotar a ordem de promocao ja validada na Fase 1 como baseline:
  - `countries`
  - `states`
  - `cities`
  - `stadiums`
  - `tournaments`
  - `seasons`
  - `referees`
  - `managers`
  - `teams`
  - `players`
  - `matches`
  - `lineups`
  - `player_match_stats`
  - `team_match_stats`
  - `events`
  - `player_career_teams`
- implementar `upsert` por chave natural
- impedir que execucao parcial altere `core.*`
- garantir transacao unica na promocao

Decisao recomendada:

- `insert ... on conflict do update` quando viavel
- fallback para estrategias equivalentes por entidade, desde que idempotentes

Criterio de pronto:

- repetir a mesma execucao nao gera duplicidade
- falha na promocao nao deixa `core.*` inconsistente

### Frente 4 - Auditoria detalhada

Objetivo:

- sair de um `ingestion_runs` resumido para uma auditoria mais util por entidade

Tabela recomendada:

`ops.ingestion_run_details`

Materializacao recomendada:

- migration SQL versionada dedicada, por exemplo `infra/db/migrations/000x_phase2_ingestion_run_details.sql`

Campos iniciais sugeridos:

- `id`
- `run_id`
- `entity`
- `rows_seen`
- `rows_valid`
- `rows_invalid`
- `rows_inserted`
- `rows_updated`
- `rows_skipped`
- `warnings`
- `validation_errors`
- `created_at`

Objetivo pratico:

- saber o que mudou por entidade
- suportar `dry-run`
- apoiar debugging e observabilidade

Criterio de pronto:

- cada execucao registra resultado consolidado e detalhado por entidade

### Frente 5 - `dry-run`

Objetivo:

- permitir simulacao segura da ingestao

Contrato minimo:

- carregar em `staging.*`
- validar
- calcular impacto por entidade
- gerar relatorio
- `rollback` explicito

Saida esperada:

- resumo geral do lote
- detalhes por entidade
- lista de erros bloqueantes
- lista de warnings

Criterio de pronto:

- existe forma confiavel de testar ingestao sem alterar `core.*`

## Fora de escopo da Fase 2

- adaptar ainda o scraper para gravar no banco em producao
- expor API de leitura
- automatizar scrapes por partida
- introduzir `Directus`
- popular `core.states`

Observacao:

- `core.states` permanece como entidade estrutural prevista
- `cities.state` continua opcional
- a Fase 2 nao deve tratar `states` como entidade ingerida

## Dependencias

- Fase 1 concluida
- schema atual validado
- bootstrap da Fase 1 usado como referencia de comportamento

## Riscos principais

- tentar acoplar scraper e pipeline permanente cedo demais
- definir idempotencia de forma incompleta
- aceitar `dry-run` superficial que nao reflita a promocao real
- espalhar logica de validacao em varios lugares sem uma camada clara

## Criterios de encerramento da Fase 2

A Fase 2 estara concluida quando:

- o payload real do scraper estiver compatibilizado com `staging.*`
- a politica de idempotencia estiver implementada e validada
- a promocao para `core.*` for transacional
- `ops.ingestion_run_details` estiver em uso
- `dry-run` gerar relatorio util sem alterar `core.*`
- houver confianca para iniciar a migracao do scraper na Fase 3
