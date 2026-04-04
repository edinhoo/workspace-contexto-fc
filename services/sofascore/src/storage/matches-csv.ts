import type {
  ManagerRecord,
  MatchRecord,
  RefereeRecord,
  SeasonRecord,
  StadiumRecord,
  TeamRecord,
  TournamentRecord
} from "../types.js";
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
  "id;tournament;season;round;stadium;referee;home_team;home_manager;home_formation;home_score_period_1;home_score_period_2;home_score_normaltime;home_score_extra_1;home_score_extra_2;home_score_overtime;home_score_penalties;away_team;away_manager;away_formation;away_score_period_1;away_score_period_2;away_score_normaltime;away_score_extra_1;away_score_extra_2;away_score_overtime;away_score_penalties;start_time;period_start_time;injury_time_1;injury_time_2;injury_time_3;injury_time_4;source_ref;source;first_scraped_at;last_scraped_at;created_at;updated_at";
const SOURCE = "sofascore" as const;

export const loadMatches = async (filePath: string): Promise<MatchRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortMatches(rows.map((row) => normalizeMatchRow(header, row)));
};

export const upsertMatches = (
  existingMatches: MatchRecord[],
  incomingMatches: MatchRecord[]
): MatchRecord[] => {
  const matches = [...existingMatches];

  for (const incomingMatch of incomingMatches) {
    const existingMatchIndex = matches.findIndex(
      (existingMatch) => existingMatch.source_ref === incomingMatch.source_ref
    );

    if (existingMatchIndex === -1) {
      matches.push(createMatch(incomingMatch));
      continue;
    }

    matches[existingMatchIndex] = syncMatch(matches[existingMatchIndex], incomingMatch);
  }

  return sortMatches(matches);
};

export const relinkMatchReferences = (
  matches: MatchRecord[],
  references: {
    tournaments: TournamentRecord[];
    seasons: SeasonRecord[];
    stadiums: StadiumRecord[];
    referees: RefereeRecord[];
    managers: ManagerRecord[];
    teams: TeamRecord[];
  }
): MatchRecord[] =>
  sortMatches(
    matches.map((match) =>
      finalizeMatch({
        ...match,
        tournament: findReferenceId(references.tournaments, match.tournament, "source_ref"),
        season: findReferenceId(references.seasons, match.season, "source_ref"),
        stadium: findReferenceId(references.stadiums, match.stadium, "source_ref"),
        referee: findReferenceId(references.referees, match.referee, "source_ref"),
        home_team: findReferenceId(references.teams, match.home_team, "source_ref"),
        home_manager: findReferenceId(references.managers, match.home_manager, "source_ref"),
        away_team: findReferenceId(references.teams, match.away_team, "source_ref"),
        away_manager: findReferenceId(references.managers, match.away_manager, "source_ref")
      })
    )
  );

