import { describe, expect, it, vi } from "vitest";

import { DataApiError, getSeason } from "@/lib/api/data-api";

import { GET } from "./route";

vi.mock("@/lib/api/data-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/data-api")>(
    "@/lib/api/data-api",
  );

  return {
    ...actual,
    getSeason: vi.fn(),
  };
});

describe("GET /api/seasons/[id]", () => {
  it("returns 400 when id is blank", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "   " }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "validation_error",
        message: "Route parameter 'id' is required",
      },
    });
  });

  it("returns the upstream payload when id lookup succeeds", async () => {
    vi.mocked(getSeason).mockResolvedValueOnce({
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
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "season-1" }),
    });

    expect(getSeason).toHaveBeenCalledWith("season-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      season: {
        id: "season-1",
      },
    });
  });

  it("maps DataApiError into JSON error responses", async () => {
    vi.mocked(getSeason).mockRejectedValueOnce(
      new DataApiError(404, "season_not_found", "Season not found", {
        seasonId: "missing-season",
      }),
    );

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "missing-season" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "season_not_found",
        message: "Season not found",
        details: {
          seasonId: "missing-season",
        },
      },
    });
  });
});
