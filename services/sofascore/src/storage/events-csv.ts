import type {
  EventRecord,
  ManagerRecord,
  MatchRecord,
  PlayerRecord,
  TeamRecord
} from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;match;sort_order;team;player;related_player;manager;incident_type;incident_class;period;minute;added_time;reversed_period_time;is_home;impact_side;is_confirmed;is_rescinded;reason;description;is_injury;home_score;away_score;length;body_part;goal_type;situation;shot_type;player_x;player_y;pass_end_x;pass_end_y;shot_x;shot_y;goal_mouth_x;goal_mouth_y;goalkeeper_x;goalkeeper_y;source_id;source;edited";
const SOURCE = "sofascore" as const;

export const loadEvents = async (filePath: string): Promise<EventRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortEvents(rows.map((row) => normalizeEventRow(row)));
};

export const upsertEvents = (
  existingEvents: EventRecord[],
  incomingEvents: EventRecord[]
): EventRecord[] => {
  const events = [...existingEvents];

  for (const incomingEvent of incomingEvents) {
    const existingEventIndex = events.findIndex(
      (existingEvent) => existingEvent.source_id === incomingEvent.source_id
    );

    if (existingEventIndex === -1) {
      events.push(createEvent(incomingEvent));
      continue;
    }

    events[existingEventIndex] = syncEvent(events[existingEventIndex], incomingEvent);
  }

  return sortEvents(events);
};

export const relinkEventReferences = (
  events: EventRecord[],
  references: {
    matches: MatchRecord[];
    teams: TeamRecord[];
    players: PlayerRecord[];
    managers: ManagerRecord[];
  }
): EventRecord[] =>
  sortEvents(
    events
      .map((event) => {
        const linkedMatch = references.matches.find(
          (match) => match.id === event.match || match.source_id === event.match
        );
        const baseLinkedTeam =
          event.team === "home"
            ? linkedMatch?.home_team
            : event.team === "away"
              ? linkedMatch?.away_team
              : findReferenceId(references.teams, event.team, "source_id");
        const linkedPlayer = findReferenceId(references.players, event.player, "source_id");
        const linkedRelatedPlayer = findReferenceId(
          references.players,
          event.related_player,
          "source_id"
        );
        const linkedManager = findReferenceId(references.managers, event.manager, "source_id");
        const isPrimaryMatchManager =
          Boolean(linkedManager) &&
          (linkedManager === linkedMatch?.home_manager || linkedManager === linkedMatch?.away_manager);
        const linkedTeam =
          event.incident_type === "goal" && event.incident_class === "ownGoal"
            ? baseLinkedTeam === linkedMatch?.home_team
              ? linkedMatch?.away_team ?? baseLinkedTeam
              : baseLinkedTeam === linkedMatch?.away_team
                ? linkedMatch?.home_team ?? baseLinkedTeam
                : baseLinkedTeam
            : baseLinkedTeam;

        if (!linkedPlayer && linkedManager && !isPrimaryMatchManager) {
          return null;
        }

        if (!linkedPlayer && event.manager && !linkedManager) {
          return null;
        }

        return finalizeEvent({
          ...event,
          match: linkedMatch?.id ?? event.match,
          team: linkedTeam ?? event.team,
          player: linkedPlayer,
          related_player: linkedRelatedPlayer,
          manager: linkedManager
        });
      })
      .filter((event): event is EventRecord => event !== null)
  );

