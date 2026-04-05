import type {
  MatchRecord,
  PlayerMatchStatRecord,
  PlayerRecord,
  TeamRecord
} from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;match;team;player;total_pass;accurate_pass;total_long_balls;accurate_long_balls;goal_assist;accurate_own_half_passes;total_own_half_passes;accurate_opposition_half_passes;total_opposition_half_passes;aerial_won;duel_won;total_clearance;ball_recovery;was_fouled;good_high_claim;saved_shots_from_inside_the_box;saves;punches;minutes_played;touches;rating;possession_lost_ctrl;expected_assists;total_ball_carries_distance;ball_carries_count;total_progression;keeper_save_value;rating_version_original;rating_version_alternative;total_shots;goals_prevented;pass_value_normalized;dribble_value_normalized;defensive_value_normalized;goalkeeper_value_normalized;statistics_type_sport_slug;statistics_type_name;aerial_lost;duel_lost;total_tackle;won_tackle;unsuccessful_touch;fouls;challenge_lost;outfielder_block;best_ball_carry_progression;total_progressive_ball_carries_distance;progressive_ball_carries_count;interception_won;total_cross;accurate_cross;dispossessed;big_chance_created;shot_off_target;blocked_scoring_attempt;total_offside;expected_goals;key_pass;shot_value_normalized;total_contest;won_contest;on_target_scoring_attempt;goals;expected_goals_on_target;total_keeper_sweeper;accurate_keeper_sweeper;own_goals;big_chance_missed;last_man_tackle;hit_woodwork;error_lead_to_a_shot;clearance_off_line;error_lead_to_a_goal;penalty_conceded;penalty_faced;penalty_won;penalty_miss;penalty_save;source_match_id;source_team_id;source_player_id;source;edited";
const SOURCE = "sofascore" as const;

export const loadPlayerMatchStats = async (
  filePath: string
): Promise<PlayerMatchStatRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortPlayerMatchStats(rows.map((row) => normalizePlayerMatchStatRow(header, row)));
};

export const upsertPlayerMatchStats = (
  existingStats: PlayerMatchStatRecord[],
  incomingStats: PlayerMatchStatRecord[]
): PlayerMatchStatRecord[] => {
  const stats = [...existingStats];

  for (const incomingStat of incomingStats) {
    const existingStatIndex = stats.findIndex(
      (existingStat) =>
        existingStat.source_match_id === incomingStat.source_match_id &&
        existingStat.source_team_id === incomingStat.source_team_id &&
        existingStat.source_player_id === incomingStat.source_player_id
    );

    if (existingStatIndex === -1) {
      stats.push(createPlayerMatchStat(incomingStat));
      continue;
    }

    stats[existingStatIndex] = syncPlayerMatchStat(stats[existingStatIndex], incomingStat);
  }

  return sortPlayerMatchStats(stats);
};

export const relinkPlayerMatchStatReferences = (
  stats: PlayerMatchStatRecord[],
  references: {
    matches: MatchRecord[];
    teams: TeamRecord[];
    players: PlayerRecord[];
  }
): PlayerMatchStatRecord[] =>
  sortPlayerMatchStats(
    stats.map((stat) =>
      finalizePlayerMatchStat({
        ...stat,
        match: findReferenceId(references.matches, stat.match, "source_ref"),
        team: findReferenceId(references.teams, stat.team, "source_ref"),
        player: findReferenceId(references.players, stat.player, "source_ref")
      })
    )
  );

