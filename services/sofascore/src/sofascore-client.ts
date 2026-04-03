import type {
  CityRecord,
  CountryRecord,
  EventMetadata,
  ManagerRecord,
  RefereeRecord,
  SeasonRecord,
  StadiumRecord,
  SofascoreEventResponse,
  TournamentRecord
} from "./types.js";

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
  const season = payload.event?.season;
  const venue = payload.event?.venue;
  const referee = payload.event?.referee;
  const homeManager = payload.event?.homeTeam?.manager;
  const awayManager = payload.event?.awayTeam?.manager;
  const country = tournament?.category?.country;
  const uniqueTournament = tournament?.uniqueTournament;
  const venueCountry = venue?.country;
  const city = venue?.city;
  const stadium = venue?.stadium;
  const venueCoordinates = venue?.venueCoordinates;

  const countryRecord = country
    ? ({
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
      } satisfies CountryRecord)
    : null;

  const managerCountryRecords = [homeManager?.country, awayManager?.country]
    .filter((managerCountry): managerCountry is NonNullable<typeof managerCountry> => Boolean(managerCountry))
    .map(
      (managerCountry) =>
        ({
          id: "",
          slug: managerCountry.slug,
          name: managerCountry.name,
          code2: managerCountry.alpha2 ?? "",
          code3: managerCountry.alpha3 ?? "",
          source_slug: managerCountry.slug,
          source_code2: managerCountry.alpha2 ?? "",
          source_code3: managerCountry.alpha3 ?? "",
          source_name: managerCountry.name,
          source: SOURCE,
          sourcetranslated: false
        }) satisfies CountryRecord
    );

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

  const seasonRecord: SeasonRecord | null =
    season && uniqueTournament
      ? {
          id: "",
          slug: "",
          name: season.name,
          short_name: season.name,
          year: season.year ?? "",
          tournament: String(uniqueTournament.id),
          source_id: String(season.id),
          source_name: season.name,
          source_year: season.year ?? "",
          source: SOURCE,
          translated: false
        }
      : null;

  const cityRecord: CityRecord | null =
    city && venueCountry
      ? {
          id: "",
          slug: "",
          name: city.name,
          short_name: city.name,
          country: venueCountry.slug,
          source_name: city.name,
          source: SOURCE,
          edited: false
        }
      : null;

  const stadiumRecord: StadiumRecord | null =
    venue && venueCountry && city && venue.id
      ? {
          id: "",
          slug: "",
          name: stadium?.name || venue.name || "",
          short_name: stadium?.name || venue.name || "",
          city: city.name,
          capacity: String(stadium?.capacity ?? venue.capacity ?? ""),
          latitude:
            venueCoordinates?.latitude !== undefined ? String(venueCoordinates.latitude) : "",
          longitude:
            venueCoordinates?.longitude !== undefined ? String(venueCoordinates.longitude) : "",
          source_id: String(venue.id),
          source: SOURCE,
          edited: false
        }
      : null;

  const refereeRecord: RefereeRecord | null =
    referee && referee.country
      ? {
          id: "",
          slug: referee.slug,
          name: referee.name,
          short_name: referee.name,
          country: referee.country.slug,
          source_id: String(referee.id),
          source: SOURCE,
          edited: false
        }
      : null;

  const managers: ManagerRecord[] = [homeManager, awayManager]
    .filter((manager): manager is NonNullable<typeof manager> => Boolean(manager?.country))
    .map(
      (manager) =>
        ({
          id: "",
          slug: manager.slug,
          name: manager.name,
          short_name: manager.shortName ?? manager.name,
          country: manager.country?.slug ?? "",
          source_id: String(manager.id),
          source: SOURCE,
          edited: false
        }) satisfies ManagerRecord
    );

  const allCountryRecords: CountryRecord[] = [];

  if (countryRecord) {
    allCountryRecords.push(countryRecord);
  }

  allCountryRecords.push(...managerCountryRecords);

  return {
    countries: dedupeCountries(allCountryRecords),
    tournament: tournamentRecord,
    season: seasonRecord,
    city: cityRecord,
    stadium: stadiumRecord,
    referee: refereeRecord,
    managers
  };
};

const dedupeCountries = (countries: CountryRecord[]): CountryRecord[] => {
  const seen = new Set<string>();

  return countries.filter((countryRecord) => {
    const key = `${countryRecord.source_slug}:${countryRecord.source_name}:${countryRecord.code2}:${countryRecord.code3}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};
