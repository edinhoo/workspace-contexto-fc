import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DataApiError,
  getMatchBySlug,
  getPlayerBySlug,
  getSeason,
  getTeamBySlug,
  getTournamentBySlug,
  searchEntities,
} from "./data-api";

describe("data-api client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls the configured data-api host for slug routes", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          match: {
            id: "match-1",
            slug: "atletico-mineiro-vs-palmeiras-2026-01-28",
            sourceRef: "15237889",
            startTime: "2026-01-28T19:30:00.000Z",
            round: null,
          },
          tournament: {
            id: "tournament-1",
            name: "Brasileirão",
            slug: "brasileirao",
          },
          season: {
            id: "season-1",
            name: "2026",
            year: 2026,
          },
          homeTeam: {
            id: "team-1",
            name: "Atlético Mineiro",
            slug: "atletico-mineiro",
            score: 0,
          },
          awayTeam: {
            id: "team-2",
            name: "Palmeiras",
            slug: "palmeiras",
            score: 0,
          },
          stadium: null,
          referee: null,
          lineups: [],
          events: [],
          teamStats: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    vi.stubEnv("DATA_API_URL", "http://example.test:9999");
    vi.stubGlobal("fetch", fetchMock);

    const response = await getMatchBySlug(
      "atletico-mineiro-vs-palmeiras-2026-01-28",
    );

    expect(response.match.slug).toBe(
      "atletico-mineiro-vs-palmeiras-2026-01-28",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.test:9999/matches/by-slug/atletico-mineiro-vs-palmeiras-2026-01-28",
      expect.objectContaining({
        cache: "force-cache",
        headers: { accept: "application/json" },
        next: {
          revalidate: 300,
        },
      }),
    );
  });

  it("propagates typed upstream errors for slug lookups", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "team_not_found",
              message: "Team not found",
              details: { slug: "time-inexistente" },
            },
          }),
          { status: 404, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(getTeamBySlug("time-inexistente")).rejects.toMatchObject({
      status: 404,
      code: "team_not_found",
      details: { slug: "time-inexistente" },
    });
  });

  it("wraps network failures as upstream_unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("socket hang up");
      }),
    );

    await expect(getPlayerBySlug("vitor-roque")).rejects.toEqual(
      expect.objectContaining({
        status: 502,
        code: "upstream_unavailable",
      }),
    );
  });

  it("builds search requests with limit", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          query: "palmeiras",
          items: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await searchEntities("palmeiras", 5);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3100/search?q=palmeiras&limit=5",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("uses cacheable fetch options for stable entity reads", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          team: {
            id: "team-1",
            name: "Palmeiras",
            slug: "palmeiras",
            shortName: "Palmeiras",
            code3: "PAL",
            primaryColor: "#0B5D1E",
            secondaryColor: "#F5F5F5",
          },
          filters: {
            season: null,
            tournament: null,
            opponent: null,
          },
          recentMatches: [],
          relatedPlayers: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await getTeamBySlug("palmeiras");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3100/teams/by-slug/palmeiras",
      expect.objectContaining({
        cache: "force-cache",
        next: {
          revalidate: 300,
        },
      }),
    );
  });

  it("supports tournament and season reads as cacheable content", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            tournament: {
              id: "tournament-1",
              name: "Brasileirão",
              slug: "brasileirao",
            },
            seasons: [],
            recentMatches: [],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            season: {
              id: "season-1",
              name: "2026",
              year: "2026",
            },
            tournament: {
              id: "tournament-1",
              name: "Brasileirão",
              slug: "brasileirao",
            },
            recentMatches: [],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    await getTournamentBySlug("brasileirao");
    await getSeason("season-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:3100/tournaments/by-slug/brasileirao",
      expect.objectContaining({
        cache: "force-cache",
        next: {
          revalidate: 300,
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:3100/seasons/season-1",
      expect.objectContaining({
        cache: "force-cache",
        next: {
          revalidate: 300,
        },
      }),
    );
  });

  it("keeps DataApiError as a real Error subtype", () => {
    const error = new DataApiError(500, "upstream_error", "Unexpected response");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DataApiError");
  });
});
