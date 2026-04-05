# Planejamento da Fase 1 - Banco e Bootstrap de Validacao

Veja tambem: `docs/phase-1-bootstrap-validation-report.md`
Veja tambem: `docs/phase-1-closeout.md`

## Status

Concluida.

## Resultado real

A Fase 1 foi executada com sucesso e validada em banco limpo.

Marcos principais:

- migrations SQL aplicadas com sucesso
- bootstrap executado via `staging.* -> core.*`
- relatorio final gerado com `354` registros promovidos
- checks relacionais e checks extras retornaram `0` inconsistencias
- endurecimentos pos-execucao foram incorporados ainda nesta fase

## Objetivo

Detalhar a execucao da Fase 1 da plataforma de dados.

A Fase 1 existe para validar o desenho do banco com dados reais, usando os CSVs atuais uma unica vez como bootstrap controlado.

## Resultado esperado da Fase 1

Ao final da Fase 1, o projeto deve ter:

- `PostgreSQL` rodando localmente via `docker-compose`
- estrutura inicial de `core.*`, `ops.*` e `staging.*` criada a partir da `ddl-v1`
- mecanismo inicial de migrations em SQL versionado
- script temporario de bootstrap a partir dos CSVs atuais
- primeira carga validada no banco
- registro claro das divergencias entre legado e banco proposto

## O que a Fase 1 nao faz

- nao adapta ainda o scraper para escrever no banco
- nao implementa a API
- nao implementa scheduler
- nao introduz Directus
- nao transforma bootstrap em pipeline permanente
- nao materializa ainda `raw.*`, `read.*` ou `editorial.*`

## Dependencias de entrada

A Fase 1 assume que a Fase 0 ja entregou:

- contrato inicial de dados
- desenho de schemas
- matriz de constraints e validacoes
- revisao critica de DDL
- `ddl-v1` documental

## Estrategia geral

A Fase 1 deve seguir esta ordem:

1. preparar a infraestrutura local do banco
2. materializar a `ddl-v1` em artefatos aplicaveis
3. criar o bootstrap temporario a partir dos CSVs
4. executar carga em ambiente local controlado
5. validar integridade, semantica e divergencias

## Etapas da Fase 1

### Etapa 1 - Infra local do banco

#### Objetivo

Subir um `PostgreSQL` local previsivel e isolado para a validacao da fase.

#### Entregaveis

- servico `postgres` no `infra/docker/docker-compose.yml`
- credenciais e portas definidas para ambiente local
- volume persistente local

#### Tarefas

- adicionar o servico `postgres` ao compose
- definir nome do banco inicial
- definir usuario, senha e porta
- definir volume de dados
- documentar variaveis e uso local

#### Criterios de pronto

- o banco sobe localmente sem dependencias extras fora do compose
- o projeto consegue conectar no banco local

### Etapa 2 - Materializacao da DDL

#### Objetivo

Transformar a `ddl-v1` documental em artefatos aplicaveis de banco.

#### Entregaveis

- pasta de migrations SQL versionadas
- script inicial de criacao de schemas e tabelas
- convencao para reaplicar ou recriar ambiente local

#### Tarefas

- adotar migrations SQL versionadas como formato inicial
- converter a `ddl-v1` em SQL executavel
- separar o que entra na primeira rodada do que fica como ajuste posterior
- garantir coerencia entre `core.*`, `ops.*` e o padrao inicial de `staging.*`
- explicitar que `raw.*`, `read.*` e `editorial.*` ficam fora do escopo de materializacao da Fase 1

#### Criterios de pronto

- existe um artefato executavel para criar a estrutura inicial
- o banco local pode ser recriado do zero sem passos manuais ambíguos

### Etapa 3 - Estrutura do bootstrap

#### Objetivo

Criar o mecanismo temporario que carrega os CSVs atuais para o banco.

#### Entregaveis

- script temporario de bootstrap
- definicao da ordem de carga por entidade
- mapeamento entre CSVs e tabelas de destino

