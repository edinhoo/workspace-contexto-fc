import { runPsqlQuery } from "./_shared.mjs";
import { loadRunToStaging } from "./pipeline/load-staging.mjs";
import { promoteRun } from "./pipeline/promotion.mjs";
import { getValidationSummary, validateRun } from "./pipeline/validation.mjs";

const hasInvalidEntities = (summary) => summary.some((item) => item.rowsInvalid > 0);

const markRunFailed = (runId, errors) => {
  const escapedErrors = JSON.stringify(errors).replaceAll("'", "''");

  runPsqlQuery(`
    update ops.ingestion_runs
    set
      status = 'failed',
      finished_at = now(),
      validation_errors = '${escapedErrors}'::jsonb
    where run_id = '${runId}';
  `);
};

const { runId } = loadRunToStaging();

validateRun(runId);

const summary = getValidationSummary(runId);

if (hasInvalidEntities(summary)) {
  const invalidEntities = summary.filter((item) => item.rowsInvalid > 0);
  markRunFailed(runId, invalidEntities);

  throw new Error(
    `A ingestao da Fase 2 foi bloqueada por entidades invalidas: ${invalidEntities
      .map((item) => `${item.entity}=${item.rowsInvalid}`)
      .join(", ")}`
  );
}

promoteRun(runId);

process.stdout.write(`Ingestao da Fase 2 concluida com sucesso. run_id=${runId}\n`);
