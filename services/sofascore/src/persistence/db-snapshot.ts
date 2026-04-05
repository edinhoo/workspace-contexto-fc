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

export const saveSnapshotToDatabase = async (snapshot: SofascoreSnapshot) => {
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

  const { runId, ingestedAt } = loadRunToStagingFromEntityRows({
    entityRowsByName: toEntityRows(snapshot),
    source: "sofascore"
  });

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
};
