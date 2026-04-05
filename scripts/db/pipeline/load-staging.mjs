import { randomUUID } from "node:crypto";

import { createTempSqlFile, runPsqlFile } from "../_shared.mjs";
import { ENTITY_CONFIGS } from "./entities.mjs";
import { getSourceFilePath, parseCsv, sqlLiteral, validateSourceFiles } from "./source-data.mjs";

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

const buildTabularInsert = ({ table, headers, rows, runId, ingestedAt }) => {
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

  return `insert into ${table} (${columns.join(", ")}) values\n${values};\n`;
};

const buildPlayerStatsInsert = ({ rows, runId, ingestedAt, table }) => {
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

  return `insert into ${table} (${columns.join(", ")}) values\n${values};\n`;
};

const buildTeamStatsInsert = ({ rows, runId, ingestedAt, table }) => {
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

  return `insert into ${table} (${columns.join(", ")}) values\n${values};\n`;
};

const buildStagingInserts = (runId, ingestedAt) =>
  ENTITY_CONFIGS.map((config) => {
    const filePath = getSourceFilePath(config.file);
    const { headers, rows } = parseCsv(filePath);

    if (config.mode === "tabular") {
      return buildTabularInsert({
        table: config.stagingTable,
        headers,
        rows,
        runId,
        ingestedAt
      });
    }

    if (config.mode === "player-stats") {
      return buildPlayerStatsInsert({
        table: config.stagingTable,
        rows,
        runId,
        ingestedAt
      });
    }

    return buildTeamStatsInsert({
      table: config.stagingTable,
      rows,
      runId,
      ingestedAt
    });
  })
    .filter(Boolean)
    .join("\n");

export const buildLoadRunSql = ({
  runId,
  ingestedAt,
  source = "sofascore",
  status = "staged",
  wrapInTransaction = true
}) => `
${wrapInTransaction ? "begin;" : ""}

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

insert into ops.ingestion_runs (run_id, source, started_at, status)
values (${sqlLiteral(runId)}, ${sqlLiteral(source)}, ${sqlLiteral(ingestedAt)}, ${sqlLiteral(status)});

${buildStagingInserts(runId, ingestedAt)}

${wrapInTransaction ? "commit;" : ""}
`;

export const loadRunToStaging = ({ runId = `phase2-${randomUUID()}`, source = "sofascore" } = {}) => {
  validateSourceFiles();

  const ingestedAt = new Date().toISOString();
  const sqlFile = createTempSqlFile(
    "contexto-fc-phase2-load",
    buildLoadRunSql({ runId, ingestedAt, source })
  );

  try {
    runPsqlFile(sqlFile.filePath);
  } finally {
    sqlFile.cleanup();
  }

  return { runId, ingestedAt };
};
