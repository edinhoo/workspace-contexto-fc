import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { ENTITY_CONFIGS } from "./entities.mjs";

const dataDir = resolve(process.cwd(), "services/sofascore/data");

export const getSourceFilePath = (fileName) => resolve(dataDir, fileName);

export const parseCsvRow = (row) => {
  const columns = [];
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

export const parseCsv = (filePath) => {
  const content = readFileSync(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { headers, rows };
};

export const validateSourceFiles = () => {
  const problems = [];

  for (const config of ENTITY_CONFIGS) {
    const filePath = getSourceFilePath(config.file);

    try {
      const { headers } = parseCsv(filePath);

      if (headers.length === 0) {
        problems.push(`${config.file}: arquivo vazio ou sem header`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      problems.push(`${config.file}: ${message}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Falha na pre-validacao dos CSVs:\n- ${problems.join("\n- ")}`);
  }
};

export const sqlLiteral = (value) => {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }

  const normalizedValue = typeof value === "string" ? value : JSON.stringify(value, null, 0);

  return `'${normalizedValue.replaceAll("'", "''")}'`;
};
