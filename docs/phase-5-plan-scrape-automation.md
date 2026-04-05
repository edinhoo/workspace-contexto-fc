# Plano da Fase 5 - Automacao da Ingestao

Veja tambem: `docs/implementation-plan-data-platform.md`
Veja tambem: `docs/next-services-architecture.md`
Veja tambem: `docs/phase-2-closeout.md`
Veja tambem: `docs/phase-3-closeout.md`
Veja tambem: `docs/phase-4-closeout.md`

## Objetivo

Automatizar a ingestao por partida sem alterar o metodo de carga ja validado nas fases anteriores.

Nesta fase, o ganho nao vem de um pipeline novo. O ganho vem de trocar o gatilho manual por um fluxo previsivel de:

`planned_matches -> scheduled_scrapes -> scraper -> staging -> validacao -> core`

## O que a Fase 5 herda

- a ingestao segura `staging.* -> core.*` ja esta validada
- o scraper ja escreve no banco sem depender de CSV
- a API de leitura ja existe para inspecionar o resultado no canônico
- `warnings` seguem como pendencia nao bloqueante
- `staging.*` continua operando como area de um lote por vez

## Escopo da fase

### Entra nesta fase

- modelagem operacional de `ops.planned_matches`
- modelagem operacional de `ops.scheduled_scrapes`
- geracao automatica dos passes por partida planejada
- worker ou scheduler serial para executar scrapes pendentes
- rastreabilidade da automacao ate `ops.ingestion_runs`
- politica minima de retry e reexecucao manual

### Fica fora desta fase

- batching de multiplas partidas por janela de tempo
- ingestao live ou quasi-live
- concorrencia entre multiplos lotes
- interface visual de operacao
- `Directus`
- novos tipos de warning sofisticados

## Decisoes fechadas antes de executar

- o cadastro inicial de partidas planejadas pode ser via CLI ou script administrativo; nao depende de UI nesta fase
- a execucao automatica reutiliza exatamente o mesmo metodo de ingestao do scraper manual
- a automacao roda em modo serial, com um lote por vez
- os passes continuam orientados ao horario marcado da partida, nao ao inicio real
- o modelo inicial usa tres passes por partida, derivados de `scheduled_at`
- os tres offsets da primeira iteracao sao `+2h30`, `+3h` e `+3h30`
- o retry automatico ocorre no maximo `2` vezes e apenas para falhas operacionais
- falha de validacao bloqueante nao entra em retry automatico e vai direto para `failed`
- remarcacao de partida cancela apenas scrapes futuros ainda nao executados e regenera os passes com base no novo `scheduled_at`
- `core.states` continua fora do escopo operacional desta fase

## Frentes de execucao

## Frente 1 - Contrato operacional da automacao

### Objetivo

Fechar as tabelas e estados minimos que a automacao precisa para operar com clareza.

### Entregaveis

- migration para `ops.planned_matches`
- migration para `ops.scheduled_scrapes`
- documento curto de estados e transicoes operacionais

### Tarefas

- definir colunas de `ops.planned_matches`
- definir colunas de `ops.scheduled_scrapes`
- registrar estados minimos: `pending`, `running`, `done`, `failed`, `cancelled`
- definir campos de rastreio: `triggered_by`, `run_id`, `error_message`, `attempt_count`
- definir quando `core_match_id` e preenchido apos o primeiro scrape bem-sucedido

### Criterios de pronto

- existe contrato claro para planejar uma partida futura
- existe contrato claro para saber o estado de cada passe agendado
- dado um `scheduled_scrape`, e possivel rastrear sua execucao ate `ops.ingestion_runs`

## Frente 2 - Planejamento por partida

### Objetivo

Gerar automaticamente os passes agendados a partir de uma partida planejada.

### Entregaveis

- script ou comando para criar `planned_matches`
- geracao automatica de tres `scheduled_scrapes` por partida
- regra documentada de offsets por passe

### Tarefas

- implementar cadastro manual de `planned_matches`
- gerar `scheduled_scrapes` no ato do cadastro
- impedir duplicidade indevida para o mesmo `provider_event_id`
- documentar os offsets fixos da V1: `+2h30`, `+3h`, `+3h30`
- permitir replanejamento controlado quando `scheduled_at` mudar

### Criterios de pronto

