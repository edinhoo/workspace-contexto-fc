import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataApiError, getPlayerBySlug } from "@/lib/api/data-api";
import { getMatchHref, getTeamHref } from "@/lib/routes";

type PlayerPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const formatDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(value))
    : "não informado";

const formatAppearanceDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default async function PlayerPage({
  params,
}: PlayerPageProps) {
  const { slug } = await params;

  try {
    const response = await getPlayerBySlug(slug);

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <Badge>Jogador</Badge>
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
              <Badge variant="secondary">{response.player.position ?? "SEM POS"}</Badge>
              <span className="text-sm text-[color:var(--muted-foreground)]">
                slug: {slug}
              </span>
            </div>
            <CardTitle className="text-4xl md:text-5xl">
              {response.player.name}
            </CardTitle>
            <CardDescription className="text-base">
              {response.player.shortName ?? "Sem nome curto"} ·{" "}
              {response.player.countryName}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-[color:var(--muted-foreground)] md:grid-cols-3">
            <div>
              <span className="font-medium text-[color:var(--foreground)]">Nascimento:</span>{" "}
              {formatDate(response.player.dateOfBirth)}
            </div>
            <div>
              <span className="font-medium text-[color:var(--foreground)]">Times atuais:</span>{" "}
              {response.currentTeams.length}
            </div>
            <div>
              <span className="font-medium text-[color:var(--foreground)]">Aparições recentes:</span>{" "}
              {response.recentAppearances.length}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Times atuais</CardTitle>
                <CardDescription>
                  Relações observadas no histórico carregado do banco.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {response.currentTeams.length ? (
                  response.currentTeams.map((team) => (
                    <Link key={team.id} href={getTeamHref(team.slug)}>
                      <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-[color:var(--foreground)]">
                              {team.name}
                            </p>
                            <p className="text-sm text-[color:var(--muted-foreground)]">
                              {team.slug}
                            </p>
                          </div>
                          <Badge variant="secondary">Time</Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    Nenhum time atual encontrado neste recorte.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entradas de estatística</CardTitle>
                <CardDescription>
                  O `statPayload` continua livre nesta etapa, então a tela mostra só o resumo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {response.statEntries.map((entry) => (
                  <Link key={`${entry.matchId}-${entry.teamId}`} href={getMatchHref(entry.matchSlug)}>
                    <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                      <p className="font-medium text-[color:var(--foreground)]">
                        {entry.teamName}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        {Object.keys(entry.statPayload).length} chaves em `statPayload`
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aparições recentes</CardTitle>
              <CardDescription>
                Contexto leve para navegar entre jogador, time e partida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.recentAppearances.length ? (
                response.recentAppearances.map((appearance) => (
                  <Link key={appearance.matchId} href={getMatchHref(appearance.matchSlug)}>
                    <div className="rounded-2xl border border-[color:var(--border)] p-4 transition hover:border-black/20">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="secondary">{appearance.teamName}</Badge>
                        <span className="text-sm text-[color:var(--muted-foreground)]">
                          {appearance.opponentName}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="font-medium text-[color:var(--foreground)]">
                          {formatAppearanceDate(appearance.startTime)}
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          Minutos: {appearance.minutesPlayed ?? "-"} · Nota:{" "}
                          {appearance.rating ?? "-"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Nenhuma aparição recente encontrada para este jogador.
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
