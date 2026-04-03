import type { CountryRecord, SofascoreEventResponse } from "./types.js";

export const fetchCountryByEventId = async (
  eventId: string
): Promise<CountryRecord | null> => {
  const response = await fetch(`https://www.sofascore.com/api/v1/event/${eventId}`);

  if (!response.ok) {
    throw new Error(`Falha ao buscar evento ${eventId}: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as SofascoreEventResponse;
  const country = payload.event?.tournament?.category?.country;

  if (!country) {
    return null;
  }

  return {
    id: "",
    slug: country.slug,
    name: country.name,
    code2: country.alpha2 ?? "",
    code3: country.alpha3 ?? "",
    source_slug: country.slug,
    source_code2: country.alpha2 ?? "",
    source_code3: country.alpha3 ?? "",
    source_name: country.name,
    sourcetranslated: false
  };
};
