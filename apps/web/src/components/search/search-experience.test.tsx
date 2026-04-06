// @vitest-environment jsdom

import { createElement } from "react";
import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchItem } from "@services/data-api/contracts/search";

import { SearchExperience } from "./search-experience";

const replaceMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => createElement("a", { href }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const createSearchItem = (overrides: Partial<SearchItem> = {}): SearchItem => ({
  id: "team-1",
  type: "team",
  label: "Palmeiras",
  subtitle: "Brasil",
  slug: "palmeiras",
  ...overrides,
});

type DeferredResponse = {
  resolve: (value: Response) => void;
  reject: (reason?: unknown) => void;
};

const createDeferredResponse = (): {
  promise: Promise<Response>;
  controls: DeferredResponse;
} => {
  let resolve!: (value: Response) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<Response>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    promise,
    controls: { resolve, reject },
  };
};

const flushDebounce = async () => {
  await act(async () => {
    // Usa tempo real de proposito: esta suite cobre useDeferredValue + debounce
    // e ficou mais estavel assim do que com fake timers globais.
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
};

describe("SearchExperience", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders idle state without a query", () => {
    render(createElement(SearchExperience, { initialItems: [], initialQuery: "" }));

    expect(screen.getByRole("heading", { name: "Buscar no banco" })).toBeInTheDocument();
    expect(
      screen.getByText("Use nomes, slugs ou o `source_ref` de uma partida."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Digite um termo para consultar a `data-api` por meio do web app."),
    ).toBeInTheDocument();
  });

  it("loads live results after debounce without updating the URL", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [createSearchItem()],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    render(createElement(SearchExperience, { initialItems: [], initialQuery: "" }));

    const input = screen.getByPlaceholderText("Ex.: palmeiras");
    fireEvent.change(input, { target: { value: "palmeiras" } });

    expect(
      screen.getByText(
        "Digitando... a busca ao vivo atualiza os resultados sem alterar a URL.",
      ),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();

    await flushDebounce();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/search?q=palmeiras&limit=8",
        expect.objectContaining({
          cache: "no-store",
          signal: expect.any(AbortSignal),
        }),
      );
    });

    expect(await screen.findByText("Palmeiras")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Resultados instantaneos carregados. Pressione Enter para fixar essa busca na URL.",
      ),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("shows empty state when the search returns no results", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    render(createElement(SearchExperience, { initialItems: [], initialQuery: "" }));

    const input = screen.getByPlaceholderText("Ex.: palmeiras");
    fireEvent.change(input, { target: { value: "abc" } });

    await flushDebounce();

    expect(
      await screen.findByText(/Nenhum resultado encontrado para/i),
    ).toBeInTheDocument();
    expect(screen.getByText("abc")).toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "upstream_error",
            message: "Falha upstream",
          },
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      ),
    );

    render(createElement(SearchExperience, { initialItems: [], initialQuery: "" }));

    const input = screen.getByPlaceholderText("Ex.: palmeiras");
    fireEvent.change(input, { target: { value: "erro" } });

    await flushDebounce();

    const errorMessages = await screen.findAllByText("Falha upstream");
    expect(errorMessages).toHaveLength(1);
  });

  it("updates the URL only on explicit submit", async () => {
    render(createElement(SearchExperience, { initialItems: [], initialQuery: "" }));

    const input = screen.getByPlaceholderText("Ex.: palmeiras");
    fireEvent.change(input, { target: { value: "palmeiras" } });

    expect(replaceMock).not.toHaveBeenCalled();

    fireEvent.submit(input.closest("form")!);

    expect(replaceMock).toHaveBeenCalledWith("/search?q=palmeiras");
  });

  it("aborts the previous request when the query changes before the response", async () => {
    const fetchMock = vi.mocked(fetch);
    const firstResponse = createDeferredResponse();

    fetchMock
      .mockImplementationOnce((_, init) => {
        const signal = init?.signal as AbortSignal | undefined;

        signal?.addEventListener("abort", () => {
          firstResponse.controls.reject(new DOMException("Aborted", "AbortError"));
        });

        return firstResponse.promise;
      })
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [createSearchItem({ label: "Palmeiras atualizado" })],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    render(createElement(SearchExperience, { initialItems: [], initialQuery: "" }));
    const input = screen.getByPlaceholderText("Ex.: palmeiras");
    fireEvent.change(input, { target: { value: "pal" } });
    await flushDebounce();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "palmeiras" } });
    await flushDebounce();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Palmeiras atualizado")).toBeInTheDocument();
  });
});
