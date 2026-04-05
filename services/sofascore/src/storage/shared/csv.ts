import { readFile, writeFile } from "node:fs/promises";
import { ulid } from "ulid";

export type SyncAuditFields = {
  first_scraped_at: string;
  last_scraped_at: string;
  created_at: string;
  updated_at: string;
};

export const loadCsvRows = async (
  filePath: string
): Promise<{ header: string | null; rows: string[][] }> => {
  try {
    const content = await readFile(filePath, "utf8");
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return { header: null, rows: [] };
    }

    return {
      header: lines[0] ?? null,
      rows: lines.slice(1).map(parseCsvRow)
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { header: null, rows: [] };
    }

    throw error;
  }
};

export const saveCsvRows = async (
  filePath: string,
  header: string,
  rows: string[]
): Promise<void> => {
  await writeFile(filePath, `${[header, ...rows].join("\n")}\n`, "utf8");
};

export const createEntityId = (): string => ulid();

export const compareEntityIds = (leftId: string, rightId: string): number =>
  leftId.localeCompare(rightId);

export const createTimestamp = (): string => new Date().toISOString();

export const createSourceRef = (
  ...candidates: Array<string | number | null | undefined>
): string =>
  candidates
    .map((candidate) => String(candidate ?? "").trim())
    .find((candidate) => candidate.length > 0) ?? "";

export const createAuditFields = (timestamp = createTimestamp()): SyncAuditFields => ({
  first_scraped_at: timestamp,
  last_scraped_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
});

export const normalizeAuditFields = (
  auditFields: Partial<SyncAuditFields>,
  fallbackTimestamp = createTimestamp()
): SyncAuditFields => {
  const firstScrapedAt = auditFields.first_scraped_at?.trim() || fallbackTimestamp;
  const createdAt = auditFields.created_at?.trim() || firstScrapedAt;
  const lastScrapedAt = auditFields.last_scraped_at?.trim() || firstScrapedAt;
  const updatedAt = auditFields.updated_at?.trim() || createdAt;

  return {
    first_scraped_at: firstScrapedAt,
    last_scraped_at: lastScrapedAt,
    created_at: createdAt,
    updated_at: updatedAt
  };
};

export const mergeAuditFields = (
  existingFields: Partial<SyncAuditFields>,
  changed: boolean,
  timestamp = createTimestamp()
): SyncAuditFields => {
  const normalizedExisting = normalizeAuditFields(existingFields, timestamp);

  return {
    first_scraped_at: normalizedExisting.first_scraped_at,
    last_scraped_at: timestamp,
    created_at: normalizedExisting.created_at,
    updated_at: changed ? timestamp : normalizedExisting.updated_at
  };
};

export const syncCanonicalField = (
  currentValue: string,
  previousSourceValue: string,
  incomingSourceValue: string
): string => (currentValue === previousSourceValue ? incomingSourceValue : currentValue);

const parseCsvRow = (row: string): string[] => {
  const columns: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    const nextCharacter = row[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ";" && !insideQuotes) {
      columns.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  columns.push(currentValue);

  return columns;
};
