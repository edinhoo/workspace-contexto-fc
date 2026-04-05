import { createTempSqlFile, runPsqlFile, runPsqlQuery } from "../_shared.mjs";
import { ENTITY_CONFIGS } from "./entities.mjs";
import { sqlLiteral } from "./source-data.mjs";

const parseRows = (output) =>
  output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));

const VALIDATION_QUERIES = {
  countries: `
    select count(*)
    from staging.countries
    where run_id = $RUN_ID$
      and (source_ref is null or slug is null or name is null);
  `,
  cities: `
    select count(*)
    from staging.cities c
    left join core.countries core_country on core_country.id = c.country
    left join staging.countries staging_country on staging_country.id = c.country and staging_country.run_id = $RUN_ID$
    where c.run_id = $RUN_ID$
      and (c.source_ref is null or c.name is null or (core_country.id is null and staging_country.id is null));
  `,
  stadiums: `
    select count(*)
    from staging.stadiums s
    left join core.cities core_city on core_city.id = s.city
    left join staging.cities staging_city on staging_city.id = s.city and staging_city.run_id = $RUN_ID$
    where s.run_id = $RUN_ID$
      and (s.source_ref is null or s.name is null or (core_city.id is null and staging_city.id is null));
  `,
  tournaments: `
    select count(*)
    from staging.tournaments t
    left join core.countries core_country on core_country.id = t.country
    left join staging.countries staging_country on staging_country.id = t.country and staging_country.run_id = $RUN_ID$
    where t.run_id = $RUN_ID$
      and (t.source_ref is null or t.name is null or (core_country.id is null and staging_country.id is null));
  `,
  seasons: `
    select count(*)
    from staging.seasons s
    left join core.tournaments core_tournament on core_tournament.id = s.tournament
    left join staging.tournaments staging_tournament on staging_tournament.id = s.tournament and staging_tournament.run_id = $RUN_ID$
    where s.run_id = $RUN_ID$
      and (s.source_ref is null or s.name is null or (core_tournament.id is null and staging_tournament.id is null));
  `,
  referees: `
    select count(*)
    from staging.referees
    where run_id = $RUN_ID$
      and (source_ref is null or name is null);
  `,
  managers: `
    select count(*)
    from staging.managers
    where run_id = $RUN_ID$
      and (source_ref is null or name is null);
  `,
  teams: `
    select count(*)
    from staging.teams t
    left join core.stadiums core_stadium on core_stadium.id = t.stadium
    left join staging.stadiums staging_stadium on staging_stadium.id = t.stadium and staging_stadium.run_id = $RUN_ID$
    where t.run_id = $RUN_ID$
      and (
        t.source_ref is null
        or t.name is null
        or (t.stadium is not null and t.stadium <> '' and core_stadium.id is null and staging_stadium.id is null)
      );
  `,
  players: `
    select count(*)
    from staging.players p
    left join core.countries core_country on core_country.id = p.country
    left join staging.countries staging_country on staging_country.id = p.country and staging_country.run_id = $RUN_ID$
    where p.run_id = $RUN_ID$
      and (p.source_ref is null or p.name is null or (core_country.id is null and staging_country.id is null));
  `,
  matches: `
    select count(*)
    from staging.matches m
    left join core.tournaments core_tournament on core_tournament.id = m.tournament
    left join staging.tournaments staging_tournament on staging_tournament.id = m.tournament and staging_tournament.run_id = $RUN_ID$
    left join core.seasons core_season on core_season.id = m.season
    left join staging.seasons staging_season on staging_season.id = m.season and staging_season.run_id = $RUN_ID$
    left join core.teams core_home_team on core_home_team.id = m.home_team
    left join staging.teams staging_home_team on staging_home_team.id = m.home_team and staging_home_team.run_id = $RUN_ID$
    left join core.teams core_away_team on core_away_team.id = m.away_team
    left join staging.teams staging_away_team on staging_away_team.id = m.away_team and staging_away_team.run_id = $RUN_ID$
    where m.run_id = $RUN_ID$
      and (
        m.source_ref is null
        or m.start_time is null
        or (core_tournament.id is null and staging_tournament.id is null)
        or (core_season.id is null and staging_season.id is null)
        or (core_home_team.id is null and staging_home_team.id is null)
        or (core_away_team.id is null and staging_away_team.id is null)
      );
  `,
  lineups: `
    select count(*)
    from staging.lineups l
    left join core.matches core_match on core_match.id = l.match
    left join staging.matches staging_match on staging_match.id = l.match and staging_match.run_id = $RUN_ID$
    left join core.teams core_team on core_team.id = l.team
    left join staging.teams staging_team on staging_team.id = l.team and staging_team.run_id = $RUN_ID$
    left join core.players core_player on core_player.id = l.player
    left join staging.players staging_player on staging_player.id = l.player and staging_player.run_id = $RUN_ID$
    where l.run_id = $RUN_ID$
      and (
        l.source_match_id is null
        or l.source_team_id is null
        or l.source_player_id is null
        or (core_match.id is null and staging_match.id is null)
        or (core_team.id is null and staging_team.id is null)
        or (core_player.id is null and staging_player.id is null)
      );
  `,
  player_match_stats: `
    select count(*)
    from staging.player_match_stats s
    left join core.matches core_match on core_match.id = s.match
    left join staging.matches staging_match on staging_match.id = s.match and staging_match.run_id = $RUN_ID$
    left join core.teams core_team on core_team.id = s.team
    left join staging.teams staging_team on staging_team.id = s.team and staging_team.run_id = $RUN_ID$
    left join core.players core_player on core_player.id = s.player
    left join staging.players staging_player on staging_player.id = s.player and staging_player.run_id = $RUN_ID$
    where s.run_id = $RUN_ID$
      and (
        s.source_match_id is null
        or s.source_team_id is null
        or s.source_player_id is null
        or s.stat_payload is null
        or (core_match.id is null and staging_match.id is null)
        or (core_team.id is null and staging_team.id is null)
        or (core_player.id is null and staging_player.id is null)
      );
  `,
  team_match_stats: `
    select count(*)
    from staging.team_match_stats s
    left join core.matches core_match on core_match.id = s.match
    left join staging.matches staging_match on staging_match.id = s.match and staging_match.run_id = $RUN_ID$
    left join core.teams core_team on core_team.id = s.team
    left join staging.teams staging_team on staging_team.id = s.team and staging_team.run_id = $RUN_ID$
    where s.run_id = $RUN_ID$
      and (
        s.source_match_id is null
        or s.source_team_id is null
        or s.stat_payload is null
        or (core_match.id is null and staging_match.id is null)
        or (core_team.id is null and staging_team.id is null)
      );
  `,
  events: `
    select count(*)
    from staging.events e
    left join core.matches core_match on core_match.id = e.match
    left join staging.matches staging_match on staging_match.id = e.match and staging_match.run_id = $RUN_ID$
    left join core.teams core_team on core_team.id = e.team
    left join staging.teams staging_team on staging_team.id = e.team and staging_team.run_id = $RUN_ID$
    left join core.players core_player on core_player.id = e.player
    left join staging.players staging_player on staging_player.id = e.player and staging_player.run_id = $RUN_ID$
    left join core.players core_related_player on core_related_player.id = e.related_player
    left join staging.players staging_related_player on staging_related_player.id = e.related_player and staging_related_player.run_id = $RUN_ID$
    left join core.managers core_manager on core_manager.id = e.manager
    left join staging.managers staging_manager on staging_manager.id = e.manager and staging_manager.run_id = $RUN_ID$
    where e.run_id = $RUN_ID$
      and (
        e.source_match_id is null
        or e.source_incident_id is null
        or e.incident_type is null
        or (core_match.id is null and staging_match.id is null)
        or (e.team is not null and e.team <> '' and core_team.id is null and staging_team.id is null)
        or (e.player is not null and e.player <> '' and core_player.id is null and staging_player.id is null)
        or (e.related_player is not null and e.related_player <> '' and core_related_player.id is null and staging_related_player.id is null)
        or (e.manager is not null and e.manager <> '' and core_manager.id is null and staging_manager.id is null)
      );
  `,
  player_career_teams: `
    select count(*)
    from staging.player_career_teams pct
    left join core.players core_player on core_player.id = pct.player
    left join staging.players staging_player on staging_player.id = pct.player and staging_player.run_id = $RUN_ID$
    left join core.teams core_team on core_team.id = pct.team
    left join staging.teams staging_team on staging_team.id = pct.team and staging_team.run_id = $RUN_ID$
    where pct.run_id = $RUN_ID$
      and (
        pct.source_player_id is null
        or pct.source_team_id is null
        or (core_player.id is null and staging_player.id is null)
        or (core_team.id is null and staging_team.id is null)
      );
  `
};

