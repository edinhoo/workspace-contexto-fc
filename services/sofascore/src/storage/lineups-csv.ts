import type { LineupRecord, MatchRecord, PlayerRecord, TeamRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;match;team;player;jersey_number;position;substitute;is_missing;slot;minutes_played;rating;source_match_id;source_team_id;source_player_id;source;edited";
const SOURCE = "sofascore" as const;
const LEGACY_HEADER_WITH_SHIRT_NUMBER =
  "id;match;team;player;shirt_number;jersey_number;position;substitute;entry_type;reason;external_type;minutes_played;rating;source_ref;source;edited";
const LEGACY_HEADER_WITH_ENTRY_TYPE =
  "id;match;team;player;jersey_number;position;substitute;entry_type;reason;external_type;minutes_played;rating;source_ref;source;edited";
const LEGACY_HEADER_WITHOUT_SLOT =
  "id;match;team;player;jersey_number;position;substitute;is_missing;minutes_played;rating;source_ref;source;edited";

export const loadLineups = async (filePath: string): Promise<LineupRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortLineups(rows.map((row) => normalizeLineupRow(header, row)));
};

export const upsertLineups = (
  existingLineups: LineupRecord[],
  incomingLineups: LineupRecord[]
): LineupRecord[] => {
  const lineups = [...existingLineups];

  for (const incomingLineup of incomingLineups) {
    const existingLineupIndex = lineups.findIndex(
      (existingLineup) =>
        existingLineup.source_match_id === incomingLineup.source_match_id &&
        existingLineup.source_team_id === incomingLineup.source_team_id &&
        existingLineup.source_player_id === incomingLineup.source_player_id
    );

    if (existingLineupIndex === -1) {
      lineups.push(createLineup(incomingLineup));
      continue;
    }

    lineups[existingLineupIndex] = syncLineup(lineups[existingLineupIndex], incomingLineup);
  }

  return sortLineups(lineups);
};

export const relinkLineupReferences = (
  lineups: LineupRecord[],
  references: {
    matches: MatchRecord[];
    teams: TeamRecord[];
    players: PlayerRecord[];
  }
): LineupRecord[] =>
  sortLineups(
    lineups.map((lineup) =>
      finalizeLineup({
        ...lineup,
        match: findReferenceId(references.matches, lineup.match, "source_ref"),
        team: findReferenceId(references.teams, lineup.team, "source_ref"),
        player: findReferenceId(references.players, lineup.player, "source_ref")
      })
    )
  );

