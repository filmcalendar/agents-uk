import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';

import slugify from 'src/lib/slugify';
import type * as FC from '@filmcalendar/types';

type GetTitleFn = ($page: cheerio.Cheerio) => string;
export const getTitle: GetTitleFn = ($page) =>
  $page
    .find('.hero-title h3')
    .text()
    .trim()
    .replace(/\+\s?.*?Q&A.*/i, '')
    .replace(/\+\s?intro/i, '')
    .replace(/\+\s?live piano score!?/i, '')
    .replace(/\d{2}th anniversary/i, '')
    .replace(/Cine-real presents:/i, '')
    .replace(/Cine-Real:/i, '')
    .replace(/Doc'n Roll Festival:/i, '')
    .replace(/Fringe!:/i, '')
    .replace(/IWD preview:/i, '')
    .replace(/No Bollocks presents/i, '')
    .replace(/No Bollocks:/i, '')
    .replace(/Parent & Baby/i, '')
    .replace(/Preview:/i, '')
    .replace(/Science Fiction Theatre presents\s?:/i, '')
    .replace(/SFT:/i, '')
    .replace(/The Final Girls present:/i, '')
    .replace(/Zodiac Film Club presents:/i, '')
    .replace(/\s\s*/, ' ')
    .trim();

type GetDirectorFn = ($page: cheerio.Cheerio) => string[];
export const getDirector: GetDirectorFn = ($page) =>
  splitNamesList($page.find('.film-director').text());

type GetCastFn = ($page: cheerio.Cheerio) => string[];
export const getCast: GetCastFn = ($page) =>
  splitNamesList($page.find('.film-cast').text());

type GetYearFn = ($page: cheerio.Cheerio) => number;
export const getYear: GetYearFn = ($page) =>
  Number($page.find('.film-year').text());

type GetEventTagsFn = ($page: cheerio.Cheerio) => string[];
export const getEventTags: GetEventTagsFn = ($page) => {
  const title = $page.find('.hero-title h3').text();
  const tags = [];

  if (/Q&A/i.test(title)) tags.push('q-and-a');
  if (/Cine-Real/i.test(title)) tags.push('16mm');
  if (/Parent & Baby/i.test(title)) tags.push('parent-and-baby');

  return tags;
};

type GetBookingIdFromUrlFn = (bookingLink: string) => string;
export const getBookingIdFromUrl: GetBookingIdFromUrlFn = (bookingLink) => {
  const [, bookingId] = /(\d+)\/$/.exec(bookingLink) || ['', ''];
  return bookingId;
};

type GetSessionsTagsFn = (
  $page: cheerio.Cheerio,
  bookingsLink: string
) => string[];
export const getSessionTags: GetSessionsTagsFn = ($page, bookingLink) => {
  const bookingId = getBookingIdFromUrl(bookingLink);
  const performance = `TcsPerformance_${bookingId}`;
  const screeningType = $page
    .find(`a[href*=${performance}] .screening-type`)
    .text();

  return [slugify(screeningType)].filter(Boolean);
};

type GetSessionsFn = ($page: cheerio.Cheerio) => FC.Session[];
export const getSessions: GetSessionsFn = ($page) =>
  $page
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
