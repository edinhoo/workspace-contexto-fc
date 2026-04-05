import { slugify } from "@repo/utils";

import type { CountryRecord, TournamentRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;short_name;country;primary_color;secondary_color;source_ref;source_slug;source_name;source_primary_color;source_secondary_color;source;translated";
const SOURCE = "sofascore" as const;

export const loadTournaments = async (filePath: string): Promise<TournamentRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortTournaments(rows.map((row) => normalizeTournamentRow(header, row)));
};

export const upsertTournaments = (
  existingTournaments: TournamentRecord[],
  incomingTournaments: TournamentRecord[]
): TournamentRecord[] => {
  const tournaments = [...existingTournaments];

  for (const incomingTournament of incomingTournaments) {
    const existingTournamentIndex = tournaments.findIndex(
      (existingTournament) => existingTournament.source_ref === incomingTournament.source_ref
    );

    if (existingTournamentIndex === -1) {
      tournaments.push(createTournament(incomingTournament));
      continue;
    }

    tournaments[existingTournamentIndex] = syncTournament(
      tournaments[existingTournamentIndex],
      incomingTournament
    );
  }

  return sortTournaments(tournaments);
};

export const relinkTournamentCountries = (
  tournaments: TournamentRecord[],
  countries: CountryRecord[]
): TournamentRecord[] =>
  sortTournaments(
    tournaments.map((tournament) => {
      const linkedCountry = countries.find(
        (country) => country.id === tournament.country || country.slug === tournament.country
      );

      if (!linkedCountry) {
        return tournament;
      }

      return finalizeTournament({
        ...tournament,
        country: linkedCountry.id
      });
    })
  );

export const saveTournaments = async (
  filePath: string,
  tournaments: TournamentRecord[]
): Promise<void> => {
  const rows = sortTournaments(tournaments).map((tournament) =>
    [
      tournament.id,
      tournament.slug,
      tournament.name,
      tournament.short_name,
      tournament.country,
      tournament.primary_color,
      tournament.secondary_color,
      tournament.source_ref,
      tournament.source_slug,
      tournament.source_name,
      tournament.source_primary_color,
      tournament.source_secondary_color,
      tournament.source,
      String(tournament.translated)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeTournamentRow = (header: string, row: string[]): TournamentRecord => {

  if (
    header ===
    "id;slug;name;country;primary_color;secondary_color;source_ref;source_slug;source_name;source_primary_color;source_secondary_color;source;translated"
  ) {
    const [
      id = "",
      slug = "",
      name = "",
      country = "",
      primary_color = "",
      secondary_color = "",
      source_ref = "",
      source_slug = "",
      source_name = "",
      source_primary_color = "",
      source_secondary_color = "",
      source = SOURCE,
      translated = "false"
    ] = row;

    return finalizeTournament({
      id,
      slug,
      name,
      short_name: name,
      country,
      primary_color,
      secondary_color,
      source_ref,
      source_slug,
      source_name,
      source_primary_color,
      source_secondary_color,
      source: source === SOURCE ? SOURCE : SOURCE,
      translated: translated === "true"
    });
  }

  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    country = "",
    primary_color = "",
    secondary_color = "",
    source_ref = "",
    source_slug = "",
    source_name = "",
    source_primary_color = "",
    source_secondary_color = "",
    source = SOURCE,
    translated = "false"
  ] = row;

  if (header === CSV_HEADER) {
    return finalizeTournament({
      id,
      slug,
      name,
      short_name,
      country,
      primary_color,
      secondary_color,
      source_ref,
      source_slug,
      source_name,
      source_primary_color,
      source_secondary_color,
      source: source === SOURCE ? SOURCE : SOURCE,
      translated: translated === "true"
    });
  }

  return finalizeTournament({
    id,
    slug,
    name,
    short_name: short_name || name,
    country,
    primary_color,
    secondary_color,
    source_ref,
    source_slug: source_slug || slug,
    source_name: source_name || name,
    source_primary_color: source_primary_color || primary_color,
    source_secondary_color: source_secondary_color || secondary_color,
    source: SOURCE,
    translated: translated === "true"
  });
};

const createTournament = (tournament: TournamentRecord): TournamentRecord =>
  finalizeTournament({
    id: createEntityId(),
    slug: tournament.source_slug,
    name: tournament.source_name,
    short_name: tournament.source_name,
    country: tournament.country,
    primary_color: tournament.source_primary_color,
    secondary_color: tournament.source_secondary_color,
    source_ref: tournament.source_ref,
    source_slug: tournament.source_slug,
    source_name: tournament.source_name,
    source_primary_color: tournament.source_primary_color,
    source_secondary_color: tournament.source_secondary_color,
    source: SOURCE,
    translated: false
  });

const syncTournament = (
  existingTournament: TournamentRecord,
  incomingTournament: TournamentRecord
): TournamentRecord => {
  const shouldSyncCanonicalFields =
    existingTournament.slug === existingTournament.source_slug &&
    existingTournament.name === existingTournament.source_name &&
    existingTournament.short_name === existingTournament.source_name &&
    existingTournament.primary_color === existingTournament.source_primary_color &&
    existingTournament.secondary_color === existingTournament.source_secondary_color;

  const updatedSourceTournament = {
    ...existingTournament,
    country: incomingTournament.country,
    source_ref: incomingTournament.source_ref,
    source_slug: incomingTournament.source_slug,
    source_name: incomingTournament.source_name,
    source_primary_color: incomingTournament.source_primary_color,
    source_secondary_color: incomingTournament.source_secondary_color,
    source: SOURCE
  };

  if (!shouldSyncCanonicalFields) {
    return finalizeTournament(updatedSourceTournament);
  }

  return finalizeTournament({
    ...updatedSourceTournament,
    slug: incomingTournament.source_slug,
    name: incomingTournament.source_name,
    short_name: incomingTournament.source_name,
    primary_color: incomingTournament.source_primary_color,
    secondary_color: incomingTournament.source_secondary_color
  });
};

const finalizeTournament = (tournament: TournamentRecord): TournamentRecord => {
  const normalizedId = tournament.id.trim() || createEntityId();
  const baseTournament = {
    id: normalizedId,
    slug: tournament.slug.trim(),
    name: tournament.name.trim(),
    short_name: tournament.short_name.trim(),
    country: tournament.country.trim(),
    primary_color: tournament.primary_color.trim(),
    secondary_color: tournament.secondary_color.trim(),
    source_ref: tournament.source_ref.trim(),
    source_slug: tournament.source_slug.trim(),
    source_name: tournament.source_name.trim(),
    source_primary_color: tournament.source_primary_color.trim(),
    source_secondary_color: tournament.source_secondary_color.trim(),
    source: SOURCE,
    translated: false
  };
  const translated = isTranslated(baseTournament) || tournament.translated;
  const normalizedTournament = {
    ...baseTournament,
    slug: translated ? slugify(baseTournament.name) : baseTournament.slug
  };

  return {
    ...normalizedTournament,
    translated: isTranslated(normalizedTournament)
  };
};

const isTranslated = (tournament: Omit<TournamentRecord, "translated">): boolean =>
  tournament.slug !== tournament.source_slug ||
  tournament.name !== tournament.source_name ||
  tournament.short_name !== tournament.source_name ||
  tournament.primary_color !== tournament.source_primary_color ||
  tournament.secondary_color !== tournament.source_secondary_color;

const sortTournaments = (tournaments: TournamentRecord[]): TournamentRecord[] =>
  [...tournaments].sort((left, right) => compareEntityIds(left.id, right.id));
