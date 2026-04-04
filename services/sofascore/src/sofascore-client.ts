import type {
  CityRecord,
  CountryRecord,
  SofascoreAveragePositionsResponse,
  EventLineupsMetadata,
  EventMetadata,
  LineupRecord,
  ManagerRecord,
  MatchRecord,
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

  const match = event?.id
    ? createMatchRecord({
        id: event.id,
        uniqueTournamentId: uniqueTournament?.id,
        seasonId: season?.id,
        round: event.roundInfo?.round,
        venueId: eventVenue?.id,
        refereeId: referee?.id,
        homeTeamId: homeTeam?.id,
        homeManagerId: homeTeam?.manager?.id,
        homeScore: event.homeScore,
        awayTeamId: awayTeam?.id,
        awayManagerId: awayTeam?.manager?.id,
        awayScore: event.awayScore,
        startTimestamp: event.startTimestamp,
        currentPeriodStartTimestamp:
          event.time?.currentPeriodStartTimestamp ?? event.currentPeriodStartTimestamp,
        injuryTime1: event.time?.injuryTime1,
        injuryTime2: event.time?.injuryTime2,
        injuryTime3: event.time?.injuryTime3,
        injuryTime4: event.time?.injuryTime4
      })
    : null;

  return {
    countries: dedupeCountries(countries),
    tournament: tournamentRecord,
    season: seasonRecord,
    cities,
    stadiums,
    referee: refereeRecord,
    managers,
    teams,
    match
  };
};

