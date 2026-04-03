import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchEventMetadataByEventId } from "./sofascore-client.js";
import { loadCountries, saveCountries, upsertCountries } from "./storage/countries-csv.js";
import { loadCities, relinkCityCountries, saveCities, upsertCities } from "./storage/cities-csv.js";
import {
  loadStadiums,
  relinkStadiumReferences,
  saveStadiums,
  upsertStadiums
} from "./storage/stadiums-csv.js";
import {
  loadTournaments,
  relinkTournamentCountries,
  saveTournaments,
  upsertTournaments
} from "./storage/tournaments-csv.js";
import {
  loadManagers,
  relinkManagerCountries,
  saveManagers,
  upsertManagers
} from "./storage/managers-csv.js";
import {
  loadReferees,
  relinkRefereeCountries,
  saveReferees,
  upsertReferees
} from "./storage/referees-csv.js";
import {
  loadSeasons,
  relinkSeasonTournaments,
  saveSeasons,
  upsertSeasons
} from "./storage/seasons-csv.js";
import type {
  CityRecord,
  CountryRecord,
  ManagerRecord,
  RefereeRecord,
  SeasonRecord,
  StadiumRecord,
  TournamentRecord
} from "./types.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const countriesCsvPath = resolve(currentDir, "../data/countries.csv");
const citiesCsvPath = resolve(currentDir, "../data/cities.csv");
const stadiumsCsvPath = resolve(currentDir, "../data/stadiums.csv");
const managersCsvPath = resolve(currentDir, "../data/managers.csv");
const refereesCsvPath = resolve(currentDir, "../data/referees.csv");
const tournamentsCsvPath = resolve(currentDir, "../data/tournaments.csv");
const seasonsCsvPath = resolve(currentDir, "../data/seasons.csv");

const eventIds = process.argv.slice(2);

if (eventIds.length === 0) {
  console.error("Informe ao menos um event id. Exemplo: pnpm scrape:sofascore 123 456 789");
  process.exit(1);
}

