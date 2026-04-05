import { cancelScheduledScrape } from "./_shared.mjs";

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
const scheduledScrape = cancelScheduledScrape({ scheduledScrapeId });

process.stdout.write(
  `scheduled_scrape cancelado. id=${scheduledScrape.id} status=${scheduledScrape.status}\n`
);
