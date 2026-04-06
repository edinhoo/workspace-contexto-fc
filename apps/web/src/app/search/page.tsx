import Link from "next/link";

import type { SearchItem } from "@services/data-api/contracts/search";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchEntities } from "@/lib/api/data-api";
import { getSearchItemHref } from "@/lib/routes";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    limit?: string;
  }>;
};

const typeLabels: Record<SearchItem["type"], string> = {
  match: "Partida",
  player: "Jogador",
  team: "Time",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q?.trim() ?? "";
  const hasQuery = query.length > 0;
  const response = hasQuery ? await searchEntities(query, 8) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10">
      <section className="space-y-4">
        <Badge>Busca</Badge>
        <div className="space-y-3">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Encontre partidas, times e jogadores a partir da data-api
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)]">
            A tela de busca usa o mesmo cliente tipado do BFF e serve como ponto
            de entrada para a primeira navegação do app.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Buscar no banco</CardTitle>
          <CardDescription>
            Use nomes, slugs ou o `source_ref` de uma partida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/search" className="flex flex-col gap-3 md:flex-row">
            <Input
              defaultValue={query}
              name="q"
              placeholder="Ex.: palmeiras"
              className="h-12 flex-1"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] px-5 text-sm font-medium text-[color:var(--accent-foreground)]"
            >
              Buscar
            </button>
          </form>
        </CardContent>
      </Card>

      {!hasQuery ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-sm text-[color:var(--muted-foreground)]">
            Digite um termo para consultar a `data-api` por meio do web app.
          </CardContent>
        </Card>
      ) : response?.items.length ? (
        <section className="grid gap-4">
          {response.items.map((item) => {
            const href = getSearchItemHref(item);
            const content = (
              <Card className="h-full border-black/10 bg-white/80 transition hover:border-black/20 hover:bg-white">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={item.type === "match" ? "default" : "secondary"}>
                      {typeLabels[item.type]}
                    </Badge>
                    {item.subtitle ? (
                      <span className="text-sm text-[color:var(--muted-foreground)]">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </div>
                  <CardTitle className="text-2xl">{item.label}</CardTitle>
                  {item.slug ? (
                    <CardDescription>{item.slug}</CardDescription>
                  ) : null}
                </CardHeader>
                {!href ? (
                  <CardContent className="pt-0 text-sm text-[color:var(--muted-foreground)]">
                    Esta entidade ainda depende de um caminho amigável próprio no app.
                  </CardContent>
                ) : null}
              </Card>
            );

            if (!href) {
              return <div key={`${item.type}-${item.id}`}>{content}</div>;
            }

            return (
              <Link key={`${item.type}-${item.id}`} href={href}>
                {content}
              </Link>
            );
          })}
        </section>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 text-sm text-[color:var(--muted-foreground)]">
            Nenhum resultado encontrado para <strong>{query}</strong>.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
