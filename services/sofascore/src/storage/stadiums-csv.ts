import { slugify } from "@repo/utils";

import type { CityRecord, StadiumRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;short_name;city;capacity;latitude;longitude;source_id;source;edited";
const SOURCE = "sofascore" as const;

export const loadStadiums = async (filePath: string): Promise<StadiumRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortStadiums(rows.map((row) => normalizeStadiumRow(header, row)));
};

export const upsertStadiums = (
  existingStadiums: StadiumRecord[],
  incomingStadiums: StadiumRecord[]
): StadiumRecord[] => {
  const stadiums = [...existingStadiums];

  for (const incomingStadium of incomingStadiums) {
    const existingStadiumIndex = stadiums.findIndex(
      (existingStadium) => existingStadium.source_id === incomingStadium.source_id
    );

    if (existingStadiumIndex === -1) {
      stadiums.push(createStadium(incomingStadium));
      continue;
    }

    stadiums[existingStadiumIndex] = syncStadium(
      stadiums[existingStadiumIndex],
      incomingStadium
    );
  }

  return sortStadiums(stadiums);
};

export const relinkStadiumReferences = (
  stadiums: StadiumRecord[],
  cities: CityRecord[]
): StadiumRecord[] =>
  sortStadiums(
    stadiums.map((stadium) => {
      const linkedCity = cities.find(
        (city) => city.id === stadium.city || city.name === stadium.city
      );

      return finalizeStadium({
        ...stadium,
        city: linkedCity?.id ?? stadium.city
      });
    })
  );

export const saveStadiums = async (
  filePath: string,
  stadiums: StadiumRecord[]
): Promise<void> => {
  const rows = sortStadiums(stadiums).map((stadium) =>
    [
      stadium.id,
      stadium.slug,
      stadium.name,
      stadium.short_name,
      stadium.city,
      stadium.capacity,
      stadium.latitude,
      stadium.longitude,
      stadium.source_id,
      stadium.source,
      String(stadium.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeStadiumRow = (header: string, row: string): StadiumRecord => {
  const columns = row.split(";");

  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    city = "",
    capacity = "",
    latitude = "",
    longitude = "",
    source_id = "",
    source = SOURCE,
    edited = "false"
  ] = columns;

  if (header === CSV_HEADER) {
    return finalizeStadium({
      id,
      slug,
      name,
      short_name,
      city,
      capacity,
      latitude,
      longitude,
      source_id,
      source: source === SOURCE ? SOURCE : SOURCE,
      edited: edited === "true"
    });
  }

  return finalizeStadium({
    id,
    slug,
    name,
    short_name: short_name || name,
    city,
    capacity,
    latitude,
    longitude,
    source_id,
    source: SOURCE,
    edited: edited === "true"
  });
};

const createStadium = (stadium: StadiumRecord): StadiumRecord =>
  finalizeStadium({
    id: createEntityId(),
    slug: slugify(stadium.name),
    name: stadium.name,
    short_name: stadium.name,
    city: stadium.city,
    capacity: stadium.capacity,
    latitude: stadium.latitude,
    longitude: stadium.longitude,
    source_id: stadium.source_id,
    source: SOURCE,
    edited: false
  });

const syncStadium = (
  existingStadium: StadiumRecord,
  incomingStadium: StadiumRecord
): StadiumRecord => {
  const shouldSyncCanonicalFields =
    existingStadium.short_name === existingStadium.name &&
    existingStadium.name === incomingStadium.name &&
    existingStadium.capacity === incomingStadium.capacity &&
    existingStadium.latitude === incomingStadium.latitude &&
    existingStadium.longitude === incomingStadium.longitude;

  const updatedStadium = {
    ...existingStadium,
    city: incomingStadium.city,
    source_id: incomingStadium.source_id,
    source: SOURCE
  };

  if (!shouldSyncCanonicalFields) {
    return finalizeStadium(updatedStadium);
  }

  return finalizeStadium({
    ...updatedStadium,
    name: incomingStadium.name,
    short_name: incomingStadium.name,
    capacity: incomingStadium.capacity,
    latitude: incomingStadium.latitude,
    longitude: incomingStadium.longitude
  });
};

const finalizeStadium = (stadium: StadiumRecord): StadiumRecord => {
  const normalizedId = stadium.id.trim() || createEntityId();
  const baseStadium = {
    id: normalizedId,
    slug: slugify(stadium.name.trim()),
    name: stadium.name.trim(),
    short_name: stadium.short_name.trim(),
    city: stadium.city.trim(),
    capacity: stadium.capacity.trim(),
    latitude: stadium.latitude.trim(),
    longitude: stadium.longitude.trim(),
    source_id: stadium.source_id.trim(),
    source: SOURCE,
    edited: false
  };

  return {
    ...baseStadium,
    edited:
      stadium.edited ||
      baseStadium.short_name !== baseStadium.name
  };
};

const sortStadiums = (stadiums: StadiumRecord[]): StadiumRecord[] =>
  [...stadiums].sort((left, right) => compareEntityIds(left.id, right.id));
