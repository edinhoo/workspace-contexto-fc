import { slugify } from "@repo/utils";

import type { CountryRecord, RefereeRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER = "id;slug;name;short_name;country;source_id;source;edited";
const SOURCE = "sofascore" as const;

export const loadReferees = async (filePath: string): Promise<RefereeRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortReferees(rows.map((row) => normalizeRefereeRow(header, row)));
};

export const upsertReferees = (
  existingReferees: RefereeRecord[],
  incomingReferees: RefereeRecord[]
): RefereeRecord[] => {
  const referees = [...existingReferees];

  for (const incomingReferee of incomingReferees) {
    const existingRefereeIndex = referees.findIndex(
      (existingReferee) => existingReferee.source_id === incomingReferee.source_id
    );

    if (existingRefereeIndex === -1) {
      referees.push(createReferee(incomingReferee));
      continue;
    }

    referees[existingRefereeIndex] = syncReferee(
      referees[existingRefereeIndex],
      incomingReferee
    );
  }

  return sortReferees(referees);
};

export const relinkRefereeCountries = (
  referees: RefereeRecord[],
  countries: CountryRecord[]
): RefereeRecord[] =>
  sortReferees(
    referees.map((referee) => {
      const linkedCountry = countries.find(
        (country) => country.id === referee.country || country.slug === referee.country
      );

      if (!linkedCountry) {
        return referee;
      }

      return finalizeReferee({
        ...referee,
        country: linkedCountry.id
      });
    })
  );

export const saveReferees = async (
  filePath: string,
  referees: RefereeRecord[]
): Promise<void> => {
  const rows = sortReferees(referees).map((referee) =>
    [
      referee.id,
      referee.slug,
      referee.name,
      referee.short_name,
      referee.country,
      referee.source_id,
      referee.source,
      String(referee.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeRefereeRow = (header: string, row: string): RefereeRecord => {
  const columns = row.split(";");

  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    country = "",
    source_id = "",
    source = SOURCE,
    edited = "false"
  ] = columns;

  if (header === CSV_HEADER) {
    return finalizeReferee({
      id,
      slug,
      name,
      short_name,
      country,
      source_id,
      source: source === SOURCE ? SOURCE : SOURCE,
      edited: edited === "true"
    });
  }

  return finalizeReferee({
    id,
    slug,
    name,
    short_name: short_name || name,
    country,
    source_id,
    source: SOURCE,
    edited: edited === "true"
  });
};

const createReferee = (referee: RefereeRecord): RefereeRecord =>
  finalizeReferee({
    id: createEntityId(),
    slug: referee.slug,
    name: referee.name,
    short_name: referee.name,
    country: referee.country,
    source_id: referee.source_id,
    source: SOURCE,
    edited: false
  });

const syncReferee = (
  existingReferee: RefereeRecord,
  incomingReferee: RefereeRecord
): RefereeRecord => {
  const shouldSyncCanonicalFields =
    existingReferee.slug === incomingReferee.slug &&
    existingReferee.name === incomingReferee.name &&
    existingReferee.short_name === existingReferee.name;

  const updatedReferee = {
    ...existingReferee,
    country: incomingReferee.country,
    source_id: incomingReferee.source_id,
    source: SOURCE
  };

  if (!shouldSyncCanonicalFields) {
    return finalizeReferee(updatedReferee);
  }

  return finalizeReferee({
    ...updatedReferee,
    slug: incomingReferee.slug,
    name: incomingReferee.name,
    short_name: incomingReferee.name
  });
};

const finalizeReferee = (referee: RefereeRecord): RefereeRecord => {
  const normalizedId = referee.id.trim() || createEntityId();
  const baseReferee = {
    id: normalizedId,
    slug: slugify(referee.name.trim() || referee.slug.trim()),
    name: referee.name.trim(),
    short_name: referee.short_name.trim(),
    country: referee.country.trim(),
    source_id: referee.source_id.trim(),
    source: SOURCE,
    edited: false
  };

  return {
    ...baseReferee,
    edited: referee.edited || baseReferee.short_name !== baseReferee.name
  };
};

const sortReferees = (referees: RefereeRecord[]): RefereeRecord[] =>
  [...referees].sort((left, right) => compareEntityIds(left.id, right.id));