export const saveMatches = async (filePath: string, matches: MatchRecord[]): Promise<void> => {
  const rows = sortMatches(matches).map((match) =>
    [
      match.id,
      match.tournament,
      match.season,
      match.round,
      match.stadium,
      match.referee,
      match.home_team,
      match.home_manager,
      match.home_formation,
      match.home_score_period_1,
      match.home_score_period_2,
      match.home_score_normaltime,
      match.home_score_extra_1,
      match.home_score_extra_2,
      match.home_score_overtime,
      match.home_score_penalties,
      match.away_team,
      match.away_manager,
      match.away_formation,
      match.away_score_period_1,
      match.away_score_period_2,
      match.away_score_normaltime,
      match.away_score_extra_1,
      match.away_score_extra_2,
      match.away_score_overtime,
      match.away_score_penalties,
      match.start_time,
      match.period_start_time,
      match.injury_time_1,
      match.injury_time_2,
      match.injury_time_3,
      match.injury_time_4,
      match.source_ref,
      match.source,
      match.first_scraped_at,
      match.last_scraped_at,
      match.created_at,
      match.updated_at
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeMatchRow = (header: string, row: string): MatchRecord => {
  const columns = row.split(";");

  const legacyLength33 = columns.length === 33;
  const legacyLength35 = columns.length === 35;

  if (legacyLength33 || legacyLength35) {
    const [
      id = "",
      tournament = "",
      season = "",
      round = "",
      stadium = "",
      referee = "",
      home_team = "",
      home_manager = "",
      maybeHomeFormation = "",
      home_score_period_1 = "",
      home_score_period_2 = "",
      home_score_normaltime = "",
      home_score_extra_1 = "",
      home_score_extra_2 = "",
      home_score_overtime = "",
      home_score_penalties = "",
      away_team = "",
      away_manager = "",
      maybeAwayFormation = "",
      away_score_period_1 = "",
      away_score_period_2 = "",
      away_score_normaltime = "",
      away_score_extra_1 = "",
      away_score_extra_2 = "",
      away_score_overtime = "",
      away_score_penalties = "",
      start_time = "",
      period_start_time = "",
      injury_time_1 = "",
      injury_time_2 = "",
      injury_time_3 = "",
      injury_time_4 = "",
      source_ref = "",
      legacySource = SOURCE
    ] = columns;

    return finalizeMatch({
      id,
      tournament,
      season,
      round,
      stadium,
      referee,
      home_team,
      home_manager,
      home_formation: legacyLength35 ? maybeHomeFormation : "",
      home_score_period_1,
      home_score_period_2,
      home_score_normaltime,
      home_score_extra_1,
      home_score_extra_2,
      home_score_overtime,
      home_score_penalties,
      away_team,
      away_manager,
      away_formation: legacyLength35 ? maybeAwayFormation : "",
      away_score_period_1,
      away_score_period_2,
      away_score_normaltime,
      away_score_extra_1,
      away_score_extra_2,
      away_score_overtime,
      away_score_penalties,
      start_time,
      period_start_time,
      injury_time_1,
      injury_time_2,
      injury_time_3,
      injury_time_4,
      source_ref,
      source: legacySource === SOURCE ? SOURCE : SOURCE,
      ...normalizeAuditFields({})
    });
  }

  const [
    id = "",
    tournament = "",
    season = "",
    round = "",
    stadium = "",
    referee = "",
    home_team = "",
    home_manager = "",
    home_formation = "",
    home_score_period_1 = "",
    home_score_period_2 = "",
    home_score_normaltime = "",
    home_score_extra_1 = "",
    home_score_extra_2 = "",
    home_score_overtime = "",
    home_score_penalties = "",
    away_team = "",
    away_manager = "",
    away_formation = "",
    away_score_period_1 = "",
    away_score_period_2 = "",
    away_score_normaltime = "",
    away_score_extra_1 = "",
    away_score_extra_2 = "",
    away_score_overtime = "",
    away_score_penalties = "",
    start_time = "",
    period_start_time = "",
    injury_time_1 = "",
    injury_time_2 = "",
    injury_time_3 = "",
    injury_time_4 = "",
    source_ref = "",
    source = SOURCE,
    first_scraped_at = "",
    last_scraped_at = "",
    created_at = "",
    updated_at = ""
  ] = columns;

  return finalizeMatch({
    id,
    tournament,
    season,
    round,
    stadium,
    referee,
    home_team,
    home_manager,
    home_formation,
    home_score_period_1,
    home_score_period_2,
    home_score_normaltime,
    home_score_extra_1,
    home_score_extra_2,
    home_score_overtime,
    home_score_penalties,
    away_team,
    away_manager,
    away_formation,
    away_score_period_1,
    away_score_period_2,
    away_score_normaltime,
    away_score_extra_1,
    away_score_extra_2,
    away_score_overtime,
    away_score_penalties,
    start_time,
    period_start_time,
    injury_time_1,
    injury_time_2,
    injury_time_3,
    injury_time_4,
    source_ref,
    source: source === SOURCE ? SOURCE : SOURCE,
    first_scraped_at,
    last_scraped_at,
    created_at,
    updated_at
  });
};

const createMatch = (match: MatchRecord): MatchRecord =>
  finalizeMatch({
    ...match,
    id: createEntityId(),
    source: SOURCE,
    ...createAuditFields()
  });

const syncMatch = (existingMatch: MatchRecord, incomingMatch: MatchRecord): MatchRecord => {
  const nextMatch = {
    ...existingMatch,
    tournament: incomingMatch.tournament,
    season: incomingMatch.season,
    round: incomingMatch.round,
    stadium: incomingMatch.stadium,
    referee: incomingMatch.referee,
    home_team: incomingMatch.home_team,
    home_manager: incomingMatch.home_manager,
    home_formation: incomingMatch.home_formation,
    home_score_period_1: incomingMatch.home_score_period_1,
    home_score_period_2: incomingMatch.home_score_period_2,
    home_score_normaltime: incomingMatch.home_score_normaltime,
    home_score_extra_1: incomingMatch.home_score_extra_1,
    home_score_extra_2: incomingMatch.home_score_extra_2,
    home_score_overtime: incomingMatch.home_score_overtime,
    home_score_penalties: incomingMatch.home_score_penalties,
    away_team: incomingMatch.away_team,
    away_manager: incomingMatch.away_manager,
    away_formation: incomingMatch.away_formation,
    away_score_period_1: incomingMatch.away_score_period_1,
    away_score_period_2: incomingMatch.away_score_period_2,
    away_score_normaltime: incomingMatch.away_score_normaltime,
    away_score_extra_1: incomingMatch.away_score_extra_1,
    away_score_extra_2: incomingMatch.away_score_extra_2,
    away_score_overtime: incomingMatch.away_score_overtime,
    away_score_penalties: incomingMatch.away_score_penalties,
    start_time: incomingMatch.start_time,
    period_start_time: incomingMatch.period_start_time,
    injury_time_1: incomingMatch.injury_time_1,
    injury_time_2: incomingMatch.injury_time_2,
    injury_time_3: incomingMatch.injury_time_3,
    injury_time_4: incomingMatch.injury_time_4,
    source_ref: incomingMatch.source_ref,
    source: SOURCE
  };
  const changed = JSON.stringify(nextMatch) !== JSON.stringify({ ...existingMatch, source: SOURCE });

  return finalizeMatch({
    ...nextMatch,
    ...mergeAuditFields(existingMatch, changed)
  });
};

const finalizeMatch = (match: MatchRecord): MatchRecord => ({
  id: match.id.trim() || createEntityId(),
  tournament: match.tournament.trim(),
  season: match.season.trim(),
  round: match.round.trim(),
  stadium: match.stadium.trim(),
  referee: match.referee.trim(),
  home_team: match.home_team.trim(),
  home_manager: match.home_manager.trim(),
  home_formation: match.home_formation.trim(),
  home_score_period_1: match.home_score_period_1.trim(),
  home_score_period_2: match.home_score_period_2.trim(),
  home_score_normaltime: match.home_score_normaltime.trim(),
  home_score_extra_1: match.home_score_extra_1.trim(),
  home_score_extra_2: match.home_score_extra_2.trim(),
  home_score_overtime: match.home_score_overtime.trim(),
  home_score_penalties: match.home_score_penalties.trim(),
  away_team: match.away_team.trim(),
  away_manager: match.away_manager.trim(),
  away_formation: match.away_formation.trim(),
  away_score_period_1: match.away_score_period_1.trim(),
  away_score_period_2: match.away_score_period_2.trim(),
  away_score_normaltime: match.away_score_normaltime.trim(),
  away_score_extra_1: match.away_score_extra_1.trim(),
  away_score_extra_2: match.away_score_extra_2.trim(),
  away_score_overtime: match.away_score_overtime.trim(),
  away_score_penalties: match.away_score_penalties.trim(),
  start_time: match.start_time.trim(),
  period_start_time: match.period_start_time.trim(),
  injury_time_1: match.injury_time_1.trim(),
  injury_time_2: match.injury_time_2.trim(),
  injury_time_3: match.injury_time_3.trim(),
  injury_time_4: match.injury_time_4.trim(),
  source_ref: match.source_ref.trim(),
  source: SOURCE,
  ...normalizeAuditFields(match)
});

const findReferenceId = <
  TRecord extends { id: string; source_ref: string },
  TKey extends keyof TRecord
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

const sortMatches = (matches: MatchRecord[]): MatchRecord[] =>
  [...matches].sort((left, right) => compareEntityIds(left.id, right.id));
