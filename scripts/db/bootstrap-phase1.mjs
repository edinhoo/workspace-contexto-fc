import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createTempSqlFile, runPsqlFile } from "./_shared.mjs";

const runId = `phase1-${randomUUID()}`;
const ingestedAt = new Date().toISOString();
const dataDir = resolve(process.cwd(), "services/sofascore/data");

const tableConfigs = [
  { file: "countries.csv", table: "countries", mode: "tabular" },
  { file: "cities.csv", table: "cities", mode: "tabular" },
  { file: "stadiums.csv", table: "stadiums", mode: "tabular" },
  { file: "tournaments.csv", table: "tournaments", mode: "tabular" },
  { file: "seasons.csv", table: "seasons", mode: "tabular" },
  { file: "referees.csv", table: "referees", mode: "tabular" },
  { file: "managers.csv", table: "managers", mode: "tabular" },
  { file: "teams.csv", table: "teams", mode: "tabular" },
  { file: "players.csv", table: "players", mode: "tabular" },
  { file: "matches.csv", table: "matches", mode: "tabular" },
  { file: "lineups.csv", table: "lineups", mode: "tabular" },
  { file: "events.csv", table: "events", mode: "tabular" },
  { file: "player-career-teams.csv", table: "player_career_teams", mode: "tabular" },
  {
    file: "player-match-stats.csv",
    table: "player_match_stats",
    mode: "player-stats"
  },
  {
    file: "team-match-stats.csv",
    table: "team_match_stats",
    mode: "team-stats"
  }
];

const tabularBaseColumns = [
  "run_id",
  "ingested_at",
  "validation_status",
  "validation_errors",
  "warnings"
];

const statsBaseColumns = [
  "run_id",
  "ingested_at",
  "validation_status",
  "validation_errors",
  "warnings",
  "first_scraped_at",
  "last_scraped_at",
  "created_at",
  "updated_at"
];

const sourceFiles = tableConfigs.map((config) => resolve(dataDir, config.file));

