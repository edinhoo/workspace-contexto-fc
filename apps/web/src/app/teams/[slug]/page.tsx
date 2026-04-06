import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataApiError, getTeamBySlug } from "@/lib/api/data-api";
import { getMatchHref, getPlayerHref } from "@/lib/routes";

type TeamPageProps = {
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

export default async function TeamPage({
  params,
}: TeamPageProps) {
  const { slug } = await params;

  try {
    const response = await getTeamBySlug(slug);

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <Badge>Time</Badge>
          <Link
            href="/search"
            className="text-sm font-medium text-[color:var(--accent)] underline-offset-4 hover:underline"
          >
            Voltar para a busca
          </Link>
        </div>

        <Card
          className="overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${response.team.primaryColor ?? "#0f172a"} 0%, ${response.team.secondaryColor ?? "#1d4ed8"} 100%)`,
          }}
        >
          <CardHeader className="border-none pb-2 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{response.team.code3 ?? "TEAM"}</Badge>
              <span className="text-sm text-white/80">slug: {slug}</span>
            </div>
            <CardTitle className="text-4xl text-white md:text-5xl">
              {response.team.name}
            </CardTitle>
            <CardDescription className="text-white/80">
              {response.team.shortName ?? "Sem nome curto cadastrado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-white/80 md:grid-cols-3">
            <div>
              <span className="font-medium text-white">Partidas recentes:</span>{" "}
              {response.recentMatches.length}
            </div>
            <div>
              <span className="font-medium text-white">Jogadores relacionados:</span>{" "}
              {response.relatedPlayers.length}
            </div>
            <div>
              <span className="font-medium text-white">Filtros ativos:</span>{" "}
              {response.filters.season || response.filters.tournament || response.filters.opponent
                ? "sim"
                : "nao"}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Partidas recentes</CardTitle>
              <CardDescription>
                A perspectiva e sempre relativa ao time focal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.recentMatches.length ? (
                response.recentMatches.map((match) => (
                  <Link key={match.id} href={getMatchHref(match.slug)}>
                    <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="secondary">{match.tournamentName}</Badge>
                        <span className="text-sm text-[color:var(--muted-foreground)]">
                          {match.seasonName}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-[color:var(--foreground)]">
                            {response.team.name} vs {match.opponentName}
                          </p>
                          <p className="text-sm text-[color:var(--muted-foreground)]">
                            {formatMatchDate(match.startTime)} · {match.side === "home" ? "mandante" : "visitante"}
                          </p>
                        </div>
                        <div className="text-lg font-semibold text-[color:var(--foreground)]">
                          {formatScore(match.teamScore)} x {formatScore(match.opponentScore)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Nenhuma partida recente encontrada para este recorte.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jogadores relacionados</CardTitle>
              <CardDescription>
                Lista derivada de lineups observadas, nao de elenco canônico atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {response.relatedPlayers.map((player) => (
                <Link
                  key={player.id}
                  href={getPlayerHref(player.slug)}
                >
                  <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          {player.name}
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          {player.position ?? "posição não informada"}
                        </p>
                      </div>
                      <Badge variant="secondary">Perfil</Badge>
                    </div>
                  </div>
                </Link>
              ))}
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted-foreground)]">
                Esta lista segue limitada ao comportamento atual da `data-api` e pode
                incluir jogadores observados em lineups mais antigas quando o banco crescer.
              </div>
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
