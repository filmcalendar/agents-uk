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
    .get('/category/3141470/enchanted-castle/')
    .replyWithFile(200, `${dataDir}/collection.html`)
    .get(/it-s-a-wonderful-life\/$/)
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('featured', async () => {
    const [provider] = await agent.providers();
    const result = await agent.featured(provider);

    const expected = [
      'https://thecastlecinema.com/programme/3165214/wonder-woman-1984/',
      'https://thecastlecinema.com/programme/3143804/county-lines/',
    ];
    expect(result).toHaveLength(2);
    expect(result).toStrictEqual(expected);
  });

  it('seasons', async () => {
    const [provider] = await agent.providers();
    const result = await agent.seasons(provider);

    const expected = [
      'https://thecastlecinema.com/category/3141470/enchanted-castle/',
      'https://thecastlecinema.com/listings/#',
    ];
    expect(result.seasonUrls).toStrictEqual(expected);
  });

  it('season', async () => {
    const [provider] = await agent.providers();
    const seasons = await agent.seasons(provider);
    const [url] = seasons.seasonUrls;
    const result = await agent.season(url, { _data: seasons._data });

    const expected = {
      url: 'https://thecastlecinema.com/category/3141470/enchanted-castle/',
      name: 'Enchanted Castle',
      description: 'Winter fables, fairy tales and a feast of festive faves',
      image: 'https://thecastlecinema.com/static/images/cms/snowman.jpg',
    };
    expect(result).toMatchObject(expected);
    expect(result.programme).toHaveLength(12);
  });

  it('season (no season page)', async () => {
    const [provider] = await agent.providers();
    const seasons = await agent.seasons(provider);
    const [, url] = seasons.seasonUrls;
    const result = await agent.season(url, { _data: seasons._data });

    const expected = {
      url: 'https://thecastlecinema.com/listings/#',
      name: "Doc'n Roll Festival",
      programme: ['/programme/3049995/this-film-shouldn-t-exist/'],
    };
    expect(result).toStrictEqual(expected);
  });

  it('programme', async () => {
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
    const url =
      'https://thecastlecinema.com/programme/4375/it-s-a-wonderful-life/';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      dateTime: '2020-12-14T21:00:00.000Z',
      link: 'https://thecastlecinema.com/bookings/3141391/',
      tags: ['5-mondays'],
    };
    expect(result?.sessions).toHaveLength(6);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
