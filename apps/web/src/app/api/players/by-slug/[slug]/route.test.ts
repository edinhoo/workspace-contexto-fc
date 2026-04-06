import { describe, expect, it, vi } from "vitest";

import { DataApiError, getPlayerBySlug } from "@/lib/api/data-api";

import { GET } from "./route";

vi.mock("@/lib/api/data-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/data-api")>(
    "@/lib/api/data-api",
  );

  return {
    ...actual,
    getPlayerBySlug: vi.fn(),
  };
});

describe("GET /api/players/by-slug/[slug]", () => {
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
    vi.mocked(getPlayerBySlug).mockResolvedValueOnce({
      player: {
        id: "player-1",
        name: "Vitor Roque",
        slug: "vitor-roque",
        shortName: "V. Roque",
        position: "F",
        countryName: "Brazil",
        dateOfBirth: "2005-02-27T00:00:00.000Z",
      },
      currentTeams: [],
      recentAppearances: [],
      statEntries: [],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "vitor-roque" }),
    });

    expect(getPlayerBySlug).toHaveBeenCalledWith("vitor-roque");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      player: {
        slug: "vitor-roque",
      },
    });
  });

  it("maps DataApiError into JSON error responses", async () => {
    vi.mocked(getPlayerBySlug).mockRejectedValueOnce(
      new DataApiError(404, "player_not_found", "Player not found", {
        slug: "jogador-inexistente",
      }),
    );

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "jogador-inexistente" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "player_not_found",
        message: "Player not found",
        details: {
          slug: "jogador-inexistente",
        },
      },
    });
  });
});
