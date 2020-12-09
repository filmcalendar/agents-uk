export type Cinema = {
  Cinema_Id: string;
  CinemaName: string;
};

export type ProviderData = {
  cinemaId: string;
  urlThisWeek: string;
  urlComingSoon: string;
};

export type Experience = {
  Name: string;
};

export type Screening = {
  StartDateTime: string;
  SoldOut: boolean;
  NotBookable: boolean;
  SessionExpired: boolean;
  CinemaId: string;
  Scheduleid: string;
  Experience: Experience[];
};

export type ExperienceType = {
  Times: Screening[];
};

export type Session = {
  ExperienceTypes: ExperienceType[];
};

export type FilmData = {
  Title: string;
  FriendlyName: string;
  Director: string;
  Cast: string;
  Sessions: Session[];
  FilmData?: FilmData;
};
