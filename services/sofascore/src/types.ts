type SyncAuditRecord = {
  source: "sofascore";
  source_ref: string;
  first_scraped_at?: string;
  last_scraped_at?: string;
  created_at?: string;
  updated_at?: string;
  edited?: boolean;
  translated?: boolean;
  sourcetranslated?: boolean;
};

export type CountryRecord = {
  id: string;
  slug: string;
  name: string;
  code2: string;
  code3: string;
  source_slug: string;
  source_code2: string;
  source_code3: string;
  source_name: string;
} & SyncAuditRecord;

export type TournamentRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
  primary_color: string;
  secondary_color: string;
  source_ref: string;
  source_slug: string;
  source_name: string;
  source_primary_color: string;
  source_secondary_color: string;
} & SyncAuditRecord;

export type SeasonRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  year: string;
  tournament: string;
  source_ref: string;
  source_name: string;
  source_year: string;
} & SyncAuditRecord;

export type CityRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
  source_name: string;
} & SyncAuditRecord;

export type StadiumRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  city: string;
  capacity: string;
  latitude: string;
  longitude: string;
} & SyncAuditRecord;

export type RefereeRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
} & SyncAuditRecord;

export type ManagerRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
} & SyncAuditRecord;

export type TeamRecord = {
  id: string;
  slug: string;
  name: string;
  code3: string;
  short_name: string;
  complete_name: string;
  stadium: string;
  foundation: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
} & SyncAuditRecord;

export type PlayerRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  country: string;
  date_of_birth: string;
} & SyncAuditRecord;

