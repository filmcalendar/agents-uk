import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';
import slugify from '@sindresorhus/slugify';
import dtParse from 'date-fns/parse';
import { URL } from 'url';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import type * as PCC from './index.d';

export type GetWhatsOnDataFn = (url: string) => Promise<PCC.Film[]>;
export const getWhatsOnData: GetWhatsOnDataFn = async (url) => {
  const { Events } = await fletch.script<PCC.EventsData>(url, {
    scriptFindFn: ($page) =>
      $page
        .find('script')
        .toArray()
        .find((script) => /var Events/.test($(script).html() || '')),
  });

  return Events.Events;
};

type GetTitleFn = (film: PCC.Film) => string;
export const getTitle: GetTitleFn = (film) => {
  const t = film.Title.replace(/\+ Q&A.*/i, '')
    .replace(/: ACA-ALONG/i, '')
    .replace(/sing-a-long-a/i, '')
    .replace(/•?\s?\d{2}th Anniversary/i, '')
    .replace(/•?\s?sing along/i, '')
    .replace(/•?\s?extended version/i, '')
    .replace(/-?\s?quote along/i, '')
    .replace(/\.$/, '')
    .replace(/\(Dubbed\)/i, '')
    .replace(/in 70mm/i, '')
    .replace(/\+ Director.+Q&A/i, '')
    .replace(/(\[.+[^\]]\])/g, '') // remove [.+]
    .replace(/\s\s*/, ' ')
    .trim();

  return $(`<div>${t}</div>`).text();
};

type GetDirectorFn = (film: PCC.Film) => string[];
export const getDirector: GetDirectorFn = (film) =>
  splitNamesList(film.Director);

type GetCastFn = (film: PCC.Film) => string[];
export const getCast: GetCastFn = (film) => splitNamesList(film.Cast);

type GetYearFn = (film: PCC.Film) => number;
export const getYear: GetYearFn = (film) => Number(film.Year);

type GetSessionAttributesFn = (event: PCC.Performance) => string[];
export const getSessionAttributes: GetSessionAttributesFn = (event) => {
  const attributes = [];
  const {
    IsSubtitled,
    IsSilverScreen,
    IsParentAndBaby,
    IsSupportive,
    PerformanceNotes,
    StartTimeAndNotes,
  } = event;
  if (IsSubtitled === 'Y') attributes.push('subtitled');
  if (IsSilverScreen === 'Y') attributes.push('seniors');
  if (IsParentAndBaby === 'Y') attributes.push('parent-and-baby');
  if (IsSupportive === 'Y') attributes.push('parent-and-baby');
  const [, notes] = /\(([^)]+)\)/.exec(StartTimeAndNotes) || ['', ''];
  const moreTags = notes ? [slugify(notes)] : [];
  attributes.push(
    ...moreTags,
    ...PerformanceNotes.split('/')
      .map((tag) => tag.trim())
      .map((tag) => slugify(tag))
  );

  return attributes;
};

type GetSessionFn = (
  event: PCC.Performance,
  url: string,
  eventAttributes: string[]
) => FC.Agent.Session | null;
export const getSession: GetSessionFn = (event, url, eventAttributes) => {
  const { StartDate, StartTimeAndNotes, IsSoldOut, URL: Url } = event;
  if (IsSoldOut === 'Y') return null;

  const dtTime = `${StartDate} ${StartTimeAndNotes}`
    .replace(/\([^)]+\)/, '')
    .trim();
  const dateTime = dtParse(
    dtTime,
    'yyyy-MM-dd h:mma',
    Date.now()
  ).toISOString();
  const link = new URL(Url, url).href;

  return {
    dateTime,
    link,
    attributes: [...eventAttributes, ...getSessionAttributes(event)].filter(
      Boolean
    ),
  };
};

type GetEventAttributesFn = (film: PCC.Film) => string[];
export const getEventAttributes: GetEventAttributesFn = (film) => {
  const attributes = [];
  const { Title, Tags } = film;
  if (/Sing-A-Long-A/i.test(Title)) attributes.push('sing-along');
  attributes.push(
    ...Tags.map((tag) => tag.Format)
      .map((tag) => tag.toLowerCase())
      .filter(Boolean)
      .map((tag) => slugify(tag))
  );

  return attributes;
};

type GetSessionsFn = (film: PCC.Film, url: string) => FC.Agent.Session[];
export const getSessions: GetSessionsFn = (film, url) =>
  film.Performances.map((event) =>
    getSession(event, url, getEventAttributes(film))
  ).filter(Boolean) as FC.Agent.Session[];
