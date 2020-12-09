import $ from 'cheerio';
import URL from 'url';
import splitNamesList from '@tuplo/split-names-list';
import dtParse from 'date-fns/parse';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';

type FindMovieUrlsFn = (url: string) => Promise<string[]>;
export const findMovieUrls: FindMovieUrlsFn = async (url) => {
  const $page = await fletch.html(url);

  return [url].concat(
    $page
      .find('a[href^="/films/"]')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => URL.resolve(url, href || ''))
  );
};

type GetTitleFn = ($page: cheerio.Cheerio) => string;
export const getTitle: GetTitleFn = ($page) =>
  $page
    .find('#title .title')
    .text()
    .replace(/\+.+?in conversation/i, '')
    .replace(/\+ introduction by.+/i, '')
    .replace(/\+ introduction/i, '')
    .replace(/KINOTEKA \d{4}/, '')
    .replace(/LSFF \d{4}:/i, '')
    .replace(/Members’ Screening:/i, '')
    .replace(/\+ panel discussion/i, '')
    .replace(/PREVIEW/, '')
    .replace(/PREMIERE/, '')
    .replace(/\+ reading group/i, '')
    .replace(/Special Preview:/i, '')
    .replace(/UK PREMIERE/i, '')
    .replace(/- Shorts Programme/i, '')
    .replace(/\+ discussion/i, '')
    .replace(/\+ q&A/i, '')
    .replace(/Members' Screening:/i, '')
    .replace(/Preview Screening:/i, '')
    .trim();

type GetDirectorFn = ($page: cheerio.Cheerio) => string[];
export const getDirector: GetDirectorFn = ($page) => {
  const colophon = $page.find('#colophon').text();
  if (!colophon) return [];

  const [, d] = /Dirs?\.(.+?)\d{4}/i.exec(colophon) || ['', ''];
  const parts = d.split(',').map((line) => line.trim());
  const dd = parts.length === 1 ? parts : parts.slice(0, -1);
  const directorText = dd.join(', ');

  return splitNamesList(directorText);
};

type GetYearFn = ($page: cheerio.Cheerio) => number | undefined;
export const getYear: GetYearFn = ($page) => {
  const colophon = $page.find('#colophon').text();
  if (!colophon) return undefined;

  const [, y] = /(\d{4})/.exec(colophon) || [null, ''];
  return Number(y);
};

type GetEventAttributes = ($page: cheerio.Cheerio) => string[];
const getEventAttributes: GetEventAttributes = ($page) => {
  const attributes = [];
  const title = $page.find('#title .title').text();

  if (/\+ Q&A/i.test(title)) attributes.push('q-and-a');
  if (/\+ panel discussion/i.test(title)) attributes.push('panel');
  if (/\+ discussion/i.test(title)) attributes.push('panel');
  if (/\+.+?in conversation/i.test(title)) attributes.push('q-and-a');
  if (/PREVIEW/.test(title)) attributes.push('preview');

  return attributes;
};

type GetSessionFn = (
  el: cheerio.Element,
  url: string,
  fieldName: string,
  eventAttributes: string[]
) => FC.Agent.Session | null;
const getSession: GetSessionFn = (el, url, fieldName, eventAttributes) => {
  const $el = $(el);
  const dateStr = $el.text();
  if (/sold out/i.test(dateStr)) return null;

  const dateTimeStr = dateStr
    .replace(/(\d{2}:\d{2})(.+)/, '$1')
    .replace(/\(.{3}\)/, '')
    .replace(/\s-\s/, ' ');
  const dateTime = dtParse(
    dateTimeStr,
    'd MMM yyyy HH:mm',
    Date.now()
  ).toISOString();
  const link: FC.Agent.BookingRequest = {
    url,
    method: 'POST',
    formUrlEncoded: {
      [fieldName]: $el.attr('value') || '',
    },
  };

  return { dateTime, link, attributes: [...eventAttributes] };
};

type GetSessionsFn = (
  $page: cheerio.Cheerio,
  url: string
) => Promise<FC.Agent.Session[]>;
export const getSessions: GetSessionsFn = async ($page, url) => {
  const bookingOnClick = $page.find('#row.select').attr('onclick');
  const [, bookingPath] =
    /location\.href="([^"]+)"/.exec(bookingOnClick || '') || [];
  if (!bookingPath) return [];

  const urlBooking = URL.resolve(url, bookingPath);
  const $bookingPage = await fletch.html(urlBooking, {
    validateStatus: (status) => status === 404,
  });
  const urlIframe = $bookingPage.find('#SpektrixIFrame').attr('src');
  if (!urlIframe) return [];

  const $bookingForm = await fletch.html(urlIframe);
  const $form = $bookingForm.find('#aspnetForm');
  const formAction = URL.resolve(urlIframe, $form.attr('action') || '');
  const $select = $form.find('.EventDatesList');

  return $select
    .find('option')
    .toArray()
    .map((el) =>
      getSession(
        el,
        formAction,
        $select.attr('name') || 'field-name',
        getEventAttributes($page)
      )
    )
    .filter(Boolean) as FC.Agent.Session[];
};
