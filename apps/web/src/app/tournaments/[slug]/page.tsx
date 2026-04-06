import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataApiError, getTournamentBySlug } from "@/lib/api/data-api";
import { getMatchHref, getSeasonHref, getTeamHref } from "@/lib/routes";

type TournamentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const formatMatchDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatScore = (value: number | null): string => (value === null ? "-" : String(value));

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { slug } = await params;

  try {
    const response = await getTournamentBySlug(slug);

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <Badge>Torneio</Badge>
          <Link
            href="/search"
            className="text-sm font-medium text-[color:var(--accent)] underline-offset-4 hover:underline"
          >
            Voltar para a busca
          </Link>
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">slug: {response.tournament.slug}</Badge>
              <span className="text-sm text-[color:var(--muted-foreground)]">
                temporadas observadas: {response.seasons.length}
              </span>
            </div>
            <CardTitle className="text-4xl md:text-5xl">
              {response.tournament.name}
            </CardTitle>
            <CardDescription className="text-base">
              Contexto mínimo de torneio com temporadas relacionadas e partidas recentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-[color:var(--muted-foreground)] md:grid-cols-2">
            <div>
              <span className="font-medium text-[color:var(--foreground)]">Partidas recentes:</span>{" "}
              {response.recentMatches.length}
            </div>
            <div>
              <span className="font-medium text-[color:var(--foreground)]">Temporadas relacionadas:</span>{" "}
              {response.seasons.length}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>Temporadas observadas</CardTitle>
              <CardDescription>
                Lista mínima derivada das partidas já carregadas para este torneio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {response.seasons.length ? (
                response.seasons.map((season) => (
                  <Link key={season.id} href={getSeasonHref(season.id)}>
                    <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[color:var(--foreground)]">
                            {season.name}
                          </p>
                          <p className="text-sm text-[color:var(--muted-foreground)]">
                            {season.year ?? "ano não informado"}
                          </p>
                        </div>
                        <Badge variant="secondary">Abrir temporada</Badge>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Nenhuma temporada observada para este torneio no recorte atual.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partidas recentes</CardTitle>
              <CardDescription>
                Últimas partidas observadas para este torneio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.recentMatches.length ? (
                response.recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-[color:var(--border)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary">{match.seasonName}</Badge>
                      <span className="text-sm text-[color:var(--muted-foreground)]">
                        {formatMatchDate(match.startTime)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                      <Link
                        href={getTeamHref(match.homeTeamSlug)}
                        className="font-medium text-[color:var(--foreground)] underline-offset-4 hover:underline"
                      >
                        {match.homeTeamName}
                      </Link>
                      <Link
                        href={getMatchHref(match.slug)}
                        className="text-center text-lg font-semibold text-[color:var(--foreground)] underline-offset-4 hover:underline"
                      >
                        {formatScore(match.homeScore)} x {formatScore(match.awayScore)}
                      </Link>
                      <Link
                        href={getTeamHref(match.awayTeamSlug)}
                        className="text-left font-medium text-[color:var(--foreground)] underline-offset-4 hover:underline md:text-right"
                      >
                        {match.awayTeamName}
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Nenhuma partida recente encontrada para este torneio.
                </p>
              )}
            </CardContent>
          </Card>
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
