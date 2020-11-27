import nock from 'nock';

import * as agent from '.';

describe('the-castle', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://thecastlecinema.com')
    .persist()
    .get('/calendar/film/')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/programme/3141361/coraline/')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('programme', async () => {
    expect.assertions(2);
    const [venue] = await agent.venues();
    const result = await agent.programme(venue);

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
    const [venue] = await agent.venues();
    const result = await agent.page(url, venue);

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
    const [venue] = await agent.venues();
    const result = await agent.page(url, venue);

    const expected = {
      bookingLink: 'https://thecastlecinema.com/bookings/3141362/',
      dateTime: '2020-12-05T11:30:00.000Z',
      attributes: [],
    };
    expect(result?.sessions).toHaveLength(3);
    expect(result?.sessions[0]).toStrictEqual(expected);
  });
});
