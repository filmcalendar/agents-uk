import nock from 'nock';

import * as agent from '.';

describe('the-castle', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://thecastlecinema.com')
    .persist()
    .get('/')
    .replyWithFile(200, `${dataDir}/home.html`)
    .get('/calendar/film/')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/programme/3141361/coraline/')
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
      'https://thecastlecinema.com/programme/3141361/coraline/',
      'https://thecastlecinema.com/programme/3142081/wolfwalkers-q-a/',
      'https://thecastlecinema.com/programme/3142080/wolfwalkers/',
    ];
    expect(result.programme).toHaveLength(17);
    expect(result.programme).toStrictEqual(expect.arrayContaining(expected));
  });

  it('film', async () => {
    expect.assertions(1);
    const url = 'https://thecastlecinema.com/programme/3141361/coraline/';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: 'Coraline',
      director: ['Henry Selick'],
      cast: ['Dakota Fanning', 'Teri Hatcher', 'John Hodgman'],
      year: 2009,
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url = 'https://thecastlecinema.com/programme/3141361/coraline/';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      link: 'https://thecastlecinema.com/bookings/3141362/',
      dateTime: '2020-12-05T11:30:00.000Z',
      attributes: [],
    };
    expect(result?.sessions).toHaveLength(3);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