export const saveEvents = async (filePath: string, events: EventRecord[]): Promise<void> => {
  const rows = sortEvents(events).map((event) =>
    [
      event.id,
      event.match,
      event.sort_order,
      event.team,
      event.player,
      event.related_player,
      event.manager,
      event.incident_type,
      event.incident_class,
      event.period,
      event.minute,
      event.added_time,
      event.reversed_period_time,
      event.is_home,
      event.impact_side,
      event.is_confirmed,
      event.is_rescinded,
      event.reason,
      event.description,
      event.is_injury,
      event.home_score,
      event.away_score,
      event.length,
      event.body_part,
      event.goal_type,
      event.situation,
      event.shot_type,
      event.player_x,
      event.player_y,
      event.pass_end_x,
      event.pass_end_y,
      event.shot_x,
      event.shot_y,
      event.goal_mouth_x,
      event.goal_mouth_y,
      event.goalkeeper_x,
      event.goalkeeper_y,
      event.source_id,
      event.source,
      String(event.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeEventRow = (row: string): EventRecord => {
  const columns = row.split(";");
  const [
    id = "",
    match = "",
    sort_order = "",
    team = "",
    player = "",
    related_player = "",
    manager = "",
    incident_type = "",
    incident_class = "",
    period = "",
    minute = "",
    added_time = "",
    reversed_period_time = "",
    is_home = "",
    impact_side = "",
    is_confirmed = "",
    is_rescinded = "",
    reason = "",
    description = "",
    is_injury = "",
    home_score = "",
    away_score = "",
    length = "",
    body_part = "",
    goal_type = "",
    situation = "",
    shot_type = "",
    player_x = "",
    player_y = "",
    pass_end_x = "",
    pass_end_y = "",
    shot_x = "",
    shot_y = "",
    goal_mouth_x = "",
    goal_mouth_y = "",
    goalkeeper_x = "",
    goalkeeper_y = "",
    source_id = "",
    source = SOURCE,
    edited = "false"
  ] = columns;

  return finalizeEvent({
    id,
    match,
    sort_order,
    team,
    player,
    related_player,
    manager,
    incident_type,
    incident_class,
    period,
    minute,
    added_time,
    reversed_period_time,
    is_home,
    impact_side,
    is_confirmed,
    is_rescinded,
    reason,
    description,
    is_injury,
    home_score,
    away_score,
    length,
    body_part,
    goal_type,
    situation,
    shot_type,
    player_x,
    player_y,
    pass_end_x,
    pass_end_y,
    shot_x,
    shot_y,
    goal_mouth_x,
    goal_mouth_y,
    goalkeeper_x,
    goalkeeper_y,
    source_id,
    source: source === SOURCE ? SOURCE : SOURCE,
    edited: edited === "true"
  });
};

const createEvent = (event: EventRecord): EventRecord =>
  finalizeEvent({
    ...event,
    id: createEntityId(),
    source: SOURCE,
    edited: false
  });

const syncEvent = (existingEvent: EventRecord, incomingEvent: EventRecord): EventRecord => {
  if (existingEvent.edited) {
    return finalizeEvent({
      ...existingEvent,
      source_id: incomingEvent.source_id,
      source: SOURCE
    });
  }

  return finalizeEvent({
    ...existingEvent,
    match: incomingEvent.match,
    sort_order: incomingEvent.sort_order,
    team: incomingEvent.team,
    player: incomingEvent.player,
    related_player: incomingEvent.related_player,
    manager: incomingEvent.manager,
    incident_type: incomingEvent.incident_type,
    incident_class: incomingEvent.incident_class,
    period: incomingEvent.period,
    minute: incomingEvent.minute,
    added_time: incomingEvent.added_time,
    reversed_period_time: incomingEvent.reversed_period_time,
    is_home: incomingEvent.is_home,
    impact_side: incomingEvent.impact_side,
    is_confirmed: incomingEvent.is_confirmed,
    is_rescinded: incomingEvent.is_rescinded,
    reason: incomingEvent.reason,
    description: incomingEvent.description,
    is_injury: incomingEvent.is_injury,
    home_score: incomingEvent.home_score,
    away_score: incomingEvent.away_score,
    length: incomingEvent.length,
    body_part: incomingEvent.body_part,
    goal_type: incomingEvent.goal_type,
    situation: incomingEvent.situation,
    shot_type: incomingEvent.shot_type,
    player_x: incomingEvent.player_x,
    player_y: incomingEvent.player_y,
    pass_end_x: incomingEvent.pass_end_x,
    pass_end_y: incomingEvent.pass_end_y,
    shot_x: incomingEvent.shot_x,
    shot_y: incomingEvent.shot_y,
    goal_mouth_x: incomingEvent.goal_mouth_x,
    goal_mouth_y: incomingEvent.goal_mouth_y,
    goalkeeper_x: incomingEvent.goalkeeper_x,
    goalkeeper_y: incomingEvent.goalkeeper_y,
    source_id: incomingEvent.source_id,
    source: SOURCE
  });
};

const finalizeEvent = (event: EventRecord): EventRecord => ({
  id: event.id.trim() || createEntityId(),
  match: event.match.trim(),
  sort_order: event.sort_order.trim(),
  team: event.team.trim(),
  player: event.player.trim(),
  related_player: event.related_player.trim(),
  manager: event.manager.trim(),
  incident_type: event.incident_type.trim(),
  incident_class: event.incident_class.trim(),
  period: event.period.trim(),
  minute: event.minute.trim(),
  added_time: event.added_time.trim(),
  reversed_period_time: event.reversed_period_time.trim(),
  is_home: event.is_home.trim(),
  impact_side: event.impact_side.trim(),
  is_confirmed: event.is_confirmed.trim(),
  is_rescinded: event.is_rescinded.trim(),
  reason: event.reason.trim(),
  description: event.description.trim(),
  is_injury: event.is_injury.trim(),
  home_score: event.home_score.trim(),
  away_score: event.away_score.trim(),
  length: event.length.trim(),
  body_part: event.body_part.trim(),
  goal_type: event.goal_type.trim(),
  situation: event.situation.trim(),
  shot_type: event.shot_type.trim(),
  player_x: event.player_x.trim(),
  player_y: event.player_y.trim(),
  pass_end_x: event.pass_end_x.trim(),
  pass_end_y: event.pass_end_y.trim(),
  shot_x: event.shot_x.trim(),
  shot_y: event.shot_y.trim(),
  goal_mouth_x: event.goal_mouth_x.trim(),
  goal_mouth_y: event.goal_mouth_y.trim(),
  goalkeeper_x: event.goalkeeper_x.trim(),
  goalkeeper_y: event.goalkeeper_y.trim(),
  source_id: event.source_id.trim(),
  source: SOURCE,
  edited: event.edited
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
  if (!value) {
    return "";
  }

  const linkedRecord = records.find(
    (record) => record.id === value || String(record[sourceKey]) === value
  );

  return linkedRecord?.id ?? value;
};

const sortEvents = (events: EventRecord[]): EventRecord[] =>
  [...events].sort((left, right) => {
    const leftMatchOrder = `${left.match}:${left.sort_order.padStart(4, "0")}`;
    const rightMatchOrder = `${right.match}:${right.sort_order.padStart(4, "0")}`;
    const matchOrderComparison = leftMatchOrder.localeCompare(rightMatchOrder);

    if (matchOrderComparison !== 0) {
      return matchOrderComparison;
    }

    return compareEntityIds(left.id, right.id);
  });