export const buildValidationSql = (runId) => {
  const statements = ENTITY_CONFIGS.map((config) => {
    const validationQuery = VALIDATION_QUERIES[config.entity]?.replaceAll(
      "$RUN_ID$",
      sqlLiteral(runId)
    )?.trim().replace(/;$/, "");

    if (!validationQuery) {
      return "";
    }

    return `
with validation_result as (
  ${validationQuery}
)
update ${config.stagingTable}
set
  validation_status = case when (select count from validation_result) = 0 then 'valid' else 'invalid' end,
  validation_errors = case
    when (select count from validation_result) = 0 then null
    else jsonb_build_array(jsonb_build_object('type', 'entity_validation', 'entity', ${sqlLiteral(config.entity)}, 'count', (select count from validation_result)))
  end,
  warnings = null
where run_id = ${sqlLiteral(runId)};
`;
  });

  return statements.filter(Boolean).join("\n");
};

export const validateRun = (runId) => {
  const sqlFile = createTempSqlFile(
    "contexto-fc-phase2-validate",
    `begin;\n${buildValidationSql(runId)}\ncommit;\n`
  );

  try {
    runPsqlFile(sqlFile.filePath);
  } finally {
    sqlFile.cleanup();
  }
};

export const getValidationSummary = (runId) => {
  const rows = parseRows(
    runPsqlQuery(`
      select entity, rows_seen::text, rows_valid::text, rows_invalid::text, status
      from (
        ${ENTITY_CONFIGS.map(
          (config) => `
            select
              ${sqlLiteral(config.entity)} as entity,
              count(*) as rows_seen,
              count(*) filter (where validation_status = 'valid') as rows_valid,
              count(*) filter (where validation_status = 'invalid') as rows_invalid,
              case
                when count(*) filter (where validation_status = 'invalid') > 0 then 'invalid'
                else 'valid'
              end as status
            from ${config.stagingTable}
            where run_id = ${sqlLiteral(runId)}
          `
        ).join(" union all ")}
      ) summary
      order by entity;
    `)
  );

  return rows.map(([entity, rowsSeen, rowsValid, rowsInvalid, status]) => ({
    entity,
    rowsSeen: Number(rowsSeen),
    rowsValid: Number(rowsValid),
    rowsInvalid: Number(rowsInvalid),
    status
  }));
};
