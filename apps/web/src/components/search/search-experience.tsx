"use client";

import Link from "next/link";
import {
  type FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import type { SearchItem } from "@services/data-api/contracts/search";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSearchItemHref } from "@/lib/routes";

type SearchExperienceProps = {
  initialItems: SearchItem[];
  initialQuery: string;
};

const typeLabels: Record<SearchItem["type"], string> = {
  match: "Partida",
  player: "Jogador",
  team: "Time",
};

type SearchStatus =
  | "idle"
  | "typing"
  | "loading"
  | "ready"
  | "empty"
  | "error";

const isSearchSuccessPayload = (
  value: unknown,
): value is { items: SearchItem[] } =>
  typeof value === "object" &&
  value !== null &&
  "items" in value &&
  Array.isArray(value.items);

const getSearchErrorMessage = (value: unknown): string | null => {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "object" &&
    value.error !== null &&
    "message" in value.error &&
    typeof value.error.message === "string"
  ) {
    return value.error.message;
  }

  return null;
};

const getStatusFromItems = (query: string, items: SearchItem[]): SearchStatus => {
  if (!query.trim()) {
    return "idle";
  }

  return items.length ? "ready" : "empty";
};

export function SearchExperience({
  initialItems,
  initialQuery,
}: SearchExperienceProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [resolvedQuery, setResolvedQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchItem[]>(initialItems);
  const [status, setStatus] = useState<SearchStatus>(
    getStatusFromItems(initialQuery, initialItems),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRouting, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(initialQuery);
    setResolvedQuery(initialQuery);
    setItems(initialItems);
    setErrorMessage(null);
    setStatus(getStatusFromItems(initialQuery, initialItems));
  }, [initialItems, initialQuery]);

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim();
    const normalizedResolvedQuery = resolvedQuery.trim();

    if (!normalizedQuery) {
      setItems([]);
      setErrorMessage(null);
      setStatus("idle");
      return;
    }

    if (normalizedQuery === normalizedResolvedQuery) {
      setStatus(getStatusFromItems(normalizedQuery, items));
      return;
    }

    setStatus("typing");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(normalizedQuery)}&limit=8`,
          {
            headers: {
              accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload: unknown = await response.json();

        if (!response.ok || !isSearchSuccessPayload(payload)) {
          setItems([]);
          setStatus("error");
          setErrorMessage(
            getSearchErrorMessage(payload) ??
              "Nao foi possivel consultar a busca agora.",
          );
          return;
        }

        setItems(payload.items);
        setResolvedQuery(normalizedQuery);
        setStatus(getStatusFromItems(normalizedQuery, payload.items));
        setErrorMessage(null);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setItems([]);
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar a busca agora.",
        );
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredQuery, resolvedQuery]);

  const helperMessage = useMemo(() => {
    const normalizedQuery = query.trim();
    const normalizedInitialQuery = initialQuery.trim();

    switch (status) {
      case "typing":
        return "Digitando... a busca ao vivo atualiza os resultados sem alterar a URL.";
      case "loading":
        return "Buscando resultados atualizados em tempo real...";
      case "error":
        return "Nao foi possivel atualizar a busca agora. Confira a mensagem abaixo e tente novamente.";
      case "ready":
      case "empty":
        if (normalizedQuery && normalizedQuery !== normalizedInitialQuery) {
          return "Resultados instantaneos carregados. Pressione Enter para fixar essa busca na URL.";
        }

        return "A URL continua refletindo apenas a busca confirmada pelo usuario.";
      default:
        return "Digite um termo para consultar a data-api por meio do web app.";
    }
  }, [errorMessage, query, resolvedQuery, status]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();

    startTransition(() => {
      if (!normalizedQuery) {
        router.replace("/search");
        return;
      }

      router.replace(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    });
  };

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Buscar no banco</CardTitle>
          <CardDescription>
            Use nomes, slugs ou o `source_ref` de uma partida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              name="q"
              placeholder="Ex.: palmeiras"
              className="h-12 flex-1"
              autoComplete="off"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] px-5 text-sm font-medium text-[color:var(--accent-foreground)] disabled:opacity-70"
              disabled={isRouting}
            >
              {isRouting ? "Atualizando..." : "Buscar"}
            </button>
          </form>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            {helperMessage}
          </p>
        </CardContent>
      </Card>

      {!hasQuery ? (
        <Card className="border-dashed">
          <CardContent
            className="py-10 text-sm text-[color:var(--muted-foreground)]"
            aria-live="polite"
          >
            Digite um termo para consultar a `data-api` por meio do web app.
          </CardContent>
        </Card>
      ) : status === "error" ? (
        <Card className="border-dashed">
          <CardContent
            className="py-10 text-sm text-[color:var(--muted-foreground)]"
            aria-live="polite"
          >
            {errorMessage ?? "Nao foi possivel carregar resultados agora."}
          </CardContent>
        </Card>
      ) : items.length ? (
        <section className="grid gap-4">
          {items.map((item) => {
            const href = getSearchItemHref(item);
            const content = (
              <Card className="h-full border-black/10 bg-white/80 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white">
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
                  {item.slug ? <CardDescription>{item.slug}</CardDescription> : null}
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
          <CardContent
            className="py-10 text-sm text-[color:var(--muted-foreground)]"
            aria-live="polite"
          >
            Nenhum resultado encontrado para <strong>{query.trim()}</strong>.
          </CardContent>
        </Card>
      )}
    </>
  );
}
