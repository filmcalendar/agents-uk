import nock from 'nock';
import type * as FC from '@filmcalendar/types';

import * as agent from '.';

describe('curzon', () => {
  const mocksDir = `${__dirname}/__data__`;
  nock('https://movie-curzon.peachdigital.com')
    .persist()
    .get('/quickbook/GetCinemas/36')
    .replyWithFile(200, `${mocksDir}/GetCinemas.json`);

  nock('https://www.curzoncinemas.com')
    .persist()
    .get(/info$/)
    .replyWithFile(200, `${mocksDir}/cinema-info.html`)
    .get(/this-week/)
    .replyWithFile(200, `${mocksDir}/this-week.html`)
    .get(/coming-soon/)
    .replyWithFile(200, `${mocksDir}/coming-soon.html`)
    .get(/mank$/)
    .replyWithFile(200, `${mocksDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('providers', async () => {
    expect.assertions(2);
    const result = await agent.providers();

    const expected: FC.Agent.Provider = {
      address: 'Second Floor 23 The Broadway, London, SW19 1RE',
      chain: 'Curzon',
      name: 'Aldgate',
      type: 'cinema',
      url: 'https://www.curzoncinemas.com/aldgate/info',
      _data: {
        cinemaId: 7733,
        urlComingSoon: 'https://www.curzoncinemas.com/aldgate/coming-soon',
        urlThisWeek: 'https://www.curzoncinemas.com/aldgate/this-week',
      },
    };
    expect(result).toHaveLength(11);
    expect(result[0]).toStrictEqual(expected);
  });

  it('programme', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://www.curzoncinemas.com/aldgate/film-info/mank',
      'https://www.curzoncinemas.com/aldgate/film-info/possessor',
      'https://www.curzoncinemas.com/aldgate/film-info/county-lines',
      'https://www.curzoncinemas.com/aldgate/film-info/im-your-woman',
      'https://www.curzoncinemas.com/aldgate/film-info/ma-raineys-black-bottom',
    ];
    expect(result.programme).toHaveLength(14);
    expect(result.programme.slice(0, 5)).toStrictEqual(expected);
  });

  it('film', async () => {
    expect.assertions(1);
    const url = 'https://www.curzoncinemas.com/aldgate/film-info/mank';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: 'Mank',
      director: ['David Fincher'],
      cast: ['Gary Oldman', 'Lily Collins', 'Amanda Seyfried'],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url = 'https://www.curzoncinemas.com/aldgate/film-info/mank';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      attributes: [],
      dateTime: '2020-12-10T12:15:00.000Z',
      link: 'https://www.curzoncinemas.com/booking/7733/1036826',
    };
    expect(result?.sessions).toHaveLength(14);
    const [session] = result?.sessions || [];
    expect(session).toStrictEqual(expected);
  });
});