const parseCsv = (filePath) => {
  const content = readFileSync(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { headers, rows };
};

const validateSourceFiles = () => {
  const problems = [];

  for (const filePath of sourceFiles) {
    try {
      const { headers } = parseCsv(filePath);

      if (headers.length === 0) {
        problems.push(`${filePath}: arquivo vazio ou sem header`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      problems.push(`${filePath}: ${message}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Falha na pre-validacao dos CSVs:\n- ${problems.join("\n- ")}`);
  }
};

const parseCsvRow = (row) => {
  const columns = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    const nextCharacter = row[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ";" && !insideQuotes) {
      columns.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  columns.push(currentValue);
  return columns;
};

const sqlLiteral = (value) => {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }

  const normalizedValue =
    typeof value === "string" ? value : JSON.stringify(value, null, 0);

  return `'${normalizedValue.replaceAll("'", "''")}'`;
};

const buildTabularInsert = ({ table, headers, rows }) => {
  if (rows.length === 0) {
    return "";
  }

  const columns = [...headers, ...tabularBaseColumns];
  const values = rows
    .map((row) => {
      const rowValues = [
        ...headers.map((header) => sqlLiteral(row[header] ?? null)),
        sqlLiteral(runId),
        sqlLiteral(ingestedAt),
        sqlLiteral("pending"),
        "NULL",
        "NULL"
      ];

      return `(${rowValues.join(", ")})`;
    })
    .join(",\n");

  return `insert into staging.${table} (${columns.join(", ")}) values\n${values};\n`;
};

const buildPlayerStatsInsert = ({ rows }) => {
  if (rows.length === 0) {
    return "";
  }

  const columns = [
    "id",
    "match",
    "team",
    "player",
    "source_match_id",
    "source_team_id",
    "source_player_id",
    "source",
    ...statsBaseColumns,
    "stat_payload"
  ];

  const values = rows
    .map((row) => {
      const statPayload = Object.fromEntries(
        Object.entries(row).filter(
          ([key]) =>
            ![
              "id",
              "match",
              "team",
              "player",
              "source_match_id",
              "source_team_id",
              "source_player_id",
              "source",
              "edited"
            ].includes(key)
        )
      );

      return `(${[
        sqlLiteral(row.id),
        sqlLiteral(row.match),
        sqlLiteral(row.team),
        sqlLiteral(row.player),
        sqlLiteral(row.source_match_id),
        sqlLiteral(row.source_team_id),
        sqlLiteral(row.source_player_id),
        sqlLiteral(row.source || "sofascore"),
        sqlLiteral(runId),
        sqlLiteral(ingestedAt),
        sqlLiteral("pending"),
        "NULL",
        "NULL",
        "NULL",
        "NULL",
        "NULL",
        "NULL",
        `${sqlLiteral(statPayload)}::jsonb`
      ].join(", ")})`;
    })
    .join(",\n");

  return `insert into staging.player_match_stats (${columns.join(", ")}) values\n${values};\n`;
};

const buildTeamStatsInsert = ({ rows }) => {
  if (rows.length === 0) {
    return "";
  }

  const columns = [
    "id",
    "match",
    "team",
    "source_match_id",
    "source_team_id",
    "source",
    ...statsBaseColumns,
    "stat_payload"
  ];

  const values = rows
    .map((row) => {
      const statPayload = Object.fromEntries(
        Object.entries(row).filter(
          ([key]) =>
            ![
              "id",
              "match",
              "team",
              "source_match_id",
              "source_team_id",
              "source",
              "edited"
            ].includes(key)
        )
      );

      return `(${[
        sqlLiteral(row.id),
        sqlLiteral(row.match),
        sqlLiteral(row.team),
        sqlLiteral(row.source_match_id),
        sqlLiteral(row.source_team_id),
        sqlLiteral(row.source || "sofascore"),
        sqlLiteral(runId),
        sqlLiteral(ingestedAt),
        sqlLiteral("pending"),
        "NULL",
        "NULL",
        "NULL",
        "NULL",
        "NULL",
        "NULL",
        `${sqlLiteral(statPayload)}::jsonb`
      ].join(", ")})`;
    })
    .join(",\n");

  return `insert into staging.team_match_stats (${columns.join(", ")}) values\n${values};\n`;
};

const buildStagingSql = () =>
  tableConfigs
    .map((config) => {
      const filePath = resolve(dataDir, config.file);
      const { headers, rows } = parseCsv(filePath);

      if (config.mode === "tabular") {
        return buildTabularInsert({ table: config.table, headers, rows });
      }

      if (config.mode === "player-stats") {
        return buildPlayerStatsInsert({ rows });
      }

      return buildTeamStatsInsert({ rows });
    })
    .filter(Boolean)
    .join("\n");

const buildBootstrapSql = () => `
begin;

truncate table
  staging.team_match_stats,
  staging.player_match_stats,
  staging.player_career_teams,
  staging.events,
  staging.lineups,
  staging.matches,
  staging.players,
  staging.teams,
  staging.managers,
  staging.referees,
  staging.seasons,
  staging.tournaments,
  staging.stadiums,
  staging.cities,
  staging.countries;

truncate table
  core.player_career_teams,
  core.events,
  core.team_match_stats,
  core.player_match_stats,
  core.lineups,
  core.matches,
  core.players,
  core.teams,
  core.managers,
  core.referees,
  core.seasons,
  core.tournaments,
  core.stadiums,
  core.cities,
  core.states,
  core.countries cascade;

insert into ops.ingestion_runs (run_id, source, started_at, status)
values (${sqlLiteral(runId)}, 'sofascore', ${sqlLiteral(ingestedAt)}, 'running');

${buildStagingSql()}

insert into core.countries (
  id, slug, name, code2, code3, source_slug, source_code2, source_code3, source_name,
  source_ref, source, first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, code2, code3, source_slug, source_code2, source_code3, source_name,
  coalesce(source_ref, slug), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.countries
where run_id = ${sqlLiteral(runId)};

insert into core.cities (
  id, slug, name, short_name, country, state, source_name, source_ref, source,
  first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, short_name, country, null, source_name, coalesce(source_ref, id),
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.cities
where run_id = ${sqlLiteral(runId)};

insert into core.stadiums (
  id, slug, name, short_name, city, capacity, latitude, longitude, source_ref, source,
  first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, short_name, city,
  nullif(capacity::text, '')::integer,
  nullif(latitude::text, '')::numeric(9, 6),
  nullif(longitude::text, '')::numeric(9, 6),
  coalesce(source_ref, id),
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.stadiums
where run_id = ${sqlLiteral(runId)};

insert into core.tournaments (
  id, slug, name, short_name, country, primary_color, secondary_color, source_ref,
  source_slug, source_name, source_primary_color, source_secondary_color, source,
  first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, short_name, country, primary_color, secondary_color,
  coalesce(source_ref, id), source_slug, source_name, source_primary_color, source_secondary_color,
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.tournaments
where run_id = ${sqlLiteral(runId)};

insert into core.seasons (
  id, slug, name, short_name, year, tournament, source_ref, source_name, source_year, source,
  first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, short_name, year, tournament, coalesce(source_ref, id), source_name, source_year,
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.seasons
where run_id = ${sqlLiteral(runId)};

insert into core.referees (
  id, slug, name, short_name, country, source_ref, source,
  first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, short_name, nullif(country, ''), coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.referees
where run_id = ${sqlLiteral(runId)};

insert into core.managers (
  id, slug, name, short_name, country, source_ref, source,
  first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, short_name, nullif(country, ''), coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.managers
where run_id = ${sqlLiteral(runId)};

insert into core.teams (
  id, slug, name, code3, short_name, complete_name, stadium, foundation, primary_color,
  secondary_color, text_color, source_ref, source, first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, code3, short_name, complete_name, nullif(stadium, ''), foundation, primary_color,
  secondary_color, text_color, coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.teams
where run_id = ${sqlLiteral(runId)};

insert into core.players (
  id, slug, name, short_name, first_name, last_name, position, height, country, date_of_birth,
  source, source_ref, first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, slug, name, short_name, first_name, last_name, position, height, country, date_of_birth,
  coalesce(source, 'sofascore'), coalesce(source_ref, id),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.players
where run_id = ${sqlLiteral(runId)};

insert into core.matches (
  id, tournament, season, round, stadium, referee, home_team, home_manager, home_formation,
  home_score_period_1, home_score_period_2, home_score_normaltime, home_score_extra_1,
  home_score_extra_2, home_score_overtime, home_score_penalties, away_team, away_manager,
  away_formation, away_score_period_1, away_score_period_2, away_score_normaltime,
  away_score_extra_1, away_score_extra_2, away_score_overtime, away_score_penalties,
  start_time, period_start_time, injury_time_1, injury_time_2, injury_time_3, injury_time_4,
  source_ref, source, first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, tournament, season, round, nullif(stadium, ''), nullif(referee, ''), home_team, nullif(home_manager, ''),
  home_formation,
  nullif(home_score_period_1::text, '')::integer,
  nullif(home_score_period_2::text, '')::integer,
  nullif(home_score_normaltime::text, '')::integer,
  nullif(home_score_extra_1::text, '')::integer,
  nullif(home_score_extra_2::text, '')::integer,
  nullif(home_score_overtime::text, '')::integer,
  nullif(home_score_penalties::text, '')::integer,
  away_team, nullif(away_manager, ''),
  away_formation,
  nullif(away_score_period_1::text, '')::integer,
  nullif(away_score_period_2::text, '')::integer,
  nullif(away_score_normaltime::text, '')::integer,
  nullif(away_score_extra_1::text, '')::integer,
  nullif(away_score_extra_2::text, '')::integer,
  nullif(away_score_overtime::text, '')::integer,
  nullif(away_score_penalties::text, '')::integer,
  to_timestamp(start_time::double precision),
  case when nullif(period_start_time, '') is null then null else to_timestamp(period_start_time::double precision) end,
  nullif(injury_time_1::text, '')::integer,
  nullif(injury_time_2::text, '')::integer,
  nullif(injury_time_3::text, '')::integer,
  nullif(injury_time_4::text, '')::integer,
  coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.matches
where run_id = ${sqlLiteral(runId)};

insert into core.lineups (
  id, match, team, player, jersey_number, position, substitute, is_missing, slot, minutes_played,
  rating, source_match_id, source_team_id, source_player_id, source, first_scraped_at, last_scraped_at,
  created_at, updated_at
)
select
  id, match, team, player, nullif(jersey_number::text, '')::integer, position, substitute, is_missing, slot,
  nullif(minutes_played::text, '')::integer,
  nullif(rating::text, '')::numeric(4, 2), source_match_id, source_team_id, source_player_id, coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.lineups
where run_id = ${sqlLiteral(runId)};

insert into core.player_match_stats (
  id, match, team, player, stat_payload, source_match_id, source_team_id, source_player_id,
  source, first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, match, team, player, stat_payload, source_match_id, source_team_id, source_player_id,
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.player_match_stats
where run_id = ${sqlLiteral(runId)};

insert into core.team_match_stats (
  id, match, team, stat_payload, source_match_id, source_team_id, source,
  first_scraped_at, last_scraped_at, created_at, updated_at
)
select
  id, match, team, stat_payload, source_match_id, source_team_id, coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.team_match_stats
where run_id = ${sqlLiteral(runId)};

insert into core.events (
  id, match, sort_order, team, player, related_player, manager, incident_type, incident_class,
  period, minute, added_time, reversed_period_time, is_home, impact_side, is_confirmed, is_rescinded,
  reason, description, is_injury, home_score, away_score, length, body_part, goal_type, situation,
  shot_type, player_x, player_y, pass_end_x, pass_end_y, shot_x, shot_y, goal_mouth_x, goal_mouth_y,
  goalkeeper_x, goalkeeper_y, source_match_id, source_incident_id, source, first_scraped_at,
  last_scraped_at, created_at, updated_at
)
select
  id, match, sort_order, nullif(team, ''), nullif(player, ''), nullif(related_player, ''),
  nullif(manager, ''), incident_type, incident_class, period, minute, added_time, reversed_period_time,
  is_home, impact_side, is_confirmed, is_rescinded, reason, description, is_injury, home_score,
  away_score, length, body_part, goal_type, situation, shot_type, player_x, player_y, pass_end_x,
  pass_end_y, shot_x, shot_y, goal_mouth_x, goal_mouth_y, goalkeeper_x, goalkeeper_y,
  source_match_id, source_incident_id, coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.events
where run_id = ${sqlLiteral(runId)};

insert into core.player_career_teams (
  id, player, team, source_player_id, source_team_id, source, first_scraped_at, last_scraped_at,
  created_at, updated_at
)
select
  id, player, team, source_player_id, source_team_id, coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.player_career_teams
where run_id = ${sqlLiteral(runId)};

update ops.ingestion_runs
set
  finished_at = now(),
  status = 'completed',
  rows_inserted = (
    select
      (select count(*) from core.countries) +
      (select count(*) from core.cities) +
      (select count(*) from core.stadiums) +
      (select count(*) from core.tournaments) +
      (select count(*) from core.seasons) +
      (select count(*) from core.referees) +
      (select count(*) from core.managers) +
      (select count(*) from core.teams) +
      (select count(*) from core.players) +
      (select count(*) from core.matches) +
      (select count(*) from core.lineups) +
      (select count(*) from core.player_match_stats) +
      (select count(*) from core.team_match_stats) +
      (select count(*) from core.events) +
      (select count(*) from core.player_career_teams)
  )
where run_id = ${sqlLiteral(runId)};

commit;
`;

validateSourceFiles();

const sqlFile = createTempSqlFile("contexto-fc-phase1-bootstrap", buildBootstrapSql());

try {
  runPsqlFile(sqlFile.filePath);
  process.stdout.write(`Bootstrap da Fase 1 executado com sucesso. run_id=${runId}\n`);
} finally {
  sqlFile.cleanup();
}
