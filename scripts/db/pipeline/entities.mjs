export const ENTITY_CONFIGS = [
  {
    entity: "countries",
    file: "countries.csv",
    stagingTable: "staging.countries",
    coreTable: "core.countries",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "cities",
    file: "cities.csv",
    stagingTable: "staging.cities",
    coreTable: "core.cities",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "stadiums",
    file: "stadiums.csv",
    stagingTable: "staging.stadiums",
    coreTable: "core.stadiums",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "tournaments",
    file: "tournaments.csv",
    stagingTable: "staging.tournaments",
    coreTable: "core.tournaments",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "seasons",
    file: "seasons.csv",
    stagingTable: "staging.seasons",
    coreTable: "core.seasons",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "referees",
    file: "referees.csv",
    stagingTable: "staging.referees",
    coreTable: "core.referees",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "managers",
    file: "managers.csv",
    stagingTable: "staging.managers",
    coreTable: "core.managers",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "teams",
    file: "teams.csv",
    stagingTable: "staging.teams",
    coreTable: "core.teams",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "players",
    file: "players.csv",
    stagingTable: "staging.players",
    coreTable: "core.players",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "matches",
    file: "matches.csv",
    stagingTable: "staging.matches",
    coreTable: "core.matches",
    mode: "tabular",
    naturalKey: ["source_ref"]
  },
  {
    entity: "lineups",
    file: "lineups.csv",
    stagingTable: "staging.lineups",
    coreTable: "core.lineups",
    mode: "tabular",
    naturalKey: ["source_match_id", "source_team_id", "source_player_id"]
  },
  {
    entity: "player_match_stats",
    file: "player-match-stats.csv",
    stagingTable: "staging.player_match_stats",
    coreTable: "core.player_match_stats",
    mode: "player-stats",
    naturalKey: ["source_match_id", "source_team_id", "source_player_id"]
  },
  {
    entity: "team_match_stats",
    file: "team-match-stats.csv",
    stagingTable: "staging.team_match_stats",
    coreTable: "core.team_match_stats",
    mode: "team-stats",
    naturalKey: ["source_match_id", "source_team_id"]
  },
  {
    entity: "events",
    file: "events.csv",
    stagingTable: "staging.events",
    coreTable: "core.events",
    mode: "tabular",
    naturalKey: ["source_match_id", "source_incident_id"]
  },
  {
    entity: "player_career_teams",
    file: "player-career-teams.csv",
    stagingTable: "staging.player_career_teams",
    coreTable: "core.player_career_teams",
    mode: "tabular",
    naturalKey: ["source_player_id", "source_team_id"]
  }
];

export const PROMOTION_ORDER = [
  "countries",
  "states",
  "cities",
  "stadiums",
  "tournaments",
  "seasons",
  "referees",
  "managers",
  "teams",
  "players",
  "matches",
  "lineups",
  "player_match_stats",
  "team_match_stats",
  "events",
  "player_career_teams"
];

export const ENTITIES_BY_NAME = Object.fromEntries(
  ENTITY_CONFIGS.map((config) => [config.entity, config])
);
