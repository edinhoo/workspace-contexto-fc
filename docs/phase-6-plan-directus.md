# Plano da Fase 6 - Directus e Edicao Operacional

Veja tambem: `docs/implementation-plan-data-platform.md`
Veja tambem: `docs/next-services-architecture.md`
Veja tambem: `docs/data-platform-contract.md`
Veja tambem: `docs/phase-5-closeout.md`

## Objetivo

Introduzir o `Directus` no mesmo `PostgreSQL` sem comprometer o modelo canônico nem misturar ingestao automatica com edicao editorial.

Nesta fase, o valor nao e "editar qualquer tabela". O valor e provar um fluxo seguro de:

`core.*` como base canônica  
`editorial.*` como camada de override controlado  
`Directus` como interface operacional e nao como caminho alternativo de ingestao

## O que a Fase 6 herda

- o pipeline de ingestao automatica ja esta validado e nao deve mudar
- `core.*` ja e a base canônica confiavel
- `services/data-api` ja consome `core.*` e pode evoluir depois para aplicar overrides
- `states` ja existe como entidade estrutural e e um bom candidato a manutencao manual
- `warnings` e concorrencia do scheduler continuam fora do centro desta fase

## Escopo da fase

### Entra nesta fase

- subir `Directus` na infra local
- conectar `Directus` ao `PostgreSQL`
- definir permissoes por camada e por tabela
- materializar as primeiras tabelas `editorial.*`
- provar um primeiro fluxo real de override/manual controlado

### Fica fora desta fase

- autenticação final de producao
- fluxo multiusuario sofisticado
- automacoes do `Directus`
- edicao livre de `staging.*` ou `ops.*`
- aplicacao completa de overrides em toda a API
- novas fontes de dados

## Decisoes fechadas antes de executar

- `Directus` entra como interface operacional, nao como origem de ingestao
- o `Directus` usa schema proprio `directus`, sem misturar suas tabelas internas no `public`
- `raw.*`, `staging.*` e `ops.*` ficam fora de edicao
- a primeira iteracao privilegia `editorial.*` em vez de escrita direta em `core.*`
- o primeiro caso concreto da fase sera a manutencao manual de `core.states` via painel
- excecao inicial permitida: `core.states` pode ser mantido manualmente porque nao depende da ingestao automatica atual
- a excecao de `core.states` nao abre precedente para edicao ampla em `core.*`
- o primeiro ciclo deve provar poucos casos bem controlados, nao abrir o banco inteiro para edicao
- a API pode continuar lendo `core.*` puro nesta fase se o override ainda nao estiver aplicado em leitura final

## Frentes de execucao

## Frente 1 - Infra local do Directus

### Objetivo

Subir o `Directus` de forma repetivel no ambiente local.

### Entregaveis

- servico `directus` no `docker-compose`
- configuracao inicial de ambiente
- documentacao curta de bootstrap local

### Tarefas

- adicionar `directus` na infra local
- configurar conexao com o `PostgreSQL` existente
- definir credenciais locais de desenvolvimento
- documentar como subir, acessar e reinicializar o `Directus`

### Criterios de pronto

- o `Directus` sobe localmente sem quebrar o ambiente atual
- o painel conecta ao banco do projeto
- existe roteiro minimo para acesso local

## Frente 2 - Permissoes e fronteiras de edicao

### Objetivo

Definir claramente o que o `Directus` pode ver e o que pode editar.

### Entregaveis

- matriz de permissoes por schema/tabela
- decisao registrada sobre excecoes de escrita em `core.*`
- documento de fronteiras operacionais

### Tarefas

- marcar `raw.*`, `staging.*` e `ops.*` como leitura ou fora de escopo
- definir quais tabelas `core.*` podem ser apenas visualizadas
- definir quais tabelas `core.*` podem ter manutencao manual excepcional
- definir onde a edicao principal passa a acontecer em `editorial.*`
- registrar riscos e guardrails para evitar corromper o canônico

### Criterios de pronto

- existe uma fronteira clara entre leitura, edicao controlada e edicao livre
- o `Directus` nao oferece caminho acidental para alterar ingestao ou scheduler
- a equipe consegue explicar onde um ajuste deve ser feito sem ambiguidade

### Decisao operacional inicial

