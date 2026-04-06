import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataApiError, getMatch } from "@/lib/api/data-api";

type MatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const formatMatchDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));

const formatScore = (value: number | null): string => (value === null ? "-" : String(value));

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;

  try {
    const response = await getMatch(id);
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
                <Badge variant="secondary">{response.tournament.name}</Badge>
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  {response.season.name}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    Mandante
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {response.homeTeam.name}
                  </h1>
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
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {response.awayTeam.name}
                  </h2>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-[color:var(--muted-foreground)] md:grid-cols-3">
              <div>
                <span className="font-medium text-[color:var(--foreground)]">Rodada:</span>{" "}
                {response.match.round ?? "nao informada"}
              </div>
              <div>
                <span className="font-medium text-[color:var(--foreground)]">Estádio:</span>{" "}
                {response.stadium
                  ? `${response.stadium.name}${response.stadium.cityName ? `, ${response.stadium.cityName}` : ""}`
                  : "nao informado"}
              </div>
              <div>
                <span className="font-medium text-[color:var(--foreground)]">Árbitro:</span>{" "}
                {response.referee?.name ?? "nao informado"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo deste contexto</CardTitle>
              <CardDescription>
                Esta primeira versao foca em cabecalho, eventos e lineups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--secondary)] p-4">
                <p className="font-medium text-[color:var(--foreground)]">Eventos</p>
                <p className="mt-1 text-[color:var(--muted-foreground)]">
                  {response.events.length} itens ordenados por `sortOrder`.
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--secondary)] p-4">
                <p className="font-medium text-[color:var(--foreground)]">Lineups</p>
                <p className="mt-1 text-[color:var(--muted-foreground)]">
                  {response.lineups.length} jogadores observados neste snapshot.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4 text-[color:var(--muted-foreground)]">
                `teamStats.statPayload` fica para um proximo ciclo, quando o shape
                de leitura estiver mais claro.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Eventos da partida</CardTitle>
              <CardDescription>
                Linha do tempo ordenada a partir do que a `data-api` já entrega.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.events.length ? (
                response.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-[color:var(--border)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary">{event.incidentType}</Badge>
                      {event.minute ? (
                        <span className="text-sm font-medium text-[color:var(--foreground)]">
                          {event.minute}
                          {event.addedTime ? `+${event.addedTime}` : ""}'
                        </span>
                      ) : null}
                      {event.teamName ? (
                        <span className="text-sm text-[color:var(--muted-foreground)]">
                          {event.teamName}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-1">
                      {event.playerName ? (
                        <p className="font-medium text-[color:var(--foreground)]">
                          {event.playerName}
                        </p>
                      ) : null}
                      {event.relatedPlayerName ? (
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          Relacionado: {event.relatedPlayerName}
                        </p>
                      ) : null}
                      {event.homeScore || event.awayScore ? (
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          Placar no momento: {event.homeScore ?? "-"} x{" "}
                          {event.awayScore ?? "-"}
                        </p>
                      ) : null}
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
                <CardDescription>Lineup observada do mandante.</CardDescription>
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
                          {player.playerName}
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
                <CardDescription>Lineup observada do visitante.</CardDescription>
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
                          {player.playerName}
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
