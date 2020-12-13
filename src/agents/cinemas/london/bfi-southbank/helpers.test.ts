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
    .get('/Online/article/akira2020')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('extracts credits', () => {
    expect.assertions(1);
    const $page = $.load(mockFilmHtml).root();
    const result = getCredits($page);

    const expected: string[] = [
      'Japan 1988',
      'Dir Katsuhiro Otomo',
      'With the voices of Mitsuo Iwata, Nozomu Sasaki, Mami Koyama',
      '125min',
      'Digital',
      'English subtitles',
      'Certificate 15',
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
      'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=A75F9B94-4D72-4551-9525-080853567746';
    expect(result).toBe(expected);
  });
});
