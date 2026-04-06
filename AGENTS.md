# Instrucoes do Workspace

Antes de explorar o codigo em profundidade, consulte estes documentos para reduzir releitura e consumo de contexto:

1. [README.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/README.md)
2. [docs/monorepo-overview.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/docs/monorepo-overview.md)
3. [services/sofascore/README.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/README.md)
4. [services/sofascore/docs/data-model.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/data-model.md)
5. [services/sofascore/docs/scraper-decisions.md](/Users/edinhomedeiros/Documents/GitHub/_VIBE%20CODE/WORKSPACES/workspace-contexto-fc/services/sofascore/docs/scraper-decisions.md)

Fluxo recomendado:

- use os docs acima para entender arquitetura, comandos, CSVs e regras de negocio
- releia o codigo so no ponto necessario para executar a tarefa atual
- ao alterar comportamento relevante, atualize os docs correspondentes no mesmo ciclo
- ao investigar inconsistencias em CSVs, valide primeiro as regras documentadas antes de propor mudancas estruturais
- use sempre o template completo de commit em `.gitmessage.txt`
- use sempre o template padrao de PR em `.github/pull_request_template.md`
- ao preparar o repositorio local, rode `pnpm git:setup` para ativar template de commit e hooks versionados
