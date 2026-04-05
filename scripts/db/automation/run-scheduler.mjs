import { spawnSync } from "node:child_process";

import {
  completeScheduledScrape,
  failScheduledScrape,
  getNextDueScheduledScrape,
  reserveScheduledScrape
} from "./_shared.mjs";

const SCRAPE_RESULT_PREFIX = "SCRAPE_RESULT ";

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

const extractStructuredResult = (output) => {
  const line = output
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reverse()
    .find((entry) => entry.startsWith(SCRAPE_RESULT_PREFIX));

  if (!line) {
    return null;
  }

  try {
    return JSON.parse(line.slice(SCRAPE_RESULT_PREFIX.length));
  } catch {
    return null;
  }
};

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

  const scrapeResult = runScrapeForEvent(nextScheduledScrape.providerEventId);
  const combinedOutput = [scrapeResult.stdout, scrapeResult.stderr].filter(Boolean).join("\n");
  const structuredResult = extractStructuredResult(scrapeResult.stdout ?? "");
  const runId = structuredResult?.runId ?? null;

  if (scrapeResult.status === 0 && structuredResult?.status === "success") {
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

  const retryable = structuredResult?.errorKind !== "validation_failure";
  const failure = failScheduledScrape({
    scheduledScrapeId: nextScheduledScrape.id,
    retryable,
    errorMessage: shortenMessage(
      structuredResult?.errorMessage ||
        combinedOutput ||
        "Falha desconhecida no scheduler"
    )
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