export const saveLineups = async (filePath: string, lineups: LineupRecord[]): Promise<void> => {
  const rows = sortLineups(lineups).map((lineup) =>
    [
      lineup.id,
      lineup.match,
      lineup.team,
      lineup.player,
      lineup.jersey_number,
      lineup.position,
      lineup.substitute,
      lineup.is_missing,
      lineup.slot,
      lineup.minutes_played,
      lineup.rating,
      lineup.source_match_id,
      lineup.source_team_id,
      lineup.source_player_id,
      lineup.source,
      String(lineup.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeLineupRow = (header: string, row: string[]): LineupRecord => {
  if (header === LEGACY_HEADER_WITH_SHIRT_NUMBER) {
    const [
      id = "",
      match = "",
      team = "",
      player = "",
      shirt_number = "",
      jersey_number = "",
      position = "",
      substitute = "",
      entry_type = "",
      ,
      ,
      minutes_played = "",
      rating = "",
      source_ref = "",
      source = SOURCE,
      edited = "false"
    ] = row;

    const [source_match_id = "", source_team_id = "", source_player_id = ""] =
      parseLegacyCompositeSourceRef(source_ref);

    return finalizeLineup({
      id,
      match,
      team,
      player,
      jersey_number: jersey_number || shirt_number,
      position,
      substitute,
      is_missing: String(entry_type === "missing"),
      slot: "",
      minutes_played,
      rating,
      source_match_id,
      source_team_id,
      source_player_id,
      source: source === SOURCE ? SOURCE : SOURCE,
      edited: edited === "true"
    });
  }

  if (header === LEGACY_HEADER_WITH_ENTRY_TYPE) {
    const [
      id = "",
      match = "",
      team = "",
      player = "",
      jersey_number = "",
      position = "",
      substitute = "",
      entry_type = "",
      ,
      ,
      minutes_played = "",
      rating = "",
      source_ref = "",
      source = SOURCE,
      edited = "false"
    ] = row;

    const [source_match_id = "", source_team_id = "", source_player_id = ""] =
      parseLegacyCompositeSourceRef(source_ref);

    return finalizeLineup({
      id,
      match,
      team,
      player,
      jersey_number,
      position,
      substitute,
      is_missing: String(entry_type === "missing"),
      slot: "",
      minutes_played,
      rating,
      source_match_id,
      source_team_id,
      source_player_id,
      source: source === SOURCE ? SOURCE : SOURCE,
      edited: edited === "true"
    });
  }

  if (header === LEGACY_HEADER_WITHOUT_SLOT) {
    const [
      id = "",
      match = "",
      team = "",
      player = "",
      jersey_number = "",
      position = "",
      substitute = "",
      is_missing = "false",
      minutes_played = "",
      rating = "",
      source_ref = "",
      source = SOURCE,
      edited = "false"
    ] = row;

    const [source_match_id = "", source_team_id = "", source_player_id = ""] =
      parseLegacyCompositeSourceRef(source_ref);

    return finalizeLineup({
      id,
      match,
      team,
      player,
      jersey_number,
      position,
      substitute,
      is_missing,
      slot: "",
      minutes_played,
      rating,
      source_match_id,
      source_team_id,
      source_player_id,
      source: source === SOURCE ? SOURCE : SOURCE,
      edited: edited === "true"
    });
  }

  const [
    id = "",
    match = "",
    team = "",
    player = "",
    jersey_number = "",
    position = "",
    substitute = "",
    is_missing = "false",
    slot = "",
    minutes_played = "",
    rating = "",
    source_match_id = "",
    source_team_id = "",
    source_player_id = "",
    source = SOURCE,
    edited = "false"
  ] = row;

  return finalizeLineup({
    id,
    match,
    team,
    player,
    jersey_number,
    position,
    substitute,
    is_missing,
    slot,
    minutes_played,
    rating,
    source_match_id,
    source_team_id,
    source_player_id,
    source: source === SOURCE ? SOURCE : SOURCE,
    edited: edited === "true"
  });
};

const createLineup = (lineup: LineupRecord): LineupRecord =>
  finalizeLineup({
    ...lineup,
    id: createEntityId(),
    source: SOURCE,
    edited: false
  });

const syncLineup = (existingLineup: LineupRecord, incomingLineup: LineupRecord): LineupRecord => {
  if (existingLineup.edited) {
    return finalizeLineup({
      ...existingLineup,
      source_match_id: incomingLineup.source_match_id,
      source_team_id: incomingLineup.source_team_id,
      source_player_id: incomingLineup.source_player_id,
      source: SOURCE
    });
  }

  return finalizeLineup({
    ...existingLineup,
    match: incomingLineup.match,
    team: incomingLineup.team,
    player: incomingLineup.player,
    jersey_number: incomingLineup.jersey_number,
    position: incomingLineup.position,
    substitute: incomingLineup.substitute,
    is_missing: incomingLineup.is_missing,
    slot: incomingLineup.slot,
    minutes_played: incomingLineup.minutes_played,
    rating: incomingLineup.rating,
    source_match_id: incomingLineup.source_match_id,
    source_team_id: incomingLineup.source_team_id,
    source_player_id: incomingLineup.source_player_id,
    source: SOURCE
  });
};

const finalizeLineup = (lineup: LineupRecord): LineupRecord => ({
  id: lineup.id.trim() || createEntityId(),
  match: lineup.match.trim(),
  team: lineup.team.trim(),
  player: lineup.player.trim(),
  jersey_number: lineup.jersey_number.trim(),
  position: lineup.position.trim(),
  substitute: lineup.substitute.trim(),
  is_missing: lineup.is_missing.trim(),
  slot: lineup.slot.trim(),
  minutes_played: lineup.minutes_played.trim(),
  rating: lineup.rating.trim(),
  source_match_id: lineup.source_match_id.trim(),
  source_team_id: lineup.source_team_id.trim(),
  source_player_id: lineup.source_player_id.trim(),
  source: SOURCE,
  edited: lineup.edited
});

const parseLegacyCompositeSourceRef = (value: string): [string, string, string] => {
  const [source_match_id = "", source_team_id = "", source_player_id = ""] = value.split(":");
  return [source_match_id, source_team_id, source_player_id];
};

const findReferenceId = <
  TRecord extends { id: string },
  TKey extends {
    [TProperty in keyof TRecord]: TRecord[TProperty] extends string ? TProperty : never;
  }[keyof TRecord]
>(
  records: TRecord[],
  value: string,
  sourceKey: TKey
): string => {
  const linkedRecord = records.find(
    (record) => record.id === value || String(record[sourceKey]) === value
  );

  return linkedRecord?.id ?? value;
};

const sortLineups = (lineups: LineupRecord[]): LineupRecord[] =>
  [...lineups].sort((left, right) => compareEntityIds(left.id, right.id));
