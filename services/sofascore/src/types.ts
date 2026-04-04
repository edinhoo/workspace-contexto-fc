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
  source: "sofascore";
  sourcetranslated: boolean;
};

export type TournamentRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
  primary_color: string;
  secondary_color: string;
  source_id: string;
  source_slug: string;
  source_name: string;
  source_primary_color: string;
  source_secondary_color: string;
  source: "sofascore";
  translated: boolean;
};

export type SeasonRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  year: string;
  tournament: string;
  source_id: string;
  source_name: string;
  source_year: string;
  source: "sofascore";
  translated: boolean;
};

export type CityRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
  source_name: string;
  source: "sofascore";
  edited: boolean;
};

export type StadiumRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  city: string;
  capacity: string;
  latitude: string;
  longitude: string;
  source_id: string;
  source: "sofascore";
  edited: boolean;
};

export type RefereeRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
  source_id: string;
  source: "sofascore";
  edited: boolean;
};

export type ManagerRecord = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
  source_id: string;
  source: "sofascore";
  edited: boolean;
};

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
  source_id: string;
  edited: boolean;
};

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
  source: "sofascore";
  source_id: string;
  edited: boolean;
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
  source_id: string;
  source: "sofascore";
  edited: boolean;
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

type SofascoreLineupPlayer = {
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
  homeFormation: string;
  awayFormation: string;
};
