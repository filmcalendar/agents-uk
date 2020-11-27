export type Event = {
  date: string;
  type: 'Events';
  title: string;
  description: string;
  imageURL: string;
  bookingurl: string;
  url: string;
};

export type ProgrammeData = {
  eventsInline: Event[];
};
