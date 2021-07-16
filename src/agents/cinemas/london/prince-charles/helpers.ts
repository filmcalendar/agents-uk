import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';
import dtParse from 'date-fns/parse';
import { URL } from 'url';
import type { FletchInstance } from '@tuplo/fletch';

import slugify from 'src/lib/slugify';
import EventTitle from 'src/lib/event-title';
import type * as FC from '@filmcalendar/types';
import type * as PCC from './index.d';

const evt = new EventTitle({
  tags: ['Sing-A-Long-A'],
});

export async function getWhatsOnData(
  request: FletchInstance,
  url: string
): Promise<PCC.Film[]> {
  const { Events } = await request.script<PCC.EventsData>(url, {
    scriptFindFn: (script) => /var Events/.test($(script).html() || ''),
  });

  return Events.Events;
}

export function getTitle(film: PCC.Film): string {
  const filmTitle = evt.getFilmTitle(film.Title);
  const title = filmTitle.replace(/\[([^\]]+)/, '');
  return $(`<div>${title}</div>`).text();
}

export function getDirector(film: PCC.Film): string[] {
  return splitNamesList(film.Director);
}

export function getCast(film: PCC.Film): string[] {
  return splitNamesList(film.Cast);
}

export function getYear(film: PCC.Film): number {
  return Number(film.Year);
}

export function getSessionTags(event: PCC.Performance): string[] {
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
}

export function getSession(
  event: PCC.Performance,
  url: string,
  eventTags: string[]
): FC.Session | null {
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
}

export function getEventTags(film: PCC.Film): string[] {
  const tags = [];
  const { Title, Tags } = film;

  const tagsFromTitle = evt.getTags(Title);
  tags.push(...tagsFromTitle);

  tags.push(
    ...Tags.map((tag) => tag.Format)
      .map((tag) => tag.toLowerCase())
      .filter(Boolean)
      .map((tag) => slugify(tag))
  );

  return tags;
}

export function getSessions(film: PCC.Film, url: string): FC.Session[] {
  return film.Performances.map((event) =>
    getSession(event, url, getEventTags(film))
  ).filter(Boolean) as FC.Session[];
}
