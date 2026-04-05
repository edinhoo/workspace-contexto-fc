# Notas de Extensao para Novas Fontes na Fase 7

Veja tambem: `docs/phase-7-plan-robustness-and-scale.md`
Veja tambem: `docs/phase-7-closeout.md`
Veja tambem: `docs/next-services-architecture.md`

## Objetivo

Registrar o recorte minimo para uma futura segunda fonte sem quebrar o desenho atual.

## O que ja esta reaproveitavel

- `ops.ingestion_runs` como trilha comum de execucao
- `staging.*` como area de lote com validacao previa
- promocao para `core.*` orientada por chaves naturais
- `ops.ingestion_run_details` como resumo por entidade
- `services/data-api` lendo de `core.*`, sem acoplamento direto ao formato do scraper

## O que ainda esta especifico demais do Sofascore

- nomes de scripts e prefixos de `run_id`
- parte das regras de validacao e dos warnings ainda assumem entidades e formatos do Sofascore
- o scheduler atual conhece `provider = sofascore` como caso principal
- a montagem do snapshot ainda nasce dentro de `services/sofascore`

## Recorte minimo para uma segunda fonte

Uma nova fonte nao precisa reaproveitar o scraper atual, mas precisa respeitar este contrato:

1. produzir um lote identificavel por `run_id`
2. preencher `staging.*` com o mesmo contrato canônico por entidade
3. passar pelas validacoes bloqueantes antes da promocao
4. registrar detalhes em `ops.ingestion_run_details`
5. promover para `core.*` sem criar chave paralela fora de `source` + `source_ref`

## Ponto de extensao recomendado

O ponto mais limpo de extensao continua sendo:

- um adaptador por fonte que converte o payload bruto para o contrato de entidades do projeto

Em termos praticos:

- `services/sofascore` continua como um adaptador especifico
- uma futura `services/<nova-fonte>` deveria produzir o mesmo formato intermediario que hoje alimenta `load-staging`

## O que nao deve mudar com uma nova fonte

- `core.*` como canônico do projeto
- promocao transacional `staging.* -> core.*`
- auditoria por run e por entidade em `ops.*`
- `data-api` consumindo contexto consolidado, nao a origem bruta

## Conclusao

A Fase 7 fecha o plano deixando claro que a segunda fonte nao depende de uma reescrita estrutural.

O proximo passo natural, quando isso virar prioridade, e criar um adaptador novo para `staging.*`, e nao abrir um segundo canônico paralelo.
