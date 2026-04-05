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
    left join core.countries country on country.id = c.country
    where c.run_id = $RUN_ID$
      and (c.source_ref is null or c.name is null or country.id is null);
  `,
  stadiums: `
    select count(*)
    from staging.stadiums s
    left join core.cities c on c.id = s.city
    where s.run_id = $RUN_ID$
      and (s.source_ref is null or s.name is null or c.id is null);
  `,
  tournaments: `
    select count(*)
    from staging.tournaments t
    left join core.countries c on c.id = t.country
    where t.run_id = $RUN_ID$
      and (t.source_ref is null or t.name is null or c.id is null);
  `,
  seasons: `
    select count(*)
    from staging.seasons s
    left join core.tournaments t on t.id = s.tournament
    where s.run_id = $RUN_ID$
      and (s.source_ref is null or s.name is null or t.id is null);
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
    left join core.stadiums s on s.id = t.stadium
    where t.run_id = $RUN_ID$
      and (
        t.source_ref is null
        or t.name is null
        or (t.stadium is not null and t.stadium <> '' and s.id is null)
      );
  `,
  players: `
    select count(*)
    from staging.players p
    left join core.countries c on c.id = p.country
    where p.run_id = $RUN_ID$
      and (p.source_ref is null or p.name is null or c.id is null);
  `,
  matches: `
    select count(*)
    from staging.matches m
    left join core.tournaments t on t.id = m.tournament
    left join core.seasons s on s.id = m.season
    left join core.teams ht on ht.id = m.home_team
    left join core.teams at on at.id = m.away_team
    where m.run_id = $RUN_ID$
      and (
        m.source_ref is null
        or m.start_time is null
        or t.id is null
        or s.id is null
        or ht.id is null
        or at.id is null
      );
  `,
  lineups: `
    select count(*)
    from staging.lineups l
    left join core.matches m on m.id = l.match
    left join core.teams t on t.id = l.team
    left join core.players p on p.id = l.player
    where l.run_id = $RUN_ID$
      and (
        l.source_match_id is null
        or l.source_team_id is null
        or l.source_player_id is null
        or m.id is null
        or t.id is null
        or p.id is null
      );
  `,
  player_match_stats: `
    select count(*)
    from staging.player_match_stats s
    left join core.matches m on m.id = s.match
    left join core.teams t on t.id = s.team
    left join core.players p on p.id = s.player
    where s.run_id = $RUN_ID$
      and (
        s.source_match_id is null
        or s.source_team_id is null
        or s.source_player_id is null
        or s.stat_payload is null
        or m.id is null
        or t.id is null
        or p.id is null
      );
  `,
  team_match_stats: `
    select count(*)
    from staging.team_match_stats s
    left join core.matches m on m.id = s.match
    left join core.teams t on t.id = s.team
    where s.run_id = $RUN_ID$
      and (
        s.source_match_id is null
        or s.source_team_id is null
        or s.stat_payload is null
        or m.id is null
        or t.id is null
      );
  `,
  events: `
    select count(*)
    from staging.events e
    left join core.matches m on m.id = e.match
    left join core.teams t on t.id = e.team
    left join core.players p on p.id = e.player
    left join core.players rp on rp.id = e.related_player
    left join core.managers mgr on mgr.id = e.manager
    where e.run_id = $RUN_ID$
      and (
        e.source_match_id is null
        or e.source_incident_id is null
        or e.incident_type is null
        or m.id is null
        or (e.team is not null and e.team <> '' and t.id is null)
        or (e.player is not null and e.player <> '' and p.id is null)
        or (e.related_player is not null and e.related_player <> '' and rp.id is null)
        or (e.manager is not null and e.manager <> '' and mgr.id is null)
      );
  `,
  player_career_teams: `
    select count(*)
    from staging.player_career_teams pct
    left join core.players p on p.id = pct.player
    left join core.teams t on t.id = pct.team
    where pct.run_id = $RUN_ID$
      and (
        pct.source_player_id is null
        or pct.source_team_id is null
        or p.id is null
        or t.id is null
      );
  `
};

const buildValidationSql = (runId) => {
  const statements = ENTITY_CONFIGS.map((config) => {
    const validationQuery = VALIDATION_QUERIES[config.entity]?.replaceAll(
      "$RUN_ID$",
      sqlLiteral(runId)
    );

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