- cadastrar uma partida futura gera os tres passes previstos
- o agendamento e deterministico e reproduzivel
- o sistema evita duplicar a mesma partida planejada por engano

## Frente 3 - Executor serial do scheduler

### Objetivo

Executar scrapes pendentes sem abrir concorrencia nem desviar do pipeline seguro existente.

### Entregaveis

- worker ou comando de scheduler serial
- selecao de scrapes `pending` prontos para execucao
- transicao correta de estado `pending -> running -> done|failed`

### Tarefas

- buscar `scheduled_scrapes` vencidos em ordem previsivel
- marcar um item como `running` antes da execucao
- disparar o mesmo fluxo do scraper manual para o `provider_event_id`
- registrar `run_id` apos a ingestao
- preencher `core_match_id` em `planned_matches` quando o primeiro run bem-sucedido produzir a partida canonica
- registrar falha com mensagem curta e contador de tentativas

### Criterios de pronto

- um passe agendado pode ser executado sem intervenção manual
- a automacao nao pula `staging.*`, validacao nem promocao
- o worker processa um item por vez sem ambiguidade de estado

## Frente 4 - Reexecucao, retry e operacao minima

### Objetivo

Dar previsibilidade para falha operacional sem inflar a fase com orquestracao pesada.

### Entregaveis

- politica minima de retry
- comando para reexecutar um `scheduled_scrape`
- comandos ou consultas de apoio operacional

### Tarefas

- definir limite inicial de tentativas automaticas
- distinguir falha de ingestao de falha operacional do scheduler
- permitir reexecucao manual de um passe especifico
- documentar como cancelar um scrape agendado
- documentar como reinspecionar `run_id`, `scheduled_scrape_id` e `planned_match_id`

### Criterios de pronto

- um item com falha pode ser reprocessado sem ajuste manual no banco
- existe forma clara de cancelar ou rerodar um passe
- o operador consegue entender por que um item falhou

## Frente 5 - Validacao da automacao ponta a ponta

### Objetivo

Provar que o scheduler adiciona somente o gatilho automatico, sem alterar o metodo de ingestao.

### Entregaveis

- roteiro de validacao da fase
- relatorio de execucao automatica com pelo menos uma partida planejada
- closeout da fase

### Tarefas

- criar uma partida planejada de teste
- confirmar geracao dos tres passes
- executar pelo menos um passe por scheduler
- validar que `scheduled_scrapes.run_id` aponta para `ops.ingestion_runs`
- validar que o resultado no `core.*` e equivalente ao da execucao manual para o mesmo `provider_event_id`
- registrar limitacoes conhecidas da fase

### Criterios de pronto

- uma partida planejada percorre o fluxo ate a execucao automatica real
- o metodo de ingestao continua igual ao manual
- a automacao e auditavel por `planned_match_id`, `scheduled_scrape_id` e `run_id`

## Ordem recomendada

1. fechar contrato operacional
2. implementar cadastro e geracao dos passes
3. implementar executor serial
4. adicionar retry e reexecucao minima
5. validar ponta a ponta e documentar

## Riscos principais

- reabrir a discussao de concorrencia cedo demais
- misturar scheduler com batching antes de uma partida isolada estar estavel
- criar um fluxo automatico que contorne o pipeline seguro ja validado
- deixar os estados operacionais vagos demais para diagnosticar falhas
- depender de UI antes de provar o fluxo via CLI ou script

## Decisoes praticas antes de executar

- usar cadastro inicial via CLI/script e nao via interface
- manter tres passes fixos na primeira iteracao
- manter os offsets `+2h30`, `+3h` e `+3h30`
- manter worker serial, sem execucao paralela
- aplicar retry automatico apenas para falha operacional, limitado a `2` tentativas
- cancelar scrapes futuros pendentes quando houver remarcacao e regenerar a agenda
- considerar `warnings` ainda fora do caminho critico da automacao

## Criterio de encerramento da fase

A Fase 5 pode ser considerada concluida quando:

- uma partida futura pode ser cadastrada em `ops.planned_matches`
- o sistema gera automaticamente os `scheduled_scrapes`
- um worker serial executa os passes vencidos usando o mesmo pipeline do scraper manual
- cada execucao automatica fica ligada a `ops.ingestion_runs`
- a automacao prova valor sem introduzir concorrencia, batching ou novos caminhos de ingestao
