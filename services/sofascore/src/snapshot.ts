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
} from "./types.js";

export type SofascoreSnapshot = {
  countries: CountryRecord[];
  cities: CityRecord[];
  stadiums: StadiumRecord[];
  tournaments: TournamentRecord[];
  seasons: SeasonRecord[];
  referees: RefereeRecord[];
  managers: ManagerRecord[];
  teams: TeamRecord[];
  players: PlayerRecord[];
  matches: MatchRecord[];
  lineups: LineupRecord[];
  playerMatchStats: PlayerMatchStatRecord[];
  teamMatchStats: TeamMatchStatRecord[];
  events: EventRecord[];
  playerCareerTeams: PlayerCareerTeamRecord[];
};

export type SofascoreSnapshotCounts = {
  countries: number;
  cities: number;
  stadiums: number;
  tournaments: number;
  seasons: number;
  referees: number;
  managers: number;
  teams: number;
  players: number;
  matches: number;
  lineups: number;
  playerMatchStats: number;
  teamMatchStats: number;
  events: number;
  playerCareerTeams: number;
};

export type SofascoreSnapshotResult = {
  snapshot: SofascoreSnapshot;
  processedCounts: SofascoreSnapshotCounts;
};
