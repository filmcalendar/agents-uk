export type ArticleContext = {
  searchNames: string[];
  searchResults: string[][];
};

export type LocalPageData = {
  createSearchMapping: () => null;
  tsAddReadyEvent: () => null;
  articleContext?: ArticleContext;
};

export type Event = {
  id: string;
  venue_group: string;
  keywords: string;
  start_date: string;
  short_description: string;
  availability_status: 'S' | 'G';
};
