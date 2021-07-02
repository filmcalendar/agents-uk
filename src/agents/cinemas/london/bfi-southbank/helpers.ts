import vm from 'vm';
import $ from 'cheerio';
import slugify from '@sindresorhus/slugify';
import splitNamesList from '@tuplo/split-names-list';
import dtParse from 'date-fns/parse';

import type * as FC from '@filmcalendar/types';
import type * as BFI from './index.d';

type GetArticleContextFn = ($page: cheerio.Cheerio) => BFI.ArticleContext;
export const getArticleContext: GetArticleContextFn = ($page) => {
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
};

type GetExpandedUrlFn = (articleId: string) => string;
export const getExpandedUrl: GetExpandedUrlFn = (articleId) =>
  `https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=${articleId}`;

type GetTitleFn = ($page: cheerio.Cheerio) => string;
export const getTitle: GetTitleFn = ($page) =>
  $page
    .find('h1')
    .text()
    .replace(/12 Stars:/i, '')
    .replace(/– A Tribute to.+/i, '')
    .replace(/African Odysseys Presents?:/i, '')
    .replace(/BFI Blu-ray Launch:/i, '')
    .replace(/BFI Screen Epiphany:/i, '')
    .replace(/by actor.+/i, '')
    .replace(/Closing Night Film:/i, '')
    .replace(/Comedians Cinema Club presents/i, '')
    .replace(/\+ discussion/i, '')
    .replace(/.+?Double-bill:/i, '')
    .replace(/Experimenta Salon:/i, '')
    .replace(/Free Seniors’? Talk:/i, '')
    .replace(/Funday Preview:/i, '')
    .replace(/Funday:/i, '')
    .replace(/Halloween Special:/i, '')
    .replace(/ICO Archive Screening Day:/i, '')
    .replace(/London Restoration Premiere:/i, '')
    .replace(/Relaxed Screening:/i, '')
    .replace(/Opening Night:/i, '')
    .replace(/Opening Night Gala \(UK Premiere\):/i, '')
    .replace(/Seniors’ Free Archive Matinee:/i, '')
    .replace(/Seniors’? free matinee:/i, '')
    .replace(/Seniors’ Matinee:/i, '')
    .replace(/Seniors’? Paid Matinee:/i, '')
    .replace(/Woman With a Movie Camera presents:/i, '')
    .replace(/\+ intro/i, '')
    .replace(/.+? introduces/, '')
    .replace(/Critics’ Salon:|Member Picks:/i, '')
    .replace(/DVD Launch:/i, '')
    .replace(/in\s?\d{2}mm|\(\)|’/i, '')
    .replace(/Member Exclusive:/i, '')
    .replace(/Preview:/i, '')
    .replace(/Silent Cinema presents:/i, '')
    .replace(/Seniors’ Free Screening:|Seniors’ free talk:/i, '')
    .replace(/\+ Q&A/i, '')
    .replace(/UK Premiere:|TV Preview:|Champions’ Preview:|Preview:/i, '')
    .replace(/\d{2}th Anniversary Screening/i, '')
    .replace(/\d{2}th Anniversary Restoration Preview:/i, '')
    .replace(/\d{2}th Anniversary:/i, '')
    .replace(/\s\s*/, ' ')
    .trim();

type GetCreditsFn = ($page: cheerio.Cheerio) => string[];
export const getCredits: GetCreditsFn = ($page) => {
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
};

type GetDirectorFn = (credits: string[]) => string[];
export const getDirector: GetDirectorFn = (credits) => {
  const d = credits.filter((line) => /Dirs?\.?/i.test(line)).find(Boolean);
  const [, dd] = /Dirs?\.?(.+)/.exec(d || '') || [];
  return splitNamesList(dd) || [];
};

type GetCastFn = (credits: string[]) => string[];
export const getCast: GetCastFn = (credits) => {
  const d = credits.filter((line) => /With?\.?/i.test(line)).find(Boolean);
  const [, dd] = /With(.+)/.exec(d || '') || [];
  return splitNamesList((dd || '').replace(/the voices of/i, '')) || [];
};

type GetYearFn = (credits: string[]) => number;
export const getYear: GetYearFn = (credits) => {
  const y = credits
    .filter((line) => /20\d{2}|19\d{2}/i.test(line))
    .find(Boolean);
  const [, yy] = /(20\d{2}|19\d{2})/.exec(y || '') || [];
  return Number(yy);
};

type GetEventsFn = ($page: cheerio.Cheerio) => BFI.Event[];
export const getEvents: GetEventsFn = ($page) => {
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
};

type GetSessionTagsFn = (event: BFI.Event) => string[];
const getSessionTags: GetSessionTagsFn = (event) =>
  (event.keywords || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => !/^releases$/.test(tag))
    .map((tag) => slugify(tag.toLowerCase()));

type GetSessionFn = (event: BFI.Event) => FC.Session | null;
export const getSession: GetSessionFn = (event) => {
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
    tags: [...getSessionTags(event)],
  };
};

type GetSessionsFn = ($page: cheerio.Cheerio) => FC.Session[];
export const getSessions: GetSessionsFn = ($page) =>
  getEvents($page).map(getSession).filter(Boolean) as FC.Session[];

type GetExpandedUrlFromPageFn = ($page: cheerio.Cheerio) => string;
export const getExpandedUrlFromPage: GetExpandedUrlFromPageFn = ($page) => {
  const { articleId } = getArticleContext($page);
  return getExpandedUrl(articleId);
};
