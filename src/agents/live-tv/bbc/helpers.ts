import $ from 'cheerio';
import { URL } from 'url';
import dtIsAfter from 'date-fns/isAfter';
import dtIsSameDay from 'date-fns/isSameDay';
import type { FletchInstance } from '@tuplo/fletch';
import type * as FC from '@filmcalendar/types';

import type * as BBC from './index.d';

export function getAvailableDatesUrls(
  url: string,
  $page: cheerio.Cheerio
): string[] {
  const today = new Date(Date.now());

  return $page
    .find('.day-switcher .day-switcher__item')
    .toArray()
    .map((a) => $(a).attr('href'))
    .filter((href) => {
      const [, date] = /([\d]+)$/.exec(href || '') || ['', ''];
      const [, year, month, day] = /(\d{4})(\d{2})(\d{2})/.exec(date) || [];
      const dtDate = new Date([year, month, day].join('-'));

      return dtIsSameDay(dtDate, today) || dtIsAfter(dtDate, today);
    })
    .map((href) => new URL(href || '', url).href);
}

export async function getReduxState<T>(
  request: FletchInstance,
  url: string
): Promise<T> {
  type PageWithReduxState = {
    window: {
      __IPLAYER_REDUX_STATE__: T;
    };
  };

  const { window } = await request.script<PageWithReduxState>(url, {
    scriptSandbox: { window: {} },
    scriptFindFn: (script) =>
      /__IPLAYER_REDUX_STATE__/.test($(script).html() || ''),
  });

  const { __IPLAYER_REDUX_STATE__: state } = window;
  return state as T;
}

export function getDailySchedule(request: FletchInstance) {
  return async (url: string): Promise<BBC.ScheduleItem[]> => {
    const { schedule } = await getReduxState<{ schedule: BBC.Schedule }>(
      request,
      url
    );

    return schedule.items.filter(
      (item) => item.props.label && item.props.label === 'Film'
    );
  };
}

export function getSessions(
  episodeId: string,
  schedule: BBC.ScheduleItem[]
): FC.Session[] {
  const rgEpisodeId = new RegExp(`${episodeId}$`);
  return schedule
    .filter((item) => {
      const { props } = item;
      const { href } = props;

      return rgEpisodeId.test(href);
    })
    .map((item) => {
      const { props, meta } = item;
      const { href } = props;
      const { scheduledStart } = meta;

      return {
        link: `https://bbc.co.uk/${href}`,
        dateTime: scheduledStart,
        tags: ['audio-described', 'sign-language'],
      };
    });
}
