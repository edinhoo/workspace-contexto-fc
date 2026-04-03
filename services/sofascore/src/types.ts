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
};

export type SofascoreEventResponse = {
  event?: SofascoreEvent;
};

export type EventMetadata = {
  country: CountryRecord | null;
  tournament: TournamentRecord | null;
};
