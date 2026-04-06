import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataApiError, getMatchBySlug } from "@/lib/api/data-api";
import {
  getPlayerHref,
  getSeasonHref,
  getTeamHref,
  getTournamentHref,
} from "@/lib/routes";

type MatchPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const formatMatchDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));

const formatScore = (value: number | null): string => (value === null ? "-" : String(value));

export default async function MatchPage({ params }: MatchPageProps) {
  const { slug } = await params;

  try {
    const response = await getMatchBySlug(slug);
    const homeLineup = response.lineups.filter(
      (lineup) => lineup.teamId === response.homeTeam.id,
    );
    const awayLineup = response.lineups.filter(
      (lineup) => lineup.teamId === response.awayTeam.id,
    );

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <Badge>Partida</Badge>
          <Link
            href="/search"
            className="text-sm font-medium text-[color:var(--accent)] underline-offset-4 hover:underline"
          >
            Voltar para a busca
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={getTournamentHref(response.tournament.slug)}>
                  <Badge variant="secondary">{response.tournament.name}</Badge>
                </Link>
                <Link
                  href={getSeasonHref(response.season.id)}
                  className="text-sm text-[color:var(--muted-foreground)] underline-offset-4 hover:underline"
                >
                  {response.season.name}
                </Link>
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  slug: {response.match.slug}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    Mandante
                  </p>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      <Link
                        href={getTeamHref(response.homeTeam.slug)}
                        className="underline-offset-4 hover:underline"
                      >
                        {response.homeTeam.name}
                      </Link>
                    </h1>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Abrir contexto do time mandante
                    </p>
                  </div>
                </div>
                <div className="rounded-3xl bg-[color:var(--secondary)] px-6 py-4 text-center">
                  <div className="text-4xl font-semibold tracking-tight md:text-5xl">
                    {formatScore(response.homeTeam.score)}{" "}
                    <span className="text-[color:var(--muted-foreground)]">x</span>{" "}
                    {formatScore(response.awayTeam.score)}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                    {formatMatchDate(response.match.startTime)}
                  </p>
                </div>
                <div className="space-y-1 text-left md:text-right">
                  <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    Visitante
                  </p>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      <Link
                        href={getTeamHref(response.awayTeam.slug)}
                        className="underline-offset-4 hover:underline"
                      >
                        {response.awayTeam.name}
                      </Link>
                    </h2>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Abrir contexto do time visitante
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-[color:var(--muted-foreground)] md:grid-cols-3">
              <div>
                <span className="font-medium text-[color:var(--foreground)]">Rodada:</span>{" "}
                {response.match.round ?? "não informada"}
              </div>
              <div>
                <span className="font-medium text-[color:var(--foreground)]">Estádio:</span>{" "}
                {response.stadium?.name ?? "não informado"}
              </div>
              <div>
                <span className="font-medium text-[color:var(--foreground)]">Árbitro:</span>{" "}
                {response.referee?.name ?? "não informado"}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stats do time</CardTitle>
                <CardDescription>
                  O `statPayload` permanece livre nesta etapa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {response.teamStats.map((stats) => (
                  <div
                    key={stats.id}
                    className="rounded-2xl border border-[color:var(--border)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[color:var(--foreground)]">
                        {stats.teamName}
                      </p>
                      <Badge variant="secondary">
                        {Object.keys(stats.statPayload).length} chaves
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted-foreground)]">
                  O próximo ciclo pode transformar `teamStats.statPayload` em blocos mais
                  legíveis se essa leitura se mostrar recorrente.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contextos relacionados</CardTitle>
                <CardDescription>
                  Esta partida já conecta diretamente aos dois times envolvidos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={getTeamHref(response.homeTeam.slug)}>
                  <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          {response.homeTeam.name}
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          Time mandante
                        </p>
                      </div>
                      <Badge variant="secondary">Abrir time</Badge>
                    </div>
                  </div>
                </Link>
                <Link href={getTeamHref(response.awayTeam.slug)}>
                  <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          {response.awayTeam.name}
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          Time visitante
                        </p>
                      </div>
                      <Badge variant="secondary">Abrir time</Badge>
                    </div>
                  </div>
                </Link>
                <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted-foreground)]">
                  Os jogadores da lineup agora abrem direto o perfil no app. Em
                  eventos, a navegação aparece apenas quando o contexto trouxer `slug`
                  suficiente para montar a URL pública do jogador.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Eventos da partida</CardTitle>
              <CardDescription>
                Incidentes em ordem cronológica observada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.events.length ? (
                response.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-[color:var(--border)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          {event.incidentType}
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          {event.teamName ?? "sem time"} ·{" "}
                          {event.playerSlug && event.playerName ? (
                            <Link
                              href={getPlayerHref(event.playerSlug)}
                              className="underline-offset-4 hover:underline"
                            >
                              {event.playerName}
                            </Link>
                          ) : (
                            event.playerName ?? "sem jogador"
                          )}
                          {event.relatedPlayerName ? (
                            <>
                              {" · relacionado: "}
                              {event.relatedPlayerSlug ? (
                                <Link
                                  href={getPlayerHref(event.relatedPlayerSlug)}
                                  className="underline-offset-4 hover:underline"
                                >
                                  {event.relatedPlayerName}
                                </Link>
                              ) : (
                                event.relatedPlayerName
                              )}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="text-right text-sm text-[color:var(--muted-foreground)]">
                        <p>
                          {event.minute ?? "-"}
                          {event.addedTime ? `+${event.addedTime}` : ""}
                        </p>
                        {event.homeScore !== null || event.awayScore !== null ? (
                          <p>
                            {event.homeScore ?? "-"} x {event.awayScore ?? "-"}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Nenhum evento encontrado para esta partida.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{response.homeTeam.name}</CardTitle>
                <CardDescription>
                  Lineup observada do mandante. Use o nome do time para abrir o contexto
                  completo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {homeLineup.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-2xl border border-[color:var(--border)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          <Link
                            href={getPlayerHref(player.playerSlug)}
                            className="underline-offset-4 hover:underline"
                          >
                            {player.playerName}
                          </Link>
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          {player.position ?? "posição não informada"}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Camisa {player.jerseyNumber ?? "-"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-[color:var(--muted-foreground)]">
                      <span>Min: {player.minutesPlayed ?? "-"}</span>
                      <span>Nota: {player.rating ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{response.awayTeam.name}</CardTitle>
                <CardDescription>
                  Lineup observada do visitante. Use o nome do time para abrir o contexto
                  completo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {awayLineup.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-2xl border border-[color:var(--border)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          <Link
                            href={getPlayerHref(player.playerSlug)}
                            className="underline-offset-4 hover:underline"
                          >
                            {player.playerName}
                          </Link>
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          {player.position ?? "posição não informada"}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Camisa {player.jerseyNumber ?? "-"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-[color:var(--muted-foreground)]">
                      <span>Min: {player.minutesPlayed ?? "-"}</span>
                      <span>Nota: {player.rating ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof DataApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
