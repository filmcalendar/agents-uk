import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';
import slugify from '@sindresorhus/slugify';
import dtParse from 'date-fns/parse';
import { URL } from 'url';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import type * as GEN from './index.d';

type GetEventsInlineFn = (url: string) => Promise<GEN.Event[]>;
export const getEventsInline: GetEventsInlineFn = async (url) => {
  const { eventsInline } = await fletch.script<GEN.ProgrammeData>(url, {
    scriptFindFn: (script) => /var eventsInline/.test($(script).html() || ''),
    scriptSandbox: {
      $: () => ({
        eventCalendar: (): null => null,
      }),
    },
  });

  return eventsInline;
};

type GetTitleFn = ($page: cheerio.Cheerio) => string;
export const getTitle: GetTitleFn = ($page) =>
  $page
    .find('#content > h2.subtitle.first')
    .text()
    .trim()
    .replace(/\s\s*/g, ' ')
    .replace(/- #RECLAIMTHEFRAME.+/i, '')
    .replace(/- a 35mm presentation.*/i, '')
    .replace(/- BFI Comedy Genius/i, '')
    .replace(/- Cine Mar Surf Film Night/i, '')
    .replace(/- FLAWA/i, '')
    .replace(/- FRINGE!.+/i, '')
    .replace(/- London Migration Film Festival/i, '')
    .replace(/- London Migratition Film Festival/i, '')
    .replace(/- Pesented by Truman's/i, '')
    .replace(/- Relaxed Screening/i, '')
    .replace(/- The World of David Lynch/i, '')
    .replace(/- Young Women's Trust Fundraiser/i, '')
    .replace(/-?\s?\d{2}th Anniversary\s?-?/i, '')
    .replace(/-.*MOVIES ON WEEKENDS/i, '')
    .replace(/-\s?A BFI Re-Release|-\s?A Relaxed Screening/i, '')
    .replace(/-\s?celebrating.+|-\s?Presented by.+|-\s?Preview/i, '')
    .replace(/-\s?Dogwoof Docs|-\s?MUBI x Genesis/i, '')
    .replace(/-\s?Music & Movies|-\s?Rescored.+/i, '')
    .replace(/-\s?Reel Love:.+|-?\s?Movies By Barlight\s?-?/i, '')
    .replace(/-\s?SoundScreen.+|-\s?The People\\'s Film Club/i, '')
    .replace(/:\s?\d{2}th Anniversary\sScreening/i, '')
    .replace(/:\s?A 35mm Presentation|on 35mm|35mm/i, '')
    .replace(/\[.+\]/, '')
    .replace(/\+.+/i, '')
    .replace(/\+\s?Panel.+|^.+presents?\s?:/i, '')
    .replace(/& intro.+/i, '')
    .replace(/& Party!/i, '')
    .replace(/Black History Walks:|.+perform live soundtrack to/i, '')
    .replace(/CinemaItaliaUK:/i, '')
    .replace(/DirectedByWomen Class Of \d{4}\s?-|/i, '')
    .replace(/DirectedByWomen\d{4}\s?[:-]/i, '')
    .replace(/Double Bill/i, '')
    .replace(/Folk Horror Cinema Club:|-?\s?Cult Classic Collective:?/i, '')
    .replace(/Genesisters Vol.\d{1,} - /i, '')
    .replace(/Halloween at Genesis:/i, '')
    .replace(/HALLOWEEN SCREENING/i, '')
    .replace(/LIFF\s?[:-]/i, '')
    .replace(/preview$/i, '')
    .replace(/Reel Good Film Club:/i, '')
    .replace(/Restoration$/i, '')
    .replace(/Write-Along-Movies:/i, '')
    .replace(/\s\s*/, ' ')
    .trim();

type GetDirectorFn = ($page: cheerio.Cheerio) => string[];
export const getDirector: GetDirectorFn = ($page) =>
  $page
    .find('.main-content .info li')
    .toArray()
    .filter((li) => $(li).find('.icon-video-camera').length)
    .reduce((acc, li) => {
      const [, d] = /director\s?:\s?(.+)/i.exec($(li).text()) || [];
      return [...acc, ...splitNamesList(d)];
    }, [] as string[]);

type GetCastFn = ($page: cheerio.Cheerio) => string[];
export const getCast: GetCastFn = ($page) =>
  $page
    .find('.main-content .info li')
    .toArray()
    .filter((li) => $(li).find('.icon-users').length)
    .reduce((acc, li) => {
      const [, c] = /cast\s?:\s?(.+)/i.exec($(li).text()) || [];
      return [...acc, ...splitNamesList(c)];
    }, [] as string[]);

type GetYearFn = ($page: cheerio.Cheerio) => number;
export const getYear: GetYearFn = ($page) =>
  $page
    .find('.main-content .info li')
    .toArray()
    .filter((li) => $(li).find('.icon-home').length)
    .reduce((acc, li) => {
      const [, y] = /(\d{4})/i.exec($(li).text()) || [];
      return Number(y);
    }, -1);

type GetSessionTagsFn = ($el: cheerio.Cheerio) => string[];
const getSessionTags: GetSessionTagsFn = ($el) => {
  const time = $el.text();
  const [, tags] = /:\d{2}\s?\(([^)]+)\)/.exec(time) || ['', ''];
  return tags ? [slugify(tags)] : [];
};

type GetSessionFn = (
  el: cheerio.Element,
  day: string,
  url: string,
  eventTags: string[]
) => FC.Session;
const getSession: GetSessionFn = (el, day, url, eventTags) => {
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
};

type GetEventTagsFn = ($page: cheerio.Cheerio) => string[];
const getEventTags: GetEventTagsFn = ($page) => {
  const tags = [];
  const title = $page.find('#content > h2.subtitle.first').text();
  if (/35mm/i.test(title)) tags.push('35mm');
  if (/Double Bill/i.test(title)) tags.push('double-bill');
  if (/Relaxed Screening/i.test(title)) tags.push('relaxed');
  if (/Preview/i.test(title)) tags.push('preview');
  if (/\+\s?Panel/.test(title)) tags.push('panel');

  return tags;
};

type GetSessionsFn = ($page: cheerio.Cheerio, url: string) => FC.Session[];
export const getSessions: GetSessionsFn = ($page, url) =>
  $page
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
