# Instrucoes do Servico Sofascore

Antes de abrir muitos arquivos do servico, consulte nesta ordem:

1. [README.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/README.md)
2. [docs/data-model.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/data-model.md)
3. [docs/scraper-decisions.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/scraper-decisions.md)

Regras locais:

- trate `services/sofascore/data/*.csv` como a saida canonica atual do scraper
- preserve `source_id` em qualquer evolucao de schema
- sempre que alterar regra de negocio do parser, atualize a documentacao correspondente
- para validar consistencia, prefira cruzar `matches`, `teams`, `players`, `lineups`, `player-match-stats`, `team-match-stats` e `events`

