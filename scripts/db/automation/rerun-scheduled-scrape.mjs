import { rerunScheduledScrape } from "./_shared.mjs";

const parseArgs = (argv) => {
  const scheduledScrapeId = argv
    .find((argument) => argument.startsWith("--scheduled-scrape-id="))
    ?.slice("--scheduled-scrape-id=".length)
    .trim();

  if (!scheduledScrapeId) {
    throw new Error("Informe --scheduled-scrape-id.");
  }

  return { scheduledScrapeId };
};

const { scheduledScrapeId } = parseArgs(process.argv.slice(2));
const scheduledScrape = rerunScheduledScrape({ scheduledScrapeId, triggeredBy: "cli" });

process.stdout.write(
  `scheduled_scrape rearmado. id=${scheduledScrape.id} status=${scheduledScrape.status} scheduled_for=${scheduledScrape.scheduledFor}\n`
);
