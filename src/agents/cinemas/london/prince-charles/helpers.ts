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
    scriptFindFn: (script) => /var Events/.test($(script).html() || ''),
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

type GetSessionTagsFn = (event: PCC.Performance) => string[];
export const getSessionTags: GetSessionTagsFn = (event) => {
  const tags = [];
  const {
    IsSubtitled,
    IsSilverScreen,
    IsParentAndBaby,
    IsSupportive,
    PerformanceNotes,
    StartTimeAndNotes,
  } = event;
  if (IsSubtitled === 'Y') tags.push('subtitled');
  if (IsSilverScreen === 'Y') tags.push('seniors');
  if (IsParentAndBaby === 'Y') tags.push('parent-and-baby');
  if (IsSupportive === 'Y') tags.push('parent-and-baby');
  const [, notes] = /\(([^)]+)\)/.exec(StartTimeAndNotes) || ['', ''];
  const moreTags = notes ? [slugify(notes)] : [];
  tags.push(
    ...moreTags,
    ...PerformanceNotes.split('/')
      .map((tag) => tag.trim())
      .map((tag) => slugify(tag))
  );

  return tags;
};

type GetSessionFn = (
  event: PCC.Performance,
  url: string,
  eventTags: string[]
) => FC.Session | null;
export const getSession: GetSessionFn = (event, url, eventTags) => {
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
    tags: [...eventTags, ...getSessionTags(event)].filter(Boolean),
  };
};

type GetEventTagsFn = (film: PCC.Film) => string[];
export const getEventTags: GetEventTagsFn = (film) => {
  const tags = [];
  const { Title, Tags } = film;
  if (/Sing-A-Long-A/i.test(Title)) tags.push('sing-along');
  tags.push(
    ...Tags.map((tag) => tag.Format)
      .map((tag) => tag.toLowerCase())
      .filter(Boolean)
      .map((tag) => slugify(tag))
  );

  return tags;
};

type GetSessionsFn = (film: PCC.Film, url: string) => FC.Session[];
export const getSessions: GetSessionsFn = (film, url) =>
  film.Performances.map((event) =>
    getSession(event, url, getEventTags(film))
  ).filter(Boolean) as FC.Session[];
