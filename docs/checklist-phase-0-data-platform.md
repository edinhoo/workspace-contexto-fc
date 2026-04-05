# Checklist Tecnico - Fase 0 da Plataforma de Dados

## Objetivo

Preparar a base tecnica da plataforma de dados antes de qualquer execucao de banco, migracao de ingestao ou criacao de novos servicos.

Este checklist nao implica implementacao imediata. Ele existe para orientar a futura execucao da Fase 0 com clareza e ordem.

## Definicao de pronto da Fase 0

A Fase 0 esta pronta quando:

- o contrato de dados estiver definido
- os schemas principais estiverem desenhados
- as regras de identidade e relacionamento estiverem documentadas
- as validacoes obrigatorias estiverem mapeadas
- nao houver ambiguidade entre `staging.*`, `core.*`, `read.*`, `raw.*` e `editorial.*`

## Checklist

### 1. Inventario do modelo atual

- [ ] listar todos os CSVs atuais que representam entidades canonicas
- [ ] listar todos os CSVs derivados ou agregados
- [ ] mapear quais arquivos sao cadastro, quais sao evento e quais sao agregacao
- [ ] identificar quais campos atuais sao IDs internos
- [ ] identificar quais campos atuais sao referencias de origem (`source_ref`, `source_*_id`)
- [ ] mapear quais campos sao claramente opcionais e quais sao obrigatorios na pratica

### 2. Contrato das entidades

- [ ] definir a lista inicial de entidades de `core.*`
- [ ] definir a lista inicial de entidades de `staging.*`
- [ ] definir se `raw.*` comeca na primeira entrega ou entra depois
- [ ] definir quais entidades terao tabela `editorial.*`
- [ ] definir quais modelos de leitura iniciais serao expostos em `read.*`

### 3. Chaves e identidade

- [ ] definir a chave primaria de cada tabela `core.*`
- [ ] definir a chave natural de `upsert` de cada entidade
- [ ] documentar onde `source_ref` basta e onde `source_*_id` separado e obrigatorio
- [ ] documentar como relacionamentos compostos serao identificados
- [ ] definir a estrategia para entidades que chegam sem ID explicito da origem

### 4. Relacionamentos

- [ ] mapear FKs obrigatorias entre entidades de `core.*`
- [ ] mapear relacionamentos que podem nascer pendentes em `staging.*`
- [ ] definir ordem logica de promocao entre entidades relacionadas
- [ ] documentar dependencias entre `matches`, `teams`, `players`, `lineups`, `events` e agregados
- [ ] validar quais relacionamentos precisam de resolucao por ID interno antes de entrar em `core.*`

### 5. Regras de negocio que viram validacao

- [ ] listar invariantes estruturais minimas por entidade
- [ ] listar invariantes relacionais minimas por entidade
- [ ] listar invariantes de negocio ja conhecidas no scraper atual
- [ ] transformar as regras mais sensiveis em checks objetivos
- [ ] separar claramente erro bloqueante de warning operacional

### 6. Desenho dos schemas

- [ ] definir o papel de `staging.*`
- [ ] definir o papel de `core.*`
- [ ] definir o papel de `read.*`
- [ ] definir o papel de `raw.*`
- [ ] definir o papel de `editorial.*`
- [ ] documentar o fluxo oficial entre esses schemas

### 7. Tabelas de controle operacional

- [ ] desenhar `ingestion_runs`
- [ ] desenhar `planned_matches`
- [ ] desenhar `scheduled_scrapes`
- [ ] definir os status validos dessas tabelas
- [ ] definir quais colunas sao obrigatorias desde a primeira versao

### 8. Constraints e protecoes

- [ ] decidir colunas `NOT NULL` por tabela
- [ ] decidir chaves `UNIQUE` por tabela
- [ ] decidir FKs obrigatorias desde a primeira versao
- [ ] decidir `CHECK CONSTRAINTS` basicas
- [ ] definir o que precisa ficar fora de constraint no inicio para nao travar a migracao

### 9. Estrategia de promocao

- [ ] definir como dados entram em `staging.*`
- [ ] definir quando uma execucao pode promover para `core.*`
- [ ] definir em que ordem a promocao acontece
- [ ] definir como preservar dados canonicos e overrides editoriais
- [ ] definir o comportamento em caso de falha parcial

### 10. Estrategia de comparacao com a referencia atual

- [ ] definir quais entidades do banco devem ser comparadas com os CSVs atuais
- [ ] definir quais comparacoes serao por contagem
- [ ] definir quais comparacoes serao por integridade relacional
- [ ] definir quais comparacoes serao por semantica de negocio
- [ ] definir o que significa "resultado equivalente" entre bootstrap e futura ingestao do scraper

### 11. Modelos iniciais de contexto

- [ ] escolher as primeiras entidades focais da API
- [ ] escolher as primeiras dimensoes opcionais por entidade focal
- [ ] decidir quais modelos precisam de `view` dedicada e quais podem nascer como query composta
- [ ] documentar o minimo necessario para `teams`, `matches`, `players` e `search`

### 12. Decisoes que precisam ficar registradas

- [ ] registrar decisoes fechadas no doc de arquitetura
- [ ] registrar decisoes abertas ou adiadas
- [ ] registrar assuncoes importantes da Fase 0
- [ ] registrar riscos conhecidos antes da Fase 1

## Artefatos esperados ao final da Fase 0

- um documento de contrato de dados
- um desenho inicial dos schemas
- uma lista de constraints e chaves
- uma lista de validacoes obrigatorias
- uma definicao minima das tabelas operacionais
- uma definicao inicial dos primeiros modelos de contexto

## Observacoes

- se houver duvida entre simplificar agora ou fechar uma regra cedo demais, preferir a opcao que preserve validacao com dados reais na Fase 1
- Fase 0 nao deve gerar servicos novos nem automacao nova
- o foco aqui e reduzir ambiguidade antes da implementacao
