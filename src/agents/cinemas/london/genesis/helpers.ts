import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';
import dtParse from 'date-fns/parse';
import { URL } from 'url';
import { FletchInstance } from '@tuplo/fletch';

import slugify from 'src/lib/slugify';
import EventTitle from 'src/lib/event-title';
import type * as FC from '@filmcalendar/types';

import type * as GEN from './index.d';

const evt = new EventTitle({
  seasons: [
    'Black Ink Cinema',
    'CinemaItaliaUK',
    'Cult Classic Collective',
    'DirectedByWomen',
    'Dogwoof Docs',
    'Genesisters',
    'LIFF',
    'SFFL Tour',
    'SSFL Tour',
    'Write-Along-Movies',
  ],
});

export async function getEventsInline(
  request: FletchInstance,
  url: string
): Promise<GEN.Event[]> {
  const { eventsInline } = await request.script<GEN.ProgrammeData>(url, {
    scriptFindFn: (script) => /var eventsInline/.test($(script).html() || ''),
    scriptSandbox: {
      $: () => ({
        eventCalendar: (): null => null,
      }),
    },
  });

  return eventsInline;
}

export function getPageHeading($page: cheerio.Cheerio): string {
  return $page.find('#content > h2.subtitle.first').text();
}

export function getTitle($page: cheerio.Cheerio): string {
  const eventTitle = getPageHeading($page);
  return evt.getFilmTitle(eventTitle);
}

export function getSeasonsFromTitle($page: cheerio.Cheerio): string[] {
  const eventTitle = getPageHeading($page);
  return evt.getSeasons(eventTitle);
}

function getEventTags($page: cheerio.Cheerio): string[] {
  const eventTitle = getPageHeading($page);
  return evt.getTags(eventTitle);
}

export function getDirector($page: cheerio.Cheerio): string[] {
  return $page
    .find('.main-content .info li')
    .toArray()
    .filter((li) => $(li).find('.icon-video-camera').length)
    .reduce((acc, li) => {
      const [, d] = /director\s?:\s?(.+)/i.exec($(li).text()) || [];
      return [...acc, ...splitNamesList(d)];
    }, [] as string[]);
}

export function getCast($page: cheerio.Cheerio): string[] {
  return $page
    .find('.main-content .info li')
    .toArray()
    .filter((li) => $(li).find('.icon-users').length)
    .reduce((acc, li) => {
      const [, c] = /cast\s?:\s?(.+)/i.exec($(li).text()) || [];
      return [...acc, ...splitNamesList(c)];
    }, [] as string[]);
}

export function getYear($page: cheerio.Cheerio): number {
  return $page
    .find('.main-content .info li')
    .toArray()
    .filter((li) => $(li).find('.icon-home').length)
    .reduce((acc, li) => {
      const [, y] = /(\d{4})/i.exec($(li).text()) || [];
      return Number(y);
    }, -1);
}

export function getSessionTags($el: cheerio.Cheerio): string[] {
  const time = $el.text();
  const [, tags] = /:\d{2}\s?\(([^)]+)\)/.exec(time) || ['', ''];
  return tags ? [slugify(tags)] : [];
}

function getSession(
  el: cheerio.Element,
  day: string,
  url: string,
  eventTags: string[]
): FC.Session {
  const nowYear = new Date(Date.now()).getFullYear();
  const $el = $(el);
  const time = $el.text().replace(/(\d{2}:\d{2})(.+)/, '$1');
  const dateTime = dtParse(
    `${day} ${nowYear} ${time}`,
    'EEE d MMM yyyy HH:mm',
    Date.now()
  ).toISOString();
  const link = new URL($el.attr('href') || '', url).href;

  return {
    dateTime,
    link,
    tags: [...getSessionTags($el), ...eventTags],
  };
}

export function getSessions($page: cheerio.Cheerio, url: string): FC.Session[] {
  return $page
    .find('.film-times li')
    .toArray()
    .flatMap((dayGroup) => {
      const $dayGroup = $(dayGroup);
      const day = $dayGroup.find('.date').text().trim();
      return $dayGroup
        .find('.button')
        .toArray()
        .map((el) => getSession(el, day, url, getEventTags($page)));
    });
}
