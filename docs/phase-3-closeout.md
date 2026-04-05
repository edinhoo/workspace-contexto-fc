# Encerramento da Fase 3

Veja tambem: `docs/phase-3-plan-scraper-to-db.md`
Veja tambem: `docs/phase-3-validation-report.md`
Veja tambem: `docs/phase-3-integration-decision.md`

## Status

Fase 3 concluida.

## O que foi entregue

- decisao arquitetural do ponto de integracao do scraper com o banco
- extracao do snapshot normalizado do scraper como artefato reutilizavel
- carregamento do estado existente a partir de `core.*`
- writer do scraper para o pipeline do banco
- execucao real `scraper -> staging -> validacao -> core`
- erro explicito para duplicidade de identidade no lote
- diff mais limpo no segundo run, sem contar refresh operacional de timestamp como update semantico
- documentacao de uso local do scraper com targets de persistencia

## O que a Fase 3 confirmou

- o scraper nao depende mais de CSV como etapa operacional obrigatoria
- a normalizacao existente pode ser preservada sem reescrever a camada inteira de storage
- a Fase 2 era base suficiente para receber o lote do scraper diretamente
- a comparacao com a referencia conhecida segue valida em um snapshot fixo do evento testado

## Decisao sobre warnings

Nesta fase, a decisao foi manter:

- erros bloqueantes como mecanismo operacional obrigatorio
- `warnings` ainda fora do fluxo principal, ate existir criterio claro e estavel para usalos

## Pendencias nao bloqueantes

- `warnings` continua sem populacao relevante em `ops.ingestion_run_details`
- a concorrencia entre multiplos lotes segue fora de escopo
- `staging.*` continua operando como area de um lote por vez

## Decisao de encerramento

A Fase 3 fica formalmente encerrada.

O proximo passo recomendado e a Fase 4, com foco em:

- API de leitura
- modelos de contexto
- consultas compostas sobre `core.*` e futura camada `read.*`
