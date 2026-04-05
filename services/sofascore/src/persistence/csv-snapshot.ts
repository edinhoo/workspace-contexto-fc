import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadCities, saveCities } from "../storage/cities-csv.js";
import { loadCountries, saveCountries } from "../storage/countries-csv.js";
import { loadEvents, saveEvents } from "../storage/events-csv.js";
import { loadLineups, saveLineups } from "../storage/lineups-csv.js";
import { loadManagers, saveManagers } from "../storage/managers-csv.js";
import { loadMatches, saveMatches } from "../storage/matches-csv.js";
import { loadPlayerCareerTeams, savePlayerCareerTeams } from "../storage/player-career-teams-csv.js";
import { loadPlayerMatchStats, savePlayerMatchStats } from "../storage/player-match-stats-csv.js";
import { loadPlayers, savePlayers } from "../storage/players-csv.js";
import { loadReferees, saveReferees } from "../storage/referees-csv.js";
import { loadSeasons, saveSeasons } from "../storage/seasons-csv.js";
import { loadStadiums, saveStadiums } from "../storage/stadiums-csv.js";
import { saveTeamMatchStats } from "../storage/team-match-stats-csv.js";
import { loadTeams, saveTeams } from "../storage/teams-csv.js";
import { loadTournaments, saveTournaments } from "../storage/tournaments-csv.js";
import type { SofascoreSnapshot } from "../snapshot.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(currentDir, "../../data");

const csvPaths = {
  countries: resolve(dataDir, "countries.csv"),
  cities: resolve(dataDir, "cities.csv"),
  events: resolve(dataDir, "events.csv"),
  stadiums: resolve(dataDir, "stadiums.csv"),
  managers: resolve(dataDir, "managers.csv"),
  lineups: resolve(dataDir, "lineups.csv"),
  matches: resolve(dataDir, "matches.csv"),
  playerMatchStats: resolve(dataDir, "player-match-stats.csv"),
  playerCareerTeams: resolve(dataDir, "player-career-teams.csv"),
  teamMatchStats: resolve(dataDir, "team-match-stats.csv"),
  referees: resolve(dataDir, "referees.csv"),
  players: resolve(dataDir, "players.csv"),
  teams: resolve(dataDir, "teams.csv"),
  tournaments: resolve(dataDir, "tournaments.csv"),
  seasons: resolve(dataDir, "seasons.csv")
};

export const loadCsvSnapshot = async (): Promise<SofascoreSnapshot> => ({
  countries: await loadCountries(csvPaths.countries),
  cities: await loadCities(csvPaths.cities),
  stadiums: await loadStadiums(csvPaths.stadiums),
  tournaments: await loadTournaments(csvPaths.tournaments),
  seasons: await loadSeasons(csvPaths.seasons),
  referees: await loadReferees(csvPaths.referees),
  managers: await loadManagers(csvPaths.managers),
  teams: await loadTeams(csvPaths.teams),
  players: await loadPlayers(csvPaths.players),
  matches: await loadMatches(csvPaths.matches),
  lineups: await loadLineups(csvPaths.lineups),
  playerMatchStats: await loadPlayerMatchStats(csvPaths.playerMatchStats),
  teamMatchStats: [],
  events: await loadEvents(csvPaths.events),
  playerCareerTeams: await loadPlayerCareerTeams(csvPaths.playerCareerTeams)
});

export const saveCsvSnapshot = async (snapshot: SofascoreSnapshot): Promise<void> => {
  await saveCountries(csvPaths.countries, snapshot.countries);
  await saveCities(csvPaths.cities, snapshot.cities);
  await saveEvents(csvPaths.events, snapshot.events);
  await saveStadiums(csvPaths.stadiums, snapshot.stadiums);
  await saveTeams(csvPaths.teams, snapshot.teams);
  await saveManagers(csvPaths.managers, snapshot.managers);
  await saveLineups(csvPaths.lineups, snapshot.lineups);
  await saveMatches(csvPaths.matches, snapshot.matches);
  await savePlayerMatchStats(csvPaths.playerMatchStats, snapshot.playerMatchStats);
  await savePlayerCareerTeams(csvPaths.playerCareerTeams, snapshot.playerCareerTeams);
  await saveTeamMatchStats(csvPaths.teamMatchStats, snapshot.teamMatchStats);
  await savePlayers(csvPaths.players, snapshot.players);
  await saveReferees(csvPaths.referees, snapshot.referees);
  await saveTournaments(csvPaths.tournaments, snapshot.tournaments);
  await saveSeasons(csvPaths.seasons, snapshot.seasons);
};
