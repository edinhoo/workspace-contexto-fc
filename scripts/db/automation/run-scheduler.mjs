import { spawnSync } from "node:child_process";

import {
  completeScheduledScrape,
  failScheduledScrape,
  getLatestIngestionRunId,
  getNextDueScheduledScrape,
  reserveScheduledScrape
} from "./_shared.mjs";

const SCRAPER_SUCCESS_REGEX = /Run do banco concluido com sucesso:\s*([^\s]+)/;
const VALIDATION_FAILURE_MARKER = "bloqueada por entidades invalidas";

const parseArgs = (argv) => ({
  drain: argv.includes("--drain")
});

const cliOptions = parseArgs(process.argv.slice(2));

const runScrapeForEvent = (providerEventId) =>
  spawnSync(
    "pnpm",
    ["--filter", "@services/sofascore", "scrape", providerEventId],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe"
    }
  );

const extractRunIdFromOutput = (output) => output.match(SCRAPER_SUCCESS_REGEX)?.[1] ?? null;

const shortenMessage = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ")
    .slice(0, 500);

const processNextScheduledScrape = () => {
  const nextScheduledScrape = getNextDueScheduledScrape();

  if (!nextScheduledScrape) {
    process.stdout.write("Nenhum scheduled_scrape pendente e vencido para executar.\n");
    return { processed: false };
  }

  reserveScheduledScrape({
    scheduledScrapeId: nextScheduledScrape.id,
    triggeredBy: "scheduler"
  });

  const previousRunId = getLatestIngestionRunId(nextScheduledScrape.provider);
  const scrapeResult = runScrapeForEvent(nextScheduledScrape.providerEventId);
  const combinedOutput = [scrapeResult.stdout, scrapeResult.stderr].filter(Boolean).join("\n");
  const parsedRunId = extractRunIdFromOutput(combinedOutput);
  const latestRunId = getLatestIngestionRunId(nextScheduledScrape.provider);
  const runId = parsedRunId ?? (latestRunId !== previousRunId ? latestRunId : null);

  if (scrapeResult.status === 0) {
    const completion = completeScheduledScrape({
      scheduledScrapeId: nextScheduledScrape.id,
      runId,
      provider: nextScheduledScrape.provider,
      providerEventId: nextScheduledScrape.providerEventId
    });

    process.stdout.write(
      `scheduled_scrape concluido. id=${nextScheduledScrape.id} pass=${nextScheduledScrape.passNumber} run_id=${runId ?? "n/a"} core_match_id=${completion.coreMatchId ?? "n/a"}\n`
    );

    return {
      processed: true,
      success: true,
      scheduledScrapeId: nextScheduledScrape.id,
      runId
    };
  }

  const retryable = !combinedOutput.includes(VALIDATION_FAILURE_MARKER);
  const failure = failScheduledScrape({
    scheduledScrapeId: nextScheduledScrape.id,
    retryable,
    errorMessage: shortenMessage(combinedOutput || "Falha desconhecida no scheduler")
  });

  process.stdout.write(
    `scheduled_scrape falhou. id=${nextScheduledScrape.id} pass=${nextScheduledScrape.passNumber} next_status=${failure.nextStatus} attempt_count=${failure.attemptCount} run_id=${runId ?? "n/a"}\n`
  );

  return {
    processed: true,
    success: false,
    scheduledScrapeId: nextScheduledScrape.id,
    runId,
    nextStatus: failure.nextStatus
  };
};

let processedCount = 0;

do {
  const result = processNextScheduledScrape();

  if (!result.processed) {
    break;
  }

  processedCount += 1;

  if (!cliOptions.drain) {
    break;
  }
} while (true);

process.stdout.write(`Scheduler serial finalizado. itens_processados=${processedCount}\n`);
