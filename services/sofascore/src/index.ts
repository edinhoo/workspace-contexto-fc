import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  fetchEventIncidentsByEventId,
  fetchEventLineupsByEventId,
  fetchEventMetadataByEventId
} from "./sofascore-client.js";
import { loadCountries, saveCountries, upsertCountries } from "./storage/countries-csv.js";
import { loadCities, relinkCityCountries, saveCities, upsertCities } from "./storage/cities-csv.js";
import {
  loadEvents,
  relinkEventReferences,
  saveEvents,
  upsertEvents
} from "./storage/events-csv.js";
import {
  loadStadiums,
  relinkStadiumReferences,
  saveStadiums,
  upsertStadiums
} from "./storage/stadiums-csv.js";
import {
  loadTeams,
  relinkTeamStadiums,
  saveTeams,
  upsertTeams
} from "./storage/teams-csv.js";
import {
  buildTeamMatchStats,
  saveTeamMatchStats
} from "./storage/team-match-stats-csv.js";
import {
  loadTournaments,
  relinkTournamentCountries,
  saveTournaments,
  upsertTournaments
} from "./storage/tournaments-csv.js";
import {
  loadLineups,
  relinkLineupReferences,
  saveLineups,
  upsertLineups
} from "./storage/lineups-csv.js";
import {
  loadManagers,
  relinkManagerCountries,
  saveManagers,
  upsertManagers
} from "./storage/managers-csv.js";
import {
  loadMatches,
  relinkMatchReferences,
  saveMatches,
  upsertMatches
} from "./storage/matches-csv.js";
import {
  loadPlayers,
  relinkPlayerCountries,
  savePlayers,
  upsertPlayers
} from "./storage/players-csv.js";
import {
  loadPlayerMatchStats,
  relinkPlayerMatchStatReferences,
  savePlayerMatchStats,
  upsertPlayerMatchStats
} from "./storage/player-match-stats-csv.js";
import {
  loadPlayerCareerTeams,
  relinkPlayerCareerTeamReferences,
  savePlayerCareerTeams,
  upsertPlayerCareerTeams
} from "./storage/player-career-teams-csv.js";
import {
  loadReferees,
  relinkRefereeCountries,
  saveReferees,
  upsertReferees
} from "./storage/referees-csv.js";
import {
  loadSeasons,
  relinkSeasonTournaments,
  saveSeasons,
  upsertSeasons
} from "./storage/seasons-csv.js";
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

const currentDir = dirname(fileURLToPath(import.meta.url));
const countriesCsvPath = resolve(currentDir, "../data/countries.csv");
const citiesCsvPath = resolve(currentDir, "../data/cities.csv");
const eventsCsvPath = resolve(currentDir, "../data/events.csv");
const stadiumsCsvPath = resolve(currentDir, "../data/stadiums.csv");
const managersCsvPath = resolve(currentDir, "../data/managers.csv");
const lineupsCsvPath = resolve(currentDir, "../data/lineups.csv");
const matchesCsvPath = resolve(currentDir, "../data/matches.csv");
const playerMatchStatsCsvPath = resolve(currentDir, "../data/player-match-stats.csv");
const playerCareerTeamsCsvPath = resolve(currentDir, "../data/player-career-teams.csv");
const teamMatchStatsCsvPath = resolve(currentDir, "../data/team-match-stats.csv");
const refereesCsvPath = resolve(currentDir, "../data/referees.csv");
const playersCsvPath = resolve(currentDir, "../data/players.csv");
const teamsCsvPath = resolve(currentDir, "../data/teams.csv");
const tournamentsCsvPath = resolve(currentDir, "../data/tournaments.csv");
const seasonsCsvPath = resolve(currentDir, "../data/seasons.csv");

const eventIds = process.argv.slice(2);

if (eventIds.length === 0) {
  console.error("Informe ao menos um event id. Exemplo: pnpm scrape:sofascore 123 456 789");
  process.exit(1);
}

