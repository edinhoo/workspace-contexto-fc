import { describe, expect, it, vi } from "vitest";

import { DataApiError, getTeamBySlug } from "@/lib/api/data-api";

import { GET } from "./route";

vi.mock("@/lib/api/data-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/data-api")>(
    "@/lib/api/data-api",
  );

  return {
    ...actual,
    getTeamBySlug: vi.fn(),
  };
});

describe("GET /api/teams/by-slug/[slug]", () => {
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
    vi.mocked(getTeamBySlug).mockResolvedValueOnce({
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
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "palmeiras" }),
    });

    expect(getTeamBySlug).toHaveBeenCalledWith("palmeiras");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      team: {
        slug: "palmeiras",
      },
    });
  });

  it("maps DataApiError into JSON error responses", async () => {
    vi.mocked(getTeamBySlug).mockRejectedValueOnce(
      new DataApiError(404, "team_not_found", "Team not found", {
        slug: "inexistente",
      }),
    );

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "inexistente" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "team_not_found",
        message: "Team not found",
        details: {
          slug: "inexistente",
        },
      },
    });
  });
});
