import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchEventMetadataByEventId } from "./sofascore-client.js";
import { loadCountries, saveCountries, upsertCountries } from "./storage/countries-csv.js";
import {
  loadTournaments,
  relinkTournamentCountries,
  saveTournaments,
  upsertTournaments
} from "./storage/tournaments-csv.js";
import type { CountryRecord, TournamentRecord } from "./types.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const countriesCsvPath = resolve(currentDir, "../data/countries.csv");
const tournamentsCsvPath = resolve(currentDir, "../data/tournaments.csv");

const eventIds = process.argv.slice(2);

if (eventIds.length === 0) {
  console.error("Informe ao menos um event id. Exemplo: pnpm scrape:sofascore 123 456 789");
  process.exit(1);
}

const run = async (): Promise<void> => {
  await mkdir(dirname(countriesCsvPath), { recursive: true });

  const existingCountries = await loadCountries(countriesCsvPath);
  const existingTournaments = await loadTournaments(tournamentsCsvPath);
  const fetchedCountries = await Promise.all(
    eventIds.map(async (eventId) => {
      try {
        return await fetchEventMetadataByEventId(eventId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`Falha ao processar o evento ${eventId}: ${message}`);
        return null;
      }
    })
  );

  const validCountries = fetchedCountries
    .map((eventMetadata) => eventMetadata?.country ?? null)
    .filter((country): country is CountryRecord => country !== null);
  const validTournaments = fetchedCountries
    .map((eventMetadata) => eventMetadata?.tournament ?? null)
    .filter((tournament): tournament is TournamentRecord => tournament !== null);

  const mergedCountries = upsertCountries(existingCountries, validCountries);
  const mergedTournaments = upsertTournaments(
    existingTournaments,
    validTournaments.map((tournament) => linkTournamentCountry(tournament, mergedCountries))
  );
  const normalizedTournaments = relinkTournamentCountries(mergedTournaments, mergedCountries);

  await saveCountries(countriesCsvPath, mergedCountries);
  await saveTournaments(tournamentsCsvPath, normalizedTournaments);

  console.log(
    `countries.csv atualizado com ${validCountries.length} item(ns) processado(s).`
  );
  console.log(
    `tournaments.csv atualizado com ${validTournaments.length} item(ns) processado(s).`
  );
};

const linkTournamentCountry = (
  tournament: TournamentRecord,
  countries: CountryRecord[]
): TournamentRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === tournament.country || country.slug === tournament.country
  );

  if (!linkedCountry) {
    return tournament;
  }

  return {
    ...tournament,
    country: linkedCountry.id
  };
};

await run();
