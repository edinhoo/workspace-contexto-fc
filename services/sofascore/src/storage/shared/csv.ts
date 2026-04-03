import { readFile, writeFile } from "node:fs/promises";
import { ulid } from "ulid";

export const loadCsvRows = async (
  filePath: string
): Promise<{ header: string | null; rows: string[] }> => {
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
      rows: lines.slice(1)
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
