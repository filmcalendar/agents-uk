import dtFormat from 'date-fns/format';
import type * as FC from '@filmcalendar/types';
import { FletchInstance } from '@tuplo/fletch';

import type * as C4 from './index.d';

export function getAvailableDates(data: C4.DailyProgramme): string[] {
  const { dates = [] } = data;
  const today = new Date(Date.now());

  return dates
    .map((date) => {
      const { y, m, d } = date;
      return new Date(`${y}-${m}-${d}`);
    })
    .filter((date) => date >= today)
    .map((date) => dtFormat(date, 'y-MM-dd'));
}

export function trimProgram(program: C4.Program): C4.Program {
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
}

export type GetDailyProgrammeParams = { channelId: C4.ChannelId; date: string };

export function getDailyProgramme(request: FletchInstance) {
  return async (params: GetDailyProgrammeParams): Promise<C4.Program[]> => {
    const { channelId, date } = params;
    const strDate = dtFormat(new Date(date), 'y/MM/dd');
    const url = `https://www.channel4.com/tv-guide/api/${strDate}`;

    const { channels } = await request.json<C4.DailyProgramme>(url);
    const { programmes = [] } = channels[channelId] as C4.Channel;

    return programmes.filter(
      (program) => program.isMovie !== 'false' || !program.isMovie
    );
  };
}

export function getSlotIdFromUrl(url: string): string {
  const [, slotId] = /(\d+)$/.exec(url) || ['', ''];
  return slotId;
}

export function getYear(program: C4.Program): number {
  const { summary } = program;
  const [, year] = /^\((\d{4})\)/.exec(summary) || ['', ''];

  return Number(year);
}

export function getSessions(program: C4.Program): FC.Session[] {
  const { startDate, isAudioDescribed, isSubtitled, url } = program;
  const tags = [
    isAudioDescribed && 'audio-described',
    isSubtitled && 'subtitled',
  ].filter(Boolean) as string[];

  return [
    {
      dateTime: startDate,
      link: `https://www.channel4.com${url}`,
      tags,
    },
  ];
}
