import { describe, expect, it, vi } from "vitest";

import { DataApiError, getTournamentBySlug } from "@/lib/api/data-api";

import { GET } from "./route";

vi.mock("@/lib/api/data-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/data-api")>(
    "@/lib/api/data-api",
  );

  return {
    ...actual,
    getTournamentBySlug: vi.fn(),
  };
});

describe("GET /api/tournaments/by-slug/[slug]", () => {
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
    vi.mocked(getTournamentBySlug).mockResolvedValueOnce({
      tournament: {
        id: "tournament-1",
        name: "Brasileirão",
        slug: "brasileirao",
      },
      seasons: [],
      recentMatches: [],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "brasileirao" }),
    });

    expect(getTournamentBySlug).toHaveBeenCalledWith("brasileirao");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      tournament: {
        slug: "brasileirao",
      },
    });
  });

  it("maps DataApiError into JSON error responses", async () => {
    vi.mocked(getTournamentBySlug).mockRejectedValueOnce(
      new DataApiError(404, "tournament_not_found", "Tournament not found", {
        slug: "inexistente",
      }),
    );

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "inexistente" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "tournament_not_found",
        message: "Tournament not found",
        details: {
          slug: "inexistente",
        },
      },
    });
  });
});
