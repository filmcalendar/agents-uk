import dtFormat from 'date-fns/format';
import fletch from '@tuplo/fletch';
import type * as FC from '@filmcalendar/types';

import type * as C4 from './index.d';

type GetAvailableDatesFn = (data: C4.DailyProgramme) => string[];
export const getAvailableDates: GetAvailableDatesFn = (data) => {
  const { dates = [] } = data;
  const today = new Date(Date.now());

  return dates
    .map((date) => {
      const { y, m, d } = date;
      return new Date(`${y}-${m}-${d}`);
    })
    .filter((date) => date >= today)
    .map((date) => dtFormat(date, 'y-MM-dd'));
};

export type TrimProgramFn = (program: C4.Program) => C4.Program;
export const trimProgram: TrimProgramFn = (program) => {
  const {
    isMovie,
    slotId,
    startDate,
    summary,
    title,
    url,
    isAudioDescribed,
    isSubtitled,
  } = program;
  return {
    isMovie,
    slotId,
    startDate,
    summary,
    title,
    url,
    isAudioDescribed,
    isSubtitled,
  };
};

export type GetDailyProgrammeParams = { channelId: C4.ChannelId; date: string };
type GetDailyProgrammeFn = (
  params: GetDailyProgrammeParams
) => Promise<C4.Program[]>;
export const getDailyProgramme: GetDailyProgrammeFn = async (params) => {
  const { channelId, date } = params;
  const strDate = dtFormat(new Date(date), 'y/MM/dd');
  const url = `https://www.channel4.com/tv-guide/api/${strDate}`;

  const { channels } = await fletch.json<C4.DailyProgramme>(url);
  const { programmes = [] } = channels[channelId] as C4.Channel;

  return programmes.filter((program) => program.isMovie === 'true');
};

type GetSlotIdFromUrlFn = (url: string) => string;
export const getSlotIdFromUrl: GetSlotIdFromUrlFn = (url) => {
  const [, slotId] = /(\d+)$/.exec(url) || ['', ''];
  return slotId;
};

type GetYearFn = (program: C4.Program) => number;
export const getYear: GetYearFn = (program) => {
  const { summary } = program;
  const [, year] = /^\((\d{4})\)/.exec(summary) || ['', ''];

  return Number(year);
};

type GetSessionsFn = (program: C4.Program) => FC.Agent.Session[];
export const getSessions: GetSessionsFn = (program) => {
  const { startDate, isAudioDescribed, isSubtitled, url } = program;
  const attributes = [
    isAudioDescribed && 'audio-described',
    isSubtitled && 'subtitled',
  ].filter(Boolean) as string[];

  return [
    {
      dateTime: startDate,
      link: `https://www.channel4.com${url}`,
      attributes,
    },
  ];
};
