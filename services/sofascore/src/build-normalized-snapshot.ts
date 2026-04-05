import {
  fetchEventIncidentsByEventId,
  fetchEventLineupsByEventId,
  fetchEventMetadataByEventId
} from "./sofascore-client.js";
import { relinkCityCountries, upsertCities } from "./storage/cities-csv.js";
import { relinkEventReferences, upsertEvents } from "./storage/events-csv.js";
import { relinkLineupReferences, upsertLineups } from "./storage/lineups-csv.js";
import { relinkManagerCountries, upsertManagers } from "./storage/managers-csv.js";
import { relinkMatchReferences, upsertMatches } from "./storage/matches-csv.js";
import { relinkPlayerCareerTeamReferences, upsertPlayerCareerTeams } from "./storage/player-career-teams-csv.js";
import { relinkPlayerMatchStatReferences, upsertPlayerMatchStats } from "./storage/player-match-stats-csv.js";
import { relinkPlayerCountries, upsertPlayers } from "./storage/players-csv.js";
import { relinkRefereeCountries, upsertReferees } from "./storage/referees-csv.js";
import { relinkSeasonTournaments, upsertSeasons } from "./storage/seasons-csv.js";
import { relinkStadiumReferences, upsertStadiums } from "./storage/stadiums-csv.js";
import { buildTeamMatchStats } from "./storage/team-match-stats-csv.js";
import { relinkTeamStadiums, upsertTeams } from "./storage/teams-csv.js";
import { relinkTournamentCountries, upsertTournaments } from "./storage/tournaments-csv.js";
import { upsertCountries } from "./storage/countries-csv.js";
import type {
  CityRecord,
  CountryRecord,
  EventRecord,
  ManagerRecord,
  MatchRecord,
  PlayerCareerTeamRecord,
  PlayerRecord,
  RefereeRecord,
  SeasonRecord,
  StadiumRecord,
  TeamRecord,
  TournamentRecord
} from "./types.js";
import type { SofascoreSnapshot, SofascoreSnapshotResult } from "./snapshot.js";

