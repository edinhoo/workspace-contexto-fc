import type {
  CityRecord,
  CountryRecord,
  EventLineupsMetadata,
  EventMetadata,
  ManagerRecord,
  PlayerRecord,
  RefereeRecord,
  SeasonRecord,
  SofascoreEventResponse,
  SofascoreLineupsResponse,
  StadiumRecord,
  TeamRecord,
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
  const event = payload.event;
  const tournament = event?.tournament;
  const season = event?.season;
  const eventVenue = event?.venue;
  const referee = event?.referee;
  const homeTeam = event?.homeTeam;
  const awayTeam = event?.awayTeam;
  const country = tournament?.category?.country;
  const uniqueTournament = tournament?.uniqueTournament;

  const countries: CountryRecord[] = [];

  if (country) {
    countries.push(createCountryRecord(country));
  }

  if (eventVenue?.country) {
    countries.push(createCountryRecord(eventVenue.country));
  }

  if (referee?.country) {
    countries.push(createCountryRecord(referee.country));
  }

  const teamCountries = [homeTeam?.country, awayTeam?.country, homeTeam?.venue?.country, awayTeam?.venue?.country]
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => createCountryRecord(item));

  countries.push(...teamCountries);

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

  const cities = dedupeCities([
    createCityRecord(eventVenue?.city?.name, eventVenue?.country?.slug),
    createCityRecord(homeTeam?.venue?.city?.name, homeTeam?.venue?.country?.slug),
    createCityRecord(awayTeam?.venue?.city?.name, awayTeam?.venue?.country?.slug)
  ]);

  const stadiums = dedupeStadiums([
    createStadiumRecord(eventVenue),
    createStadiumRecord(homeTeam?.venue),
    createStadiumRecord(awayTeam?.venue)
  ]);

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

  const managers: ManagerRecord[] = [homeTeam?.manager, awayTeam?.manager]
    .filter((manager): manager is NonNullable<typeof manager> => Boolean(manager?.country))
    .map((manager) => ({
      id: "",
      slug: manager.slug,
      name: manager.name,
      short_name: manager.shortName ?? manager.name,
      country: manager.country?.slug ?? "",
      source_id: String(manager.id),
      source: SOURCE,
      edited: false
    }));

  const teams = [homeTeam, awayTeam]
    .filter((team): team is NonNullable<typeof team> => Boolean(team?.id))
    .map((team) => createTeamRecord(team));

  return {
    countries: dedupeCountries(countries),
    tournament: tournamentRecord,
    season: seasonRecord,
    cities,
    stadiums,
    referee: refereeRecord,
    managers,
    teams
  };
};

