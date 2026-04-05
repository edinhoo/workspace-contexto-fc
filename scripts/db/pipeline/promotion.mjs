import { createTempSqlFile, runPsqlFile } from "../_shared.mjs";
import { sqlLiteral } from "./source-data.mjs";

const buildUpsert = ({ runId, coreTable, insertColumns, selectClause, conflictColumns, updateColumns }) => `
insert into ${coreTable} (
  ${insertColumns.join(", ")}
)
${selectClause.replaceAll("$RUN_ID$", sqlLiteral(runId))}
on conflict (${conflictColumns.join(", ")}) do update
set
  ${updateColumns.map((column) => `${column} = excluded.${column}`).join(",\n  ")};
`;

const UPSERTS = [
  {
    coreTable: "core.countries",
    insertColumns: [
      "id","slug","name","code2","code3","source_slug","source_code2","source_code3","source_name","source_ref","source","first_scraped_at","last_scraped_at","created_at","updated_at"
    ],
    selectClause: `
select
  id, slug, name, code2, code3, source_slug, source_code2, source_code3, source_name,
  coalesce(source_ref, slug), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.countries
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","code2","code3","source_slug","source_code2","source_code3","source_name","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.cities",
    insertColumns: ["id","slug","name","short_name","country","state","source_name","source_ref","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, short_name, country, null, source_name, coalesce(source_ref, id),
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.cities
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","short_name","country","source_name","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.stadiums",
    insertColumns: ["id","slug","name","short_name","city","capacity","latitude","longitude","source_ref","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, short_name, city, capacity, latitude, longitude, coalesce(source_ref, id),
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.stadiums
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","short_name","city","capacity","latitude","longitude","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.tournaments",
    insertColumns: ["id","slug","name","short_name","country","primary_color","secondary_color","source_ref","source_slug","source_name","source_primary_color","source_secondary_color","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, short_name, country, primary_color, secondary_color,
  coalesce(source_ref, id), source_slug, source_name, source_primary_color, source_secondary_color,
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.tournaments
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","short_name","country","primary_color","secondary_color","source_slug","source_name","source_primary_color","source_secondary_color","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.seasons",
    insertColumns: ["id","slug","name","short_name","year","tournament","source_ref","source_name","source_year","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, short_name, year, tournament, coalesce(source_ref, id), source_name, source_year,
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.seasons
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","short_name","year","tournament","source_name","source_year","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.referees",
    insertColumns: ["id","slug","name","short_name","country","source_ref","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, short_name, nullif(country, ''), coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.referees
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","short_name","country","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.managers",
    insertColumns: ["id","slug","name","short_name","country","source_ref","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, short_name, nullif(country, ''), coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.managers
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","short_name","country","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.teams",
    insertColumns: ["id","slug","name","code3","short_name","complete_name","stadium","foundation","primary_color","secondary_color","text_color","source_ref","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, code3, short_name, complete_name, nullif(stadium, ''), foundation, primary_color,
  secondary_color, text_color, coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.teams
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","code3","short_name","complete_name","stadium","foundation","primary_color","secondary_color","text_color","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.players",
    insertColumns: ["id","slug","name","short_name","first_name","last_name","position","height","country","date_of_birth","source","source_ref","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, slug, name, short_name, first_name, last_name, position, height, country, date_of_birth,
  coalesce(source, 'sofascore'), coalesce(source_ref, id),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.players
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["slug","name","short_name","first_name","last_name","position","height","country","date_of_birth","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.matches",
    insertColumns: ["id","tournament","season","round","stadium","referee","home_team","home_manager","home_formation","home_score_period_1","home_score_period_2","home_score_normaltime","home_score_extra_1","home_score_extra_2","home_score_overtime","home_score_penalties","away_team","away_manager","away_formation","away_score_period_1","away_score_period_2","away_score_normaltime","away_score_extra_1","away_score_extra_2","away_score_overtime","away_score_penalties","start_time","period_start_time","injury_time_1","injury_time_2","injury_time_3","injury_time_4","source_ref","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, tournament, season, round, nullif(stadium, ''), nullif(referee, ''), home_team, nullif(home_manager, ''),
  home_formation, home_score_period_1, home_score_period_2, home_score_normaltime, home_score_extra_1,
  home_score_extra_2, home_score_overtime, home_score_penalties, away_team, nullif(away_manager, ''),
  away_formation, away_score_period_1, away_score_period_2, away_score_normaltime,
  away_score_extra_1, away_score_extra_2, away_score_overtime, away_score_penalties,
  to_timestamp(start_time::double precision),
  case when nullif(period_start_time::text, '') is null then null else to_timestamp(period_start_time::double precision) end,
  injury_time_1, injury_time_2, injury_time_3, injury_time_4,
  coalesce(source_ref, id), coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.matches
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_ref"],
    updateColumns: ["tournament","season","round","stadium","referee","home_team","home_manager","home_formation","home_score_period_1","home_score_period_2","home_score_normaltime","home_score_extra_1","home_score_extra_2","home_score_overtime","home_score_penalties","away_team","away_manager","away_formation","away_score_period_1","away_score_period_2","away_score_normaltime","away_score_extra_1","away_score_extra_2","away_score_overtime","away_score_penalties","start_time","period_start_time","injury_time_1","injury_time_2","injury_time_3","injury_time_4","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.lineups",
    insertColumns: ["id","match","team","player","jersey_number","position","substitute","is_missing","slot","minutes_played","rating","source_match_id","source_team_id","source_player_id","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, match, team, player, jersey_number, position, substitute, is_missing, slot, minutes_played,
  rating, source_match_id, source_team_id, source_player_id, coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.lineups
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_match_id","source_team_id","source_player_id"],
    updateColumns: ["match","team","player","jersey_number","position","substitute","is_missing","slot","minutes_played","rating","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.player_match_stats",
    insertColumns: ["id","match","team","player","stat_payload","source_match_id","source_team_id","source_player_id","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, match, team, player, stat_payload, source_match_id, source_team_id, source_player_id,
  coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.player_match_stats
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_match_id","source_team_id","source_player_id"],
    updateColumns: ["match","team","player","stat_payload","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.team_match_stats",
    insertColumns: ["id","match","team","stat_payload","source_match_id","source_team_id","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, match, team, stat_payload, source_match_id, source_team_id, coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.team_match_stats
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_match_id","source_team_id"],
    updateColumns: ["match","team","stat_payload","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.events",
    insertColumns: ["id","match","sort_order","team","player","related_player","manager","incident_type","incident_class","period","minute","added_time","reversed_period_time","is_home","impact_side","is_confirmed","is_rescinded","reason","description","is_injury","home_score","away_score","length","body_part","goal_type","situation","shot_type","player_x","player_y","pass_end_x","pass_end_y","shot_x","shot_y","goal_mouth_x","goal_mouth_y","goalkeeper_x","goalkeeper_y","source_match_id","source_incident_id","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
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
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_match_id","source_incident_id"],
    updateColumns: ["match","sort_order","team","player","related_player","manager","incident_type","incident_class","period","minute","added_time","reversed_period_time","is_home","impact_side","is_confirmed","is_rescinded","reason","description","is_injury","home_score","away_score","length","body_part","goal_type","situation","shot_type","player_x","player_y","pass_end_x","pass_end_y","shot_x","shot_y","goal_mouth_x","goal_mouth_y","goalkeeper_x","goalkeeper_y","source","last_scraped_at","updated_at"]
  },
  {
    coreTable: "core.player_career_teams",
    insertColumns: ["id","player","team","source_player_id","source_team_id","source","first_scraped_at","last_scraped_at","created_at","updated_at"],
    selectClause: `
select
  id, player, team, source_player_id, source_team_id, coalesce(source, 'sofascore'),
  coalesce(first_scraped_at, ingested_at), coalesce(last_scraped_at, ingested_at),
  coalesce(created_at, ingested_at), coalesce(updated_at, ingested_at)
from staging.player_career_teams
where run_id = $RUN_ID$
`,
    conflictColumns: ["source_player_id","source_team_id"],
    updateColumns: ["player","team","source","last_scraped_at","updated_at"]
  }
];

export const promoteRun = (runId) => {
  const sql = `
begin;

${UPSERTS.map((config) => buildUpsert({ runId, ...config })).join("\n")}

update ops.ingestion_runs
set
  status = 'completed',
  finished_at = now()
where run_id = ${sqlLiteral(runId)};

commit;
`;

  const sqlFile = createTempSqlFile("contexto-fc-phase2-promote", sql);

  try {
    runPsqlFile(sqlFile.filePath);
  } finally {
    sqlFile.cleanup();
  }
};
