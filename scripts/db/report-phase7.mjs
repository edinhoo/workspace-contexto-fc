import { runPsqlQuery } from "./_shared.mjs";

const parseRows = (output) =>
  output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));

const parseJson = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

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
  throw new Error("Informe um run_id ou gere uma execucao antes de montar o relatorio da Fase 7.");
}

const runRows = parseRows(
  runPsqlQuery(`
    select
      run_id,
      status,
      coalesce(rows_inserted::text, '0'),
      coalesce(rows_updated::text, '0'),
      coalesce(rows_skipped::text, '0'),
      coalesce(warnings::text, '')
    from ops.ingestion_runs
    where run_id = '${runId}'
    limit 1;
  `)
);

const runRow = runRows[0];

if (!runRow) {
  throw new Error(`run_id nao encontrado: ${runId}`);
}

const detailRows = parseRows(
  runPsqlQuery(`
    select
      entity,
      rows_seen::text,
      rows_valid::text,
      rows_invalid::text,
      rows_inserted::text,
      rows_updated::text,
      rows_skipped::text,
      coalesce(warnings::text, '')
    from ops.ingestion_run_details
    where run_id = '${runId}'
    order by entity;
  `)
);

const runWarnings = parseJson(runRow[5]) ?? [];

process.stdout.write(`Relatorio operacional da Fase 7 para run_id=${runId}\n`);
process.stdout.write(
  `status=${runRow[1]} inserted=${runRow[2]} updated=${runRow[3]} skipped=${runRow[4]}\n`
);

if (runWarnings.length === 0) {
  process.stdout.write("warnings=nenhum\n");
} else {
  process.stdout.write("warnings=\n");

  for (const entry of runWarnings) {
    const warningTypes = Array.isArray(entry.warnings)
      ? entry.warnings
          .map((warning) => `${warning.type}=${warning.count}`)
          .join(", ")
      : "n/a";

    process.stdout.write(`- ${entry.entity}: ${warningTypes}\n`);
  }
}

process.stdout.write("detalhes=\n");

for (const row of detailRows) {
  const warnings = parseJson(row[7]) ?? [];
  const warningsSummary =
    warnings.length === 0
      ? "none"
      : warnings.map((warning) => `${warning.type}=${warning.count}`).join(", ");

  process.stdout.write(
    `- ${row[0]}: seen=${row[1]} valid=${row[2]} invalid=${row[3]} inserted=${row[4]} updated=${row[5]} skipped=${row[6]} warnings=${warningsSummary}\n`
  );
}
