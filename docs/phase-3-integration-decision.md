# Decisao de Integracao da Fase 3

Veja tambem: `docs/phase-3-plan-scraper-to-db.md`

## Decisao

A integracao do scraper com o banco entra como uma camada nova de writer, sem substituir de imediato os modulos de storage CSV.

## Ponto de integracao escolhido

O ponto mais estavel para a migracao e o momento imediatamente posterior a:

- `upsert*`
- `relink*`
- `buildTeamMatchStats`

Ou seja:

- o scraper continua produzindo os arrays normalizados por entidade
- a escrita em CSV deixa de ser a unica saida operacional
- uma nova camada passa a receber esse snapshot normalizado e enviá-lo para `staging.*`

## Por que essa decisao faz sentido

### 1. Evita duplicar regras de negocio

As regras sensiveis do scraper ja estao concentradas hoje em:

- normalizacao do `sofascore-client`
- `upsert*`
- `relink*`
- derivacao de `team_match_stats`

Substituir diretamente os modulos CSV por uma implementacao de banco logo na primeira iteracao aumentaria o risco de divergencia funcional.

### 2. Preserva um fallback util

Os modulos CSV continuam uteis para:

- inspecao manual
- comparacao de comportamento
- fallback controlado durante a migracao

Na Fase 3, o objetivo e remover a obrigatoriedade do CSV no fluxo normal, nao apagar toda a capacidade de exportacao local.

### 3. Reaproveita o pipeline da Fase 2

O banco ja sabe fazer:

- carga em `staging.*`
- validacao
- promocao
- auditoria
- `dry-run`

Logo, a Fase 3 nao precisa recriar isso dentro do scraper. Ela so precisa trocar a origem do lote.

## Consequencias praticas

- o scraper passara a ter um modo operacional de saida para banco
- a escrita no banco recebera o snapshot normalizado em memoria
- o fluxo CSV pode permanecer como saida opcional ou auxiliar
- a validacao e a promocao continuam centralizadas no pipeline do banco

## O que nao foi escolhido

### Nao substituir todos os modulos `storage/*-csv.ts` por banco agora

Motivo:

- isso misturaria migracao de persistencia com reescrita da camada de normalizacao
- o risco de regressao semantica seria maior

### Nao escrever no banco antes da normalizacao final

Motivo:

- o `staging.*` atual espera registros que ja passaram pelo contrato consolidado do scraper
- escrever cedo demais deslocaria para a Fase 3 responsabilidades que hoje estao estabilizadas

## Criterio de sucesso desta decisao

Esta decisao sera considerada correta se:

- o scraper conseguir alimentar `staging.*` sem CSV intermediario obrigatorio
- os resultados baterem com a referencia validada da Fase 1/Fase 2
- os modulos de normalizacao existentes puderem ser preservados quase intactos
