import { slugify } from "@repo/utils";

import type { CityRecord, CountryRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER = "id;slug;name;short_name;country;source_name;source;edited";
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
      city.source,
      String(city.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeCityRow = (header: string, row: string): CityRecord => {
  const columns = row.split(";");

  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    country = "",
    source_name = "",
    source = SOURCE,
    edited = "false"
  ] = columns;

  if (header === CSV_HEADER) {
    return finalizeCity({
      id,
      slug,
      name,
      short_name,
      country,
      source_name,
      source: source === SOURCE ? SOURCE : SOURCE,
      edited: edited === "true"
    });
  }

  return finalizeCity({
    id,
    slug,
    name,
    short_name: short_name || name,
    country,
    source_name: source_name || name,
    source: SOURCE,
    edited: edited === "true"
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
    source: SOURCE,
    edited: false
  });

const syncCity = (existingCity: CityRecord, incomingCity: CityRecord): CityRecord => {
  const shouldSyncCanonicalFields =
    existingCity.name === existingCity.source_name &&
    existingCity.short_name === existingCity.source_name;

  const updatedSourceCity = {
    ...existingCity,
    country: incomingCity.country,
    source_name: incomingCity.source_name,
    source: SOURCE
  };

  if (!shouldSyncCanonicalFields) {
    return finalizeCity(updatedSourceCity);
  }

  return finalizeCity({
    ...updatedSourceCity,
    name: incomingCity.source_name,
    short_name: incomingCity.source_name
  });
};

const finalizeCity = (city: CityRecord): CityRecord => {
  const normalizedId = city.id.trim() || createEntityId();
  const baseCity = {
    id: normalizedId,
    slug: city.slug.trim(),
    name: city.name.trim(),
    short_name: city.short_name.trim(),
    country: city.country.trim(),
    source_name: city.source_name.trim(),
    source: SOURCE,
    edited: false
  };
  const edited = isEdited(baseCity) || city.edited;
  const normalizedCity = {
    ...baseCity,
    slug: slugify(baseCity.name)
  };

  return {
    ...normalizedCity,
    edited: edited || isEdited(normalizedCity)
  };
};

const isEdited = (city: Omit<CityRecord, "edited">): boolean =>
  city.name !== city.source_name || city.short_name !== city.source_name;

const sortCities = (cities: CityRecord[]): CityRecord[] =>
  [...cities].sort((left, right) => compareEntityIds(left.id, right.id));
