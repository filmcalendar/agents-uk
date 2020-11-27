import $ from 'cheerio';
import fs from 'fs';

import mockArticleContext from './__data__/article-context.json';
import mockEvents from './__data__/events.json';
import mockSessions from './__data__/sessions.json';
import {
  getCredits,
  getArticleContext,
  getEvents,
  getSessions,
} from './helpers';

const mockFilmHtml = fs.readFileSync(`${__dirname}/__data__/film.html`, 'utf8');

describe('bfi southbank - helpers', () => {
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

    expect(result).toStrictEqual(mockSessions);
  });
});
