import type { SearchItem } from "@services/data-api/contracts/search";

export const getTeamHref = (slug: string): string => `/teams/${slug}`;

export const getPlayerHref = (slug: string): string => `/players/${slug}`;

export const getMatchHref = (slug: string): string => `/matches/${slug}`;

export const getSearchItemHref = (item: SearchItem): string | null => {
  if (item.type === "match" && item.slug) {
    return getMatchHref(item.slug);
  }

  if (item.type === "team" && item.slug) {
    return getTeamHref(item.slug);
  }

  if (item.type === "player" && item.slug) {
    return getPlayerHref(item.slug);
  }

  return null;
};