const run = async (): Promise<void> => {
  await mkdir(dirname(countriesCsvPath), { recursive: true });

  const existingCountries = await loadCountries(countriesCsvPath);
  const existingCities = await loadCities(citiesCsvPath);
  const existingEvents = await loadEvents(eventsCsvPath);
  const existingStadiums = await loadStadiums(stadiumsCsvPath);
  const existingManagers = await loadManagers(managersCsvPath);
  const existingLineups = await loadLineups(lineupsCsvPath);
  const existingMatches = await loadMatches(matchesCsvPath);
  const existingPlayerMatchStats = await loadPlayerMatchStats(playerMatchStatsCsvPath);
  const existingPlayerCareerTeams = await loadPlayerCareerTeams(playerCareerTeamsCsvPath);
  const existingPlayers = await loadPlayers(playersCsvPath);
  const existingReferees = await loadReferees(refereesCsvPath);
  const existingTeams = await loadTeams(teamsCsvPath);
  const existingTournaments = await loadTournaments(tournamentsCsvPath);
  const existingSeasons = await loadSeasons(seasonsCsvPath);
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

  const mergedCountries = upsertCountries(existingCountries, validCountries);
  const mergedCities = upsertCities(
    existingCities,
    validCities.map((city) => linkCityCountry(city, mergedCountries))
  );
  const normalizedCities = relinkCityCountries(mergedCities, mergedCountries);
  const mergedStadiums = upsertStadiums(
    existingStadiums,
    validStadiums.map((stadium) => linkStadiumReferences(stadium, normalizedCities))
  );
  const normalizedStadiums = relinkStadiumReferences(mergedStadiums, normalizedCities);
  const mergedTeams = upsertTeams(
    existingTeams,
    validTeams.map((team) => linkTeamStadium(team, normalizedStadiums))
  );
  const normalizedTeams = relinkTeamStadiums(mergedTeams, normalizedStadiums);
  const mergedManagers = upsertManagers(
    existingManagers,
    validManagers.map((manager) => linkManagerCountry(manager, mergedCountries))
  );
  const normalizedManagers = relinkManagerCountries(mergedManagers, mergedCountries);
  const mergedPlayers = upsertPlayers(
    existingPlayers,
    validPlayers.map((player) => linkPlayerCountry(player, mergedCountries))
  );
  const normalizedPlayers = relinkPlayerCountries(mergedPlayers, mergedCountries);
  const mergedReferees = upsertReferees(
    existingReferees,
    validReferees.map((referee) => linkRefereeCountry(referee, mergedCountries))
  );
  const normalizedReferees = relinkRefereeCountries(mergedReferees, mergedCountries);
  const mergedTournaments = upsertTournaments(
    existingTournaments,
    validTournaments.map((tournament) => linkTournamentCountry(tournament, mergedCountries))
  );
  const normalizedTournaments = relinkTournamentCountries(mergedTournaments, mergedCountries);
  const mergedSeasons = upsertSeasons(
    existingSeasons,
    validSeasons.map((season) => linkSeasonTournament(season, normalizedTournaments))
  );
  const normalizedSeasons = relinkSeasonTournaments(mergedSeasons, normalizedTournaments);
  const mergedMatches = upsertMatches(existingMatches, validMatches);
  const normalizedMatches = relinkMatchReferences(mergedMatches, {
    tournaments: normalizedTournaments,
    seasons: normalizedSeasons,
    stadiums: normalizedStadiums,
    referees: normalizedReferees,
    managers: normalizedManagers,
    teams: normalizedTeams
  });
  const mergedEvents = upsertEvents(existingEvents, validEvents);
  const normalizedEvents = relinkEventReferences(mergedEvents, {
    matches: normalizedMatches,
    teams: normalizedTeams,
    players: normalizedPlayers,
    managers: normalizedManagers
  });
  const mergedLineups = upsertLineups(existingLineups, validLineups);
  const normalizedLineups = relinkLineupReferences(mergedLineups, {
    matches: normalizedMatches,
    teams: normalizedTeams,
    players: normalizedPlayers
  });
  const mergedPlayerMatchStats = upsertPlayerMatchStats(
    existingPlayerMatchStats,
    validPlayerMatchStats
  );
  const mergedPlayerCareerTeams = upsertPlayerCareerTeams(
    existingPlayerCareerTeams,
    validPlayerCareerTeams
  );
  const normalizedPlayerMatchStats = relinkPlayerMatchStatReferences(
    mergedPlayerMatchStats,
    {
      matches: normalizedMatches,
      teams: normalizedTeams,
      players: normalizedPlayers
    }
  );
  const normalizedPlayerCareerTeams = relinkPlayerCareerTeamReferences(
    mergedPlayerCareerTeams,
    {
      players: normalizedPlayers,
      teams: normalizedTeams
    }
  );
  const normalizedTeamMatchStats = buildTeamMatchStats(normalizedPlayerMatchStats);

  await saveCountries(countriesCsvPath, mergedCountries);
  await saveCities(citiesCsvPath, normalizedCities);
  await saveEvents(eventsCsvPath, normalizedEvents);
  await saveStadiums(stadiumsCsvPath, normalizedStadiums);
  await saveTeams(teamsCsvPath, normalizedTeams);
  await saveManagers(managersCsvPath, normalizedManagers);
  await saveLineups(lineupsCsvPath, normalizedLineups);
  await saveMatches(matchesCsvPath, normalizedMatches);
  await savePlayerMatchStats(playerMatchStatsCsvPath, normalizedPlayerMatchStats);
  await savePlayerCareerTeams(playerCareerTeamsCsvPath, normalizedPlayerCareerTeams);
  await saveTeamMatchStats(teamMatchStatsCsvPath, normalizedTeamMatchStats);
  await savePlayers(playersCsvPath, normalizedPlayers);
  await saveReferees(refereesCsvPath, normalizedReferees);
  await saveTournaments(tournamentsCsvPath, normalizedTournaments);
  await saveSeasons(seasonsCsvPath, normalizedSeasons);

  console.log(
    `countries.csv atualizado com ${validCountries.length} item(ns) processado(s).`
  );
  console.log(`cities.csv atualizado com ${validCities.length} item(ns) processado(s).`);
  console.log(`events.csv atualizado com ${validEvents.length} item(ns) processado(s).`);
  console.log(`stadiums.csv atualizado com ${validStadiums.length} item(ns) processado(s).`);
  console.log(`teams.csv atualizado com ${validTeams.length} item(ns) processado(s).`);
  console.log(`managers.csv atualizado com ${validManagers.length} item(ns) processado(s).`);
  console.log(`lineups.csv atualizado com ${validLineups.length} item(ns) processado(s).`);
  console.log(`matches.csv atualizado com ${validMatches.length} item(ns) processado(s).`);
  console.log(
    `player-match-stats.csv atualizado com ${validPlayerMatchStats.length} item(ns) processado(s).`
  );
  console.log(
    `player-career-teams.csv atualizado com ${validPlayerCareerTeams.length} item(ns) processado(s).`
  );
  console.log(
    `team-match-stats.csv atualizado com ${normalizedTeamMatchStats.length} item(ns) processado(s).`
  );
  console.log(`players.csv atualizado com ${validPlayers.length} item(ns) processado(s).`);
  console.log(`referees.csv atualizado com ${validReferees.length} item(ns) processado(s).`);
  console.log(
    `tournaments.csv atualizado com ${validTournaments.length} item(ns) processado(s).`
  );
  console.log(`seasons.csv atualizado com ${validSeasons.length} item(ns) processado(s).`);
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
        source_ref: sourceRef,
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

await run();

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
