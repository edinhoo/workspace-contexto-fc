import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createTempSqlFile, runPsqlFile } from "./_shared.mjs";
import { buildLoadRunSql } from "./pipeline/load-staging.mjs";
import { buildPromotionSql, buildRunDetailsSummaryQuery } from "./pipeline/promotion.mjs";
import { buildValidationSql } from "./pipeline/validation.mjs";
import { validateSourceFiles } from "./pipeline/source-data.mjs";

const runId = `phase2-dry-run-${randomUUID()}`;
const ingestedAt = new Date().toISOString();

validateSourceFiles();

const sql = `
begin;

${buildLoadRunSql({
  runId,
  ingestedAt,
  status: "dry-run",
  wrapInTransaction: false
})}

${buildValidationSql(runId)}

${buildPromotionSql(runId, {
  finalStatus: "dry-run",
  wrapInTransaction: false
})}

select '__RUN__', run_id, status, coalesce(rows_inserted::text, '0'), coalesce(rows_updated::text, '0'), coalesce(rows_skipped::text, '0')
from ops.ingestion_runs
where run_id = '${runId}';

select '__DETAIL__', entity, rows_seen::text, rows_valid::text, rows_invalid::text, rows_inserted::text, rows_updated::text, rows_skipped::text
from ops.ingestion_run_details
where run_id = '${runId}'
order by entity;

rollback;
`;

const sqlFile = createTempSqlFile("contexto-fc-phase2-dry-run", sql);

try {
  const output = runPsqlFile(sqlFile.filePath, { tuplesOnly: true });
  const lines = output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));

  const runRow = lines.find((parts) => parts[0] === "__RUN__");
  const detailRows = lines.filter((parts) => parts[0] === "__DETAIL__");

  const report = `# Relatorio de Dry-Run da Fase 2

## Execucao

- run_id: \`${runRow?.[1] ?? runId}\`
- status: \`${runRow?.[2] ?? "dry-run"}\`
- rows_inserted: \`${runRow?.[3] ?? "0"}\`
- rows_updated: \`${runRow?.[4] ?? "0"}\`
- rows_skipped: \`${runRow?.[5] ?? "0"}\`

## Detalhes por entidade

| Entidade | Seen | Valid | Invalid | Inserted | Updated | Skipped |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${detailRows
  .map(
    (parts) =>
      `| ${parts[1]} | ${parts[2]} | ${parts[3]} | ${parts[4]} | ${parts[5]} | ${parts[6]} | ${parts[7]} |`
  )
  .join("\n")}

## Observacoes

- este relatorio foi gerado com \`rollback\` explicito ao final da transacao
- \`core.*\` nao foi alterado por esta execucao
`;

  const outputPath = resolve(
    process.cwd(),
    "docs/phase-2-dry-run-report.md"
  );

  writeFileSync(outputPath, report, "utf8");
  process.stdout.write(`Dry-run da Fase 2 concluido com sucesso. relatorio=${outputPath}\n`);
} finally {
  sqlFile.cleanup();
}
