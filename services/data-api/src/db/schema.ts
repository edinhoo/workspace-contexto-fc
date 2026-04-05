export type CountryTable = {
  id: string;
  name: string;
};

export type StadiumTable = {
  id: string;
  name: string;
  slug: string;
  city: string;
};

export type CityTable = {
  id: string;
  name: string;
};

export type TournamentTable = {
  id: string;
  name: string;
  slug: string;
};

export type SeasonTable = {
  id: string;
  name: string;
  year: string | null;
};

export type RefereeTable = {
  id: string;
  name: string;
  slug: string;
};

export type TeamTable = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  code3: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  source_ref: string;
};

export type PlayerTable = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  position: string | null;
  country: string;
  date_of_birth: string | null;
};

export type MatchTable = {
  id: string;
  source_ref: string;
  tournament: string;
  season: string;
  round: string | null;
  stadium: string | null;
  referee: string | null;
  home_team: string;
  away_team: string;
  start_time: Date;
  home_score_normaltime: string | null;
  away_score_normaltime: string | null;
};

export type LineupTable = {
  id: string;
  match: string;
  team: string;
  player: string;
  position: string | null;
  jersey_number: string | null;
  minutes_played: string | null;
  rating: string | null;
};

export type EventTable = {
  id: string;
  match: string;
  sort_order: string | null;
  team: string | null;
  player: string | null;
  related_player: string | null;
  incident_type: string;
  incident_class: string | null;
  minute: string | null;
  added_time: string | null;
  home_score: string | null;
  away_score: string | null;
};

export type TeamMatchStatsTable = {
  id: string;
  match: string;
  team: string;
  stat_payload: Record<string, unknown>;
};

export type PlayerMatchStatsTable = {
  id: string;
  match: string;
  team: string;
  player: string;
  stat_payload: Record<string, unknown>;
};

export type PlayerCareerTeamTable = {
  id: string;
  player: string;
  team: string;
};

export type IngestionRunTable = {
  run_id: string;
  source: string;
  started_at: Date;
  finished_at: Date | null;
  status: string;
  rows_inserted: number | null;
  rows_updated: number | null;
  rows_skipped: number | null;
  validation_errors: unknown | null;
  warnings: unknown | null;
};

export type Database = {
  "core.countries": CountryTable;
  "core.stadiums": StadiumTable;
  "core.cities": CityTable;
  "core.tournaments": TournamentTable;
  "core.seasons": SeasonTable;
  "core.referees": RefereeTable;
  "core.teams": TeamTable;
  "core.players": PlayerTable;
  "core.matches": MatchTable;
  "core.lineups": LineupTable;
  "core.events": EventTable;
  "core.team_match_stats": TeamMatchStatsTable;
  "core.player_match_stats": PlayerMatchStatsTable;
  "core.player_career_teams": PlayerCareerTeamTable;
  "ops.ingestion_runs": IngestionRunTable;
};
