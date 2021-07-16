import vm from 'vm';
import $ from 'cheerio';
import splitNamesList from '@tuplo/split-names-list';
import dtParse from 'date-fns/parse';

import slugify from 'src/lib/slugify';
import EventTitle from 'src/lib/event-title';
import type * as FC from '@filmcalendar/types';
import type * as BFI from './index.d';

const evt = new EventTitle({
  events: ['Member Picks', 'DVD Launch', 'BFI', 'unconfirmed'],
  seasons: ['Woman With a Movie Camera', 'BFI Screen Epiphany'],
  tags: [
    'Double-bill',
    'Opening Night',
    'Seniors’ free archive matinee',
    'Seniors’ matinee',
    'Seniors’ Paid Matinee',
    "'Seniors’ matinee'",
  ],
});

export function getArticleContext($page: cheerio.Cheerio): BFI.ArticleContext {
  if (!$page) return {} as BFI.ArticleContext;

  const script = $page
    .find('script')
    .toArray()
    .find((scr) => /function loadLocalPage/i.test($(scr).html() || ''));
  const src = $(script).html();
  if (!src) return {} as BFI.ArticleContext;

  const code = new vm.Script(src);
  const sandbox: BFI.LocalPageData = {
    createSearchMapping: (): null => null,
    tsAddReadyEvent: (): null => null,
  };
  vm.createContext(sandbox);
  code.runInContext(sandbox, { displayErrors: true });

  return sandbox.articleContext as BFI.ArticleContext;
}

export function getExpandedUrl(articleId: string): string {
  return `https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=${articleId}`;
}

export function getTitle($page: cheerio.Cheerio): string {
  const eventTitle = $page.find('h1').text();
  return evt.getFilmTitle(eventTitle);
}

export function getCredits($page: cheerio.Cheerio): string[] {
  const $credits = $page.find('.credits');
  if ($credits === null) return [];
  if ($credits.length === 0) return [];

  // @ts-expect-error $credits is possibly null?
  return $credits
    .html()
    .split(/\n|<br clear="none">/i)
    .filter((line) => !/^<br clear/i.test(line))
    .map((line) => line.replace(/<br clear="none">/i, '').trim())
    .map((line) => $(`<div>${line}</div>`).text())
    .filter((line) => line.length);
}

export function getDirector(credits: string[]): string[] {
  const d = credits.filter((line) => /Dirs?\.?/i.test(line)).find(Boolean);
  const [, dd] = /Dirs?\.?(.+)/.exec(d || '') || [];
  return splitNamesList(dd) || [];
}

export function getCast(credits: string[]): string[] {
  const d = credits.filter((line) => /With?\.?/i.test(line)).find(Boolean);
  const [, dd] = /With(.+)/.exec(d || '') || [];
  return splitNamesList((dd || '').replace(/the voices of/i, '')) || [];
}

export function getYear(credits: string[]): number {
  const y = credits
    .filter((line) => /20\d{2}|19\d{2}/i.test(line))
    .find(Boolean);
  const [, yy] = /(20\d{2}|19\d{2})/.exec(y || '') || [];
  return Number(yy);
}

export function getEvents($page: cheerio.Cheerio): BFI.Event[] {
  const articleContext = getArticleContext($page);
  const { searchResults = [], searchNames } = articleContext;

  return searchResults
    .reduce((acc, row) => {
      const data = searchNames.reduce((accc, key, i) => {
        // @ts-expect-error foo
        // eslint-disable-next-line no-param-reassign
        if (row[i]) accc[key] = row[i];
        return accc;
      }, {} as BFI.Event);
      acc.push(data);
      return acc;
    }, [] as BFI.Event[])
    .filter((r) => /Southbank Public Programme/i.test(r.venue_group))
    .filter((r) => !/Courses|Podstock/.test(r.keywords))
    .filter((r) => !/Mark Kermode Live/i.test(r.short_description));
}

export function getSessionTags(event: BFI.Event): string[] {
  return (event.keywords || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => !/^releases$/.test(tag))
    .map((tag) => slugify(tag.toLowerCase()));
}

export function getSession(
  event: BFI.Event,
  eventTags: string[]
): FC.Session | null {
  if (event.availability_status === 'S') return null;
  const { start_date } = event;

  const dateTime = dtParse(
    start_date,
    'EEEE dd MMMM yyyy HH:mm',
    Date.now()
  ).toISOString();
  const link: FC.BookingRequest = {
    url: 'https://whatson.bfi.org.uk/Online/mapSelect.asp',
    method: 'POST',
    formUrlEncoded: {
      'BOset::WSmap::seatmap::performance_ids': event.id,
      'createBO::WSmap': '1',
    },
  };

  return {
    dateTime,
    link,
    tags: [...getSessionTags(event), ...eventTags],
  };
}

export function getSessions($page: cheerio.Cheerio): FC.Session[] {
  const eventTitle = $page.find('h1').text();
  const eventTags = evt.getTags(eventTitle);

  return getEvents($page)
    .map((event) => getSession(event, eventTags))
    .filter(Boolean) as FC.Session[];
}

export function getExpandedUrlFromPage($page: cheerio.Cheerio): string {
  const { articleId } = getArticleContext($page);
  return getExpandedUrl(articleId);
}
