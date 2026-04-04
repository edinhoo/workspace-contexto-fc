import type {
  ManagerRecord,
  MatchRecord,
  RefereeRecord,
  SeasonRecord,
  StadiumRecord,
  TeamRecord,
  TournamentRecord
} from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;tournament;season;round;stadium;referee;home_team;home_manager;home_formation;home_score_period_1;home_score_period_2;home_score_normaltime;home_score_extra_1;home_score_extra_2;home_score_overtime;home_score_penalties;away_team;away_manager;away_formation;away_score_period_1;away_score_period_2;away_score_normaltime;away_score_extra_1;away_score_extra_2;away_score_overtime;away_score_penalties;start_time;period_start_time;injury_time_1;injury_time_2;injury_time_3;injury_time_4;source_id;source;edited";
const SOURCE = "sofascore" as const;

export const loadMatches = async (filePath: string): Promise<MatchRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortMatches(rows.map((row) => normalizeMatchRow(row)));
};

export const upsertMatches = (
  existingMatches: MatchRecord[],
  incomingMatches: MatchRecord[]
): MatchRecord[] => {
  const matches = [...existingMatches];

  for (const incomingMatch of incomingMatches) {
    const existingMatchIndex = matches.findIndex(
      (existingMatch) => existingMatch.source_id === incomingMatch.source_id
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
        tournament: findReferenceId(references.tournaments, match.tournament, "source_id"),
        season: findReferenceId(references.seasons, match.season, "source_id"),
        stadium: findReferenceId(references.stadiums, match.stadium, "source_id"),
        referee: findReferenceId(references.referees, match.referee, "source_id"),
        home_team: findReferenceId(references.teams, match.home_team, "source_id"),
        home_manager: findReferenceId(references.managers, match.home_manager, "source_id"),
        away_team: findReferenceId(references.teams, match.away_team, "source_id"),
        away_manager: findReferenceId(references.managers, match.away_manager, "source_id")
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
      match.source_id,
      match.source,
      String(match.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeMatchRow = (row: string): MatchRecord => {
  const columns = row.split(";");

  if (
    columns.length === 33
  ) {
    const [
      id = "",
      tournament = "",
      season = "",
      round = "",
      stadium = "",
      referee = "",
      home_team = "",
      home_manager = "",
      home_score_period_1 = "",
      home_score_period_2 = "",
      home_score_normaltime = "",
      home_score_extra_1 = "",
      home_score_extra_2 = "",
      home_score_overtime = "",
      home_score_penalties = "",
      away_team = "",
      away_manager = "",
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
      source_id = "",
      source = SOURCE,
      edited = "false"
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
      home_formation: "",
      home_score_period_1,
      home_score_period_2,
      home_score_normaltime,
      home_score_extra_1,
      home_score_extra_2,
      home_score_overtime,
      home_score_penalties,
      away_team,
      away_manager,
      away_formation: "",
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
      source_id,
      source: source === SOURCE ? SOURCE : SOURCE,
      edited: edited === "true"
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
    source_id = "",
    source = SOURCE,
    edited = "false"
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
    source_id,
    source: source === SOURCE ? SOURCE : SOURCE,
    edited: edited === "true"
  });
};

const createMatch = (match: MatchRecord): MatchRecord =>
  finalizeMatch({
    ...match,
    id: createEntityId(),
    source: SOURCE,
    edited: false
  });

const syncMatch = (existingMatch: MatchRecord, incomingMatch: MatchRecord): MatchRecord => {
  if (existingMatch.edited) {
    return finalizeMatch({
      ...existingMatch,
      source_id: incomingMatch.source_id,
      source: SOURCE
    });
  }

  return finalizeMatch({
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
    source_id: incomingMatch.source_id,
    source: SOURCE
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
  source_id: match.source_id.trim(),
  source: SOURCE,
  edited: match.edited
});

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

const sortMatches = (matches: MatchRecord[]): MatchRecord[] =>
  [...matches].sort((left, right) => compareEntityIds(left.id, right.id));
