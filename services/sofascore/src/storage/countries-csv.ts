import { slugify } from "@repo/utils";

import type { CountryRecord } from "../types.js";
import {
  compareEntityIds,
  createAuditFields,
  createEntityId,
  createSourceRef,
  loadCsvRows,
  mergeAuditFields,
  normalizeAuditFields,
  saveCsvRows,
  syncCanonicalField
} from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;code2;code3;source_slug;source_code2;source_code3;source_name;source_ref;source;first_scraped_at;last_scraped_at;created_at;updated_at";
const SOURCE = "sofascore" as const;

export const loadCountries = async (filePath: string): Promise<CountryRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortCountries(rows.map((row) => normalizeCountryRow(header, row)));
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
      country.source_ref,
      country.source,
      country.first_scraped_at,
      country.last_scraped_at,
      country.created_at,
      country.updated_at
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
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
      source_ref: createSourceRef(slug, name),
      source: SOURCE
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
      source_ref: createSourceRef(slug, name),
      source: SOURCE
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
    legacyOrSourceRef = "",
    legacySource = SOURCE,
    legacyTailA = "",
    legacyTailB = "",
    legacyTailC = "",
    legacyTailD = ""
  ] = columns;

  const isLegacyHeader =
    header ===
    "id;slug;name;code2;code3;source_slug;source_code2;source_code3;source_name;source;translated";
  const source_ref = isLegacyHeader
    ? createSourceRef(source_slug, source_name)
    : legacyOrSourceRef;
  const source = isLegacyHeader ? legacySource : legacySource;
  const audit = isLegacyHeader
    ? normalizeAuditFields({})
    : normalizeAuditFields({
        first_scraped_at: legacyTailA,
        last_scraped_at: legacyTailB,
        created_at: legacyTailC,
        updated_at: legacyTailD
      });

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
    source_ref,
    source: source === SOURCE ? SOURCE : SOURCE,
    ...audit
  });
};

const createCountry = (country: CountryRecord): CountryRecord =>
  finalizeCountry({
    id: createEntityId(),
    slug: country.source_slug,
    name: country.source_name,
    code2: country.source_code2,
    code3: country.source_code3,
    source_slug: country.source_slug,
    source_code2: country.source_code2,
    source_code3: country.source_code3,
    source_name: country.source_name,
    source_ref: country.source_ref || createSourceRef(country.source_slug, country.source_name),
    source: SOURCE,
    ...createAuditFields()
  });

const syncCountry = (existingCountry: CountryRecord, incomingCountry: CountryRecord): CountryRecord => {
  const nextCountry = {
    ...existingCountry,
    slug: syncCanonicalField(
      existingCountry.slug,
      existingCountry.source_slug,
      incomingCountry.source_slug
    ),
    name: syncCanonicalField(
      existingCountry.name,
      existingCountry.source_name,
      incomingCountry.source_name
    ),
    code2: syncCanonicalField(
      existingCountry.code2,
      existingCountry.source_code2,
      incomingCountry.source_code2
    ),
    code3: syncCanonicalField(
      existingCountry.code3,
      existingCountry.source_code3,
      incomingCountry.source_code3
    ),
    source_slug: incomingCountry.source_slug,
    source_code2: incomingCountry.source_code2,
    source_code3: incomingCountry.source_code3,
    source_name: incomingCountry.source_name,
    source_ref: incomingCountry.source_ref || existingCountry.source_ref,
    source: SOURCE
  };

  const changed =
    nextCountry.slug !== existingCountry.slug ||
    nextCountry.name !== existingCountry.name ||
    nextCountry.code2 !== existingCountry.code2 ||
    nextCountry.code3 !== existingCountry.code3 ||
    nextCountry.source_slug !== existingCountry.source_slug ||
    nextCountry.source_code2 !== existingCountry.source_code2 ||
    nextCountry.source_code3 !== existingCountry.source_code3 ||
    nextCountry.source_name !== existingCountry.source_name ||
    nextCountry.source_ref !== existingCountry.source_ref;

  return finalizeCountry({
    ...nextCountry,
    ...mergeAuditFields(existingCountry, changed)
  });
};

const finalizeCountry = (country: CountryRecord): CountryRecord => {
  const normalizedId = country.id.trim() || createEntityId();
  const audit = normalizeAuditFields(country);

  return {
    id: normalizedId,
    slug: country.slug.trim() || slugify(country.name.trim()),
    name: country.name.trim(),
    code2: country.code2.trim(),
    code3: country.code3.trim(),
    source_slug: country.source_slug.trim(),
    source_code2: country.source_code2.trim(),
    source_code3: country.source_code3.trim(),
    source_name: country.source_name.trim(),
    source_ref: country.source_ref.trim() || createSourceRef(country.source_slug, country.source_name),
    source: SOURCE,
    ...audit
  };
};

const isSameSourceCountry = (left: CountryRecord, right: CountryRecord): boolean =>
  left.source_name === right.source_name &&
  left.source_slug === right.source_slug &&
  left.source_code2 === right.source_code2 &&
  left.source_code3 === right.source_code3;

const sortCountries = (countries: CountryRecord[]): CountryRecord[] =>
  [...countries].sort((left, right) => compareEntityIds(left.id, right.id));
