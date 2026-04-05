# Planejamento da Fase 3 - Migracao do Scraper para o Banco

Veja tambem: `docs/phase-2-closeout.md`
Veja tambem: `docs/phase-2-validation-report.md`
Veja tambem: `docs/phase-2-staging-compatibility-matrix.md`
Veja tambem: `docs/phase-3-integration-decision.md`

## Objetivo

Adaptar `services/sofascore` para deixar de depender de CSV como etapa operacional e passar a alimentar o pipeline do banco diretamente.

O estado alvo da fase e:

- `services/sofascore` produzindo records normalizados em memoria
- escrita controlada em `staging.*`
- validacao e promocao reutilizando o pipeline da Fase 2
- CSV deixando de ser obrigatorio no fluxo normal

## Base herdada da Fase 2

A Fase 3 nao parte do zero.

Ela ja recebe:

- `staging.*`, `core.*` e `ops.*` materializados
- validacao reutilizavel por entidade
- promocao transacional pronta
- `ops.ingestion_runs` e `ops.ingestion_run_details`
- `dry-run` funcional
- compatibilidade entre payload do scraper e `staging.*` documentada

## Aprendizados da Fase 2 que influenciam a Fase 3

### 1. `warnings` ainda nao sao populados

Hoje a pipeline distingue bem erro bloqueante, mas ainda nao usa `warnings` de forma util.

Implicacao para a Fase 3:

- a migracao do scraper nao deve introduzir uma classificacao paralela e informal de anomalias
- se surgirem casos nao bloqueantes recorrentes, eles devem ser registrados de forma estruturada

Direcao recomendada:

- manter erros bloqueantes como requisito minimo da fase
- mapear um primeiro conjunto pequeno de `warnings` reais apenas se isso aparecer durante a adaptacao

### 2. `source_ref` duplicado ainda nao falha cedo com mensagem amigavel

Na Fase 2 isso nao bloqueou porque os dados eram controlados.

Implicacao para a Fase 3:

- quando o scraper passar a escrever direto no banco, duplicidade de `source_ref` precisa falhar cedo e de forma legivel
- o erro deve apontar entidade e identificador de origem problematico

Direcao recomendada:

- adicionar pre-validacao de identidade antes da promocao do lote
- registrar duplicidade como erro bloqueante de ingestao, nao como falha opaca de `upsert`

### 3. `updated` hoje mistura mudanca semantica com refresh de timestamp

Na segunda ingestao da Fase 2, `130` updates foram apenas atualizacoes operacionais de `last_scraped_at` e `updated_at`.

Implicacao para a Fase 3:

- a leitura do diff por lote fica menos confiavel
- o scraper passara a gerar execucoes mais frequentes, tornando esse ruido mais visivel

Direcao recomendada:

- separar diff semantico de refresh operacional no relatorio da ingestao
- evitar tratar como `updated` execucoes que mudaram apenas timestamps tecnicos, quando isso for viavel

### 4. `staging.*` ainda opera como area de lote unico

Isso foi aceitavel na Fase 2 porque o uso era serial via CLI.

Implicacao para a Fase 3:

- a primeira versao da migracao do scraper deve continuar serial e controlada
- a fase nao deve assumir concorrencia ou execucao paralela ainda

Direcao recomendada:

- explicitar que a Fase 3 opera com uma execucao de scraper por vez
- deixar concorrencia como evolucao posterior, possivelmente junto da automacao da Fase 5

## Resultado esperado da Fase 3

Ao final da Fase 3, o projeto deve ter:

- `services/sofascore` escrevendo em `staging.*`
- pipeline `scraper -> staging -> validacao -> core` funcionando sem CSV intermediario
- comparacao entre o resultado do scraper migrado e a referencia conhecida da Fase 1/Fase 2
- logs e rastreabilidade suficientes para depuracao

## Entregaveis

