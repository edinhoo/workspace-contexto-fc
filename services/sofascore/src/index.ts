import { buildNormalizedSnapshot } from "./build-normalized-snapshot.js";
import { loadCoreDbSnapshot } from "./persistence/core-db-snapshot.js";
import { loadCsvSnapshot, saveCsvSnapshot } from "./persistence/csv-snapshot.js";
import { saveSnapshotToDatabase } from "./persistence/db-snapshot.js";

type ScrapeTarget = "db" | "csv" | "both";

type CliOptions = {
  eventIds: string[];
  target: ScrapeTarget;
};

type ProcessedCounts = {
  countries: number;
  cities: number;
  events: number;
  stadiums: number;
  teams: number;
  managers: number;
  lineups: number;
  matches: number;
  playerMatchStats: number;
  playerCareerTeams: number;
  teamMatchStats: number;
  players: number;
  referees: number;
  tournaments: number;
  seasons: number;
};

type StructuredScrapeResult =
  | {
      status: "success";
      target: ScrapeTarget;
      eventIds: string[];
      runId: string | null;
      validationStatus: "valid" | "not_applicable";
      processedCounts: ProcessedCounts;
    }
  | {
      status: "failure";
      target: ScrapeTarget;
      eventIds: string[];
      runId: null;
      validationStatus: "invalid" | "unknown";
      errorKind: "validation_failure" | "runtime_error";
      errorMessage: string;
    };

const cliOptions = parseCliOptions(process.argv.slice(2));
const STRUCTURED_RESULT_PREFIX = "SCRAPE_RESULT ";

if (cliOptions.eventIds.length === 0) {
  console.error(
    "Informe ao menos um event id. Exemplo: pnpm scrape:sofascore --target=db 123 456 789"
  );
  process.exit(1);
}

const isValidationFailure = (message: string): boolean =>
  message.includes("bloqueada por entidades invalidas");

const emitStructuredResult = (payload: StructuredScrapeResult): void => {
  console.log(`${STRUCTURED_RESULT_PREFIX}${JSON.stringify(payload)}`);
};

const run = async (): Promise<{ processedCounts: ProcessedCounts; persistedRunId: string | null }> => {
  const existingSnapshot =
    cliOptions.target === "csv" ? await loadCsvSnapshot() : loadCoreDbSnapshot();

  const { snapshot, processedCounts } = await buildNormalizedSnapshot(
    cliOptions.eventIds,
    existingSnapshot
  );

  if (cliOptions.target === "csv" || cliOptions.target === "both") {
    await saveCsvSnapshot(snapshot);
  }

  let persistedRunId: string | null = null;

  if (cliOptions.target === "db" || cliOptions.target === "both") {
    const persisted = await saveSnapshotToDatabase(snapshot);
    persistedRunId = persisted.runId;
  }

  console.log(`Target de persistencia: ${cliOptions.target}`);

  if (persistedRunId) {
    console.log(`Run do banco concluido com sucesso: ${persistedRunId}`);
  }

  console.log(`countries processados: ${processedCounts.countries}`);
  console.log(`cities processadas: ${processedCounts.cities}`);
  console.log(`events processados: ${processedCounts.events}`);
  console.log(`stadiums processados: ${processedCounts.stadiums}`);
  console.log(`teams processados: ${processedCounts.teams}`);
  console.log(`managers processados: ${processedCounts.managers}`);
  console.log(`lineups processados: ${processedCounts.lineups}`);
  console.log(`matches processados: ${processedCounts.matches}`);
  console.log(`player-match-stats processados: ${processedCounts.playerMatchStats}`);
  console.log(`player-career-teams processados: ${processedCounts.playerCareerTeams}`);
  console.log(`team-match-stats processados: ${processedCounts.teamMatchStats}`);
  console.log(`players processados: ${processedCounts.players}`);
  console.log(`referees processados: ${processedCounts.referees}`);
  console.log(`tournaments processados: ${processedCounts.tournaments}`);
  console.log(`seasons processadas: ${processedCounts.seasons}`);

  return {
    processedCounts,
    persistedRunId
  };
};

try {
  const { processedCounts, persistedRunId } = await run();

  emitStructuredResult({
    status: "success",
    target: cliOptions.target,
    eventIds: cliOptions.eventIds,
    runId: persistedRunId,
    validationStatus: cliOptions.target === "csv" ? "not_applicable" : "valid",
    processedCounts
  });
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(errorMessage);

  emitStructuredResult({
    status: "failure",
    target: cliOptions.target,
    eventIds: cliOptions.eventIds,
    runId: null,
    validationStatus: isValidationFailure(errorMessage) ? "invalid" : "unknown",
    errorKind: isValidationFailure(errorMessage) ? "validation_failure" : "runtime_error",
    errorMessage
  });

  process.exitCode = 1;
}

function parseCliOptions(argv: string[]): CliOptions {
  let target: ScrapeTarget = "db";
  const eventIds: string[] = [];

  for (const argument of argv) {
    if (argument.startsWith("--target=")) {
      const rawTarget = argument.replace("--target=", "").trim();

      if (rawTarget === "db" || rawTarget === "csv" || rawTarget === "both") {
        target = rawTarget;
        continue;
      }

      throw new Error(`Target invalido: ${rawTarget}`);
    }

    eventIds.push(argument);
  }

  return { eventIds, target };
}
