import $ from 'cheerio';
import { URL } from 'url';
import dtIsAfter from 'date-fns/isAfter';
import dtIsSameDay from 'date-fns/isSameDay';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import type * as BBC from './index.d';

type GetAvailableDatesUrlsFn = (
  url: string,
  $page: cheerio.Cheerio
) => string[];
export const getAvailableDatesUrls: GetAvailableDatesUrlsFn = (url, $page) => {
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
};

export async function getReduxState<T>(url: string): Promise<T> {
  type PageWithReduxState = {
    window: {
      __IPLAYER_REDUX_STATE__: T;
    };
  };

  const { window } = await fletch.script<PageWithReduxState>(url, {
    scriptSandbox: { window: {} },
    scriptFindFn: ($page) =>
      $page
        .find('script')
        .toArray()
        .find((script) =>
          /__IPLAYER_REDUX_STATE__/.test($(script).html() || '')
        ),
  });

  const { __IPLAYER_REDUX_STATE__: state } = window;
  return state as T;
}

type GetDailyScheduleFn = (url: string) => Promise<BBC.ScheduleItem[]>;
export const getDailySchedule: GetDailyScheduleFn = async (url) => {
  const { schedule } = await getReduxState<{ schedule: BBC.Schedule }>(url);

  return schedule.items.filter(
    (item) => item.props.label && item.props.label === 'Film'
  );
};

type GetSessionsFn = (
  episodeId: string,
  schedule: BBC.ScheduleItem[]
) => FC.Session[];
export const getSessions: GetSessionsFn = (episodeId, schedule) => {
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
};
