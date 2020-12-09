import nock from 'nock';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import type * as CZ from './index.d';

import { getAddress, getCinemaInfo, getFilmData, getSessions } from './helpers';

describe('curzon - helpers', () => {
  const mocksDir = `${__dirname}/__data__`;
  nock('https://www.curzoncinemas.com')
    .persist()
    .get(/info$/)
    .replyWithFile(200, `${mocksDir}/cinema-info.html`)
    .get(/this-week$/)
    .replyWithFile(200, `${mocksDir}/this-week.html`)
    .get(/mank$/)
    .replyWithFile(200, `${mocksDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('gets address', async () => {
    expect.assertions(1);
    const url = 'https://www.curzoncinemas.com/wimbledon/info';
    const $page = await fletch.html(url);
    const result = getAddress($page);

    const expected = 'Second Floor 23 The Broadway, London, SW19 1RE';
    expect(result).toBe(expected);
  });

  it('gets cinema info', async () => {
    expect.assertions(1);
    const cinemaRef = {
      url: 'https://www.curzoncinemas.com/wimbledon/info',
      name: 'Wimbledon',
      chain: 'Curzon',
    };
    const result = await getCinemaInfo(cinemaRef);

    const expected: FC.Agent.Provider = {
      url: 'https://www.curzoncinemas.com/wimbledon/info',
      name: 'Wimbledon',
      chain: 'Curzon',
      address: 'Second Floor 23 The Broadway, London, SW19 1RE',
      type: 'cinema',
    };
    expect(result).toStrictEqual(expected);
  });

  it('gets film data', async () => {
    expect.assertions(3);
    const url = 'https://www.curzoncinemas.com/wimbledon/this-week';
    const $page = await fletch.html(url);
    const result = getFilmData($page);

    const expected = {
      Title: 'Mank',
      FriendlyName: '/aldgate/film-info/mank',
      Director: 'David Fincher',
      Cast: 'Gary Oldman, Lily Collins, Amanda Seyfried',
    } as CZ.FilmData;
    expect(result).toHaveLength(13);
    expect(result[0]).toMatchObject(expected);
    expect(result[0].Sessions).toHaveLength(6);
  });

  it('gets sessions', async () => {
    expect.assertions(2);
    const url = 'https://www.curzoncinemas.com/aldgate/film-info/mank';
    const $page = await fletch.html(url);
    const [film] = getFilmData($page);
    const result = getSessions(film);

    const expected = {
      attributes: [],
      dateTime: '2020-12-10T12:15:00.000Z',
      link: 'https://www.curzoncinemas.com/booking/7733/1036826',
    };
    expect(result).toHaveLength(14);
    expect(result[0]).toStrictEqual(expected);
  });
});
