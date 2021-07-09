import nock from 'nock';
import fletch from '@tuplo/fletch';

import {
  getPageProgramme,
  getEpisodeIdFromUrl,
  getTitle,
  getCredits,
  getAvailability,
} from './helpers';

describe('bbc-iplayer - helpers', () => {
  // 2021-06-16
  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1623848047000);

  const dataDir = `${__dirname}/__data__`;
  nock('https://www.bbc.co.uk')
    .persist()
    .get('/iplayer/categories/films/a-z')
    .replyWithFile(200, `${dataDir}/films.html`)
    .get('/iplayer/episode/m0007zh7/20th-century-women')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
    dateNowSpy.mockRestore();
  });

  it('get page programme', async () => {
    const url = 'https://www.bbc.co.uk/iplayer/categories/films/a-z';
    const result = await getPageProgramme(fletch.create())(url);

    const expected = [
      'https://www.bbc.co.uk/iplayer/episode/m0007zh7/20th-century-women',
      'https://www.bbc.co.uk/iplayer/episode/m000kkby/310-to-yuma-2007',
      'https://www.bbc.co.uk/iplayer/episode/b0078tnk/a-damsel-in-distress',
    ];
    expect(result).toHaveLength(36);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('gets episode id from url', () => {
    const url =
      'https://www.bbc.co.uk/iplayer/episode/m0007zh7/20th-century-women';
    const result = getEpisodeIdFromUrl(url);

    const expected = 'm0007zh7';
    expect(result).toBe(expected);
  });

  it('get title', async () => {
    const url =
      'https://www.bbc.co.uk/iplayer/episode/m0007zh7/20th-century-women';
    const $page = await fletch.html(url);
    const result = getTitle($page);

    const expected = '20th Century Women';
    expect(result).toBe(expected);
  });

  it('get credits', async () => {
    const url =
      'https://www.bbc.co.uk/iplayer/episode/m0007zh7/20th-century-women';
    const $page = await fletch.html(url);
    const result = getCredits($page);

    const expected = new Map([
      ['director', ['Mike Mills']],
      [
        'cast',
        [
          'Annette Bening',
          'Elle Fanning',
          'Greta Gerwig',
          'Billy Crudup',
          'Lucas Jade Zumann',
          'Alison Elliott',
          'Thea Gill',
        ],
      ],
    ]);
    expect(result).toStrictEqual(expected);
  });

  it('get availability', async () => {
    const url =
      'https://www.bbc.co.uk/iplayer/episode/m0007zh7/20th-century-women';
    const $page = await fletch.html(url);
    const result = getAvailability($page);

    const expected = {
      start: '2021-06-16T00:00:00.000Z',
      end: '2021-06-29T01:30:00.000Z',
      tags: ['audio-described', 'sign-language'],
    };
    expect(result).toStrictEqual(expected);
  });
});
