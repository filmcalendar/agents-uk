import nock from 'nock';

import * as agent from '.';

describe('the-castle', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://thecastlecinema.com')
    .persist()
    .get('/')
    .replyWithFile(200, `${dataDir}/home.html`)
    .get('/listings/')
    .replyWithFile(200, `${dataDir}/listings.html`)
    .get(/it-s-a-wonderful-life\/$/)
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('featured', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.featured(provider);

    const expected = [
      'https://thecastlecinema.com/programme/3165214/wonder-woman-1984/',
      'https://thecastlecinema.com/programme/3143804/county-lines/',
    ];
    expect(result).toHaveLength(2);
    expect(result).toStrictEqual(expected);
  });

  it('programme', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://thecastlecinema.com/programme/2289750/cine-real-the-snowman/',
      'https://thecastlecinema.com/programme/3152194/cocoon/',
      'https://thecastlecinema.com/programme/3141361/coraline/',
    ];
    expect(result.programme).toHaveLength(20);
    expect(result.programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    expect.assertions(1);
    const url =
      'https://thecastlecinema.com/programme/4375/it-s-a-wonderful-life/';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: "It's a Wonderful Life",
      director: ['Frank Capra'],
      cast: ['James Stewart', 'Donna Reed', 'Lionel Barrymore'],
      year: 1946,
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url =
      'https://thecastlecinema.com/programme/4375/it-s-a-wonderful-life/';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      dateTime: '2020-12-14T21:00:00.000Z',
      link: 'https://thecastlecinema.com/bookings/3141391/',
      attributes: ['5-mondays'],
    };
    expect(result?.sessions).toHaveLength(6);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
