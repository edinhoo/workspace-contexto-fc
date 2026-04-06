import { Badge } from "@/components/ui/badge";
import { SearchExperience } from "@/components/search/search-experience";
import { searchEntities } from "@/lib/api/data-api";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    limit?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q?.trim() ?? "";
  const response = query ? await searchEntities(query, 8) : null;

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

      <SearchExperience
        initialQuery={query}
        initialItems={response?.items ?? []}
      />
    </main>
  );
}