export type PlayerCareerTeamRecord = {
  id: string;
  player: string;
  team: string;
  source_player_id: string;
  source_team_id: string;
  source: "sofascore";
  first_scraped_at?: string;
  last_scraped_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type MatchRecord = {
  id: string;
  tournament: string;
  season: string;
  round: string;
  stadium: string;
  referee: string;
  home_team: string;
  home_manager: string;
  home_formation: string;
  home_score_period_1: string;
  home_score_period_2: string;
  home_score_normaltime: string;
  home_score_extra_1: string;
  home_score_extra_2: string;
  home_score_overtime: string;
  home_score_penalties: string;
  away_team: string;
  away_manager: string;
  away_formation: string;
  away_score_period_1: string;
  away_score_period_2: string;
  away_score_normaltime: string;
  away_score_extra_1: string;
  away_score_extra_2: string;
  away_score_overtime: string;
  away_score_penalties: string;
  start_time: string;
  period_start_time: string;
  injury_time_1: string;
  injury_time_2: string;
  injury_time_3: string;
  injury_time_4: string;
} & SyncAuditRecord;

export type EventRecord = {
  id: string;
  match: string;
  sort_order: string;
  team: string;
  player: string;
  related_player: string;
  manager: string;
  incident_type: string;
  incident_class: string;
  period: string;
  minute: string;
  added_time: string;
  reversed_period_time: string;
  is_home: string;
  impact_side: string;
  is_confirmed: string;
  is_rescinded: string;
  reason: string;
  description: string;
  is_injury: string;
  home_score: string;
  away_score: string;
  length: string;
  body_part: string;
  goal_type: string;
  situation: string;
  shot_type: string;
  player_x: string;
  player_y: string;
  pass_end_x: string;
  pass_end_y: string;
  shot_x: string;
  shot_y: string;
  goal_mouth_x: string;
  goal_mouth_y: string;
  goalkeeper_x: string;
  goalkeeper_y: string;
  source_match_id: string;
  source_incident_id: string;
  source: "sofascore";
  edited?: boolean;
};

export type LineupRecord = {
  id: string;
  match: string;
  team: string;
  player: string;
  jersey_number: string;
  position: string;
  substitute: string;
  is_missing: string;
  slot: string;
  minutes_played: string;
  rating: string;
  source_match_id: string;
  source_team_id: string;
  source_player_id: string;
  source: "sofascore";
  edited?: boolean;
};

export type PlayerMatchStatRecord = {
  id: string;
  match: string;
  team: string;
  player: string;
  total_pass: string;
  accurate_pass: string;
  total_long_balls: string;
  accurate_long_balls: string;
  goal_assist: string;
  accurate_own_half_passes: string;
  total_own_half_passes: string;
  accurate_opposition_half_passes: string;
  total_opposition_half_passes: string;
  aerial_won: string;
  duel_won: string;
  total_clearance: string;
  ball_recovery: string;
  was_fouled: string;
  good_high_claim: string;
  saved_shots_from_inside_the_box: string;
  saves: string;
  punches: string;
  minutes_played: string;
  touches: string;
  rating: string;
  possession_lost_ctrl: string;
  expected_assists: string;
  total_ball_carries_distance: string;
  ball_carries_count: string;
  total_progression: string;
  keeper_save_value: string;
  rating_version_original: string;
  rating_version_alternative: string;
  total_shots: string;
  goals_prevented: string;
  pass_value_normalized: string;
  dribble_value_normalized: string;
  defensive_value_normalized: string;
  goalkeeper_value_normalized: string;
  statistics_type_sport_slug: string;
  statistics_type_name: string;
  aerial_lost: string;
  duel_lost: string;
  total_tackle: string;
  won_tackle: string;
  unsuccessful_touch: string;
  fouls: string;
  challenge_lost: string;
  outfielder_block: string;
  best_ball_carry_progression: string;
  total_progressive_ball_carries_distance: string;
  progressive_ball_carries_count: string;
  interception_won: string;
  total_cross: string;
  accurate_cross: string;
  dispossessed: string;
  big_chance_created: string;
  shot_off_target: string;
  blocked_scoring_attempt: string;
  total_offside: string;
  expected_goals: string;
  key_pass: string;
  shot_value_normalized: string;
  total_contest: string;
  won_contest: string;
  on_target_scoring_attempt: string;
  goals: string;
  expected_goals_on_target: string;
  total_keeper_sweeper: string;
  accurate_keeper_sweeper: string;
  own_goals: string;
  big_chance_missed: string;
  last_man_tackle: string;
  hit_woodwork: string;
  error_lead_to_a_shot: string;
  clearance_off_line: string;
  error_lead_to_a_goal: string;
  penalty_conceded: string;
  penalty_faced: string;
  penalty_won: string;
  penalty_miss: string;
  penalty_save: string;
  source_match_id: string;
  source_team_id: string;
  source_player_id: string;
  source: "sofascore";
  edited?: boolean;
};

export type TeamMatchStatRecord = {
  id: string;
  match: string;
  team: string;
  total_pass: string;
  accurate_pass: string;
  total_long_balls: string;
  accurate_long_balls: string;
  goal_assist: string;
  accurate_own_half_passes: string;
  total_own_half_passes: string;
  accurate_opposition_half_passes: string;
  total_opposition_half_passes: string;
  aerial_won: string;
  duel_won: string;
  total_clearance: string;
  ball_recovery: string;
  was_fouled: string;
  good_high_claim: string;
  saved_shots_from_inside_the_box: string;
  saves: string;
  punches: string;
  minutes_played: string;
  touches: string;
  rating: string;
  possession_lost_ctrl: string;
  expected_assists: string;
  total_ball_carries_distance: string;
  ball_carries_count: string;
  total_progression: string;
  keeper_save_value: string;
  rating_version_original: string;
  rating_version_alternative: string;
  total_shots: string;
  goals_prevented: string;
  pass_value_normalized: string;
  dribble_value_normalized: string;
  defensive_value_normalized: string;
  goalkeeper_value_normalized: string;
  statistics_type_sport_slug: string;
  statistics_type_name: string;
  aerial_lost: string;
  duel_lost: string;
  total_tackle: string;
  won_tackle: string;
  unsuccessful_touch: string;
  fouls: string;
  challenge_lost: string;
  outfielder_block: string;
  best_ball_carry_progression: string;
  total_progressive_ball_carries_distance: string;
  progressive_ball_carries_count: string;
  interception_won: string;
  total_cross: string;
  accurate_cross: string;
  dispossessed: string;
  big_chance_created: string;
  shot_off_target: string;
  blocked_scoring_attempt: string;
  total_offside: string;
  expected_goals: string;
  key_pass: string;
  shot_value_normalized: string;
  total_contest: string;
  won_contest: string;
  on_target_scoring_attempt: string;
  goals: string;
  expected_goals_on_target: string;
  total_keeper_sweeper: string;
  accurate_keeper_sweeper: string;
  own_goals: string;
  big_chance_missed: string;
  last_man_tackle: string;
  hit_woodwork: string;
  error_lead_to_a_shot: string;
  clearance_off_line: string;
  error_lead_to_a_goal: string;
  penalty_conceded: string;
  penalty_faced: string;
  penalty_won: string;
  penalty_miss: string;
  penalty_save: string;
  source_match_id: string;
  source_team_id: string;
  source: "sofascore";
  edited?: boolean;
};

type SofascoreCountry = {
  id: number;
  name: string;
  slug: string;
  alpha2?: string;
  alpha3?: string;
};

type SofascoreCategory = {
  country?: SofascoreCountry;
};

type SofascoreTournament = {
  name: string;
  slug: string;
  category?: SofascoreCategory;
  uniqueTournament?: {
    id: number;
    primaryColorHex?: string;
    secondaryColorHex?: string;
  };
};

type SofascoreEvent = {
  homeTeam?: {
    id: number;
    name: string;
    slug: string;
    shortName?: string;
    nameCode?: string;
    fullName?: string;
    foundationDateTimestamp?: number;
    teamColors?: {
      primary?: string;
      secondary?: string;
      text?: string;
    };
    country?: SofascoreCountry;
    venue?: {
      id?: number;
      slug?: string;
      name?: string;
      capacity?: number;
      venueCoordinates?: {
        latitude?: number;
        longitude?: number;
      };
      country?: SofascoreCountry;
      city?: {
        name: string;
      };
      stadium?: {
        name?: string;
        capacity?: number;
      };
    };
    manager?: {
      id: number;
      name: string;
      slug: string;
      shortName?: string;
      country?: SofascoreCountry;
    };
  };
  awayTeam?: {
    id: number;
    name: string;
    slug: string;
    shortName?: string;
    nameCode?: string;
    fullName?: string;
    foundationDateTimestamp?: number;
    teamColors?: {
      primary?: string;
      secondary?: string;
      text?: string;
    };
    country?: SofascoreCountry;
    venue?: {
      id?: number;
      slug?: string;
      name?: string;
      capacity?: number;
      venueCoordinates?: {
        latitude?: number;
        longitude?: number;
      };
      country?: SofascoreCountry;
      city?: {
        name: string;
      };
      stadium?: {
        name?: string;
        capacity?: number;
      };
    };
    manager?: {
      id: number;
      name: string;
      slug: string;
      shortName?: string;
      country?: SofascoreCountry;
    };
  };
  tournament?: SofascoreTournament;
  season?: {
    id: number;
    name: string;
    year?: string;
  };
  roundInfo?: {
    round?: number;
  };
  venue?: {
    id?: number;
    slug?: string;
    name?: string;
    capacity?: number;
    venueCoordinates?: {
      latitude?: number;
      longitude?: number;
    };
    country?: {
      alpha2?: string;
      alpha3?: string;
      name: string;
      slug: string;
    };
    city?: {
      name: string;
    };
    stadium?: {
      name?: string;
      capacity?: number;
    };
  };
  referee?: {
    id: number;
    name: string;
      slug: string;
      country?: {
        alpha2?: string;
        alpha3?: string;
        name: string;
        slug: string;
      };
  };
  homeScore?: {
    period1?: number;
    period2?: number;
    normaltime?: number;
    extra1?: number;
    extra2?: number;
    overtime?: number;
    penalties?: number;
  };
  awayScore?: {
    period1?: number;
    period2?: number;
    normaltime?: number;
    extra1?: number;
    extra2?: number;
    overtime?: number;
    penalties?: number;
  };
  time?: {
    injuryTime1?: number;
    injuryTime2?: number;
    injuryTime3?: number;
    injuryTime4?: number;
    currentPeriodStartTimestamp?: number;
  };
  id?: number;
  startTimestamp?: number;
  currentPeriodStartTimestamp?: number;
};

export type SofascoreEventResponse = {
  event?: SofascoreEvent;
};

export type SofascoreLineupStatistics = {
  totalPass?: number;
  accuratePass?: number;
  totalLongBalls?: number;
  accurateLongBalls?: number;
  goalAssist?: number;
  accurateOwnHalfPasses?: number;
  totalOwnHalfPasses?: number;
  accurateOppositionHalfPasses?: number;
  totalOppositionHalfPasses?: number;
  aerialWon?: number;
  duelWon?: number;
  totalClearance?: number;
  ballRecovery?: number;
  wasFouled?: number;
  goodHighClaim?: number;
  savedShotsFromInsideTheBox?: number;
  saves?: number;
  punches?: number;
  minutesPlayed?: number;
  touches?: number;
  rating?: number;
  possessionLostCtrl?: number;
  expectedAssists?: number;
  totalBallCarriesDistance?: number;
  ballCarriesCount?: number;
  totalProgression?: number;
  keeperSaveValue?: number;
  ratingVersions?: {
    original?: number;
    alternative?: number;
  };
  totalShots?: number;
  goalsPrevented?: number;
  passValueNormalized?: number;
  dribbleValueNormalized?: number;
  defensiveValueNormalized?: number;
  goalkeeperValueNormalized?: number;
  statisticsType?: {
    sportSlug?: string;
    statisticsType?: string;
  };
  aerialLost?: number;
  duelLost?: number;
  totalTackle?: number;
  wonTackle?: number;
  unsuccessfulTouch?: number;
  fouls?: number;
  challengeLost?: number;
  outfielderBlock?: number;
  bestBallCarryProgression?: number;
  totalProgressiveBallCarriesDistance?: number;
  progressiveBallCarriesCount?: number;
  interceptionWon?: number;
  totalCross?: number;
  accurateCross?: number;
  dispossessed?: number;
  bigChanceCreated?: number;
  shotOffTarget?: number;
  blockedScoringAttempt?: number;
  totalOffside?: number;
  expectedGoals?: number;
  keyPass?: number;
  shotValueNormalized?: number;
  totalContest?: number;
  wonContest?: number;
  onTargetScoringAttempt?: number;
  goals?: number;
  expectedGoalsOnTarget?: number;
  totalKeeperSweeper?: number;
  accurateKeeperSweeper?: number;
  ownGoals?: number;
  bigChanceMissed?: number;
  lastManTackle?: number;
  hitWoodwork?: number;
  errorLeadToAShot?: number;
  clearanceOffLine?: number;
  errorLeadToAGoal?: number;
  penaltyConceded?: number;
  penaltyFaced?: number;
  penaltyWon?: number;
  penaltyMiss?: number;
  penaltySave?: number;
};

export type SofascoreLineupPlayer = {
  player?: {
    id?: number;
    name?: string;
    firstName?: string;
    lastName?: string;
    slug?: string;
    shortName?: string;
    position?: string;
    height?: number;
    country?: SofascoreCountry;
    dateOfBirthTimestamp?: number;
  };
  teamId?: number;
  shirtNumber?: number;
  jerseyNumber?: string;
  position?: string;
  substitute?: boolean;
  type?: string;
  reason?: number;
  externalType?: number;
  statistics?: SofascoreLineupStatistics;
};

export type SofascoreLineupsResponse = {
  confirmed?: boolean;
  home?: {
    players?: SofascoreLineupPlayer[];
    missingPlayers?: SofascoreLineupPlayer[];
    formation?: string;
  };
  away?: {
    players?: SofascoreLineupPlayer[];
    missingPlayers?: SofascoreLineupPlayer[];
    formation?: string;
  };
};

export type SofascoreAveragePositionsResponse = {
  home?: Array<{
    player?: {
      id?: number;
    };
    averageX?: number;
    averageY?: number;
    pointsCount?: number;
  }>;
  away?: Array<{
    player?: {
      id?: number;
    };
    averageX?: number;
    averageY?: number;
    pointsCount?: number;
  }>;
};

export type SofascoreIncidentPlayer = {
  id?: number;
  name?: string;
  slug?: string;
  shortName?: string;
};

export type SofascoreFootballPassingAction = {
  player?: SofascoreIncidentPlayer;
  eventType?: string;
  isAssist?: boolean;
  bodyPart?: string;
  goalType?: string;
  playerCoordinates?: {
    x?: number;
    y?: number;
  };
  passEndCoordinates?: {
    x?: number;
    y?: number;
  };
  goalShotCoordinates?: {
    x?: number;
    y?: number;
  };
  goalMouthCoordinates?: {
    x?: number;
    y?: number;
  };
  gkCoordinates?: {
    x?: number;
    y?: number;
  };
};

export type SofascoreIncident = {
  id?: number;
  incidentType?: string;
  incidentClass?: string;
  text?: string;
  time?: number;
  addedTime?: number;
  reversedPeriodTime?: number;
  isHome?: boolean;
  isLive?: boolean;
  confirmed?: boolean;
  rescinded?: boolean;
  reason?: string;
  description?: string;
  injury?: boolean;
  length?: number;
  from?: string;
  homeScore?: number;
  awayScore?: number;
  player?: SofascoreIncidentPlayer;
  assist1?: SofascoreIncidentPlayer;
  playerIn?: SofascoreIncidentPlayer;
  playerOut?: SofascoreIncidentPlayer;
  manager?: {
    id?: number;
    name?: string;
    slug?: string;
    shortName?: string;
  };
  footballPassingNetworkAction?: SofascoreFootballPassingAction[];
};

export type SofascoreIncidentsResponse = {
  incidents?: SofascoreIncident[];
};

export type SofascoreShotmapItem = {
  id?: number;
  time?: number;
  addedTime?: number;
  isHome?: boolean;
  shotType?: string;
  goalType?: string;
  situation?: string;
  bodyPart?: string;
  player?: SofascoreIncidentPlayer;
  playerCoordinates?: {
    x?: number;
    y?: number;
    z?: number;
  };
  goalMouthCoordinates?: {
    x?: number;
    y?: number;
    z?: number;
  };
};

export type SofascoreShotmapResponse = {
  shotmap?: SofascoreShotmapItem[];
};

export type SofascorePlayerCareerSeason = {
  startYear?: number;
  endYear?: number;
  team?: {
    id?: number;
    name?: string;
    slug?: string;
    shortName?: string;
    nameCode?: string;
    teamColors?: {
      primary?: string;
      secondary?: string;
      text?: string;
    };
  };
};

export type SofascorePlayerCareerResponse = {
  seasons?: SofascorePlayerCareerSeason[];
  typesMap?: Record<string, unknown>;
};

export type EventMetadata = {
  countries: CountryRecord[];
  tournament: TournamentRecord | null;
  season: SeasonRecord | null;
  cities: CityRecord[];
  stadiums: StadiumRecord[];
  referee: RefereeRecord | null;
  managers: ManagerRecord[];
  teams: TeamRecord[];
  match: MatchRecord | null;
};

export type EventLineupsMetadata = {
  countries: CountryRecord[];
  players: PlayerRecord[];
  lineups: LineupRecord[];
  playerMatchStats: PlayerMatchStatRecord[];
  homeFormation: string;
  awayFormation: string;
};

export type EventIncidentsMetadata = {
  events: EventRecord[];
};

export type PlayerCareerMetadata = {
  teams: TeamRecord[];
  playerCareerTeams: PlayerCareerTeamRecord[];
};
