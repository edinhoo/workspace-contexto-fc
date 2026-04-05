# Plano da Fase 7 - Robustez e Escala

Veja tambem: `docs/implementation-plan-data-platform.md`
Veja tambem: `docs/next-services-architecture.md`
Veja tambem: `docs/phase-5-plan-scrape-automation.md`
Veja tambem: `docs/phase-4-plan-data-api.md`

## Objetivo

Fechar a plataforma com os endurecimentos que faltam para crescer sem reescrita estrutural.

Nesta fase, o foco nao e criar uma nova superficie. O foco e tornar mais robusto o que ja existe:

- ingestao
- automacao
- leitura
- operacao

## O que a Fase 7 herda

- o pipeline `staging.* -> core.*` ja esta validado
- o scraper ja escreve no banco
- a automacao por partida ja existe, mas ainda e serial e simples
- a `data-api` ja expoe os primeiros contextos
- o `Directus` ja opera de forma local e controlada

## Escopo da fase

### Entra nesta fase

- contrato de saida mais estavel entre scheduler e scraper
- endurecimento de concorrencia do scheduler
- primeiro uso util de `raw.*`, se fizer sentido
- revisao de indices e consultas repetitivas
- melhoria de observabilidade e diagnostico operacional
- preparacao do desenho para novas fontes sem quebrar o canonico

### Fica fora desta fase

- nova fonte de dados em producao
- autenticao completa
- infra distribuida ou cloud definitiva
- painel operacional novo alem do que ja existe
- reescrita grande da `data-api`

## Decisoes fechadas antes de executar

- a fase deve priorizar endurecimento do que ja existe, nao novos produtos
- `raw.*` entra apenas se resolver um problema real de rastreabilidade ou reprocessamento
- `read.*` entra apenas onde houver repeticao concreta ou consulta custosa demais
- o scheduler continua podendo nascer como processo simples, mas ja com reserva segura do proximo item
- a saida do scraper para o scheduler deve deixar de depender de regex fragil em stdout
- o formato inicial dessa saida sera `JSON` na ultima linha do `stdout`, com prefixo fixo `SCRAPE_RESULT `
- a Frente 2 pode exigir migracao parcial do scheduler para `Node.js` nativo com transacao e conexao direta ao banco
- `warnings` podem continuar secundarios, mas precisam comecar a ter papel mais claro em observabilidade
- o primeiro conjunto minimo de `warnings` da fase sera:
  - cidade sem `state`
  - `events` sem `player` quando o tipo normalmente espera jogador
  - registros editoriais operacionais incompletos, mas ainda persistiveis

## Frentes de execucao

## Frente 1 - Contrato operacional do scraper

### Objetivo

Remover a fragilidade textual entre automacao e scraper.

### Entregaveis

- contrato de saida estavel do scraper para execucao automatizada
- forma clara de capturar `run_id`, status e motivo de falha
- ajuste minimo no scheduler para consumir esse contrato

### Tarefas

- substituir o parse por regex do `run_id` em stdout por saida estruturada
- emitir a ultima linha do `stdout` como `SCRAPE_RESULT {json}`
- distinguir sucesso, falha operacional e falha de validacao de forma estavel
- manter compatibilidade com o uso manual do scraper

### Criterios de pronto

- o scheduler nao depende mais de string fragil para descobrir o `run_id`
- falhas ficam classificadas de forma mais previsivel

## Frente 2 - Concorrencia e reserva segura do scheduler

### Objetivo

Preparar a automacao para mais de um executor sem criar duplicidade de trabalho.

### Entregaveis

- reserva segura do proximo `scheduled_scrape`
- documentacao do comportamento em concorrencia
- ajuste de `--drain` para operacao mais previsivel
- migracao da parte transacional do scheduler para `Node.js`

### Tarefas

- substituir a reserva em duas etapas por abordagem segura no banco
- considerar `FOR UPDATE SKIP LOCKED` ou equivalente
- mover a parte de claim/reserva para conexao direta ao banco em `Node.js`
- impedir que dois schedulers peguem o mesmo item
- definir limite ou controle explicito de iteracoes no modo `--drain`

### Criterios de pronto

- dois executores concorrentes nao processam o mesmo scrape
- o modo `--drain` tem comportamento previsivel e explicavel

## Frente 3 - Observabilidade e operacao

### Objetivo

Dar mais visibilidade sobre o que mudou, o que falhou e por que falhou.

### Entregaveis

- relatorios operacionais mais claros por run
- primeiro uso mais util de `warnings`
- diagnostico melhor para automacao e ingestao

### Tarefas

- separar melhor update semantico de refresh operacional
- materializar um conjunto pequeno e concreto de `warnings`
- melhorar leitura de diffs e contadores por entidade
- tornar os reports mais uteis para investigacao posterior

### Criterios de pronto

- dado um `run_id`, a equipe entende com menos ambiguidade o que aconteceu
- `warnings` deixam de ser coluna ociosa

## Frente 4 - Performance e camadas auxiliares

### Objetivo

Resolver repeticoes e gargalos reais sem inflar o modelo.

### Entregaveis

- revisao de indices mais importantes
- possiveis melhorias pontuais em `read.*`
- possivel primeira camada `raw.*`, se houver caso real

### Tarefas

- revisar queries principais da `data-api` e da automacao
- adicionar indices faltantes onde houver evidência de uso
- mover para `read.*` apenas consultas realmente repetitivas
- introduzir `raw.*` apenas se isso melhorar rastreabilidade ou replay

### Criterios de pronto

- indices e apoio de leitura entram por necessidade real, nao por antecipacao
- gargalos conhecidos ficam menores ou melhor mapeados

## Frente 5 - Preparacao para novas fontes

### Objetivo

Fechar a fase deixando o contrato suficientemente limpo para novas origens futuras.

### Entregaveis

- decisao documentada sobre pontos de extensao para novas fontes
- validacao final da fase
- closeout com limites do desenho atual

### Tarefas

- revisar onde o contrato atual ainda esta acoplado demais ao Sofascore
- identificar o que ja e reaproveitavel e o que ainda e especifico demais
- documentar o recorte minimo para uma futura segunda fonte
- consolidar validacao final da fase

### Criterios de pronto

- a equipe consegue apontar como uma nova fonte entraria sem quebrar o modelo atual
- a plataforma fecha o ciclo com gargalos principais mapeados

## Ordem recomendada

1. estabilizar o contrato de saida do scraper
2. endurecer concorrencia do scheduler
3. melhorar observabilidade e relatorios
4. tratar indices, `read.*` e `raw.*` apenas onde houver necessidade clara
5. documentar a preparacao para novas fontes e encerrar a fase

## Riscos principais

- inflar a fase com refatores grandes demais
- introduzir `raw.*` ou `read.*` sem problema real a resolver
- endurecer concorrencia sem preservar a simplicidade operacional atual
- misturar robustez com nova funcionalidade de produto

## Decisoes praticas antes de executar

- começar pelo que reduz risco operacional mais direto
- tratar `raw.*` e `read.*` como ferramentas, nao como obrigacao
- manter a fase pequena e orientada a gargalos reais ja observados
- usar a automacao atual, a `data-api` atual e o `Directus` atual como entrada de diagnostico

## Criterio de encerramento da fase

A Fase 7 pode ser considerada concluida quando:

- o scheduler deixa de depender de contrato textual fragil
- a reserva do proximo scrape fica segura em concorrencia
- a observabilidade de runs melhora de forma verificavel
- indices e camadas auxiliares entram apenas onde houver ganho real
- o projeto fecha com caminho claro para novas fontes e crescimento operacional
