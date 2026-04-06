import { describe, expect, it } from "vitest";

import type { SearchItem } from "@services/data-api/contracts/search";

import {
  getMatchHref,
  getPlayerHref,
  getSeasonHref,
  getSearchItemHref,
  getTeamHref,
  getTournamentHref,
} from "./routes";

const createSearchItem = (overrides: Partial<SearchItem> = {}): SearchItem => ({
  id: "item-1",
  type: "team",
  label: "Palmeiras",
  subtitle: "Brasil",
  slug: "palmeiras",
  ...overrides,
});

describe("routes helpers", () => {
  it("builds public hrefs by slug", () => {
    expect(getMatchHref("atletico-mineiro-vs-palmeiras-2026-01-28")).toBe(
      "/matches/atletico-mineiro-vs-palmeiras-2026-01-28",
    );
    expect(getTeamHref("palmeiras")).toBe("/teams/palmeiras");
    expect(getPlayerHref("vitor-roque")).toBe("/players/vitor-roque");
    expect(getTournamentHref("brasileirao")).toBe("/tournaments/brasileirao");
    expect(getSeasonHref("season-1")).toBe("/seasons/season-1");
  });

  it("maps search items to public hrefs", () => {
    expect(
      getSearchItemHref(createSearchItem({ type: "match", slug: "match-slug" })),
    ).toBe("/matches/match-slug");
    expect(
      getSearchItemHref(createSearchItem({ type: "team", slug: "team-slug" })),
    ).toBe("/teams/team-slug");
    expect(
      getSearchItemHref(createSearchItem({ type: "player", slug: "player-slug" })),
    ).toBe("/players/player-slug");
  });

  it("returns null when the search item has no slug", () => {
    expect(getSearchItemHref(createSearchItem({ slug: null }))).toBeNull();
  });
});
