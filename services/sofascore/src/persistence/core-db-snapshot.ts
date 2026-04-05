import { execFileSync } from "node:child_process";

import type {
  CityRecord,
  CountryRecord,
  EventRecord,
  LineupRecord,
  ManagerRecord,
  MatchRecord,
  PlayerCareerTeamRecord,
  PlayerMatchStatRecord,
  PlayerRecord,
  RefereeRecord,
  SeasonRecord,
  StadiumRecord,
  TeamMatchStatRecord,
  TeamRecord,
  TournamentRecord
} from "../types.js";
import type { SofascoreSnapshot } from "../snapshot.js";
import { findRepoRoot } from "../repo-root.js";

const repoRoot = findRepoRoot();
const dockerArgs = [
  "compose",
  "-f",
  "infra/docker/docker-compose.yml",
  "exec",
  "-T",
  "postgres",
  "psql",
  "-U",
  "contexto_fc",
  "-d",
  "contexto_fc",
  "-At",
  "-F",
  "\t"
] as const;

const runJsonQuery = (sql: string) => {
  const output = execFileSync("docker", [...dockerArgs, "-c", sql], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const normalizeFlatRecord = <T extends Record<string, unknown>>(record: T) =>
  Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, normalizeValue(value)])
  );

const loadFlatTable = <T>(tableName: string) =>
  runJsonQuery(`select row_to_json(t)::text from ${tableName} t order by id;`).map(
    (record) => normalizeFlatRecord(record) as T
  );

const loadStatsTable = <T>(tableName: string) =>
  runJsonQuery(
    `select ((to_jsonb(t) - 'stat_payload') || coalesce(stat_payload, '{}'::jsonb))::text from ${tableName} t order by id;`
  ).map((record) => normalizeFlatRecord(record) as T);

export const loadCoreDbSnapshot = (): SofascoreSnapshot => ({
  countries: loadFlatTable<CountryRecord>("core.countries"),
  cities: loadFlatTable<CityRecord>("core.cities"),
  stadiums: loadFlatTable<StadiumRecord>("core.stadiums"),
  tournaments: loadFlatTable<TournamentRecord>("core.tournaments"),
  seasons: loadFlatTable<SeasonRecord>("core.seasons"),
  referees: loadFlatTable<RefereeRecord>("core.referees"),
  managers: loadFlatTable<ManagerRecord>("core.managers"),
  teams: loadFlatTable<TeamRecord>("core.teams"),
  players: loadFlatTable<PlayerRecord>("core.players"),
  matches: loadFlatTable<MatchRecord>("core.matches"),
  lineups: loadFlatTable<LineupRecord>("core.lineups").map((record) => ({
    ...record,
    edited: false
  })),
  playerMatchStats: loadStatsTable<PlayerMatchStatRecord>("core.player_match_stats").map((record) => ({
    ...record,
    edited: false
  })),
  teamMatchStats: loadStatsTable<TeamMatchStatRecord>("core.team_match_stats").map((record) => ({
    ...record,
    edited: false
  })),
  events: loadFlatTable<EventRecord>("core.events").map((record) => ({
    ...record,
    edited: false
  })),
  playerCareerTeams: loadFlatTable<PlayerCareerTeamRecord>("core.player_career_teams")
});
