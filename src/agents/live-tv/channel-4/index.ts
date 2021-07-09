import type * as FC from '@filmcalendar/types';
import dtFormat from 'date-fns/format';
import seriesWith from '@tuplo/series-with';
import { URL } from 'url';
import { BaseAgent } from '@filmcalendar/agents-core';

import slugify from 'src/lib/slugify';

import type * as C4 from './index.d';
import type { GetDailyProgrammeParams } from './helpers';
import {
  getAvailableDates,
  getDailyProgramme,
  getSlotIdFromUrl,
  getYear,
  getSessions,
} from './helpers';

export class Agent extends BaseAgent {
  ref = 'channel-4';

  register: FC.Agent.RegisterFn = () => ({
    agent: this.ref,
    country: 'uk',
    language: 'en-GB',
    type: 'films',
  });

  providers: FC.Agent.ProvidersFn = async () => {
    const today = dtFormat(new Date(Date.now()), 'y/MM/dd');
    const url = `https://www.channel4.com/tv-guide/api/${today}`;
    const response = await this.request.json<C4.DailyProgramme>(url);
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

  programme: FC.Agent.ProgrammeFn = async (venue) => {
    if (!venue || !venue._data) return { programme: [] };
    const { _data } = venue;
    const { id, availableDates } = (_data || {}) as C4.ProviderData;

    const channelDates = availableDates.map((date) => ({
      channelId: id,
      date,
    }));
    const programs = await seriesWith<C4.Program[], GetDailyProgrammeParams>(
      channelDates,
      getDailyProgramme(this.request)
    ).then((data) => data.flat());

    const prg = programs.map(
      (program) => new URL(program.url, 'https://www.channel4.com').href
    );

    return { programme: [...new Set(prg)], _data: { programs } };
  };

  page: FC.Agent.PageFn = async (url, provider, _data) => {
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
}