export const fetchEventLineupsByEventId = async (
  eventId: string
): Promise<EventLineupsMetadata> => {
  const [lineupsResponse, averagePositionsResponse] = await Promise.all([
    fetch(`https://www.sofascore.com/api/v1/event/${eventId}/lineups`),
    fetch(`https://www.sofascore.com/api/v1/event/${eventId}/average-positions`)
  ]);

  if (!lineupsResponse.ok) {
    throw new Error(
      `Falha ao buscar lineups do evento ${eventId}: ${lineupsResponse.status} ${lineupsResponse.statusText}`
    );
  }

  const payload = (await lineupsResponse.json()) as SofascoreLineupsResponse;
  const averagePositionsPayload = averagePositionsResponse.ok
    ? ((await averagePositionsResponse.json()) as SofascoreAveragePositionsResponse)
    : null;
  const lineupPlayers = [
    ...(payload.home?.players ?? []),
    ...(payload.home?.missingPlayers ?? []),
    ...(payload.away?.players ?? []),
    ...(payload.away?.missingPlayers ?? [])
  ];
  const homeTeamId =
    payload.home?.players?.find((item) => item.teamId !== undefined)?.teamId;
  const awayTeamId =
    payload.away?.players?.find((item) => item.teamId !== undefined)?.teamId;

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
  const homeAveragePositions = createAveragePositionMap(averagePositionsPayload?.home ?? []);
  const awayAveragePositions = createAveragePositionMap(averagePositionsPayload?.away ?? []);
  const homeFormation = payload.home?.formation?.trim() ?? "";
  const awayFormation = payload.away?.formation?.trim() ?? "";
  const homeStarterSlots = createStarterSlotMap(
    payload.home?.players ?? [],
    homeFormation,
    homeAveragePositions
  );
  const awayStarterSlots = createStarterSlotMap(
    payload.away?.players ?? [],
    awayFormation,
    awayAveragePositions
  );

  const lineups = dedupeLineups([
    ...(payload.home?.players ?? []).map((lineupPlayer) =>
      createLineupRecord(eventId, lineupPlayer, homeTeamId, "player", homeStarterSlots)
    ),
    ...(payload.home?.missingPlayers ?? []).map((lineupPlayer) =>
      createLineupRecord(eventId, lineupPlayer, homeTeamId, "missing", homeStarterSlots)
    ),
    ...(payload.away?.players ?? []).map((lineupPlayer) =>
      createLineupRecord(eventId, lineupPlayer, awayTeamId, "player", awayStarterSlots)
    ),
    ...(payload.away?.missingPlayers ?? []).map((lineupPlayer) =>
      createLineupRecord(eventId, lineupPlayer, awayTeamId, "missing", awayStarterSlots)
    )
  ]);

  return {
    countries,
    players,
    lineups,
    homeFormation,
    awayFormation
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
  source_id: String(team.id),
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

const createLineupRecord = (
  eventId: string,
  lineupPlayer: {
    player?: { id?: number };
    teamId?: number;
    shirtNumber?: number;
    jerseyNumber?: string;
    position?: string;
    substitute?: boolean;
    type?: string;
    reason?: number;
    externalType?: number;
    statistics?: { minutesPlayed?: number; rating?: number };
  },
  fallbackTeamId?: number,
  fallbackEntryType?: string,
  slotMap?: Map<number, number>
): LineupRecord | null => {
  const playerId = lineupPlayer.player?.id;

  if (!playerId) {
    return null;
  }

  return {
    id: "",
    match: eventId,
    team: String(lineupPlayer.teamId ?? fallbackTeamId ?? ""),
    player: String(playerId),
    jersey_number:
      lineupPlayer.jerseyNumber?.trim() ||
      (lineupPlayer.shirtNumber !== undefined ? String(lineupPlayer.shirtNumber) : ""),
    position: lineupPlayer.position?.trim() ?? "",
    substitute:
      lineupPlayer.substitute !== undefined ? String(lineupPlayer.substitute) : "",
    is_missing: String((lineupPlayer.type?.trim() ?? fallbackEntryType ?? "") === "missing"),
    slot: playerId ? String(slotMap?.get(playerId) ?? "") : "",
    minutes_played:
      lineupPlayer.statistics?.minutesPlayed !== undefined
        ? String(lineupPlayer.statistics.minutesPlayed)
        : "",
    rating:
      lineupPlayer.statistics?.rating !== undefined
        ? String(lineupPlayer.statistics.rating)
        : "",
    source_id: `${eventId}:${lineupPlayer.teamId ?? fallbackTeamId ?? ""}:${playerId}`,
    source: SOURCE,
    edited: false
  };
};

const createMatchRecord = (event: {
  id: number;
  uniqueTournamentId?: number;
  seasonId?: number;
  round?: number;
  venueId?: number;
  refereeId?: number;
  homeTeamId?: number;
  homeManagerId?: number;
  homeFormation?: string;
  homeScore?: {
    period1?: number;
    period2?: number;
    normaltime?: number;
    extra1?: number;
    extra2?: number;
    overtime?: number;
    penalties?: number;
  };
  awayTeamId?: number;
  awayManagerId?: number;
  awayFormation?: string;
  awayScore?: {
    period1?: number;
    period2?: number;
    normaltime?: number;
    extra1?: number;
    extra2?: number;
    overtime?: number;
    penalties?: number;
  };
  startTimestamp?: number;
  currentPeriodStartTimestamp?: number;
  injuryTime1?: number;
  injuryTime2?: number;
  injuryTime3?: number;
  injuryTime4?: number;
}): MatchRecord => ({
  id: "",
  tournament: stringifyOptionalNumber(event.uniqueTournamentId),
  season: stringifyOptionalNumber(event.seasonId),
  round: stringifyOptionalNumber(event.round),
  stadium: stringifyOptionalNumber(event.venueId),
  referee: stringifyOptionalNumber(event.refereeId),
  home_team: stringifyOptionalNumber(event.homeTeamId),
  home_manager: stringifyOptionalNumber(event.homeManagerId),
  home_formation: event.homeFormation?.trim() ?? "",
  home_score_period_1: stringifyOptionalNumber(event.homeScore?.period1),
  home_score_period_2: stringifyOptionalNumber(event.homeScore?.period2),
  home_score_normaltime: stringifyOptionalNumber(event.homeScore?.normaltime),
  home_score_extra_1: stringifyOptionalNumber(event.homeScore?.extra1),
  home_score_extra_2: stringifyOptionalNumber(event.homeScore?.extra2),
  home_score_overtime: stringifyOptionalNumber(event.homeScore?.overtime),
  home_score_penalties: stringifyOptionalNumber(event.homeScore?.penalties),
  away_team: stringifyOptionalNumber(event.awayTeamId),
  away_manager: stringifyOptionalNumber(event.awayManagerId),
  away_formation: event.awayFormation?.trim() ?? "",
  away_score_period_1: stringifyOptionalNumber(event.awayScore?.period1),
  away_score_period_2: stringifyOptionalNumber(event.awayScore?.period2),
  away_score_normaltime: stringifyOptionalNumber(event.awayScore?.normaltime),
  away_score_extra_1: stringifyOptionalNumber(event.awayScore?.extra1),
  away_score_extra_2: stringifyOptionalNumber(event.awayScore?.extra2),
  away_score_overtime: stringifyOptionalNumber(event.awayScore?.overtime),
  away_score_penalties: stringifyOptionalNumber(event.awayScore?.penalties),
  start_time: toTimestampString(event.startTimestamp),
  period_start_time: toTimestampString(event.currentPeriodStartTimestamp),
  injury_time_1: stringifyOptionalNumber(event.injuryTime1),
  injury_time_2: stringifyOptionalNumber(event.injuryTime2),
  injury_time_3: stringifyOptionalNumber(event.injuryTime3),
  injury_time_4: stringifyOptionalNumber(event.injuryTime4),
  source_id: String(event.id),
  source: SOURCE,
  edited: false
});

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

const dedupeLineups = (lineups: Array<LineupRecord | null>): LineupRecord[] => {
  const seen = new Set<string>();

  return lineups.filter((lineup): lineup is LineupRecord => {
    if (!lineup) {
      return false;
    }

    if (seen.has(lineup.source_id)) {
      return false;
    }

    seen.add(lineup.source_id);
    return true;
  });
};

const createAveragePositionMap = (
  items: Array<{
    player?: { id?: number };
    averageX?: number;
    averageY?: number;
  }>
): Map<number, { averageX: number; averageY: number }> => {
  const positions = new Map<number, { averageX: number; averageY: number }>();

  for (const item of items) {
    const playerId = item.player?.id;

    if (!playerId || item.averageX === undefined || item.averageY === undefined) {
      continue;
    }

    positions.set(playerId, {
      averageX: item.averageX,
      averageY: item.averageY
    });
  }

  return positions;
};

const createStarterSlotMap = (
  starters: Array<{
    player?: { id?: number };
    position?: string;
    substitute?: boolean;
  }>,
  formation: string,
  averagePositions: Map<number, { averageX: number; averageY: number }>
): Map<number, number> => {
  const slots = new Map<number, number>();
  const starterPlayers = starters
    .filter((item) => item.player?.id)
    .map((item) => ({
      playerId: item.player?.id as number,
      position: item.position?.trim() ?? "",
      substitute: item.substitute ?? false,
      averagePosition: averagePositions.get(item.player?.id as number) ?? null
    }))
    .filter((item) => !item.substitute);

  const goalkeeper = starterPlayers.find((player) => player.position === "G");

  if (goalkeeper) {
    slots.set(goalkeeper.playerId, 1);
  }

  const outfieldPlayers = starterPlayers.filter(
    (player) => player.playerId !== goalkeeper?.playerId
  );
  const formationLines = parseFormation(formation, outfieldPlayers.length);
  let slot = goalkeeper ? 2 : 1;
  const sortedPlayers = [...outfieldPlayers].sort((left, right) => {
    const leftX = left.averagePosition?.averageX ?? Number.POSITIVE_INFINITY;
    const rightX = right.averagePosition?.averageX ?? Number.POSITIVE_INFINITY;

    if (leftX !== rightX) {
      return leftX - rightX;
    }

    const leftY = left.averagePosition?.averageY ?? Number.POSITIVE_INFINITY;
    const rightY = right.averagePosition?.averageY ?? Number.POSITIVE_INFINITY;

    return leftY - rightY;
  });

  let offset = 0;

  for (const lineSize of formationLines) {
    const linePlayers = sortedPlayers.slice(offset, offset + lineSize).sort((left, right) => {
      const leftY = left.averagePosition?.averageY ?? Number.POSITIVE_INFINITY;
      const rightY = right.averagePosition?.averageY ?? Number.POSITIVE_INFINITY;

      return leftY - rightY;
    });

    for (const player of linePlayers) {
      slots.set(player.playerId, slot);
      slot += 1;
    }

    offset += lineSize;
  }

  if (slots.size < starterPlayers.length) {
    for (const player of sortedPlayers) {
      if (!slots.has(player.playerId) && slot <= 11) {
        slots.set(player.playerId, slot);
        slot += 1;
      }
    }
  }

  return slots;
};

const parseFormation = (formation: string, outfieldCount: number): number[] => {
  const parsed = formation
    .split("-")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (parsed.reduce((total, value) => total + value, 0) === outfieldCount) {
    return parsed;
  }

  if (outfieldCount === 10) {
    return [4, 4, 2];
  }

  return [outfieldCount];
};

const toFoundationDate = (timestamp?: number): string => {
  return toDateString(timestamp);
};

const toTimestampString = (timestamp?: number): string =>
  timestamp !== undefined ? String(timestamp) : "";

const stringifyOptionalNumber = (value?: number): string =>
  value !== undefined ? String(value) : "";

const toDateString = (timestamp?: number): string => {
  if (timestamp === undefined) {
    return "";
  }

  return new Date(timestamp * 1000).toISOString().slice(0, 10);
};
