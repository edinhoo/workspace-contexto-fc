import { slugify } from "@repo/utils";

import type { SeasonRecord, TournamentRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;short_name;year;tournament;source_id;source_name;source_year;source;translated";
const SOURCE = "sofascore" as const;

export const loadSeasons = async (filePath: string): Promise<SeasonRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortSeasons(rows.map((row) => normalizeSeasonRow(header, row)));
};

export const upsertSeasons = (
  existingSeasons: SeasonRecord[],
  incomingSeasons: SeasonRecord[]
): SeasonRecord[] => {
  const seasons = [...existingSeasons];

  for (const incomingSeason of incomingSeasons) {
    const existingSeasonIndex = seasons.findIndex(
      (existingSeason) => existingSeason.source_id === incomingSeason.source_id
    );

    if (existingSeasonIndex === -1) {
      seasons.push(createSeason(incomingSeason));
      continue;
    }

    seasons[existingSeasonIndex] = syncSeason(seasons[existingSeasonIndex], incomingSeason);
  }

  return sortSeasons(seasons);
};

export const relinkSeasonTournaments = (
  seasons: SeasonRecord[],
  tournaments: TournamentRecord[]
): SeasonRecord[] =>
  sortSeasons(
    seasons.map((season) => {
      const linkedTournament = tournaments.find(
        (tournament) =>
          tournament.id === season.tournament || tournament.source_id === season.tournament
      );

      if (!linkedTournament) {
        return season;
      }

      return finalizeSeason({
        ...season,
        tournament: linkedTournament.id
      });
    })
  );

export const saveSeasons = async (
  filePath: string,
  seasons: SeasonRecord[]
): Promise<void> => {
  const rows = sortSeasons(seasons).map((season) =>
    [
      season.id,
      season.slug,
      season.name,
      season.short_name,
      season.year,
      season.tournament,
      season.source_id,
      season.source_name,
      season.source_year,
      season.source,
      String(season.translated)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeSeasonRow = (header: string, row: string): SeasonRecord => {
  const columns = row.split(";");

  if (
    header ===
    "id;slug;name;short_name;year;tournament;source_id;source_slug;source_name;source_year;source;translated"
  ) {
    const [
      id = "",
      slug = "",
      name = "",
      short_name = "",
      year = "",
      tournament = "",
      source_id = "",
      source_name = "",
      source_year = "",
      source = SOURCE,
      translated = "false"
    ] = columns;

    return finalizeSeason({
      id,
      slug,
      name,
      short_name,
      year,
      tournament,
      source_id,
      source_name,
      source_year,
      source: source === SOURCE ? SOURCE : SOURCE,
      translated: translated === "true"
    });
  }

  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    year = "",
    tournament = "",
    source_id = "",
    source_name = "",
    source_year = "",
    source = SOURCE,
    translated = "false"
  ] = columns;

  if (header === CSV_HEADER) {
    return finalizeSeason({
      id,
      slug,
      name,
      short_name,
      year,
      tournament,
      source_id,
      source_name,
      source_year,
      source: source === SOURCE ? SOURCE : SOURCE,
      translated: translated === "true"
    });
  }

  return finalizeSeason({
    id,
    slug,
    name,
    short_name: short_name || name,
    year,
    tournament,
    source_id,
    source_name: source_name || name,
    source_year: source_year || year,
    source: SOURCE,
    translated: translated === "true"
  });
};

const createSeason = (season: SeasonRecord): SeasonRecord =>
  finalizeSeason({
    id: createEntityId(),
    slug: slugify(season.source_name),
    name: season.source_name,
    short_name: season.source_name,
    year: season.source_year,
    tournament: season.tournament,
    source_id: season.source_id,
    source_name: season.source_name,
    source_year: season.source_year,
    source: SOURCE,
    translated: false
  });

const syncSeason = (existingSeason: SeasonRecord, incomingSeason: SeasonRecord): SeasonRecord => {
  const shouldSyncCanonicalFields =
    existingSeason.name === existingSeason.source_name &&
    existingSeason.short_name === existingSeason.source_name &&
    existingSeason.year === existingSeason.source_year;

  const updatedSourceSeason = {
    ...existingSeason,
    tournament: incomingSeason.tournament,
    source_id: incomingSeason.source_id,
    source_name: incomingSeason.source_name,
    source_year: incomingSeason.source_year,
    source: SOURCE
  };

  if (!shouldSyncCanonicalFields) {
    return finalizeSeason(updatedSourceSeason);
  }

  return finalizeSeason({
    ...updatedSourceSeason,
    slug: slugify(incomingSeason.source_name),
    name: incomingSeason.source_name,
    short_name: incomingSeason.source_name,
    year: incomingSeason.source_year
  });
};

const finalizeSeason = (season: SeasonRecord): SeasonRecord => {
  const normalizedId = season.id.trim() || createEntityId();
  const baseSeason = {
    id: normalizedId,
    slug: season.slug.trim(),
    name: season.name.trim(),
    short_name: season.short_name.trim(),
    year: season.year.trim(),
    tournament: season.tournament.trim(),
    source_id: season.source_id.trim(),
    source_name: season.source_name.trim(),
    source_year: season.source_year.trim(),
    source: SOURCE,
    translated: false
  };
  const translated = isTranslated(baseSeason) || season.translated;
  const normalizedSeason = {
    ...baseSeason,
    slug: translated ? slugify(baseSeason.name) : baseSeason.slug
  };

  return {
    ...normalizedSeason,
    translated: isTranslated(normalizedSeason)
  };
};

const isTranslated = (season: Omit<SeasonRecord, "translated">): boolean =>
  season.name !== season.source_name ||
  season.short_name !== season.source_name ||
  season.year !== season.source_year;

const sortSeasons = (seasons: SeasonRecord[]): SeasonRecord[] =>
  [...seasons].sort((left, right) => compareEntityIds(left.id, right.id));
