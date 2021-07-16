export type Performance = {
  StartDate: string;
  StartTimeAndNotes: string;
  URL: string;
  IsSoldOut: 'N' | 'Y';
  IsSubtitled: 'N' | 'Y';
  IsSilverScreen: 'N' | 'Y';
  IsParentAndBaby: 'N' | 'Y';
  IsSupportive: 'N' | 'Y';
  PerformanceNotes: string;
};

export type Tag = {
  Format: string;
};

export type Film = {
  ID: number;
  URL: string;
  Title: string;
  Director: string;
  Cast: string;
  Year: string;
  Performances: Performance[];
  ImageURL: string;
  Tags: Tag[];
};

export type EventsData = {
  Events: { Events: Film[] };
};
