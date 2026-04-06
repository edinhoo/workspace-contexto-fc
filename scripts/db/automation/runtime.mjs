import { spawn } from "node:child_process";

import {
  claimNextDueScheduledScrape,
  completeScheduledScrape,
  failScheduledScrape,
} from "./_shared.mjs";

const SCRAPE_RESULT_PREFIX = "SCRAPE_RESULT ";

const runScrapeForEvent = (providerEventId, { onChildSpawn } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      ["--filter", "@services/sofascore", "scrape", providerEventId],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });

    child.once("error", reject);
    child.once("spawn", () => {
      onChildSpawn?.(child);
    });
    child.once("close", (code, signal) => {
      resolve({
        status: typeof code === "number" ? code : 1,
        signal,
        stdout,
        stderr,
      });
    });
  });

export const extractStructuredResult = (output) => {
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

export const processNextScheduledScrape = async ({
  triggeredBy,
  onChildSpawn,
} = {}) => {
  const nextScheduledScrape = await claimNextDueScheduledScrape({
    triggeredBy: triggeredBy ?? "scheduler",
  });

  if (!nextScheduledScrape) {
    return { processed: false };
  }

  const scrapeResult = await runScrapeForEvent(nextScheduledScrape.providerEventId, {
    onChildSpawn,
  });
  const combinedOutput = [scrapeResult.stdout, scrapeResult.stderr]
    .filter(Boolean)
    .join("\n");
  const structuredResult = extractStructuredResult(scrapeResult.stdout ?? "");
  const runId = structuredResult?.runId ?? null;

  if (scrapeResult.status === 0 && structuredResult?.status === "success") {
    const completion = completeScheduledScrape({
      scheduledScrapeId: nextScheduledScrape.id,
      runId,
      provider: nextScheduledScrape.provider,
      providerEventId: nextScheduledScrape.providerEventId,
    });

    return {
      processed: true,
      success: true,
      scheduledScrapeId: nextScheduledScrape.id,
      passNumber: nextScheduledScrape.passNumber,
      runId,
      coreMatchId: completion.coreMatchId ?? null,
    };
  }

  const retryable = structuredResult?.errorKind !== "validation_failure";
  const failure = failScheduledScrape({
    scheduledScrapeId: nextScheduledScrape.id,
    retryable,
    errorMessage: shortenMessage(
      structuredResult?.errorMessage ||
        combinedOutput ||
        "Falha desconhecida no scheduler",
    ),
  });

  return {
    processed: true,
    success: false,
    scheduledScrapeId: nextScheduledScrape.id,
    passNumber: nextScheduledScrape.passNumber,
    runId,
    nextStatus: failure.nextStatus,
    attemptCount: failure.attemptCount,
  };
};