export const buildNormalizedSnapshot = async (
  eventIds: string[],
  existingSnapshot: SofascoreSnapshot
): Promise<SofascoreSnapshotResult> => {
  const fetchedData = await Promise.all(
    eventIds.map(async (eventId) => {
      try {
        const [eventMetadata, lineupMetadata, incidentsMetadata] = await Promise.all([
          fetchEventMetadataByEventId(eventId),
          fetchEventLineupsByEventId(eventId).catch((error) => {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            console.error(`Falha ao processar as lineups do evento ${eventId}: ${message}`);

            return {
              countries: [],
              players: [],
              lineups: [],
              playerMatchStats: [],
              homeFormation: "",
              awayFormation: ""
            };
          }),
          fetchEventIncidentsByEventId(eventId).catch((error) => {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            console.error(`Falha ao processar os events do evento ${eventId}: ${message}`);

            return {
              events: []
            };
          })
        ]);

        return {
          eventMetadata,
          lineupMetadata,
          incidentsMetadata
        };
      } catch (error) {
        const message = formatErrorMessage(error);
        console.error(`Falha ao processar o evento ${eventId}: ${message}`);
        return null;
      }
    })
  );

  const validCountries = fetchedData
    .flatMap((entry) => [
      ...(entry?.eventMetadata.countries ?? []),
      ...(entry?.lineupMetadata.countries ?? [])
    ])
    .filter((country): country is CountryRecord => country !== null);
  const validTournaments = fetchedData
    .map((entry) => entry?.eventMetadata.tournament ?? null)
    .filter((tournament): tournament is TournamentRecord => tournament !== null);
  const validCities = fetchedData
    .flatMap((entry) => entry?.eventMetadata.cities ?? [])
    .filter((city): city is CityRecord => city !== null);
  const validEvents = fetchedData
    .flatMap((entry) => entry?.incidentsMetadata.events ?? [])
    .filter((event): event is EventRecord => event !== null);
  const validSeasons = fetchedData
    .map((entry) => entry?.eventMetadata.season ?? null)
    .filter((season): season is SeasonRecord => season !== null);
  const validStadiums = fetchedData
    .flatMap((entry) => entry?.eventMetadata.stadiums ?? [])
    .filter((stadium): stadium is StadiumRecord => stadium !== null);
  const validReferees = fetchedData
    .map((entry) => entry?.eventMetadata.referee ?? null)
    .filter((referee): referee is RefereeRecord => referee !== null);
  const validManagers = fetchedData.flatMap((entry) => entry?.eventMetadata.managers ?? []);
  const validLineups = fetchedData.flatMap((entry) => entry?.lineupMetadata.lineups ?? []);
  const validMatches = fetchedData
    .map((entry) => {
      if (!entry?.eventMetadata.match) {
        return null;
      }

      return {
        ...entry.eventMetadata.match,
        home_formation: entry.lineupMetadata.homeFormation,
        away_formation: entry.lineupMetadata.awayFormation
      };
    })
    .filter((match): match is MatchRecord => match !== null);
  const validPlayerMatchStats = fetchedData.flatMap(
    (entry) => entry?.lineupMetadata.playerMatchStats ?? []
  );
  const validPlayers = fetchedData.flatMap((entry) => entry?.lineupMetadata.players ?? []);
  const validTeams = fetchedData.flatMap((entry) => entry?.eventMetadata.teams ?? []);
  const validPlayerCareerTeams = buildPlayerCareerTeamRelationships(validLineups);

  const mergedCountries = upsertCountries(existingSnapshot.countries, validCountries);
  const mergedCities = upsertCities(
    existingSnapshot.cities,
    validCities.map((city) => linkCityCountry(city, mergedCountries))
  );
  const normalizedCities = relinkCityCountries(mergedCities, mergedCountries);
  const mergedStadiums = upsertStadiums(
    existingSnapshot.stadiums,
    validStadiums.map((stadium) => linkStadiumReferences(stadium, normalizedCities))
  );
  const normalizedStadiums = relinkStadiumReferences(mergedStadiums, normalizedCities);
  const mergedTeams = upsertTeams(
    existingSnapshot.teams,
    validTeams.map((team) => linkTeamStadium(team, normalizedStadiums))
  );
  const normalizedTeams = relinkTeamStadiums(mergedTeams, normalizedStadiums);
  const mergedManagers = upsertManagers(
    existingSnapshot.managers,
    validManagers.map((manager) => linkManagerCountry(manager, mergedCountries))
  );
  const normalizedManagers = relinkManagerCountries(mergedManagers, mergedCountries);
  const mergedPlayers = upsertPlayers(
    existingSnapshot.players,
    validPlayers.map((player) => linkPlayerCountry(player, mergedCountries))
  );
  const normalizedPlayers = relinkPlayerCountries(mergedPlayers, mergedCountries);
  const mergedReferees = upsertReferees(
    existingSnapshot.referees,
    validReferees.map((referee) => linkRefereeCountry(referee, mergedCountries))
  );
  const normalizedReferees = relinkRefereeCountries(mergedReferees, mergedCountries);
  const mergedTournaments = upsertTournaments(
    existingSnapshot.tournaments,
    validTournaments.map((tournament) => linkTournamentCountry(tournament, mergedCountries))
  );
  const normalizedTournaments = relinkTournamentCountries(mergedTournaments, mergedCountries);
  const mergedSeasons = upsertSeasons(
    existingSnapshot.seasons,
    validSeasons.map((season) => linkSeasonTournament(season, normalizedTournaments))
  );
  const normalizedSeasons = relinkSeasonTournaments(mergedSeasons, normalizedTournaments);
  const mergedMatches = upsertMatches(existingSnapshot.matches, validMatches);
  const normalizedMatches = relinkMatchReferences(mergedMatches, {
    tournaments: normalizedTournaments,
    seasons: normalizedSeasons,
    stadiums: normalizedStadiums,
    referees: normalizedReferees,
    managers: normalizedManagers,
    teams: normalizedTeams
  });
  const mergedEvents = upsertEvents(existingSnapshot.events, validEvents);
  const normalizedEvents = relinkEventReferences(mergedEvents, {
    matches: normalizedMatches,
    teams: normalizedTeams,
    players: normalizedPlayers,
    managers: normalizedManagers
  });
  const mergedLineups = upsertLineups(existingSnapshot.lineups, validLineups);
  const normalizedLineups = relinkLineupReferences(mergedLineups, {
    matches: normalizedMatches,
    teams: normalizedTeams,
    players: normalizedPlayers
  });
  const mergedPlayerMatchStats = upsertPlayerMatchStats(
    existingSnapshot.playerMatchStats,
    validPlayerMatchStats
  );
  const mergedPlayerCareerTeams = upsertPlayerCareerTeams(
    existingSnapshot.playerCareerTeams,
    validPlayerCareerTeams
  );
  const normalizedPlayerMatchStats = relinkPlayerMatchStatReferences(mergedPlayerMatchStats, {
    matches: normalizedMatches,
    teams: normalizedTeams,
    players: normalizedPlayers
  });
  const normalizedPlayerCareerTeams = relinkPlayerCareerTeamReferences(
    mergedPlayerCareerTeams,
    {
      players: normalizedPlayers,
      teams: normalizedTeams
    }
  );
  const normalizedTeamMatchStats = buildTeamMatchStats(normalizedPlayerMatchStats);

  return {
    snapshot: {
      countries: mergedCountries,
      cities: normalizedCities,
      stadiums: normalizedStadiums,
      tournaments: normalizedTournaments,
      seasons: normalizedSeasons,
      referees: normalizedReferees,
      managers: normalizedManagers,
      teams: normalizedTeams,
      players: normalizedPlayers,
      matches: normalizedMatches,
      lineups: normalizedLineups,
      playerMatchStats: normalizedPlayerMatchStats,
      teamMatchStats: normalizedTeamMatchStats,
      events: normalizedEvents,
      playerCareerTeams: normalizedPlayerCareerTeams
    },
    processedCounts: {
      countries: validCountries.length,
      cities: validCities.length,
      stadiums: validStadiums.length,
      tournaments: validTournaments.length,
      seasons: validSeasons.length,
      referees: validReferees.length,
      managers: validManagers.length,
      teams: validTeams.length,
      players: validPlayers.length,
      matches: validMatches.length,
      lineups: validLineups.length,
      playerMatchStats: validPlayerMatchStats.length,
      teamMatchStats: normalizedTeamMatchStats.length,
      events: validEvents.length,
      playerCareerTeams: validPlayerCareerTeams.length
    }
  };
};