const run = async (): Promise<void> => {
  await mkdir(dirname(countriesCsvPath), { recursive: true });

  const existingCountries = await loadCountries(countriesCsvPath);
  const existingCities = await loadCities(citiesCsvPath);
  const existingStadiums = await loadStadiums(stadiumsCsvPath);
  const existingManagers = await loadManagers(managersCsvPath);
  const existingReferees = await loadReferees(refereesCsvPath);
  const existingTournaments = await loadTournaments(tournamentsCsvPath);
  const existingSeasons = await loadSeasons(seasonsCsvPath);
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
    .flatMap((eventMetadata) => eventMetadata?.countries ?? [])
    .filter((country): country is CountryRecord => country !== null);
  const validTournaments = fetchedCountries
    .map((eventMetadata) => eventMetadata?.tournament ?? null)
    .filter((tournament): tournament is TournamentRecord => tournament !== null);
  const validCities = fetchedCountries
    .map((eventMetadata) => eventMetadata?.city ?? null)
    .filter((city): city is CityRecord => city !== null);
  const validSeasons = fetchedCountries
    .map((eventMetadata) => eventMetadata?.season ?? null)
    .filter((season): season is SeasonRecord => season !== null);
  const validStadiums = fetchedCountries
    .map((eventMetadata) => eventMetadata?.stadium ?? null)
    .filter((stadium): stadium is StadiumRecord => stadium !== null);
  const validReferees = fetchedCountries
    .map((eventMetadata) => eventMetadata?.referee ?? null)
    .filter((referee): referee is RefereeRecord => referee !== null);
  const validManagers = fetchedCountries.flatMap((eventMetadata) => eventMetadata?.managers ?? []);

  const mergedCountries = upsertCountries(existingCountries, validCountries);
  const mergedCities = upsertCities(
    existingCities,
    validCities.map((city) => linkCityCountry(city, mergedCountries))
  );
  const normalizedCities = relinkCityCountries(mergedCities, mergedCountries);
  const mergedStadiums = upsertStadiums(
    existingStadiums,
    validStadiums.map((stadium) => linkStadiumReferences(stadium, normalizedCities))
  );
  const normalizedStadiums = relinkStadiumReferences(mergedStadiums, normalizedCities);
  const mergedManagers = upsertManagers(
    existingManagers,
    validManagers.map((manager) => linkManagerCountry(manager, mergedCountries))
  );
  const normalizedManagers = relinkManagerCountries(mergedManagers, mergedCountries);
  const mergedReferees = upsertReferees(
    existingReferees,
    validReferees.map((referee) => linkRefereeCountry(referee, mergedCountries))
  );
  const normalizedReferees = relinkRefereeCountries(mergedReferees, mergedCountries);
  const mergedTournaments = upsertTournaments(
    existingTournaments,
    validTournaments.map((tournament) => linkTournamentCountry(tournament, mergedCountries))
  );
  const normalizedTournaments = relinkTournamentCountries(mergedTournaments, mergedCountries);
  const mergedSeasons = upsertSeasons(
    existingSeasons,
    validSeasons.map((season) => linkSeasonTournament(season, normalizedTournaments))
  );
  const normalizedSeasons = relinkSeasonTournaments(mergedSeasons, normalizedTournaments);

  await saveCountries(countriesCsvPath, mergedCountries);
  await saveCities(citiesCsvPath, normalizedCities);
  await saveStadiums(stadiumsCsvPath, normalizedStadiums);
  await saveManagers(managersCsvPath, normalizedManagers);
  await saveReferees(refereesCsvPath, normalizedReferees);
  await saveTournaments(tournamentsCsvPath, normalizedTournaments);
  await saveSeasons(seasonsCsvPath, normalizedSeasons);

  console.log(
    `countries.csv atualizado com ${validCountries.length} item(ns) processado(s).`
  );
  console.log(`cities.csv atualizado com ${validCities.length} item(ns) processado(s).`);
  console.log(`stadiums.csv atualizado com ${validStadiums.length} item(ns) processado(s).`);
  console.log(`managers.csv atualizado com ${validManagers.length} item(ns) processado(s).`);
  console.log(`referees.csv atualizado com ${validReferees.length} item(ns) processado(s).`);
  console.log(
    `tournaments.csv atualizado com ${validTournaments.length} item(ns) processado(s).`
  );
  console.log(`seasons.csv atualizado com ${validSeasons.length} item(ns) processado(s).`);
};

const linkCityCountry = (city: CityRecord, countries: CountryRecord[]): CityRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === city.country || country.slug === city.country
  );

  if (!linkedCountry) {
    return city;
  }

  return {
    ...city,
    country: linkedCountry.id
  };
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

const linkStadiumReferences = (
  stadium: StadiumRecord,
  cities: CityRecord[]
): StadiumRecord => {
  const linkedCity = cities.find(
    (city) => city.source_name === stadium.city || city.name === stadium.city
  );

  return {
    ...stadium,
    city: linkedCity?.id ?? stadium.city
  };
};

const linkSeasonTournament = (
  season: SeasonRecord,
  tournaments: TournamentRecord[]
): SeasonRecord => {
  const linkedTournament = tournaments.find(
    (tournament) =>
      tournament.source_id === season.tournament || tournament.id === season.tournament
  );

  if (!linkedTournament) {
    return season;
  }

  return {
    ...season,
    tournament: linkedTournament.id
  };
};

const linkRefereeCountry = (
  referee: RefereeRecord,
  countries: CountryRecord[]
): RefereeRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === referee.country || country.slug === referee.country
  );

  if (!linkedCountry) {
    return referee;
  }

  return {
    ...referee,
    country: linkedCountry.id
  };
};

const linkManagerCountry = (
  manager: ManagerRecord,
  countries: CountryRecord[]
): ManagerRecord => {
  const linkedCountry = countries.find(
    (country) => country.source_slug === manager.country || country.slug === manager.country
  );

  if (!linkedCountry) {
    return manager;
  }

  return {
    ...manager,
    country: linkedCountry.id
  };
};

await run();
