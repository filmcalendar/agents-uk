import slugify from '@sindresorhus/slugify';
import type * as FC from '@filmcalendar/types';
import fletch from '@tuplo/fletch';
import dtFormat from 'date-fns/format';
import seriesWith from '@tuplo/series-with';
import { URL } from 'url';

import type * as C4 from './index.d';
import type { GetDailyProgrammeParams } from './helpers';
import {
  getAvailableDates,
  getDailyProgramme,
  getSlotIdFromUrl,
  getYear,
  getSessions,
} from './helpers';

export const ref = 'channel-4';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => {
  const today = dtFormat(new Date(Date.now()), 'y/MM/dd');
  const url = `https://www.channel4.com/tv-guide/api/${today}`;
  const response = await fletch.json<C4.DailyProgramme>(url);
  const { channels } = response;

  return Object.values(channels).map((channel) => {
    const { id, label } = channel;
    const customData: C4.ProviderData = {
      id,
      availableDates: getAvailableDates(response),
    };

    return {
      ref: slugify(label),
      name: label,
      type: 'live-tv',
      url: `https://www.channel4.com/now/${id}`,
      _data: customData,
    };
  });
};

export const programme: FC.Agent.ProgrammeFn = async (venue) => {
  if (!venue || !venue._data) return { programme: [] };
  const { _data } = venue;
  const { id, availableDates } = (_data || {}) as C4.ProviderData;

  const channelDates = availableDates.map((date) => ({ channelId: id, date }));
  const programs = await seriesWith<C4.Program[], GetDailyProgrammeParams>(
    channelDates,
    getDailyProgramme
  ).then((data) => data.flat());

  const prg = programs.map(
    (program) => new URL(program.url, 'https://www.channel4.com').href
  );

  return { programme: [...new Set(prg)], _data: { programs } };
};

export const page: FC.Agent.PageFn = async (url, provider, _data) => {
  const { programs = [] } = _data as C4.ProviderData;
  const slotId = getSlotIdFromUrl(url);

  const program = programs.find((p) => p.slotId === slotId);
  if (!program) return null;

  return {
    url,
    provider,
    films: [
      {
        title: program.title,
        year: getYear(program),
      },
    ],
    sessions: getSessions(program),
  };
};