export const savePlayerMatchStats = async (
  filePath: string,
  stats: PlayerMatchStatRecord[]
): Promise<void> => {
  const rows = sortPlayerMatchStats(stats).map((stat) =>
    [
      stat.id,
      stat.match,
      stat.team,
      stat.player,
      stat.total_pass,
      stat.accurate_pass,
      stat.total_long_balls,
      stat.accurate_long_balls,
      stat.goal_assist,
      stat.accurate_own_half_passes,
      stat.total_own_half_passes,
      stat.accurate_opposition_half_passes,
      stat.total_opposition_half_passes,
      stat.aerial_won,
      stat.duel_won,
      stat.total_clearance,
      stat.ball_recovery,
      stat.was_fouled,
      stat.good_high_claim,
      stat.saved_shots_from_inside_the_box,
      stat.saves,
      stat.punches,
      stat.minutes_played,
      stat.touches,
      stat.rating,
      stat.possession_lost_ctrl,
      stat.expected_assists,
      stat.total_ball_carries_distance,
      stat.ball_carries_count,
      stat.total_progression,
      stat.keeper_save_value,
      stat.rating_version_original,
      stat.rating_version_alternative,
      stat.total_shots,
      stat.goals_prevented,
      stat.pass_value_normalized,
      stat.dribble_value_normalized,
      stat.defensive_value_normalized,
      stat.goalkeeper_value_normalized,
      stat.statistics_type_sport_slug,
      stat.statistics_type_name,
      stat.aerial_lost,
      stat.duel_lost,
      stat.total_tackle,
      stat.won_tackle,
      stat.unsuccessful_touch,
      stat.fouls,
      stat.challenge_lost,
      stat.outfielder_block,
      stat.best_ball_carry_progression,
      stat.total_progressive_ball_carries_distance,
      stat.progressive_ball_carries_count,
      stat.interception_won,
      stat.total_cross,
      stat.accurate_cross,
      stat.dispossessed,
      stat.big_chance_created,
      stat.shot_off_target,
      stat.blocked_scoring_attempt,
      stat.total_offside,
      stat.expected_goals,
      stat.key_pass,
      stat.shot_value_normalized,
      stat.total_contest,
      stat.won_contest,
      stat.on_target_scoring_attempt,
      stat.goals,
      stat.expected_goals_on_target,
      stat.total_keeper_sweeper,
      stat.accurate_keeper_sweeper,
      stat.own_goals,
      stat.big_chance_missed,
      stat.last_man_tackle,
      stat.hit_woodwork,
      stat.error_lead_to_a_shot,
      stat.clearance_off_line,
      stat.error_lead_to_a_goal,
      stat.penalty_conceded,
      stat.penalty_faced,
      stat.penalty_won,
      stat.penalty_miss,
      stat.penalty_save,
      stat.source_match_id,
      stat.source_team_id,
      stat.source_player_id,
      stat.source,
      String(stat.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizePlayerMatchStatRow = (header: string, row: string[]): PlayerMatchStatRecord => {
  const [
    id = "",
    match = "",
    team = "",
    player = "",
    total_pass = "",
    accurate_pass = "",
    total_long_balls = "",
    accurate_long_balls = "",
    goal_assist = "",
    accurate_own_half_passes = "",
    total_own_half_passes = "",
    accurate_opposition_half_passes = "",
    total_opposition_half_passes = "",
    aerial_won = "",
    duel_won = "",
    total_clearance = "",
    ball_recovery = "",
    was_fouled = "",
    good_high_claim = "",
    saved_shots_from_inside_the_box = "",
    saves = "",
    punches = "",
    minutes_played = "",
    touches = "",
    rating = "",
    possession_lost_ctrl = "",
    expected_assists = "",
    total_ball_carries_distance = "",
    ball_carries_count = "",
    total_progression = "",
    keeper_save_value = "",
    rating_version_original = "",
    rating_version_alternative = "",
    total_shots = "",
    goals_prevented = "",
    pass_value_normalized = "",
    dribble_value_normalized = "",
    defensive_value_normalized = "",
    goalkeeper_value_normalized = "",
    statistics_type_sport_slug = "",
    statistics_type_name = "",
    aerial_lost = "",
    duel_lost = "",
    total_tackle = "",
    won_tackle = "",
    unsuccessful_touch = "",
    fouls = "",
    challenge_lost = "",
    outfielder_block = "",
    best_ball_carry_progression = "",
    total_progressive_ball_carries_distance = "",
    progressive_ball_carries_count = "",
    interception_won = "",
    total_cross = "",
    accurate_cross = "",
    dispossessed = "",
    big_chance_created = "",
    shot_off_target = "",
    blocked_scoring_attempt = "",
    total_offside = "",
    expected_goals = "",
    key_pass = "",
    shot_value_normalized = "",
    total_contest = "",
    won_contest = "",
    on_target_scoring_attempt = "",
    goals = "",
    expected_goals_on_target = "",
    total_keeper_sweeper = "",
    accurate_keeper_sweeper = "",
    own_goals = "",
    big_chance_missed = "",
    last_man_tackle = "",
    hit_woodwork = "",
    error_lead_to_a_shot = "",
    clearance_off_line = "",
    error_lead_to_a_goal = "",
    penalty_conceded = "",
    penalty_faced = "",
    penalty_won = "",
    penalty_miss = "",
    penalty_save = "",
    legacyOrSourceMatchId = "",
    legacyOrSourceTeamId = "",
    legacyOrSourcePlayerId = "",
    source = SOURCE,
    edited = "false"
  ] = row;

  const isLegacyHeader = header.includes("source_ref;source;edited");
  const [source_match_id, source_team_id, source_player_id] = isLegacyHeader
    ? parseLegacyCompositeSourceRef(legacyOrSourceMatchId)
    : [legacyOrSourceMatchId, legacyOrSourceTeamId, legacyOrSourcePlayerId];

  return finalizePlayerMatchStat({
    id,
    match,
    team,
    player,
    total_pass,
    accurate_pass,
    total_long_balls,
    accurate_long_balls,
    goal_assist,
    accurate_own_half_passes,
    total_own_half_passes,
    accurate_opposition_half_passes,
    total_opposition_half_passes,
    aerial_won,
    duel_won,
    total_clearance,
    ball_recovery,
    was_fouled,
    good_high_claim,
    saved_shots_from_inside_the_box,
    saves,
    punches,
    minutes_played,
    touches,
    rating,
    possession_lost_ctrl,
    expected_assists,
    total_ball_carries_distance,
    ball_carries_count,
    total_progression,
    keeper_save_value,
    rating_version_original,
    rating_version_alternative,
    total_shots,
    goals_prevented,
    pass_value_normalized,
    dribble_value_normalized,
    defensive_value_normalized,
    goalkeeper_value_normalized,
    statistics_type_sport_slug,
    statistics_type_name,
    aerial_lost,
    duel_lost,
    total_tackle,
    won_tackle,
    unsuccessful_touch,
    fouls,
    challenge_lost,
    outfielder_block,
    best_ball_carry_progression,
    total_progressive_ball_carries_distance,
    progressive_ball_carries_count,
    interception_won,
    total_cross,
    accurate_cross,
    dispossessed,
    big_chance_created,
    shot_off_target,
    blocked_scoring_attempt,
    total_offside,
    expected_goals,
    key_pass,
    shot_value_normalized,
    total_contest,
    won_contest,
    on_target_scoring_attempt,
    goals,
    expected_goals_on_target,
    total_keeper_sweeper,
    accurate_keeper_sweeper,
    own_goals,
    big_chance_missed,
    last_man_tackle,
    hit_woodwork,
    error_lead_to_a_shot,
    clearance_off_line,
    error_lead_to_a_goal,
    penalty_conceded,
    penalty_faced,
    penalty_won,
    penalty_miss,
    penalty_save,
    source_match_id,
    source_team_id,
    source_player_id,
    source: source === SOURCE ? SOURCE : SOURCE,
    edited: edited === "true"
  });
};

const createPlayerMatchStat = (stat: PlayerMatchStatRecord): PlayerMatchStatRecord =>
  finalizePlayerMatchStat({
    ...stat,
    id: createEntityId(),
    source: SOURCE,
    edited: false
  });

const syncPlayerMatchStat = (
  existingStat: PlayerMatchStatRecord,
  incomingStat: PlayerMatchStatRecord
): PlayerMatchStatRecord => {
  if (existingStat.edited) {
    return finalizePlayerMatchStat({
      ...existingStat,
      source_match_id: incomingStat.source_match_id,
      source_team_id: incomingStat.source_team_id,
      source_player_id: incomingStat.source_player_id,
      source: SOURCE
    });
  }

  return finalizePlayerMatchStat({
    ...incomingStat,
    id: existingStat.id,
    source: SOURCE,
    edited: false
  });
};

const finalizePlayerMatchStat = (
  stat: PlayerMatchStatRecord
): PlayerMatchStatRecord => ({
  ...stat,
  id: stat.id.trim() || createEntityId(),
  match: stat.match.trim(),
  team: stat.team.trim(),
  player: stat.player.trim(),
  total_pass: stat.total_pass.trim(),
  accurate_pass: stat.accurate_pass.trim(),
  total_long_balls: stat.total_long_balls.trim(),
  accurate_long_balls: stat.accurate_long_balls.trim(),
  goal_assist: stat.goal_assist.trim(),
  accurate_own_half_passes: stat.accurate_own_half_passes.trim(),
  total_own_half_passes: stat.total_own_half_passes.trim(),
  accurate_opposition_half_passes: stat.accurate_opposition_half_passes.trim(),
  total_opposition_half_passes: stat.total_opposition_half_passes.trim(),
  aerial_won: stat.aerial_won.trim(),
  duel_won: stat.duel_won.trim(),
  total_clearance: stat.total_clearance.trim(),
  ball_recovery: stat.ball_recovery.trim(),
  was_fouled: stat.was_fouled.trim(),
  good_high_claim: stat.good_high_claim.trim(),
  saved_shots_from_inside_the_box: stat.saved_shots_from_inside_the_box.trim(),
  saves: stat.saves.trim(),
  punches: stat.punches.trim(),
  minutes_played: stat.minutes_played.trim(),
  touches: stat.touches.trim(),
  rating: stat.rating.trim(),
  possession_lost_ctrl: stat.possession_lost_ctrl.trim(),
  expected_assists: stat.expected_assists.trim(),
  total_ball_carries_distance: stat.total_ball_carries_distance.trim(),
  ball_carries_count: stat.ball_carries_count.trim(),
  total_progression: stat.total_progression.trim(),
  keeper_save_value: stat.keeper_save_value.trim(),
  rating_version_original: stat.rating_version_original.trim(),
  rating_version_alternative: stat.rating_version_alternative.trim(),
  total_shots: stat.total_shots.trim(),
  goals_prevented: stat.goals_prevented.trim(),
  pass_value_normalized: stat.pass_value_normalized.trim(),
  dribble_value_normalized: stat.dribble_value_normalized.trim(),
  defensive_value_normalized: stat.defensive_value_normalized.trim(),
  goalkeeper_value_normalized: stat.goalkeeper_value_normalized.trim(),
  statistics_type_sport_slug: stat.statistics_type_sport_slug.trim(),
  statistics_type_name: stat.statistics_type_name.trim(),
  aerial_lost: stat.aerial_lost.trim(),
  duel_lost: stat.duel_lost.trim(),
  total_tackle: stat.total_tackle.trim(),
  won_tackle: stat.won_tackle.trim(),
  unsuccessful_touch: stat.unsuccessful_touch.trim(),
  fouls: stat.fouls.trim(),
  challenge_lost: stat.challenge_lost.trim(),
  outfielder_block: stat.outfielder_block.trim(),
  best_ball_carry_progression: stat.best_ball_carry_progression.trim(),
  total_progressive_ball_carries_distance:
    stat.total_progressive_ball_carries_distance.trim(),
  progressive_ball_carries_count: stat.progressive_ball_carries_count.trim(),
  interception_won: stat.interception_won.trim(),
  total_cross: stat.total_cross.trim(),
  accurate_cross: stat.accurate_cross.trim(),
  dispossessed: stat.dispossessed.trim(),
  big_chance_created: stat.big_chance_created.trim(),
  shot_off_target: stat.shot_off_target.trim(),
  blocked_scoring_attempt: stat.blocked_scoring_attempt.trim(),
  total_offside: stat.total_offside.trim(),
  expected_goals: stat.expected_goals.trim(),
  key_pass: stat.key_pass.trim(),
  shot_value_normalized: stat.shot_value_normalized.trim(),
  total_contest: stat.total_contest.trim(),
  won_contest: stat.won_contest.trim(),
  on_target_scoring_attempt: stat.on_target_scoring_attempt.trim(),
  goals: stat.goals.trim(),
  expected_goals_on_target: stat.expected_goals_on_target.trim(),
  total_keeper_sweeper: stat.total_keeper_sweeper.trim(),
  accurate_keeper_sweeper: stat.accurate_keeper_sweeper.trim(),
  own_goals: stat.own_goals.trim(),
  big_chance_missed: stat.big_chance_missed.trim(),
  last_man_tackle: stat.last_man_tackle.trim(),
  hit_woodwork: stat.hit_woodwork.trim(),
  error_lead_to_a_shot: stat.error_lead_to_a_shot.trim(),
  clearance_off_line: stat.clearance_off_line.trim(),
  error_lead_to_a_goal: stat.error_lead_to_a_goal.trim(),
  penalty_conceded: stat.penalty_conceded.trim(),
  penalty_faced: stat.penalty_faced.trim(),
  penalty_won: stat.penalty_won.trim(),
  penalty_miss: stat.penalty_miss.trim(),
  penalty_save: stat.penalty_save.trim(),
  source_match_id: stat.source_match_id.trim(),
  source_team_id: stat.source_team_id.trim(),
  source_player_id: stat.source_player_id.trim(),
  source: SOURCE,
  edited: stat.edited
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

const sortPlayerMatchStats = (
  stats: PlayerMatchStatRecord[]
): PlayerMatchStatRecord[] =>
  [...stats].sort((left, right) => compareEntityIds(left.id, right.id));