const linkCityCountry = (city: CityRecord, countries: CountryRecord[]): CityRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === city.country || country.slug === city.country
  );

  if (!linkedCountry) {
    return city;
  }

  return {
    ...city,
    country: linkedCountry.id
  };
};

const buildPlayerCareerTeamRelationships = (
  lineups: Array<{ player: string; team: string }>
): PlayerCareerTeamRecord[] => {
  const seen = new Set<string>();

  return lineups.flatMap((lineup) => {
    const player = lineup.player.trim();
    const team = lineup.team.trim();

    if (!player || !team) {
      return [];
    }

    const sourceRef = `${player}:${team}`;
    if (seen.has(sourceRef)) {
      return [];
    }

    seen.add(sourceRef);

    return [
      {
        id: "",
        player,
        team,
        source_player_id: player,
        source_team_id: team,
        source: "sofascore"
      }
    ];
  });
};

const linkTournamentCountry = (
  tournament: TournamentRecord,
  countries: CountryRecord[]
): TournamentRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === tournament.country || country.slug === tournament.country
  );

  if (!linkedCountry) {
    return tournament;
  }

  return {
    ...tournament,
    country: linkedCountry.id
  };
};

const linkStadiumReferences = (
  stadium: StadiumRecord,
  cities: CityRecord[]
): StadiumRecord => {
  const linkedCity = cities.find(
    (city) => city.source_name === stadium.city || city.name === stadium.city
  );

  return {
    ...stadium,
    city: linkedCity?.id ?? stadium.city
  };
};

const linkSeasonTournament = (
  season: SeasonRecord,
  tournaments: TournamentRecord[]
): SeasonRecord => {
  const linkedTournament = tournaments.find(
    (tournament) =>
      tournament.source_ref === season.tournament || tournament.id === season.tournament
  );

  if (!linkedTournament) {
    return season;
  }

  return {
    ...season,
    tournament: linkedTournament.id
  };
};

const linkRefereeCountry = (
  referee: RefereeRecord,
  countries: CountryRecord[]
): RefereeRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === referee.country || country.slug === referee.country
  );

  if (!linkedCountry) {
    return referee;
  }

  return {
    ...referee,
    country: linkedCountry.id
  };
};

const linkManagerCountry = (
  manager: ManagerRecord,
  countries: CountryRecord[]
): ManagerRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === manager.country || country.slug === manager.country
  );

  if (!linkedCountry) {
    return manager;
  }

  return {
    ...manager,
    country: linkedCountry.id
  };
};

const linkPlayerCountry = (player: PlayerRecord, countries: CountryRecord[]): PlayerRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === player.country || country.slug === player.country
  );

  if (!linkedCountry) {
    return player;
  }

  return {
    ...player,
    country: linkedCountry.id
  };
};

const linkTeamStadium = (team: TeamRecord, stadiums: StadiumRecord[]): TeamRecord => {
  const linkedStadium = stadiums.find(
    (stadium) => stadium.source_ref === team.stadium || stadium.id === team.stadium
  );

  if (!linkedStadium) {
    return team;
  }

  return {
    ...team,
    stadium: linkedStadium.id
  };
};

function formatErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Erro desconhecido";
  }

  const cause = extractErrorCause(error);

  if (!cause) {
    return error.message;
  }

  const details = [cause.code, cause.errno, cause.syscall, cause.hostname]
    .filter(Boolean)
    .join(" | ");

  if (!details) {
    return `${error.message} | causa: ${cause.message}`;
  }

  return `${error.message} | causa: ${cause.message} | ${details}`;
}

function extractErrorCause(
  error: Error
): {
  message?: string;
  code?: string;
  errno?: number;
  syscall?: string;
  hostname?: string;
} | null {
  if (!("cause" in error)) {
    return null;
  }

  const cause = error.cause;

  if (!cause || typeof cause !== "object") {
    return null;
  }

  const typedCause = cause as {
    message?: string;
    code?: string;
    errno?: number;
    syscall?: string;
    hostname?: string;
  };

  return typedCause;
}
