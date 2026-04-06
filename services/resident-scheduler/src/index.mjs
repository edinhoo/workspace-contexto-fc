/* global process, setTimeout */

import { closeDbPool } from "../../../scripts/db/node-db.mjs";
import { processNextScheduledScrape } from "../../../scripts/db/automation/runtime.mjs";

import { getResidentSchedulerConfig } from "./config.mjs";

const timestamp = () => new Date().toISOString();

const log = (message) => {
  process.stdout.write(`[resident-scheduler] ${timestamp()} ${message}\n`);
};

const wait = (durationMs) =>
  new Promise((resolve) => {
    const timeout = setTimeout(resolve, durationMs);
    timeout.unref?.();
  });

const config = getResidentSchedulerConfig();

let shouldStop = false;
let activeRun = false;
let idleCycles = 0;

const requestShutdown = (signal) => {
  if (shouldStop) {
    return;
  }

  shouldStop = true;
  log(`encerramento solicitado. signal=${signal} ativo=${activeRun ? "sim" : "nao"}`);
};

process.on("SIGINT", () => requestShutdown("SIGINT"));
process.on("SIGTERM", () => requestShutdown("SIGTERM"));

log(
  `processo iniciado. poll_interval_ms=${config.pollIntervalMs} idle_log_every=${config.idleLogEvery} triggered_by=${config.triggeredBy}`,
);

try {
  while (!shouldStop) {
    activeRun = true;

    try {
      const result = await processNextScheduledScrape({
        triggeredBy: config.triggeredBy,
      });

      activeRun = false;

      if (!result.processed) {
        idleCycles += 1;

        if (idleCycles === 1 || idleCycles % config.idleLogEvery === 0) {
          log(`idle. ciclos_sem_item=${idleCycles}`);
        }

        if (!shouldStop) {
          await wait(config.pollIntervalMs);
        }

        continue;
      }

      idleCycles = 0;

      if (result.success) {
        log(
          `item concluido. scheduled_scrape_id=${result.scheduledScrapeId} pass=${result.passNumber} run_id=${result.runId ?? "n/a"} core_match_id=${result.coreMatchId ?? "n/a"}`,
        );
      } else {
        log(
          `item falhou. scheduled_scrape_id=${result.scheduledScrapeId} pass=${result.passNumber} next_status=${result.nextStatus} attempt_count=${result.attemptCount} run_id=${result.runId ?? "n/a"}`,
        );
      }
    } catch (error) {
      activeRun = false;
      log(
        `falha inesperada no loop. mensagem=${error instanceof Error ? error.message : "unknown_error"}`,
      );

      if (!shouldStop) {
        await wait(config.pollIntervalMs);
      }
    }
  }
} finally {
  await closeDbPool();
  log("processo encerrado.");
}
