import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataApiError, getSeason } from "@/lib/api/data-api";
import { getMatchHref, getTeamHref, getTournamentHref } from "@/lib/routes";

type SeasonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const formatMatchDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatScore = (value: number | null): string => (value === null ? "-" : String(value));

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { id } = await params;

  try {
    const response = await getSeason(id);

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <Badge>Temporada</Badge>
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
              <Badge variant="secondary">id: {response.season.id}</Badge>
              <Link
                href={getTournamentHref(response.tournament.slug)}
                className="text-sm text-[color:var(--muted-foreground)] underline-offset-4 hover:underline"
              >
                {response.tournament.name}
              </Link>
            </div>
            <CardTitle className="text-4xl md:text-5xl">
              {response.season.name}
            </CardTitle>
            <CardDescription className="text-base">
              Contexto mínimo de temporada ligado ao torneio e às partidas observadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-[color:var(--muted-foreground)] md:grid-cols-2">
            <div>
              <span className="font-medium text-[color:var(--foreground)]">Ano:</span>{" "}
              {response.season.year ?? "não informado"}
            </div>
            <div>
              <span className="font-medium text-[color:var(--foreground)]">Partidas recentes:</span>{" "}
              {response.recentMatches.length}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>Contextos relacionados</CardTitle>
              <CardDescription>
                Esta temporada continua como contexto de suporte para leitura e navegação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={getTournamentHref(response.tournament.slug)}>
                <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[color:var(--foreground)]">
                        {response.tournament.name}
                      </p>
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        Torneio pai desta temporada
                      </p>
                    </div>
                    <Badge variant="secondary">Abrir torneio</Badge>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partidas recentes</CardTitle>
              <CardDescription>
                Últimas partidas observadas nesta temporada.
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
                      <Badge variant="secondary">{match.round ?? "rodada não informada"}</Badge>
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
                  Nenhuma partida recente encontrada para esta temporada.
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
