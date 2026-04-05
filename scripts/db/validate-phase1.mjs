import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { runPsqlQuery } from "./_shared.mjs";

const parseRows = (output) =>
  output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));

const queryValue = (query) => {
  const output = runPsqlQuery(query).trim();
  return output;
};

const countQuery = (query) => Number(queryValue(query) || "0");

const latestRunRows = parseRows(
  runPsqlQuery(`
    select run_id, status, started_at::text, coalesce(finished_at::text, ''), coalesce(rows_inserted::text, '0')
    from ops.ingestion_runs
    where source = 'sofascore'
    order by started_at desc
    limit 1;
  `)
);

if (latestRunRows.length === 0) {
  throw new Error("Nenhum ingestion_run encontrado para validar a Fase 1.");
}

const [runId, status, startedAt, finishedAt, rowsInserted] = latestRunRows[0];

const coreCounts = {
  countries: countQuery("select count(*) from core.countries;"),
  states: countQuery("select count(*) from core.states;"),
  cities: countQuery("select count(*) from core.cities;"),
  stadiums: countQuery("select count(*) from core.stadiums;"),
  tournaments: countQuery("select count(*) from core.tournaments;"),
  seasons: countQuery("select count(*) from core.seasons;"),
  referees: countQuery("select count(*) from core.referees;"),
  managers: countQuery("select count(*) from core.managers;"),
  teams: countQuery("select count(*) from core.teams;"),
  players: countQuery("select count(*) from core.players;"),
  matches: countQuery("select count(*) from core.matches;"),
  lineups: countQuery("select count(*) from core.lineups;"),
  playerMatchStats: countQuery("select count(*) from core.player_match_stats;"),
  teamMatchStats: countQuery("select count(*) from core.team_match_stats;"),
  events: countQuery("select count(*) from core.events;"),
  playerCareerTeams: countQuery("select count(*) from core.player_career_teams;")
};

const stagingCounts = {
  countries: countQuery(`select count(*) from staging.countries where run_id = '${runId}';`),
  cities: countQuery(`select count(*) from staging.cities where run_id = '${runId}';`),
  stadiums: countQuery(`select count(*) from staging.stadiums where run_id = '${runId}';`),
  tournaments: countQuery(`select count(*) from staging.tournaments where run_id = '${runId}';`),
  seasons: countQuery(`select count(*) from staging.seasons where run_id = '${runId}';`),
  referees: countQuery(`select count(*) from staging.referees where run_id = '${runId}';`),
  managers: countQuery(`select count(*) from staging.managers where run_id = '${runId}';`),
  teams: countQuery(`select count(*) from staging.teams where run_id = '${runId}';`),
  players: countQuery(`select count(*) from staging.players where run_id = '${runId}';`),
  matches: countQuery(`select count(*) from staging.matches where run_id = '${runId}';`),
  lineups: countQuery(`select count(*) from staging.lineups where run_id = '${runId}';`),
  playerMatchStats: countQuery(
    `select count(*) from staging.player_match_stats where run_id = '${runId}';`
  ),
  teamMatchStats: countQuery(
    `select count(*) from staging.team_match_stats where run_id = '${runId}';`
  ),
  events: countQuery(`select count(*) from staging.events where run_id = '${runId}';`),
  playerCareerTeams: countQuery(
    `select count(*) from staging.player_career_teams where run_id = '${runId}';`
  )
};

const checks = {
  invalidMatchTeams: countQuery(`
    select count(*)
    from core.matches
    where home_team not in (select id from core.teams)
       or away_team not in (select id from core.teams);
  `),
  invalidLineupContexts: countQuery(`
    select count(*)
    from core.lineups l
    left join core.matches m on m.id = l.match
    left join core.teams t on t.id = l.team
    left join core.players p on p.id = l.player
    where m.id is null or t.id is null or p.id is null;
  `),
  invalidPlayerStatContexts: countQuery(`
    select count(*)
    from core.player_match_stats s
    left join core.matches m on m.id = s.match
    left join core.teams t on t.id = s.team
    left join core.players p on p.id = s.player
    where m.id is null or t.id is null or p.id is null;
  `),
  invalidEventMatchRefs: countQuery(`
    select count(*)
    from core.events e
    left join core.matches m on m.id = e.match
    where m.id is null;
  `),
  invalidEventTeamRefs: countQuery(`
    select count(*)
    from core.events e
    left join core.teams t on t.id = e.team
    where e.team is not null and t.id is null;
  `),
  invalidEventPlayerRefs: countQuery(`
    select count(*)
    from core.events e
    left join core.players p on p.id = e.player
    where e.player is not null and p.id is null;
  `),
  invalidRelatedPlayerRefs: countQuery(`
    select count(*)
    from core.events e
    left join core.players p on p.id = e.related_player
    where e.related_player is not null and p.id is null;
  `),
  invalidManagerRefs: countQuery(`
    select count(*)
    from core.events e
    left join core.managers m on m.id = e.manager
    where e.manager is not null and m.id is null;
  `),
  duplicateCountrySourceRef: countQuery(`
    select count(*)
    from (
      select source_ref
      from core.countries
      group by source_ref
      having count(*) > 1
    ) duplicates;
  `),
  duplicateCitySourceRef: countQuery(`
    select count(*)
    from (
      select source_ref
      from core.cities
      group by source_ref
      having count(*) > 1
    ) duplicates;
  `),
  duplicateTeamSourceRef: countQuery(`
    select count(*)
    from (
      select source_ref
      from core.teams
      group by source_ref
      having count(*) > 1
    ) duplicates;
  `),
  duplicatePlayerSourceRef: countQuery(`
    select count(*)
    from (
      select source_ref
      from core.players
      group by source_ref
      having count(*) > 1
    ) duplicates;
  `),
  duplicateMatchSourceRef: countQuery(`
    select count(*)
    from (
      select source_ref
      from core.matches
      group by source_ref
      having count(*) > 1
    ) duplicates;
  `),
  invalidStadiumCapacity: countQuery(`
    select count(*)
    from core.stadiums
    where capacity is not null and capacity < 0;
  `),
  invalidStadiumCoordinates: countQuery(`
    select count(*)
    from core.stadiums
    where (latitude is not null and (latitude < -90 or latitude > 90))
       or (longitude is not null and (longitude < -180 or longitude > 180));
  `),
  invalidMatchScores: countQuery(`
    select count(*)
    from core.matches
    where coalesce(home_score_period_1, 0) < 0
       or coalesce(home_score_period_2, 0) < 0
       or coalesce(home_score_normaltime, 0) < 0
       or coalesce(home_score_extra_1, 0) < 0
       or coalesce(home_score_extra_2, 0) < 0
       or coalesce(home_score_overtime, 0) < 0
       or coalesce(home_score_penalties, 0) < 0
       or coalesce(away_score_period_1, 0) < 0
       or coalesce(away_score_period_2, 0) < 0
       or coalesce(away_score_normaltime, 0) < 0
       or coalesce(away_score_extra_1, 0) < 0
       or coalesce(away_score_extra_2, 0) < 0
       or coalesce(away_score_overtime, 0) < 0
       or coalesce(away_score_penalties, 0) < 0;
  `),
  invalidLineupMetrics: countQuery(`
    select count(*)
    from core.lineups
    where (jersey_number is not null and jersey_number < 0)
       or (minutes_played is not null and (minutes_played < 0 or minutes_played > 130))
       or (rating is not null and (rating < 0 or rating > 10));
  `)
};

