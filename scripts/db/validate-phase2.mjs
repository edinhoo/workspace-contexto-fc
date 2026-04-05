import { runPsqlQuery } from "./_shared.mjs";
import { getValidationSummary, validateRun } from "./pipeline/validation.mjs";

const parseRows = (output) =>
  output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));

const runIdArg = process.argv[2]?.trim();

const latestRunRows = parseRows(
  runPsqlQuery(`
    select run_id
    from ops.ingestion_runs
    order by started_at desc
    limit 1;
  `)
);

const runId = runIdArg || latestRunRows[0]?.[0];

if (!runId) {
  throw new Error("Informe um run_id ou gere uma execucao de ingestao antes de validar a Fase 2.");
}

validateRun(runId);

const summary = getValidationSummary(runId);

process.stdout.write(`Validacao da Fase 2 executada para run_id=${runId}\n`);

for (const item of summary) {
  process.stdout.write(
    `- ${item.entity}: seen=${item.rowsSeen} valid=${item.rowsValid} invalid=${item.rowsInvalid} warning_rows=${item.warningRows} warning_entries=${item.warningEntries} status=${item.status}\n`
  );
}