#### Tarefas

- fazer o bootstrap escrever primeiro em `staging.*`, com promocao controlada para `core.*`
- definir ordem de carga para respeitar dependencias
- definir estrategia para entidades derivadas
- definir logs e saidas minimas do bootstrap

#### Criterios de pronto

- existe um caminho claro de carga dos CSVs no banco
- o fluxo `staging.* -> core.*` foi exercitado com dados reais
- o bootstrap e explicitamente temporario e descartavel

### Etapa 4 - Carga inicial com dados reais

#### Objetivo

Executar a primeira carga real e observar como o schema se comporta.

#### Entregaveis

- banco populado localmente
- contagens por tabela
- log da execucao de bootstrap

#### Tarefas

- rodar a criacao do banco
- rodar o bootstrap dos CSVs atuais
- promover os dados de `staging.*` para `core.*` no fluxo definido para a fase
- capturar falhas de carga, FKs quebradas e inconsistencias
- repetir ate ter uma carga local reproduzivel

#### Criterios de pronto

- a carga roda do inicio ao fim em ambiente local
- falhas residuais ficam registradas e entendidas

### Etapa 5 - Validacao do bootstrap

#### Objetivo

Confirmar que o banco carregado representa adequadamente o estado atual dos CSVs.

#### Entregaveis

- checklist de validacao preenchido
- relatorio de divergencias
- decisao sobre ajustes na `ddl-v1`

#### Validacoes minimas

- contagem por entidade
- integridade relacional principal
- consistencia de regras de negocio mais sensiveis
- coerencia de entidades derivadas

#### Exemplos do que validar

- `matches` com `home_team` e `away_team` validos
- `lineups` relinkadas corretamente
- `player_match_stats` com contexto correspondente
- `team_match_stats` coerente com o agregado esperado
- `events` sem referencias invalidas em massa

#### Criterios de pronto

- o banco carregado e confiavel como referencia inicial
- divergencias importantes foram classificadas
- existe clareza sobre o que precisa ajustar antes da Fase 2

## Ordem de carga sugerida

1. `core.countries`
2. `core.states`
3. `core.cities`
4. `core.stadiums`
5. `core.tournaments`
6. `core.seasons`
7. `core.referees`
8. `core.managers`
9. `core.teams`
10. `core.players`
11. `core.matches`
12. `core.lineups`
13. `core.player_match_stats`
14. `core.team_match_stats`
15. `core.events`
16. `core.player_career_teams`

Observacao:

- `states` provavelmente entra vazio na primeira carga, ja que nao existe no legado
- `team_match_stats` pode ser carregado do CSV atual ou recalculado como experimento de validacao

## Riscos principais da Fase 1

- endurecer constraints cedo demais e bloquear o bootstrap
- aceitar demais o legado e perder qualidade do modelo
- misturar bootstrap temporario com pipeline permanente
- concluir que o schema esta pronto sem validar dados reais suficientes

## Decisoes praticas antes de executar

Antes de comecar a Fase 1 de fato, vale fechar:

1. se `team_match_stats` sera carregado do CSV ou recalculado ja na validacao
2. quais tabelas de `staging.*` serao tabulares na V1 e quais usarao `payload jsonb`
3. qual sera a convencao de nome e ordenacao das migrations SQL versionadas

## Fechamento

Essas decisoes foram resolvidas durante a execucao da fase:

1. `team_match_stats` foi carregado do CSV atual
2. `staging.*` ficou hibrido, com apoio de `jsonb` nas entidades largas
3. migrations SQL versionadas foram adotadas como baseline

## Criterio de encerramento da Fase 1

A Fase 1 estara concluida quando:

- o banco local subir de forma reproduzivel
- a `ddl-v1` estiver materializada em SQL aplicavel
- o bootstrap temporario rodar com os CSVs atuais
- as validacoes principais passarem ou tiverem divergencias claramente mapeadas
- a equipe tiver confianca para iniciar a Fase 2
