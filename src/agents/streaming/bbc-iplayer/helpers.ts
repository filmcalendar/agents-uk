import $ from 'cheerio';
import { URL } from 'url';
import dtParse from 'date-fns/parse';
import dtAdd from 'date-fns/add';
import dtFormat from 'date-fns/format';
import type { FletchInstance } from '@tuplo/fletch';
import type * as FC from '@filmcalendar/types';

import EventTitle from 'src/lib/event-title';

const evt = new EventTitle();

export function getPageProgramme(request: FletchInstance) {
  return async (url: string): Promise<string[]> => {
    const $page = await request.html(url);
    return $page
      .find('.list .content-item__link')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => new URL(href || '', url).href);
  };
}

export function getEpisodeIdFromUrl(url: string): string {
  const [, episodeId] = /iplayer\/episode\/([^/]+)/.exec(url) || ['', ''];
  return episodeId;
}

export function getPageHeading($page: cheerio.Cheerio): string {
  return $page.find('.programmes-page .island h1').text();
}

export function getTitle($page: cheerio.Cheerio): string {
  const eventTitle = getPageHeading($page);
  return evt.getFilmTitle(eventTitle);
}

export function getSeasonsFromTitle($page: cheerio.Cheerio): string[] {
  const eventTitle = getPageHeading($page);
  return evt.getSeasons(eventTitle);
}

export function getCredits($page: cheerio.Cheerio): Map<string, string[]> {
  const creditsRaw = $page
    .find('#credits tr')
    .toArray()
    .reduce((acc, tr) => {
      const $tr = $(tr);
      const label = $tr.find('td:nth-child(1) span').text();
      const value = $tr.find('td:nth-child(2) span').text();
      if (!label || !value) return acc;
      acc[label] = acc[label] || [];
      acc[label].push(value);
      return acc;
    }, {} as Record<string, string[]>);

  const outLabels = [
    'Composer',
    'Director of photography',
    'Producer',
    'Writer',
  ];
  const rgOutLabels = new RegExp(outLabels.join('|'), 'i');

  return Object.entries(creditsRaw)
    .filter(([key]) => !rgOutLabels.test(key))
    .reduce((acc, [key, value]) => {
      if (/director/i.test(key)) {
        const newDirector = acc.get('director') || [];
        newDirector.push(...value);
        acc.set('director', newDirector);
      } else {
        const newCast = acc.get('cast') || [];
        newCast.push(...value);
        acc.set('cast', newCast);
      }

      return acc;
    }, new Map() as Map<string, string[]>);
}

export function getAvailability($page: cheerio.Cheerio): FC.Availability {
  const today = new Date(Date.now());
  const start = new Date(dtFormat(today, 'y-MM-dd')).toISOString();
  const endStr = $page
    .find('.map__intro .episode-panel__meta')
    .toArray()
    .map((p) => {
      const $p = $(p);
      const text = $p.find('span').attr('title') || $p.text() || '';
      return text.trim();
    })
    .find((text) => /^Mon|^Tue|^Wed|^Thu|^Fri|^Sat|^Sun|^Available/.test(text));

  let end;
  if (!endStr || /^Available/.test(endStr)) {
    end = dtAdd(new Date(Date.now()), { years: 1 }).toISOString();
  } else {
    // Mon 14 December 2020, 02:00
    end = dtParse(
      endStr,
      'EEE dd MMMM y, HH:mm',
      new Date(Date.now())
    ).toISOString();
  }

  const eventTitle = getPageHeading($page);

  return {
    start,
    end,
    tags: ['audio-described', 'sign-language', ...evt.getTags(eventTitle)],
  };
}
