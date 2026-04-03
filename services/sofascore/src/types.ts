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
  tournament?: SofascoreTournament;
  season?: {
    id: number;
    name: string;
    year?: string;
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
};

export type SofascoreEventResponse = {
  event?: SofascoreEvent;
};

export type EventMetadata = {
  country: CountryRecord | null;
  tournament: TournamentRecord | null;
  season: SeasonRecord | null;
  city: CityRecord | null;
  stadium: StadiumRecord | null;
  referee: RefereeRecord | null;
};
