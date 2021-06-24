import $ from 'cheerio';
import { URL } from 'url';
import dtParse from 'date-fns/parse';
import dtAdd from 'date-fns/add';
import dtFormat from 'date-fns/format';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';

type GetPageProgrammeFn = (url: string) => Promise<string[]>;
export const getPageProgramme: GetPageProgrammeFn = async (url) => {
  const $page = await fletch.html(url);
  return $page
    .find('.list .content-item__link')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => new URL(href || '', url).href);
};

type GetEpisodeIdFromUrlFn = (url: string) => string;
export const getEpisodeIdFromUrl: GetEpisodeIdFromUrlFn = (url) => {
  const [, episodeId] = /iplayer\/episode\/([^/]+)/.exec(url) || ['', ''];
  return episodeId;
};

type GetTitleFn = ($page: cheerio.Cheerio) => string;
export const getTitle: GetTitleFn = ($page) =>
  $page.find('.programmes-page .island h1').text().trim();

type GetCreditsFn = ($page: cheerio.Cheerio) => Map<string, string[]>;
export const getCredits: GetCreditsFn = ($page) => {
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
};

type GetAvailabilityFn = ($page: cheerio.Cheerio) => FC.Availability;
export const getAvailability: GetAvailabilityFn = ($page) => {
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

  return {
    start,
    end,
    attributes: ['audio-described', 'sign-language'],
  };
};
