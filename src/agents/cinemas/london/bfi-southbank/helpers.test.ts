import $ from 'cheerio';
import fs from 'fs';
import nock from 'nock';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import mockArticleContext from './__data__/article-context.json';
import mockEvents from './__data__/events.json';
import mockSessions from './__data__/sessions.json';
import {
  getRegularStrandsUrls,
  getSeasonFromRegularStrandsPage,
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
    .get(/regular-strands/)
    .replyWithFile(200, `${dataDir}/regular-strands.html`)
    .get(/Online\/article\/.+/)
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('gets list of seasons from strands page', async () => {
    const result = await getRegularStrandsUrls(fletch.create());

    const expected = [
      'https://whatson.bfi.org.uk/Online/article/regular-strands#african-odysseys',
      'https://whatson.bfi.org.uk/Online/article/regular-strands#bfi-flare',
      'https://whatson.bfi.org.uk/Online/article/regular-strands#experimenta',
    ];
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it("gets season's info from strands page", async () => {
    const url =
      'https://whatson.bfi.org.uk/Online/article/regular-strands#african-odysseys';
    const $page = await fletch.html(url);
    const result = getSeasonFromRegularStrandsPage($page, url);

    const expected = {
      url,
      name: 'African Odysseys',
      description:
        'Inspirational films by and about the people of Africa, from archive classics to new cinema and docs. Programmed by David Somerset.',
      programme: [
        'https://whatson.bfi.org.uk/Online/article/milkmaid',
        'https://whatson.bfi.org.uk/Online/article/howtostoparecurringdream',
        'https://whatson.bfi.org.uk/Online/article/mandabi',
        'https://whatson.bfi.org.uk/Online/article/warmdecemberintro',
      ],
    };
    expect(result).toStrictEqual(expected);
  });

  it('extracts credits', () => {
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
    const $page = $.load(mockFilmHtml).root();
    const result = getArticleContext($page);

    expect(result).toMatchObject(mockArticleContext);
  });

  it('extracts events', () => {
    const $page = $.load(mockFilmHtml).root();
    const result = getEvents($page);

    expect(result).toMatchObject(mockEvents);
  });

  it('lists sessions', () => {
    const $page = $.load(mockFilmHtml).root();
    const result = getSessions($page);

    expect(result).toStrictEqual(mockSessions as FC.Session[]);
  });

  it('gets expanded url for a page', async () => {
    const url = 'https://whatson.bfi.org.uk/Online/article/akira2020';
    const $page = await fletch.html(url);
    const result = getExpandedUrlFromPage($page);

    const expected =
      'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=E7F346D1-95D4-4916-AE8A-35A2860B86EA';
    expect(result).toBe(expected);
  });
});
