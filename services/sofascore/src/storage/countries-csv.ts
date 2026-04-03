import { readFile, writeFile } from "node:fs/promises";
import { ulid } from "ulid";
import { slugify } from "@repo/utils";

import type { CountryRecord } from "../types.js";

const CSV_HEADER =
  "id;slug;name;code2;code3;source_slug;source_code2;source_code3;source_name;source;translated";
const SOURCE = "sofascore" as const;

export const loadCountries = async (filePath: string): Promise<CountryRecord[]> => {
  try {
    const content = await readFile(filePath, "utf8");
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      return [];
    }

    return normalizeCountries(lines[0], lines.slice(1));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

export const upsertCountries = (
  existingCountries: CountryRecord[],
  incomingCountries: CountryRecord[]
): CountryRecord[] => {
  const countries = [...existingCountries];

  for (const incomingCountry of incomingCountries) {
    const existingCountryIndex = countries.findIndex((existingCountry) =>
      isSameSourceCountry(existingCountry, incomingCountry)
    );

    if (existingCountryIndex === -1) {
      countries.push(createCountry(incomingCountry));
      continue;
    }

    countries[existingCountryIndex] = syncCountry(countries[existingCountryIndex], incomingCountry);
  }

  return sortCountries(countries);
};

export const saveCountries = async (
  filePath: string,
  countries: CountryRecord[]
): Promise<void> => {
  const rows = sortCountries(countries).map((country) =>
    [
      country.id,
      country.slug,
      country.name,
      country.code2,
      country.code3,
      country.source_slug,
      country.source_code2,
      country.source_code3,
      country.source_name,
      country.source,
      String(country.sourcetranslated)
    ].join(";")
  );

  await writeFile(filePath, `${[CSV_HEADER, ...rows].join("\n")}\n`, "utf8");
};

const normalizeCountries = (header: string, rows: string[]): CountryRecord[] => {
  const countries = rows.map((row) => normalizeCountryRow(header, row));
  return sortCountries(countries);
};

const normalizeCountryRow = (header: string, row: string): CountryRecord => {
  const columns = row.split(";");

  if (header === "id;name;slug") {
    const [id = "", name = "", slug = ""] = columns;

    return finalizeCountry({
      id,
      slug,
      name,
      code2: "",
      code3: "",
      source_slug: slug,
      source_code2: "",
      source_code3: "",
      source_name: name,
      source: SOURCE,
      sourcetranslated: false
    });
  }

  if (header === "id;slug;name;source") {
    const [id = "", slug = "", name = ""] = columns;

    return finalizeCountry({
      id,
      slug,
      name,
      code2: "",
      code3: "",
      source_slug: slug,
      source_code2: "",
      source_code3: "",
      source_name: name,
      source: SOURCE,
      sourcetranslated: false
    });
  }

  const [
    id = "",
    slug = "",
    name = "",
    code2 = "",
    code3 = "",
    source_slug = "",
    source_code2 = "",
    source_code3 = "",
    source_name = "",
    source = "sofascore",
    sourcetranslated = "false"
  ] = columns;

  return finalizeCountry({
    id,
    slug,
    name,
    code2,
    code3,
    source_slug,
    source_code2,
    source_code3,
    source_name,
    source: source === SOURCE ? SOURCE : SOURCE,
    sourcetranslated: sourcetranslated === "true"
  });
};

const createCountry = (country: CountryRecord): CountryRecord =>
  finalizeCountry({
    id: createUlid(),
    slug: country.source_slug,
    name: country.source_name,
    code2: country.source_code2,
    code3: country.source_code3,
    source_slug: country.source_slug,
    source_code2: country.source_code2,
    source_code3: country.source_code3,
    source_name: country.source_name,
    source: SOURCE,
    sourcetranslated: false
  });

const syncCountry = (existingCountry: CountryRecord, incomingCountry: CountryRecord): CountryRecord => {
  const shouldSyncCanonicalFields =
    existingCountry.slug === existingCountry.source_slug &&
    existingCountry.name === existingCountry.source_name &&
    existingCountry.code2 === existingCountry.source_code2 &&
    existingCountry.code3 === existingCountry.source_code3;

  const updatedSourceCountry = {
    ...existingCountry,
    source_slug: incomingCountry.source_slug,
    source_code2: incomingCountry.source_code2,
    source_code3: incomingCountry.source_code3,
    source_name: incomingCountry.source_name,
    source: SOURCE
  };

  if (!shouldSyncCanonicalFields) {
    return finalizeCountry(updatedSourceCountry);
  }

  return finalizeCountry({
    ...updatedSourceCountry,
    slug: incomingCountry.source_slug,
    name: incomingCountry.source_name,
    code2: incomingCountry.source_code2,
    code3: incomingCountry.source_code3
  });
};

const finalizeCountry = (country: CountryRecord): CountryRecord => {
  const normalizedId = country.id.trim() || createUlid();
  const baseCountry = {
    id: normalizedId,
    slug: country.slug.trim(),
    name: country.name.trim(),
    code2: country.code2.trim(),
    code3: country.code3.trim(),
    source_slug: country.source_slug.trim(),
    source_code2: country.source_code2.trim(),
    source_code3: country.source_code3.trim(),
    source_name: country.source_name.trim(),
    source: SOURCE,
    sourcetranslated: false
  };
  const translated = isTranslated(baseCountry) || country.sourcetranslated;
  const normalizedCountry = {
    ...baseCountry,
    slug: translated ? slugify(baseCountry.name) : baseCountry.slug
  };

  return {
    ...normalizedCountry,
    sourcetranslated: isTranslated(normalizedCountry)
  };
};

const isSameSourceCountry = (left: CountryRecord, right: CountryRecord): boolean =>
  left.source_name === right.source_name &&
  left.source_slug === right.source_slug &&
  left.source_code2 === right.source_code2 &&
  left.source_code3 === right.source_code3;

const isTranslated = (country: Omit<CountryRecord, "sourcetranslated">): boolean =>
  country.slug !== country.source_slug ||
  country.name !== country.source_name ||
  country.code2 !== country.source_code2 ||
  country.code3 !== country.source_code3;

const sortCountries = (countries: CountryRecord[]): CountryRecord[] =>
  [...countries].sort((left, right) => compareIds(left.id, right.id));

const compareIds = (leftId: string, rightId: string): number => {
  return leftId.localeCompare(rightId);
};

const createUlid = (): string => ulid();
