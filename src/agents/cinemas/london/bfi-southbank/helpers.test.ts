import $ from 'cheerio';
import fs from 'fs';
import nock from 'nock';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import mockArticleContext from './__data__/article-context.json';
import mockEvents from './__data__/events.json';
import mockSessions from './__data__/sessions.json';
import {
  getCredits,
  getArticleContext,
  getEvents,
  getSessions,
  getExpandedUrlFromPage,
} from './helpers';

const mockFilmHtml = fs.readFileSync(`${__dirname}/__data__/film.html`, 'utf8');

describe('bfi southbank - helpers', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://whatson.bfi.org.uk')
    .persist()
    .get(/Online\/article\/.+/)
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('extracts credits', () => {
    expect.assertions(1);

    const $page = $.load(mockFilmHtml).root();
    const result = getCredits($page);

    const expected: string[] = [
      'USA-Germany 2020',
      'Dir Chloé Zhao',
      'With Frances McDormand, David Strathairn, Linda May, Swankie',
      '107min',
      'Digital',
      'Certificate 12A',
      'A Walt Disney Studios Motion Pictures UK release',
    ];
    expect(result).toStrictEqual(expected);
  });

  it('extracts the article context', () => {
    expect.assertions(1);

    const $page = $.load(mockFilmHtml).root();
    const result = getArticleContext($page);

    expect(result).toMatchObject(mockArticleContext);
  });

  it('extracts events', () => {
    expect.assertions(1);

    const $page = $.load(mockFilmHtml).root();
    const result = getEvents($page);

    expect(result).toMatchObject(mockEvents);
  });

  it('lists sessions', () => {
    expect.assertions(1);

    const $page = $.load(mockFilmHtml).root();
    const result = getSessions($page);

    expect(result).toStrictEqual(mockSessions as FC.Agent.Session[]);
  });

  it('gets expanded url for a page', async () => {
    expect.assertions(1);

    const url = 'https://whatson.bfi.org.uk/Online/article/akira2020';
    const $page = await fletch.html(url);
    const result = getExpandedUrlFromPage($page);

    const expected =
      'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=E7F346D1-95D4-4916-AE8A-35A2860B86EA';
    expect(result).toBe(expected);
  });
});