- `core.states` e a unica excecao inicial de manutencao direta em `core.*`
- essa excecao existe porque `states` e um cadastro estrutural mantido manualmente
- nenhuma tabela alimentada pelo scraper deve ganhar escrita manual nesta frente

## Frente 3 - Primeira camada `editorial.*`

### Objetivo

Materializar poucos overrides uteis para provar a estrategia editorial.

### Entregaveis

- migration inicial de `editorial.*`
- tabelas ou colecoes de override bem delimitadas
- seeds ou exemplos minimos de uso

### Tarefas

- escolher 1-2 casos de override que realmente façam sentido agora
- modelar tabelas editoriais pequenas e claras
- preferir casos como:
  - slugs publicos
  - labels amigaveis
  - flags de publicacao
  - ajuste manual de `states`
- evitar criar `editorial.*` genérico demais na primeira iteracao

### Decisao inicial da frente

- a primeira prova real da fase e `core.states` no painel
- uma primeira tabela `editorial.*` so entra se surgir um segundo caso concreto e simples durante a execucao

### Criterios de pronto

- existe ao menos uma tabela `editorial.*` com papel claro
- o modelo editorial nao duplica a ingestao
- os overrides escolhidos resolvem um problema real e simples

## Frente 4 - Operacao guiada no Directus

### Objetivo

Provar que o `Directus` serve para operacao real, nao apenas para navegar tabelas.

### Entregaveis

- colecoes configuradas no `Directus`
- campos e relacionamentos minimamente navegaveis
- roteiro operacional curto para equipe

### Tarefas

- expor as colecoes realmente necessarias no primeiro ciclo
- validar navegacao entre tabelas canônicas e editoriais
- testar criacao/edicao de um override via painel
- documentar o que o operador deve e nao deve editar

### Criterios de pronto

- e possivel abrir o painel e executar um ajuste real sem SQL manual
- a navegacao entre entidades faz sentido para operacao
- a experiencia inicial confirma que o `Directus` agrega valor pratico

## Frente 5 - Integracao leve com leitura e encerramento

### Objetivo

Fechar a fase com uma decisao clara sobre como os overrides entram no consumo.

### Entregaveis

- decisao documentada sobre leitura de `editorial.*`
- relatorio de validacao da fase
- closeout da fase

### Tarefas

- decidir se a Fase 6 ja aplica algum override em leitura
- se sim, fazer isso no menor recorte possivel
- se nao, registrar explicitamente que a leitura editorial entra depois
- validar que o `Directus` nao afetou ingestao, scheduler nem API existente
- documentar limitacoes conhecidas da primeira iteracao

### Criterios de pronto

- existe uma resposta clara para "como o override editorial chega no consumo"
- o `Directus` nao introduz risco novo na ingestao
- a fase fica encerrada com um caso de uso operacional provado

## Ordem recomendada

1. subir `Directus` localmente
2. fechar permissoes e fronteiras
3. materializar `editorial.*`
4. provar um ajuste real no painel
5. decidir o acoplamento minimo com leitura e documentar

## Riscos principais

- abrir escrita cedo demais em `core.*`
- deixar o `Directus` enxergar ou editar `staging.*` e `ops.*`
- criar `editorial.*` genérico demais sem caso de uso concreto
- tentar aplicar overrides em toda a API antes de provar um fluxo simples
- tratar o painel como substituto de contrato operacional

## Decisoes praticas antes de executar

- começar com poucos casos de override
- manter `raw.*`, `staging.*` e `ops.*` fora da edicao
- usar schema `directus` para as tabelas internas do CMS
- permitir manutencao manual apenas de `core.states` na primeira iteracao
- usar `editorial.*` para novos overrides em vez de multiplicar excecoes em `core.*`
- adiar integracao ampla de overrides na API se o valor ainda nao estiver claro

## Criterio de encerramento da fase

A Fase 6 pode ser considerada concluida quando:

- o `Directus` sobe localmente e conecta ao banco do projeto
- as fronteiras de permissao e edicao estao documentadas e aplicadas
- existe ao menos uma tabela `editorial.*` ou um fluxo editorial controlado provado
- a equipe consegue fazer um ajuste operacional real pelo painel
- ingestao, scheduler e API continuam intactos
