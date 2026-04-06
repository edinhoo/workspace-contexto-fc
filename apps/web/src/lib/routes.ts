import type { SearchItem } from "@services/data-api/contracts/search";

const withEntityId = (pathname: string, id: string): string => {
  const params = new URLSearchParams({ id });
  return `${pathname}?${params.toString()}`;
};

export const getTeamHref = (slug: string, id: string): string =>
  withEntityId(`/teams/${slug}`, id);

export const getPlayerHref = (slug: string, id: string): string =>
  withEntityId(`/players/${slug}`, id);

export const getMatchHref = (id: string): string => `/matches/${id}`;

export const getSearchItemHref = (item: SearchItem): string | null => {
  if (item.type === "match") {
    return getMatchHref(item.id);
  }

  if (item.type === "team" && item.slug) {
    return getTeamHref(item.slug, item.id);
  }

  if (item.type === "player" && item.slug) {
    return getPlayerHref(item.slug, item.id);
  }

  return null;
};
