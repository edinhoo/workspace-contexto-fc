import { describe, expect, it, vi } from "vitest";

import { DataApiError, getMatchBySlug } from "@/lib/api/data-api";

import { GET } from "./route";

vi.mock("@/lib/api/data-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/data-api")>(
    "@/lib/api/data-api",
  );

  return {
    ...actual,
    getMatchBySlug: vi.fn(),
  };
});

describe("GET /api/matches/by-slug/[slug]", () => {
  it("returns 400 when slug is blank", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "   " }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "validation_error",
        message: "Route parameter 'slug' is required",
      },
    });
  });

  it("returns the upstream payload when slug lookup succeeds", async () => {
    vi.mocked(getMatchBySlug).mockResolvedValueOnce({
      match: {
        id: "match-1",
        slug: "atletico-mineiro-vs-palmeiras-2026-01-28",
        sourceRef: "15237889",
        startTime: "2026-01-28T22:00:00.000Z",
        round: "1",
      },
      tournament: {
        id: "tournament-1",
        name: "Brasileirão Betano",
        slug: "brasileirao-serie-a",
      },
      season: {
        id: "season-1",
        name: "Brasileiro Serie A 2026",
        year: "2026",
      },
      homeTeam: {
        id: "team-1",
        name: "Atlético Mineiro",
        slug: "atletico-mineiro",
        score: 2,
      },
      awayTeam: {
        id: "team-2",
        name: "Palmeiras",
        slug: "palmeiras",
        score: 2,
      },
      stadium: null,
      referee: null,
      lineups: [],
      events: [],
      teamStats: [],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        slug: "atletico-mineiro-vs-palmeiras-2026-01-28",
      }),
    });

    expect(getMatchBySlug).toHaveBeenCalledWith(
      "atletico-mineiro-vs-palmeiras-2026-01-28",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      match: {
        slug: "atletico-mineiro-vs-palmeiras-2026-01-28",
      },
    });
  });

  it("maps DataApiError into JSON error responses", async () => {
    vi.mocked(getMatchBySlug).mockRejectedValueOnce(
      new DataApiError(404, "match_not_found", "Match not found", {
        slug: "partida-inexistente",
      }),
    );

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "partida-inexistente" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "match_not_found",
        message: "Match not found",
        details: {
          slug: "partida-inexistente",
        },
      },
    });
  });
});
