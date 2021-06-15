type CinemaData = {
  address: string;
  city: string;
  findMoreLink: string;
  id: string;
  name: string;
  postcode: string;
};

export type VenueFinderSearchData = {
  cinemas: CinemaData[];
};

type ComponentData = {
  componentType: string;
  id: string;
  props: VenueFinderSearchData | unknown;
};

type InitialiseData = {
  api: {
    authToken: string;
    url: string;
  };
};

export type InitData = {
  initData: {
    componentsData: ComponentData[];
    occInititialiseData: InitialiseData;
  };
};

export type ProviderData = {
  authToken: string;
  cinemaId: string;
  apiUrl: string;
};

export type FilmScreenings = {
  filmId: string;
};

export type FilmScreeningDates = {
  businessDate: string;
  filmScreenings: FilmScreenings[];
};

export type FilmScreeningDatesResponse = {
  filmScreeningDates: FilmScreeningDates[];
};

type Showtime = {
  id: string;
  attributeIds: string[];
  schedule: {
    startsAt: string;
  };
};

type CastAndCrew = {
  castAndCrewMemberId: string;
  roles: string[];
};

type Person = {
  id: string;
  name: {
    givenName: string;
    middleName: string | null;
    familyName: string;
  };
};

export type FilmPeople = Record<string, string>;

type Attribute = {
  id: string;
  shortName: { text: string };
};

export type AttributesMap = Record<string, string>;

type Film = {
  id: string;
  title: { text: string };
  castAndCrew: CastAndCrew[];
};

type RelatedData = {
  attributes: Attribute[];
  castAndCrew: Person[];
  films: Film[];
};

export type BusinessDateResponse = {
  businessDate: string;
  showtimes: Showtime[];
  relatedData: RelatedData;
};
