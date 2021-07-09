import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';

import slugify from 'src/lib/slugify';
import type * as FC from '@filmcalendar/types';

export function getTitle($page: cheerio.Cheerio): string {
  return $page
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
  const title = $page.find('.hero-title h3').text();
  const tags = [];

  if (/Q&A/i.test(title)) tags.push('q-and-a');
  if (/Cine-Real/i.test(title)) tags.push('16mm');
  if (/Parent & Baby/i.test(title)) tags.push('parent-and-baby');

  return tags;
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
