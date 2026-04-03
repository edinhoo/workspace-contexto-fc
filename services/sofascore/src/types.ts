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
  sourcetranslated: boolean;
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
  category?: SofascoreCategory;
};

type SofascoreEvent = {
  tournament?: SofascoreTournament;
};

export type SofascoreEventResponse = {
  event?: SofascoreEvent;
};
