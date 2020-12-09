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
  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1607380796000);

  const dataDir = `${__dirname}/__data__`;
  nock('https://www.bbc.co.uk')
    .persist()
    .get('/iplayer/categories/films/a-z')
    .replyWithFile(200, `${dataDir}/films.html`)
    .get('/iplayer/episode/b0074n82/citizen-kane')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
    dateNowSpy.mockRestore();
  });

  it('get page programme', async () => {
    expect.assertions(2);
    const url = 'https://www.bbc.co.uk/iplayer/categories/films/a-z';
    const result = await getPageProgramme(url);

    const expected = [
      'https://www.bbc.co.uk/iplayer/episode/p04b183c/adam-curtis-hypernormalisation',
      'https://www.bbc.co.uk/iplayer/episode/b0078tnk/a-damsel-in-distress',
      'https://www.bbc.co.uk/iplayer/episode/p07ctvvn/a-high-school-rape-goes-viral-roll-red-roll',
      'https://www.bbc.co.uk/iplayer/episode/m000pqsk/amundsen',
      'https://www.bbc.co.uk/iplayer/episode/b00785fw/angel-face',
    ];
    expect(result).toHaveLength(36);
    expect(result.slice(0, 5)).toStrictEqual(expected);
  });

  it('gets episode id from url', () => {
    expect.assertions(1);
    const url = 'https://www.bbc.co.uk/iplayer/episode/b0074n82/citizen-kane';
    const result = getEpisodeIdFromUrl(url);

    const expected = 'b0074n82';
    expect(result).toBe(expected);
  });

  it('get title', async () => {
    expect.assertions(1);
    const url = 'https://www.bbc.co.uk/iplayer/episode/b0074n82/citizen-kane';
    const $page = await fletch.html(url);
    const result = getTitle($page);

    const expected = 'Citizen Kane';
    expect(result).toBe(expected);
  });

  it('get credits', async () => {
    expect.assertions(1);
    const url = 'https://www.bbc.co.uk/iplayer/episode/b0074n82/citizen-kane';
    const $page = await fletch.html(url);
    const result = getCredits($page);

    const expected = new Map([
      ['director', ['Orson Welles']],
      [
        'cast',
        [
          'Orson Welles',
          'Buddy Swan',
          'Sonny Bupp',
          'Harry Shannon',
          'Joseph Cotten',
          'Everett Sloane',
          'Agnes Moorehead',
          'Ray Collins',
          'Dorothy Comingore',
          'George Coulouris',
          'Paul Stewart',
          'Ruth Warrick',
          'Fortunio Bonanova',
          'Gus Schilling',
          'Erskine Sanford',
          'Philip Van Zandt',
          'William Alland',
        ],
      ],
    ]);
    expect(result).toStrictEqual(expected);
  });

  it('get availability', async () => {
    expect.assertions(1);
    const url = 'https://www.bbc.co.uk/iplayer/episode/b0074n82/citizen-kane';
    const $page = await fletch.html(url);
    const result = getAvailability($page);

    const expected = {
      start: '2020-12-07T00:00:00.000Z',
      end: '2020-12-14T02:00:00.000Z',
      attributes: ['audio-described', 'sign-language'],
    };
    expect(result).toStrictEqual(expected);
  });
});
