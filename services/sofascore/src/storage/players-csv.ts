import { slugify } from "@repo/utils";

import type { CountryRecord, PlayerRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;short_name;first_name;last_name;position;height;country;date_of_birth;source;source_id;edited";
const SOURCE = "sofascore" as const;

export const loadPlayers = async (filePath: string): Promise<PlayerRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortPlayers(rows.map((row) => normalizePlayerRow(header, row)));
};

export const upsertPlayers = (
  existingPlayers: PlayerRecord[],
  incomingPlayers: PlayerRecord[]
): PlayerRecord[] => {
  const players = [...existingPlayers];

  for (const incomingPlayer of incomingPlayers) {
    const existingPlayerIndex = players.findIndex(
      (existingPlayer) => existingPlayer.source_id === incomingPlayer.source_id
    );

    if (existingPlayerIndex === -1) {
      players.push(createPlayer(incomingPlayer));
      continue;
    }

    players[existingPlayerIndex] = syncPlayer(players[existingPlayerIndex], incomingPlayer);
  }

  return sortPlayers(players);
};

export const relinkPlayerCountries = (
  players: PlayerRecord[],
  countries: CountryRecord[]
): PlayerRecord[] =>
  sortPlayers(
    players.map((player) => {
      const linkedCountry = countries.find(
        (country) =>
          country.id === player.country ||
          country.slug === player.country ||
          country.source_slug === player.country
      );

      if (!linkedCountry) {
        return player;
      }

      return finalizePlayer({
        ...player,
        country: linkedCountry.id
      });
    })
  );

export const savePlayers = async (filePath: string, players: PlayerRecord[]): Promise<void> => {
  const rows = sortPlayers(players).map((player) =>
    [
      player.id,
      player.slug,
      player.name,
      player.short_name,
      player.first_name,
      player.last_name,
      player.position,
      player.height,
      player.country,
      player.date_of_birth,
      player.source,
      player.source_id,
      String(player.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizePlayerRow = (header: string, row: string): PlayerRecord => {
  const columns = row.split(";");

  const [
    id = "",
    slug = "",
    name = "",
    short_name = "",
    first_name = "",
    last_name = "",
    position = "",
    height = "",
    country = "",
    date_of_birth = "",
    source = SOURCE,
    source_id = "",
    edited = "false"
  ] = columns;

  if (header === CSV_HEADER) {
    return finalizePlayer({
      id,
      slug,
      name,
      short_name,
      first_name,
      last_name,
      position,
      height,
      country,
      date_of_birth,
      source: source === SOURCE ? SOURCE : SOURCE,
      source_id,
      edited: edited === "true"
    });
  }

  return finalizePlayer({
    id,
    slug,
    name: name || short_name,
    short_name: short_name || name,
    first_name,
    last_name,
    position,
    height,
    country,
    date_of_birth,
    source: SOURCE,
    source_id,
    edited: edited === "true"
  });
};

const createPlayer = (player: PlayerRecord): PlayerRecord =>
  finalizePlayer({
    id: createEntityId(),
    slug: player.slug,
    name: player.name,
    short_name: player.short_name || player.name,
    first_name: player.first_name,
    last_name: player.last_name,
    position: player.position,
    height: player.height,
    country: player.country,
    date_of_birth: player.date_of_birth,
    source: SOURCE,
    source_id: player.source_id,
    edited: false
  });

const syncPlayer = (existingPlayer: PlayerRecord, incomingPlayer: PlayerRecord): PlayerRecord => {
  const updatedPlayer = {
    ...existingPlayer,
    country: incomingPlayer.country,
    source_id: incomingPlayer.source_id,
    source: SOURCE
  };

  if (existingPlayer.edited) {
    return finalizePlayer(updatedPlayer);
  }

  return finalizePlayer({
    ...updatedPlayer,
    slug: incomingPlayer.slug,
    name: incomingPlayer.name,
    short_name: incomingPlayer.short_name || incomingPlayer.name,
    first_name: incomingPlayer.first_name,
    last_name: incomingPlayer.last_name,
    position: incomingPlayer.position,
    height: incomingPlayer.height,
    date_of_birth: incomingPlayer.date_of_birth
  });
};

const finalizePlayer = (player: PlayerRecord): PlayerRecord => {
  const name = player.name.trim() || player.short_name.trim();
  const shortName = player.short_name.trim() || name;

  return {
    id: player.id.trim() || createEntityId(),
    slug: slugify(name || player.slug.trim()),
    name,
    short_name: shortName,
    first_name: player.first_name.trim(),
    last_name: player.last_name.trim(),
    position: player.position.trim(),
    height: player.height.trim(),
    country: player.country.trim(),
    date_of_birth: player.date_of_birth.trim(),
    source: SOURCE,
    source_id: player.source_id.trim(),
    edited: player.edited
  };
};

const sortPlayers = (players: PlayerRecord[]): PlayerRecord[] =>
  [...players].sort((left, right) => compareEntityIds(left.id, right.id));
