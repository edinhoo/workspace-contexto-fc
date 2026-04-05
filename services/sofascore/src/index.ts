import { buildNormalizedSnapshot } from "./build-normalized-snapshot.js";
import { loadCoreDbSnapshot } from "./persistence/core-db-snapshot.js";
import { loadCsvSnapshot, saveCsvSnapshot } from "./persistence/csv-snapshot.js";
import { saveSnapshotToDatabase } from "./persistence/db-snapshot.js";

type ScrapeTarget = "db" | "csv" | "both";

type CliOptions = {
  eventIds: string[];
  target: ScrapeTarget;
};

const cliOptions = parseCliOptions(process.argv.slice(2));

if (cliOptions.eventIds.length === 0) {
  console.error(
    "Informe ao menos um event id. Exemplo: pnpm scrape:sofascore --target=db 123 456 789"
  );
  process.exit(1);
}

const run = async (): Promise<void> => {
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
};

await run();

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
