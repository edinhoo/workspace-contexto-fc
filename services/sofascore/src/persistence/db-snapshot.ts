import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import type { SofascoreSnapshot } from "../snapshot.js";
import { findRepoRoot } from "../repo-root.js";

const hasInvalidEntities = (summary: Array<{ rowsInvalid: number }>) =>
  summary.some((item) => item.rowsInvalid > 0);

const toEntityRows = (snapshot: SofascoreSnapshot) => ({
  countries: snapshot.countries,
  cities: snapshot.cities,
  stadiums: snapshot.stadiums,
  tournaments: snapshot.tournaments,
  seasons: snapshot.seasons,
  referees: snapshot.referees,
  managers: snapshot.managers,
  teams: snapshot.teams,
  players: snapshot.players,
  matches: snapshot.matches,
  lineups: snapshot.lineups,
  player_match_stats: snapshot.playerMatchStats,
  team_match_stats: snapshot.teamMatchStats,
  events: snapshot.events,
  player_career_teams: snapshot.playerCareerTeams
});

const importModule = async <T>(relativePathFromRoot: string): Promise<T> => {
  const repoRoot = findRepoRoot();
  const moduleUrl = pathToFileURL(resolve(repoRoot, relativePathFromRoot)).href;

  return import(moduleUrl) as Promise<T>;
};

const assertNoDuplicateIdentityInBatch = async (
  entityRowsByName: Record<string, Record<string, unknown>[]>
) => {
  const { ENTITY_CONFIGS } = await importModule<{
    ENTITY_CONFIGS: Array<{ entity: string; naturalKey: string[] }>;
  }>("scripts/db/pipeline/entities.mjs");

  const problems: string[] = [];

  for (const config of ENTITY_CONFIGS) {
    const rows = entityRowsByName[config.entity] ?? [];
    const seenKeys = new Map<string, number>();

    for (const row of rows) {
      const compositeKey = config.naturalKey
        .map((field) => String(row[field] ?? "").trim())
        .join("|");

      if (!compositeKey || compositeKey.split("|").every((part) => part.length === 0)) {
        continue;
      }

      const nextCount = (seenKeys.get(compositeKey) ?? 0) + 1;
      seenKeys.set(compositeKey, nextCount);
    }

    for (const [compositeKey, count] of seenKeys.entries()) {
      if (count < 2) {
        continue;
      }

      problems.push(
        `${config.entity}: identidade duplicada para [${config.naturalKey.join(", ")}] => ${compositeKey}`
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `O lote do scraper contem duplicidade de identidade antes da promocao:\n- ${problems.join("\n- ")}`
    );
  }
};

export const saveSnapshotToDatabase = async (snapshot: SofascoreSnapshot) => {
  const repoRoot = findRepoRoot();
  const originalCwd = process.cwd();
  const [{ loadRunToStagingFromEntityRows }, { validateRun, getValidationSummary }, { promoteRun }, { runPsqlQuery }] =
    await Promise.all([
      importModule<{
        loadRunToStagingFromEntityRows: (options: {
          entityRowsByName: Record<string, Record<string, unknown>[]>;
          source?: string;
        }) => { runId: string; ingestedAt: string };
      }>("scripts/db/pipeline/load-staging.mjs"),
      importModule<{
        validateRun: (runId: string) => void;
        getValidationSummary: (
          runId: string
        ) => Array<{ entity: string; rowsInvalid: number }>;
      }>("scripts/db/pipeline/validation.mjs"),
      importModule<{ promoteRun: (runId: string) => void }>(
        "scripts/db/pipeline/promotion.mjs"
      ),
      importModule<{ runPsqlQuery: (sql: string) => string }>("scripts/db/_shared.mjs")
    ]);

  const entityRowsByName = toEntityRows(snapshot);

  await assertNoDuplicateIdentityInBatch(entityRowsByName);

  process.chdir(repoRoot);

  try {
    const { runId, ingestedAt } = loadRunToStagingFromEntityRows({
      entityRowsByName,
      source: "sofascore"
    });

    try {
      validateRun(runId);

      const summary = getValidationSummary(runId);

      if (hasInvalidEntities(summary)) {
        const invalidEntities = summary.filter((item) => item.rowsInvalid > 0);
        const escapedErrors = JSON.stringify(invalidEntities).replaceAll("'", "''");

        runPsqlQuery(`
          update ops.ingestion_runs
          set
            status = 'failed',
            finished_at = now(),
            validation_errors = '${escapedErrors}'::jsonb
          where run_id = '${runId}';
        `);

        throw new Error(
          `A ingestao do scraper foi bloqueada por entidades invalidas: ${invalidEntities
            .map((item) => `${item.entity}=${item.rowsInvalid}`)
            .join(", ")}`
        );
      }

      promoteRun(runId);

      return {
        runId,
        ingestedAt,
        summary
      };
    } catch (error) {
      const errorPayload = JSON.stringify([
        {
          stage: "scraper-db-save",
          message: error instanceof Error ? error.message : String(error)
        }
      ]).replaceAll("'", "''");

      runPsqlQuery(`
        update ops.ingestion_runs
        set
          status = 'failed',
          finished_at = now(),
          validation_errors = '${errorPayload}'::jsonb
        where run_id = '${runId}'
          and status <> 'completed';
      `);

      throw error;
    }
  } finally {
    process.chdir(originalCwd);
  }
};
