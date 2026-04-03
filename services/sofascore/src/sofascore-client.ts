import type { CountryRecord, EventMetadata, SofascoreEventResponse, TournamentRecord } from "./types.js";

const SOURCE = "sofascore" as const;

export const fetchEventMetadataByEventId = async (
  eventId: string
): Promise<EventMetadata> => {
  const response = await fetch(`https://www.sofascore.com/api/v1/event/${eventId}`);

  if (!response.ok) {
    throw new Error(`Falha ao buscar evento ${eventId}: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as SofascoreEventResponse;
  const tournament = payload.event?.tournament;
  const country = tournament?.category?.country;
  const uniqueTournament = tournament?.uniqueTournament;

  const countryRecord: CountryRecord | null = country
    ? {
        id: "",
        slug: country.slug,
        name: country.name,
        code2: country.alpha2 ?? "",
        code3: country.alpha3 ?? "",
        source_slug: country.slug,
        source_code2: country.alpha2 ?? "",
        source_code3: country.alpha3 ?? "",
        source_name: country.name,
        source: SOURCE,
        sourcetranslated: false
      }
    : null;

  const tournamentRecord: TournamentRecord | null =
    tournament && uniqueTournament && country
      ? {
          id: "",
          slug: tournament.slug,
          name: tournament.name,
          short_name: tournament.name,
          country: country.slug,
          primary_color: uniqueTournament.primaryColorHex ?? "",
          secondary_color: uniqueTournament.secondaryColorHex ?? "",
          source_id: String(uniqueTournament.id),
          source_slug: tournament.slug,
          source_name: tournament.name,
          source_primary_color: uniqueTournament.primaryColorHex ?? "",
          source_secondary_color: uniqueTournament.secondaryColorHex ?? "",
          source: SOURCE,
          translated: false
        }
      : null;

  return {
    country: countryRecord,
    tournament: tournamentRecord
  };
};
