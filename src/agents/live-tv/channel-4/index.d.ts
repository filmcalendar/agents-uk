type ChannelId = 'C4' | 'E4' | 'M4' | 'F4' | '4S' | '4M' | '';

type Program = {
  isAudioDescribed: boolean;
  isMovie: 'true' | 'false';
  isSubtitled: boolean;
  slotId: string;
  startDate: string;
  summary: string;
  title: string;
  url: string;
};

export type Channel = {
  id: ChannelId;
  label: string;
  programmes: Program[];
};

type Date = {
  d: string;
  m: string;
  y: string;
};

export type DailyProgramme = {
  dates: Date[];
  channels: Record<ChannelId, Channel>;
};

export type ProviderData = {
  id: ChannelId;
  availableDates: string[];
  programs?: Program[];
};