- adaptacao da camada de storage do scraper para escrita no banco
- integracao do scraper com o pipeline de ingestao existente
- validacao explicita de identidade por entidade antes da promocao
- melhoria no diff para distinguir mudanca semantica de refresh operacional
- documentacao de execucao local do scraper escrevendo no banco
- relatorio de validacao da migracao do scraper

## Escopo por frente

### Frente 1 - Mapeamento do ponto de integracao no scraper

Objetivo:

- identificar onde os records finais do scraper hoje viram CSV
- definir o ponto mais estavel para substituir persistencia em arquivo por persistencia no banco

Tarefas:

- mapear os modulos de storage usados pelo `services/sofascore`
- identificar o contrato final por entidade antes da escrita em disco
- registrar a decisao de integracao entre:
  - nova camada de writer para banco
  - substituicao direta do storage atual

Criterio de pronto:

- existe um ponto de integracao claro, sem duplicar normalizacao ou regras de negocio
- a decisao arquitetural da frente foi registrada explicitamente

### Frente 2 - Escrita do scraper em `staging.*`

Objetivo:

- fazer o scraper persistir o lote atual do banco sem depender do bootstrap CSV

Tarefas:

- criar writer do scraper para o banco
- reutilizar o contrato de entidades ja mapeado na Fase 2
- manter `run_id`, `source` e timestamps de ingestao consistentes
- preservar o fluxo de um lote por vez

Criterio de pronto:

- uma execucao normal do scraper consegue preencher `staging.*` diretamente

### Frente 3 - Integracao com validacao e promocao

Objetivo:

- conectar a escrita do scraper ao pipeline ja pronto da Fase 2

Tarefas:

- acionar validacao logo apos a escrita do lote
- bloquear promocao quando houver erro estrutural, relacional ou de negocio
- promover para `core.*` apenas quando o lote estiver valido
- manter `ops.ingestion_runs` e `ops.ingestion_run_details` como trilha oficial da execucao

Criterio de pronto:

- o pipeline completo a partir do scraper funciona sem depender dos scripts de bootstrap

### Frente 4 - Endurecimentos herdados da revisao da Fase 2

Objetivo:

- evitar que a migracao do scraper carregue para frente os pontos de ambiguidade que ainda existem hoje

Tarefas:

- adicionar erro explicito para duplicidade de `source_ref` no lote
- separar, quando possivel, update semantico de refresh operacional de timestamp
- decidir um conjunto minimo de `warnings` reais ou registrar formalmente que a fase segue apenas com erros bloqueantes
- documentar que a versao inicial continua serial, sem concorrencia de lotes

Criterio de pronto:

- a operacao do scraper no banco fica compreensivel para quem analisa os runs depois

### Frente 5 - Comparacao com a referencia validada

Objetivo:

- provar que o scraper escrevendo no banco preserva o comportamento ja validado anteriormente

Tarefas:

- executar scraper migrado para o mesmo recorte conhecido da Fase 1/Fase 2
- comparar contagens, relacionamentos e entidades principais
- registrar diferencas aceitaveis e diferencas bloqueantes

Diferencas bloqueantes:

- perda de partidas
- perda de lineups ou events esperados
- quebra de relacionamento central entre match, team e player

Diferencas potencialmente aceitaveis:

- pequenos refreshes de timestamp
- enriquecimentos nao contraditorios
- warnings nao bloqueantes explicitamente documentados

Criterio de pronto:

- os resultados do scraper migrado batem semanticamente com a referencia validada

## Fora de escopo da Fase 3

- API de leitura
- automacao por partida
- concorrencia entre multiplos lotes simultaneos
- `Directus`
- popular `core.states`

## Criterios de encerramento da Fase 3

A Fase 3 pode ser considerada concluida quando:

- o scraper escreve em `staging.*` sem CSV intermediario
- a validacao e a promocao sao acionadas a partir da execucao real do scraper
- existe erro claro para duplicidade de identidade no lote
- o relatorio da execucao distingue melhor mudanca semantica de refresh operacional, ou deixa essa diferenca explicitamente documentada
- os resultados do scraper migrado batem com a referencia conhecida
