# Fechamento do Ciclo Incremental - Web App Match para Player

Veja tambem: `docs/next-cycle-plan-web-app-match-player.md`
Veja tambem: `docs/next-cycle-web-app-tournament-season-closeout.md`

## Objetivo do ciclo

Fechar a lacuna mais visivel de navegacao funcional do `apps/web`:

- permitir navegacao de `match` para `player`

Sem abrir novos contextos e sem reabrir a tela de partida como redesign.

## O que foi entregue

- `playerSlug` adicionado ao contrato de `lineups` na `data-api`
- `playerSlug` e `relatedPlayerSlug` adicionados tambem em `events`, porque o join
  continuou simples
- query de `match` atualizada para trazer `p.slug` e `rp.slug`
- links de `match` para `player` nos cards de lineup
- links de `match` para `player` e `relatedPlayer` nos eventos quando o `slug`
  estiver presente
- ajuste do teste de integracao de `match` para validar `lineups.playerSlug`
- atualizacao do plano geral

## O que foi validado

- `pnpm --filter @services/data-api test`
- `pnpm --filter @services/data-api typecheck`
- `pnpm --filter @services/data-api build`
- `pnpm --filter @apps/web test`
- `pnpm --filter @apps/web typecheck`
- `pnpm --filter @apps/web build`

## Resultado consolidado

- a tela de partida deixou de ter a lineup como fluxo morto
- o app agora navega de `match` para `player` mantendo URL publica por `slug`
- `events` tambem passaram a abrir jogador sem exigir query extra nem workaround

## O que ficou bom

- o ciclo continuou pequeno e focado
- o backend precisou apenas completar um join que ja existia
- a tela de partida ganhou coerencia com o restante da navegacao do app

## Limitacoes conhecidas

- o valor real dessa navegacao continua limitado pela baixa densidade atual do
  banco
- o ciclo nao ampliou a busca para incluir `tournament` e `season`
- o ciclo nao tenta enriquecer outros blocos da partida alem da navegacao para
  jogador

## Proximo ciclo recomendado

O proximo passo mais util agora e aumentar a densidade de dados do ambiente para
validar os contextos com mais de um evento real.

Depois disso, os recortes mais naturais passam a ser:

- ampliar a busca para incluir `tournament` e `season`
- observar lacunas reais de produto reveladas com mais volume de dados

## Conclusao

O ciclo pode ser considerado concluido.

A navegacao entre os contextos ja existentes ficou mais coerente e a tela de
partida deixou de ser um ponto terminal quando o usuario quer aprofundar um
jogador mostrado em lineup ou evento.
