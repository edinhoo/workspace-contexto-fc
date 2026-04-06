import { closeDbPool } from "../node-db.mjs";
import { processNextScheduledScrape } from "./runtime.mjs";

const parseArgs = (argv) => {
  const drain = argv.includes("--drain");
  const maxItemsArgument = argv.find((argument) => argument.startsWith("--max-items="));
  const rawMaxItems = maxItemsArgument?.replace("--max-items=", "").trim();
  const parsedMaxItems = rawMaxItems ? Number.parseInt(rawMaxItems, 10) : Number.NaN;

  return {
    drain,
    maxItems:
      Number.isFinite(parsedMaxItems) && parsedMaxItems > 0
        ? parsedMaxItems
        : drain
          ? 100
          : 1
  };
};

const cliOptions = parseArgs(process.argv.slice(2));

let processedCount = 0;

try {
  do {
    const result = await processNextScheduledScrape({
      triggeredBy: "scheduler",
    });

    if (!result.processed) {
      process.stdout.write("Nenhum scheduled_scrape pendente e vencido para executar.\n");
      break;
    }

    if (result.success) {
      process.stdout.write(
        `scheduled_scrape concluido. id=${result.scheduledScrapeId} pass=${result.passNumber} run_id=${result.runId ?? "n/a"} core_match_id=${result.coreMatchId ?? "n/a"}\n`,
      );
    } else {
      process.stdout.write(
        `scheduled_scrape falhou. id=${result.scheduledScrapeId} pass=${result.passNumber} next_status=${result.nextStatus} attempt_count=${result.attemptCount} run_id=${result.runId ?? "n/a"}\n`,
      );
    }

    processedCount += 1;

    if (!cliOptions.drain || processedCount >= cliOptions.maxItems) {
      break;
    }
  } while (true);

  if (cliOptions.drain && processedCount >= cliOptions.maxItems) {
    process.stdout.write(
      `Scheduler serial atingiu o limite do drain. max_items=${cliOptions.maxItems}\n`
    );
  }

  process.stdout.write(`Scheduler serial finalizado. itens_processados=${processedCount}\n`);
} finally {
  await closeDbPool();
}
