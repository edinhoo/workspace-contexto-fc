import { parseTimestampArg, upsertPlannedMatchSchedule } from "./_shared.mjs";

const usage = () => {
  process.stdout.write(
    [
      "Uso:",
      "  node scripts/db/automation/plan-match.mjs --event-id=15237889 --scheduled-at=2026-04-10T16:00:00-03:00",
      "Opcoes:",
      "  --provider=sofascore   Provedor da partida (padrao: sofascore)",
      "  --event-id=<id>        ID da partida no provedor",
      "  --scheduled-at=<iso>   Horario marcado da partida em formato ISO-8601"
    ].join("\n") + "\n"
  );
};

const parseArgs = (argv) => {
  let provider = "sofascore";
  let providerEventId = "";
  let scheduledAtRaw = "";

  for (const argument of argv) {
    if (argument.startsWith("--provider=")) {
      provider = argument.slice("--provider=".length).trim();
      continue;
    }

    if (argument.startsWith("--event-id=")) {
      providerEventId = argument.slice("--event-id=".length).trim();
      continue;
    }

    if (argument.startsWith("--scheduled-at=")) {
      scheduledAtRaw = argument.slice("--scheduled-at=".length).trim();
      continue;
    }
  }

  if (!providerEventId || !scheduledAtRaw) {
    usage();
    throw new Error("Informe --event-id e --scheduled-at.");
  }

  return {
    provider,
    providerEventId,
    scheduledAt: parseTimestampArg(scheduledAtRaw)
  };
};

const cliOptions = parseArgs(process.argv.slice(2));

const result = upsertPlannedMatchSchedule({
  provider: cliOptions.provider,
  providerEventId: cliOptions.providerEventId,
  scheduledAt: cliOptions.scheduledAt,
  triggeredBy: "cli"
});

process.stdout.write(`Agendamento ${result.action} com sucesso.\n`);
process.stdout.write(`planned_match_id=${result.plannedMatch.id}\n`);
process.stdout.write(`provider=${result.plannedMatch.provider}\n`);
process.stdout.write(`provider_event_id=${result.plannedMatch.providerEventId}\n`);
process.stdout.write(`scheduled_at=${result.plannedMatch.scheduledAt}\n`);

for (const scheduledScrape of result.scheduledScrapes) {
  process.stdout.write(
    `scheduled_scrape pass=${scheduledScrape.passNumber} id=${scheduledScrape.id} status=${scheduledScrape.status} scheduled_for=${scheduledScrape.scheduledFor}\n`
  );
}
