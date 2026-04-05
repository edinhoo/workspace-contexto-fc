import { slugify } from "@repo/utils";

import type { CountryRecord, ManagerRecord } from "../types.js";
import {
  compareEntityIds,
  createAuditFields,
  createEntityId,
  loadCsvRows,
  mergeAuditFields,
  normalizeAuditFields,
  saveCsvRows
} from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;short_name;country;source_ref;source;first_scraped_at;last_scraped_at;created_at;updated_at";
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
      (existingManager) => existingManager.source_ref === incomingManager.source_ref
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
      manager.source_ref,
      manager.source,
      manager.first_scraped_at,
      manager.last_scraped_at,
      manager.created_at,
      manager.updated_at
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeManagerRow = (header: string, row: string[]): ManagerRecord => {
  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    country = "",
    source_ref = "",
    legacyOrSource = SOURCE,
    tailA = "",
    tailB = "",
    tailC = "",
    tailD = ""
  ] = row;

  const isLegacyHeader = header === "id;slug;name;short_name;country;source_ref;source;edited";
  const audit = isLegacyHeader
    ? normalizeAuditFields({})
    : normalizeAuditFields({
        first_scraped_at: tailA,
        last_scraped_at: tailB,
        created_at: tailC,
        updated_at: tailD
      });

  return finalizeManager({
    id,
    slug,
    name,
    short_name: short_name || name,
    country,
    source_ref,
    source: legacyOrSource === SOURCE ? SOURCE : SOURCE,
    ...audit
  });
};

const createManager = (manager: ManagerRecord): ManagerRecord =>
  finalizeManager({
    id: createEntityId(),
    slug: manager.slug,
    name: manager.name,
    short_name: manager.short_name || manager.name,
    country: manager.country,
    source_ref: manager.source_ref,
    source: SOURCE,
    ...createAuditFields()
  });

const syncManager = (existingManager: ManagerRecord, incomingManager: ManagerRecord): ManagerRecord => {
  const nextManager = {
    ...existingManager,
    slug: incomingManager.slug,
    name: incomingManager.name,
    short_name: incomingManager.short_name || incomingManager.name,
    country: incomingManager.country,
    source_ref: incomingManager.source_ref,
    source: SOURCE
  };
  const changed = JSON.stringify(nextManager) !== JSON.stringify({ ...existingManager, source: SOURCE });

  return finalizeManager({
    ...nextManager,
    ...mergeAuditFields(existingManager, changed)
  });
};

const finalizeManager = (manager: ManagerRecord): ManagerRecord => ({
  id: manager.id.trim() || createEntityId(),
  slug: slugify(manager.name.trim() || manager.slug.trim()),
  name: manager.name.trim(),
  short_name: manager.short_name.trim(),
  country: manager.country.trim(),
  source_ref: manager.source_ref.trim(),
  source: SOURCE,
  ...normalizeAuditFields(manager)
});

const sortManagers = (managers: ManagerRecord[]): ManagerRecord[] =>
  [...managers].sort((left, right) => compareEntityIds(left.id, right.id));