const report = `# Relatorio de Validacao da Fase 1

## Execucao

- run_id: \`${runId}\`
- status: \`${status}\`
- started_at: \`${startedAt}\`
- finished_at: \`${finishedAt || "n/d"}\`
- rows_inserted: \`${rowsInserted}\`

## Contagens staging vs core

| Entidade | Staging | Core |
| --- | ---: | ---: |
| countries | ${stagingCounts.countries} | ${coreCounts.countries} |
| states | 0 | ${coreCounts.states} |
| cities | ${stagingCounts.cities} | ${coreCounts.cities} |
| stadiums | ${stagingCounts.stadiums} | ${coreCounts.stadiums} |
| tournaments | ${stagingCounts.tournaments} | ${coreCounts.tournaments} |
| seasons | ${stagingCounts.seasons} | ${coreCounts.seasons} |
| referees | ${stagingCounts.referees} | ${coreCounts.referees} |
| managers | ${stagingCounts.managers} | ${coreCounts.managers} |
| teams | ${stagingCounts.teams} | ${coreCounts.teams} |
| players | ${stagingCounts.players} | ${coreCounts.players} |
| matches | ${stagingCounts.matches} | ${coreCounts.matches} |
| lineups | ${stagingCounts.lineups} | ${coreCounts.lineups} |
| player_match_stats | ${stagingCounts.playerMatchStats} | ${coreCounts.playerMatchStats} |
| team_match_stats | ${stagingCounts.teamMatchStats} | ${coreCounts.teamMatchStats} |
| events | ${stagingCounts.events} | ${coreCounts.events} |
| player_career_teams | ${stagingCounts.playerCareerTeams} | ${coreCounts.playerCareerTeams} |

## Checks principais

| Check | Resultado |
| --- | ---: |
| matches com home/away invalidos | ${checks.invalidMatchTeams} |
| lineups sem match/team/player | ${checks.invalidLineupContexts} |
| player_match_stats sem contexto | ${checks.invalidPlayerStatContexts} |
| events sem match valido | ${checks.invalidEventMatchRefs} |
| events com team invalido | ${checks.invalidEventTeamRefs} |
| events com player invalido | ${checks.invalidEventPlayerRefs} |
| events com related_player invalido | ${checks.invalidRelatedPlayerRefs} |
| events com manager invalido | ${checks.invalidManagerRefs} |
| countries com source_ref duplicado | ${checks.duplicateCountrySourceRef} |
| cities com source_ref duplicado | ${checks.duplicateCitySourceRef} |
| teams com source_ref duplicado | ${checks.duplicateTeamSourceRef} |
| players com source_ref duplicado | ${checks.duplicatePlayerSourceRef} |
| matches com source_ref duplicado | ${checks.duplicateMatchSourceRef} |
| stadiums com capacity invalida | ${checks.invalidStadiumCapacity} |
| stadiums com coordenadas invalidas | ${checks.invalidStadiumCoordinates} |
| matches com scores invalidos | ${checks.invalidMatchScores} |
| lineups com metricas invalidas | ${checks.invalidLineupMetrics} |

## Observacoes

- \`core.states\` permanece vazio na Fase 1, conforme esperado, porque nao existe fonte CSV atual para esse cadastro.
- O bootstrap passou por \`staging.*\` antes de promover para \`core.*\`.
- \`team_match_stats\` foi carregado do CSV atual nesta fase, conforme a decisao baseline da V1.
- A validacao agora cobre unicidade de \`source_ref\` nas entidades principais e checks semanticos basicos de estadio, placar e lineup.
`;

const outputPath = resolve(
  process.cwd(),
  "docs/phase-1-bootstrap-validation-report.md"
);

writeFileSync(outputPath, report, "utf8");

process.stdout.write(`Relatorio de validacao gerado em ${outputPath}\n`);
