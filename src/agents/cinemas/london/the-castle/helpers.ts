import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';

import slugify from 'src/lib/slugify';
import EventTitle from 'src/lib/event-title';
import type * as FC from '@filmcalendar/types';

const evt = new EventTitle({
  notFilm: ['Pitchblack Pictures', 'Pitchblack Playback'],
  tags: ['Cine-Real'],
});

export function isNotFilm(title: string): boolean {
  return evt.isNotFilm(title);
}

export function getPageHeading($page: cheerio.Cheerio): string {
  return $page.find('.hero-title h3').text();
}

export function getTitle($page: cheerio.Cheerio): string {
  const eventTitle = getPageHeading($page);
  return evt.getFilmTitle(eventTitle);
}

export function getDirector($page: cheerio.Cheerio): string[] {
  return splitNamesList($page.find('.film-director').text());
}

export function getCast($page: cheerio.Cheerio): string[] {
  return splitNamesList($page.find('.film-cast').text());
}

export function getYear($page: cheerio.Cheerio): number {
  return Number($page.find('.film-year').text());
}

export function getEventTags($page: cheerio.Cheerio): string[] {
  const eventTitle = getPageHeading($page);
  return evt.getTags(eventTitle);
}

export function getBookingIdFromUrl(bookingLink: string): string {
  const [, bookingId] = /(\d+)\/$/.exec(bookingLink) || ['', ''];
  return bookingId;
}

export function getSessionTags(
  $page: cheerio.Cheerio,
  bookingLink: string
): string[] {
  const bookingId = getBookingIdFromUrl(bookingLink);
  const performance = `TcsPerformance_${bookingId}`;
  const screeningType = $page
    .find(`a[href*=${performance}] .screening-type`)
    .text();

  return [slugify(screeningType)].filter(Boolean);
}

export function getSessions($page: cheerio.Cheerio): FC.Session[] {
  return $page
    .find('script[type="application/ld+json"]')
    .toArray()
    .map((script) => {
      const code = $(script).html();
      if (!code) return null;

      const jsonld = JSON.parse(code);
      if (jsonld['@type'] !== 'ScreeningEvent') return null;

      const { url, startDate } = JSON.parse(code);
      const tags = [...getSessionTags($page, url), ...getEventTags($page)];

      return {
        dateTime: new Date(startDate).toISOString(),
        link: url,
        tags: [...new Set(tags)],
      };
    })
    .filter(Boolean) as FC.Session[];
}