export const fetchEventLineupsByEventId = async (
  eventId: string
): Promise<EventLineupsMetadata> => {
  const response = await fetch(`https://www.sofascore.com/api/v1/event/${eventId}/lineups`);

  if (!response.ok) {
    throw new Error(
      `Falha ao buscar lineups do evento ${eventId}: ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as SofascoreLineupsResponse;
  const lineupPlayers = [
    ...(payload.home?.players ?? []),
    ...(payload.home?.missingPlayers ?? []),
    ...(payload.away?.players ?? []),
    ...(payload.away?.missingPlayers ?? [])
  ];

  const countries = dedupeCountries(
    lineupPlayers
      .map((lineupPlayer) => lineupPlayer.player?.country)
      .filter((country): country is NonNullable<typeof country> => Boolean(country))
      .map((country) => createCountryRecord(country))
  );

  const players = dedupePlayers(
    lineupPlayers
      .map((lineupPlayer) => createPlayerRecord(lineupPlayer.player))
      .filter((player): player is PlayerRecord => player !== null)
  );

  return {
    countries,
    players
  };
};

const createCountryRecord = (country: {
  alpha2?: string;
  alpha3?: string;
  name: string;
  slug: string;
}): CountryRecord => ({
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
});

const createCityRecord = (
  cityName?: string,
  countrySlug?: string
): CityRecord | null =>
  cityName && countrySlug
    ? {
        id: "",
        slug: "",
        name: cityName,
        short_name: cityName,
        country: countrySlug,
        source_name: cityName,
        source: SOURCE,
        edited: false
      }
    : null;

const createStadiumRecord = (
  venue?:
    | {
        id?: number;
        name?: string;
        capacity?: number;
        venueCoordinates?: { latitude?: number; longitude?: number };
        city?: { name: string };
        stadium?: { name?: string; capacity?: number };
      }
    | null
): StadiumRecord | null =>
  venue && venue.city && venue.id
    ? {
        id: "",
        slug: "",
        name: venue.stadium?.name || venue.name || "",
        short_name: venue.stadium?.name || venue.name || "",
        city: venue.city.name,
        capacity: String(venue.stadium?.capacity ?? venue.capacity ?? ""),
        latitude:
          venue.venueCoordinates?.latitude !== undefined
            ? String(venue.venueCoordinates.latitude)
            : "",
        longitude:
          venue.venueCoordinates?.longitude !== undefined
            ? String(venue.venueCoordinates.longitude)
            : "",
        source_id: String(venue.id),
        source: SOURCE,
        edited: false
      }
    : null;

const createTeamRecord = (team: {
  id: number;
  name: string;
  slug: string;
  shortName?: string;
  nameCode?: string;
  fullName?: string;
  foundationDateTimestamp?: number;
  teamColors?: { primary?: string; secondary?: string; text?: string };
  venue?: { id?: number };
}): TeamRecord => ({
  id: "",
  slug: team.slug,
  name: team.name,
  code3: team.nameCode ?? "",
  short_name: team.shortName ?? team.name,
  complete_name: team.fullName ?? team.name,
  stadium: team.venue?.id ? String(team.venue.id) : "",
  foundation: toFoundationDate(team.foundationDateTimestamp),
  primary_color: team.teamColors?.primary ?? "",
  secondary_color: team.teamColors?.secondary ?? "",
  text_color: team.teamColors?.text ?? "",
  edited: false
});

const createPlayerRecord = (player?: {
  id?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  slug?: string;
  shortName?: string;
  position?: string;
  height?: number;
  country?: { slug: string };
  dateOfBirthTimestamp?: number;
}): PlayerRecord | null => {
  const name = player?.name?.trim() || player?.shortName?.trim() || "";
  const shortName = player?.shortName?.trim() || name;

  if (!player?.id || !name) {
    return null;
  }

  return {
    id: "",
    slug: player.slug ?? "",
    name,
    short_name: shortName,
    first_name: player.firstName?.trim() ?? "",
    last_name: player.lastName?.trim() ?? "",
    position: player.position?.trim() ?? "",
    height: player.height !== undefined ? String(player.height) : "",
    country: player.country?.slug ?? "",
    date_of_birth: toDateString(player.dateOfBirthTimestamp),
    source: SOURCE,
    source_id: String(player.id),
    edited: false
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

const dedupeCities = (cities: Array<CityRecord | null>): CityRecord[] => {
  const seen = new Set<string>();

  return cities.filter((city): city is CityRecord => {
    if (!city) {
      return false;
    }

    const key = `${city.source_name}:${city.country}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const dedupeStadiums = (stadiums: Array<StadiumRecord | null>): StadiumRecord[] => {
  const seen = new Set<string>();

  return stadiums.filter((stadium): stadium is StadiumRecord => {
    if (!stadium) {
      return false;
    }

    if (seen.has(stadium.source_id)) {
      return false;
    }

    seen.add(stadium.source_id);
    return true;
  });
};

const dedupePlayers = (players: PlayerRecord[]): PlayerRecord[] => {
  const seen = new Set<string>();

  return players.filter((player) => {
    if (seen.has(player.source_id)) {
      return false;
    }

    seen.add(player.source_id);
    return true;
  });
};

const toFoundationDate = (timestamp?: number): string => {
  return toDateString(timestamp);
};

const toDateString = (timestamp?: number): string => {
  if (timestamp === undefined) {
    return "";
  }

  return new Date(timestamp * 1000).toISOString().slice(0, 10);
};
