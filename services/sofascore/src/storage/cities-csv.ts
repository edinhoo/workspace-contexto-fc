import { slugify } from "@repo/utils";

import type { CityRecord, CountryRecord } from "../types.js";
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
  "id;slug;name;short_name;country;source_name;source_ref;source;first_scraped_at;last_scraped_at;created_at;updated_at";
const SOURCE = "sofascore" as const;

export const loadCities = async (filePath: string): Promise<CityRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortCities(rows.map((row) => normalizeCityRow(header, row)));
};

export const upsertCities = (
  existingCities: CityRecord[],
  incomingCities: CityRecord[]
): CityRecord[] => {
  const cities = [...existingCities];

  for (const incomingCity of incomingCities) {
    const existingCityIndex = cities.findIndex(
      (existingCity) =>
        existingCity.source_name === incomingCity.source_name &&
        existingCity.country === incomingCity.country
    );

    if (existingCityIndex === -1) {
      cities.push(createCity(incomingCity));
      continue;
    }

    cities[existingCityIndex] = syncCity(cities[existingCityIndex], incomingCity);
  }

  return sortCities(cities);
};

export const relinkCityCountries = (
  cities: CityRecord[],
  countries: CountryRecord[]
): CityRecord[] =>
  sortCities(
    cities.map((city) => {
      const linkedCountry = countries.find(
        (country) => country.id === city.country || country.slug === city.country
      );

      if (!linkedCountry) {
        return city;
      }

      return finalizeCity({
        ...city,
        country: linkedCountry.id
      });
    })
  );

export const saveCities = async (filePath: string, cities: CityRecord[]): Promise<void> => {
  const rows = sortCities(cities).map((city) =>
    [
      city.id,
      city.slug,
      city.name,
      city.short_name,
      city.country,
      city.source_name,
      city.source_ref,
      city.source,
      city.first_scraped_at,
      city.last_scraped_at,
      city.created_at,
      city.updated_at
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeCityRow = (header: string, row: string[]): CityRecord => {
  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    country = "",
    source_name = "",
    legacyOrSourceRef = "",
    legacyOrSource = SOURCE,
    tailA = "",
    tailB = "",
    tailC = "",
    tailD = ""
  ] = row;

  const isLegacyHeader = header === "id;slug;name;short_name;country;source_name;source;edited";
  const source_ref = isLegacyHeader ? createSourceRef(source_name || name) : legacyOrSourceRef;
  const source = isLegacyHeader ? legacyOrSource : legacyOrSource;
  const audit = isLegacyHeader
    ? normalizeAuditFields({})
    : normalizeAuditFields({
        first_scraped_at: tailA,
        last_scraped_at: tailB,
        created_at: tailC,
        updated_at: tailD
      });

  return finalizeCity({
    id,
    slug,
    name,
    short_name: short_name || name,
    country,
    source_name: source_name || name,
    source_ref,
    source: source === SOURCE ? SOURCE : SOURCE,
    ...audit
  });
};

const createCity = (city: CityRecord): CityRecord =>
  finalizeCity({
    id: createEntityId(),
    slug: slugify(city.source_name),
    name: city.source_name,
    short_name: city.source_name,
    country: city.country,
    source_name: city.source_name,
    source_ref: city.source_ref || createSourceRef(city.source_name),
    source: SOURCE,
    ...createAuditFields()
  });

const syncCity = (existingCity: CityRecord, incomingCity: CityRecord): CityRecord => {
  const nextCity = {
    ...existingCity,
    name: syncCanonicalField(
      existingCity.name,
      existingCity.source_name,
      incomingCity.source_name
    ),
    short_name: syncCanonicalField(
      existingCity.short_name,
      existingCity.source_name,
      incomingCity.source_name
    ),
    country: incomingCity.country,
    source_name: incomingCity.source_name,
    source_ref: incomingCity.source_ref || existingCity.source_ref,
    source: SOURCE
  };

  const changed =
    nextCity.name !== existingCity.name ||
    nextCity.short_name !== existingCity.short_name ||
    nextCity.country !== existingCity.country ||
    nextCity.source_name !== existingCity.source_name ||
    nextCity.source_ref !== existingCity.source_ref;

  return finalizeCity({
    ...nextCity,
    ...mergeAuditFields(existingCity, changed)
  });
};

const finalizeCity = (city: CityRecord): CityRecord => {
  const audit = normalizeAuditFields(city);

  return {
    id: city.id.trim() || createEntityId(),
    slug: slugify(city.name.trim() || city.source_name.trim()),
    name: city.name.trim(),
    short_name: city.short_name.trim(),
    country: city.country.trim(),
    source_name: city.source_name.trim(),
    source_ref: city.source_ref.trim() || createSourceRef(city.source_name),
    source: SOURCE,
    ...audit
  };
};

const sortCities = (cities: CityRecord[]): CityRecord[] =>
  [...cities].sort((left, right) => compareEntityIds(left.id, right.id));
