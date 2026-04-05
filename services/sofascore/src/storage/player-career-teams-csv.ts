import type { PlayerCareerTeamRecord, PlayerRecord, TeamRecord } from "../types.js";
import {
  compareEntityIds,
  createAuditFields,
  createEntityId,
  loadCsvRows,
  mergeAuditFields,
  normalizeAuditFields,
  saveCsvRows
} from "./shared/csv.js";

const CSV_HEADER =
  "id;player;team;source_player_id;source_team_id;source;first_scraped_at;last_scraped_at;created_at;updated_at";
const SOURCE = "sofascore" as const;
const LEGACY_HEADER = "id;player;team;source_ref;source;first_scraped_at;last_scraped_at;created_at;updated_at";

export const loadPlayerCareerTeams = async (
  filePath: string
): Promise<PlayerCareerTeamRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortPlayerCareerTeams(rows.map((row) => normalizePlayerCareerTeamRow(header, row)));
};

export const upsertPlayerCareerTeams = (
  existingRecords: PlayerCareerTeamRecord[],
  incomingRecords: PlayerCareerTeamRecord[]
): PlayerCareerTeamRecord[] => {
  const records = [...existingRecords];

  for (const incomingRecord of incomingRecords) {
    const existingRecordIndex = records.findIndex(
      (existingRecord) =>
        existingRecord.source_player_id === incomingRecord.source_player_id &&
        existingRecord.source_team_id === incomingRecord.source_team_id
    );

    if (existingRecordIndex === -1) {
      records.push(createPlayerCareerTeam(incomingRecord));
      continue;
    }

    records[existingRecordIndex] = syncPlayerCareerTeam(
      records[existingRecordIndex],
      incomingRecord
    );
  }

  return sortPlayerCareerTeams(records);
};

export const relinkPlayerCareerTeamReferences = (
  records: PlayerCareerTeamRecord[],
  references: {
    players: PlayerRecord[];
    teams: TeamRecord[];
  }
): PlayerCareerTeamRecord[] =>
  sortPlayerCareerTeams(
    records.map((record) => {
      const linkedPlayer = references.players.find(
        (player) => player.id === record.player || player.source_ref === record.player
      );
      const linkedTeam = references.teams.find(
        (team) => team.id === record.team || team.source_ref === record.team
      );

      return finalizePlayerCareerTeam({
        ...record,
        player: linkedPlayer?.id ?? record.player,
        team: linkedTeam?.id ?? record.team
      });
    })
  );

export const savePlayerCareerTeams = async (
  filePath: string,
  records: PlayerCareerTeamRecord[]
): Promise<void> => {
  const rows = sortPlayerCareerTeams(records).map((record) =>
    [
      record.id,
      record.player,
      record.team,
      record.source_player_id,
      record.source_team_id,
      record.source,
      record.first_scraped_at,
      record.last_scraped_at,
      record.created_at,
      record.updated_at
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizePlayerCareerTeamRow = (
  header: string,
  row: string
): PlayerCareerTeamRecord => {
  const columns = row.split(";");

  if (header === LEGACY_HEADER) {
    const [
      id = "",
      player = "",
      team = "",
      source_ref = "",
      source = SOURCE,
      tailA = "",
      tailB = "",
      tailC = "",
      tailD = ""
    ] = columns;

    const [source_player_id = "", source_team_id = ""] = source_ref.split(":");
    const audit = normalizeAuditFields({
      first_scraped_at: tailA,
      last_scraped_at: tailB,
      created_at: tailC,
      updated_at: tailD
    });

    return finalizePlayerCareerTeam({
      id,
      player,
      team,
      source_player_id,
      source_team_id,
      source: source === SOURCE ? SOURCE : SOURCE,
      ...audit
    });
  }

  const [
    id = "",
    player = "",
    team = "",
    source_player_id = "",
    source_team_id = "",
    source = SOURCE,
    tailA = "",
    tailB = "",
    tailC = "",
    tailD = ""
  ] = columns;

  const audit = normalizeAuditFields({
    first_scraped_at: tailA,
    last_scraped_at: tailB,
    created_at: tailC,
    updated_at: tailD
  });

  return finalizePlayerCareerTeam({
    id,
    player,
    team,
    source_player_id,
    source_team_id,
    source: header.includes("source") && source === SOURCE ? SOURCE : SOURCE,
    ...audit
  });
};

const createPlayerCareerTeam = (record: PlayerCareerTeamRecord): PlayerCareerTeamRecord =>
  finalizePlayerCareerTeam({
    id: createEntityId(),
    player: record.player,
    team: record.team,
    source_player_id: record.source_player_id,
    source_team_id: record.source_team_id,
    source: SOURCE,
    ...createAuditFields()
  });

const syncPlayerCareerTeam = (
  existingRecord: PlayerCareerTeamRecord,
  incomingRecord: PlayerCareerTeamRecord
): PlayerCareerTeamRecord => {
  const nextRecord = {
    ...existingRecord,
    player: incomingRecord.player,
    team: incomingRecord.team,
    source_player_id: incomingRecord.source_player_id,
    source_team_id: incomingRecord.source_team_id,
    source: SOURCE
  };
  const changed = JSON.stringify(nextRecord) !== JSON.stringify({ ...existingRecord, source: SOURCE });

  return finalizePlayerCareerTeam({
    ...nextRecord,
    ...mergeAuditFields(existingRecord, changed)
  });
};

const finalizePlayerCareerTeam = (
  record: PlayerCareerTeamRecord
): PlayerCareerTeamRecord => ({
  id: record.id.trim() || createEntityId(),
  player: record.player.trim(),
  team: record.team.trim(),
  source_player_id: record.source_player_id.trim(),
  source_team_id: record.source_team_id.trim(),
  source: SOURCE,
  ...normalizeAuditFields(record)
});

const sortPlayerCareerTeams = (
  records: PlayerCareerTeamRecord[]
): PlayerCareerTeamRecord[] =>
  [...records].sort((left, right) => compareEntityIds(left.id, right.id));
