# Plano do Proximo Ciclo - Scheduler Residente

Veja tambem: `docs/data-platform-program-closeout.md`
Veja tambem: `docs/phase-5-plan-scrape-automation.md`
Veja tambem: `docs/phase-7-closeout.md`

## Objetivo

Evoluir o scheduler atual de CLI pontual para um processo residente simples, previsivel e auditavel.

O objetivo deste ciclo nao e trocar o metodo de ingestao. O objetivo e manter o mesmo fluxo ja validado e apenas torná-lo continuo:

`scheduled_scrapes -> claim seguro -> scraper -> staging -> validacao -> core`

Nesta iteracao, o scheduler residente deve nascer como um servico Node proprio no
monorepo, com responsabilidade unica e sem reabrir a arquitetura de ingestao.

## O que este ciclo herda

- `planned_matches` e `scheduled_scrapes` ja existem
- o claim concorrente do scheduler ja esta endurecido
- o scraper ja expõe `SCRAPE_RESULT {json}`
- `warnings` ja tem papel minimo na observabilidade
- o pipeline de ingestao continua seguro e transacional

## Escopo

### Entra neste ciclo

- servico Node dedicado para o scheduler residente
- polling previsivel com intervalo configuravel
- boot/shutdown limpos
- logs operacionais minimos
- limite seguro de concorrencia inicial
- protecao contra loop ruidoso quando nao houver itens vencidos

### Fica fora deste ciclo

- segunda fonte de dados
- batching por janela
- distribuicao horizontal com multiplos workers em producao
- deploy em infraestrutura permanente
- dashboard operacional novo
- integracao de overrides editoriais na `data-api`

## Decisoes fechadas antes de executar

- o processo residente continua disparando o mesmo scraper como subprocesso
- o claim do trabalho continua no banco, com a logica segura ja validada
- a primeira iteracao nasce com concorrencia efetiva `1`
- o polling pode ser por intervalo fixo, sem cron sofisticado
- o scheduler residente nasce como servico Node proprio, nao como acumulado de script shell
- a primeira iteracao pode reutilizar o codigo de `scripts/db/automation/_shared.mjs`
- o intervalo padrao pode ser simples e explicito, por exemplo `15s`
- ao iniciar com backlog vencido, o servico segue o mesmo loop normal e processa um item por vez
- a operacao deve permitir encerramento gracioso sem perder item em execucao
- o ciclo nao reabre discussao de `raw.*` ou `read.*`

## Frentes de execucao

## Frente 1 - Contrato de processo

### Objetivo

Definir como o scheduler residente inicia, roda e encerra.

### Entregaveis

- comando dedicado de processo residente
- servico dedicado no monorepo para o worker
- configuracao minima de intervalo de polling
- politica de encerramento gracioso

### Tarefas

- definir comando de entrada do worker residente
- definir a localizacao do servico e a fronteira entre servico e helpers compartilhados
- definir variaveis minimas de configuracao
- definir comportamento em `SIGINT` e `SIGTERM`
- garantir fechamento limpo de pool e subprocessos

### Criterios de pronto

- existe um processo unico e claro para rodar o scheduler continuamente
- a responsabilidade do worker nao fica espalhada entre varios pontos do repo
- o encerramento nao deixa o processo em estado ambiguo

## Frente 2 - Loop residente e polling

### Objetivo

Executar o scheduler continuamente sem ruido operacional nem consumo desnecessario.

### Entregaveis

- loop de polling simples
- espera controlada entre iteracoes
- logs legiveis de idle, claim, sucesso e falha
- protecao simples contra logs de idle excessivos

### Tarefas

- implementar loop residente sobre o claim seguro ja existente
- definir intervalo padrao de polling
- registrar quando nao houver item vencido
- evitar spam excessivo em logs de idle
- garantir que so um item e processado por vez na iteracao inicial

### Criterios de pronto

- o processo residente continua trabalhando sem precisar de invocacao manual
- o modo idle e visivel, mas nao ruidoso

## Frente 3 - Operacao e recuperacao

### Objetivo

Dar previsibilidade de operacao minima para um processo que fica de pe.

### Entregaveis

- roteiro de execucao local
- comportamento claro em restart
- orientacao para reinspecao de falhas
- comandos simples de start e stop

### Tarefas

- documentar start, stop e restart do scheduler residente
- confirmar que restart nao quebra a fila
- documentar como correlacionar processo, `scheduled_scrape_id` e `run_id`
- registrar limitacoes conhecidas da primeira iteracao
- documentar que backlog vencido no boot segue o mesmo comportamento steady-state do loop

### Criterios de pronto

- o operador consegue subir e parar o processo com clareza
- falhas e retomadas ficam auditaveis
- o backlog inicial e tratado sem modo especial de `drain`

## Frente 4 - Validacao ponta a ponta

### Objetivo

Provar que o valor do processo residente e operacional, nao estrutural.

### Entregaveis

- roteiro de validacao do ciclo
- relatorio curto com pelo menos uma partida percorrendo o loop residente
- closeout do ciclo

### Tarefas

- criar ou reutilizar uma partida planejada de teste
- subir o processo residente
- deixar o worker capturar pelo menos um item vencido
- validar logs, `scheduled_scrapes` e `ingestion_runs`
- registrar ganhos e limites da iteracao
- validar tambem restart do processo durante modo idle

### Criterios de pronto

- o scheduler residente processa itens vencidos sem invocacao manual por item
- a trilha de auditoria continua igual ao modo atual
- a automacao fica mais proxima de operacao continua sem reescrita do pipeline

## Ordem recomendada

1. fechar contrato do processo
2. implementar loop de polling
3. documentar operacao e restart
4. validar ponta a ponta e registrar o closeout

## Riscos principais

- transformar o ciclo em tentativa de orquestracao distribuida cedo demais
- introduzir paralelismo antes de haver necessidade real
- esconder falhas do worker atras de loop silencioso
- misturar scheduler residente com segunda fonte ou nova camada de leitura

## Criterio de encerramento

Este ciclo pode ser considerado concluido quando:

- existir um servico Node claro para manter o scheduler em execucao continua
- o loop residente usar o claim seguro ja existente
- start, stop e restart estiverem documentados
- a validacao provar captura automatica de itens vencidos sem reabrir o desenho estrutural
