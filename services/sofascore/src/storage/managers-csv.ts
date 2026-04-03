import { slugify } from "@repo/utils";

import type { CountryRecord, ManagerRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER = "id;slug;name;short_name;country;source_id;source;edited";
const SOURCE = "sofascore" as const;

export const loadManagers = async (filePath: string): Promise<ManagerRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortManagers(rows.map((row) => normalizeManagerRow(header, row)));
};

export const upsertManagers = (
  existingManagers: ManagerRecord[],
  incomingManagers: ManagerRecord[]
): ManagerRecord[] => {
  const managers = [...existingManagers];

  for (const incomingManager of incomingManagers) {
    const existingManagerIndex = managers.findIndex(
      (existingManager) => existingManager.source_id === incomingManager.source_id
    );

    if (existingManagerIndex === -1) {
      managers.push(createManager(incomingManager));
      continue;
    }

    managers[existingManagerIndex] = syncManager(managers[existingManagerIndex], incomingManager);
  }

  return sortManagers(managers);
};

export const relinkManagerCountries = (
  managers: ManagerRecord[],
  countries: CountryRecord[]
): ManagerRecord[] =>
  sortManagers(
    managers.map((manager) => {
      const linkedCountry = countries.find(
        (country) => country.id === manager.country || country.slug === manager.country
      );

      if (!linkedCountry) {
        return manager;
      }

      return finalizeManager({
        ...manager,
        country: linkedCountry.id
      });
    })
  );

export const saveManagers = async (filePath: string, managers: ManagerRecord[]): Promise<void> => {
  const rows = sortManagers(managers).map((manager) =>
    [
      manager.id,
      manager.slug,
      manager.name,
      manager.short_name,
      manager.country,
      manager.source_id,
      manager.source,
      String(manager.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeManagerRow = (header: string, row: string): ManagerRecord => {
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
    return finalizeManager({
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

  return finalizeManager({
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

const createManager = (manager: ManagerRecord): ManagerRecord =>
  finalizeManager({
    id: createEntityId(),
    slug: manager.slug,
    name: manager.name,
    short_name: manager.short_name || manager.name,
    country: manager.country,
    source_id: manager.source_id,
    source: SOURCE,
    edited: false
  });

const syncManager = (existingManager: ManagerRecord, incomingManager: ManagerRecord): ManagerRecord => {
  const shouldSyncCanonicalFields =
    existingManager.slug === incomingManager.slug &&
    existingManager.name === incomingManager.name &&
    existingManager.short_name === incomingManager.short_name;

  const updatedManager = {
    ...existingManager,
    country: incomingManager.country,
    source_id: incomingManager.source_id,
    source: SOURCE
  };

  if (!shouldSyncCanonicalFields) {
    return finalizeManager(updatedManager);
  }

  return finalizeManager({
    ...updatedManager,
    slug: incomingManager.slug,
    name: incomingManager.name,
    short_name: incomingManager.short_name
  });
};

const finalizeManager = (manager: ManagerRecord): ManagerRecord => {
  const normalizedId = manager.id.trim() || createEntityId();
  const baseManager = {
    id: normalizedId,
    slug: slugify(manager.name.trim() || manager.slug.trim()),
    name: manager.name.trim(),
    short_name: manager.short_name.trim(),
    country: manager.country.trim(),
    source_id: manager.source_id.trim(),
    source: SOURCE,
    edited: false
  };

  return {
    ...baseManager,
    edited: manager.edited || baseManager.short_name !== baseManager.name
  };
};

const sortManagers = (managers: ManagerRecord[]): ManagerRecord[] =>
  [...managers].sort((left, right) => compareEntityIds(left.id, right.id));
