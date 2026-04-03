import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchCountryByEventId } from "./sofascore-client.js";
import { loadCountries, saveCountries, upsertCountries } from "./storage/countries-csv.js";
import type { CountryRecord } from "./types.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const countriesCsvPath = resolve(currentDir, "../data/countries.csv");

const eventIds = process.argv.slice(2);

if (eventIds.length === 0) {
  console.error("Informe ao menos um event id. Exemplo: pnpm scrape:sofascore 123 456 789");
  process.exit(1);
}

const run = async (): Promise<void> => {
  await mkdir(dirname(countriesCsvPath), { recursive: true });

  const existingCountries = await loadCountries(countriesCsvPath);
  const fetchedCountries = await Promise.all(
    eventIds.map(async (eventId) => {
      try {
        return await fetchCountryByEventId(eventId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`Falha ao processar o evento ${eventId}: ${message}`);
        return null;
      }
    })
  );

  const validCountries = fetchedCountries.filter(
    (country): country is CountryRecord => country !== null
  );

  const mergedCountries = upsertCountries(existingCountries, validCountries);
  await saveCountries(countriesCsvPath, mergedCountries);

  console.log(`countries.csv atualizado com ${validCountries.length} item(ns) processado(s).`);
};

await run();
