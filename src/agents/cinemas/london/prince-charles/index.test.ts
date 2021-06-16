import nock from 'nock';
import * as agent from '.';

describe('prince-charles-cinema', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://princecharlescinema.com')
    .persist()
    .get('/PrinceCharlesCinema.dll/Home')
    .replyWithFile(200, `${dataDir}/home.html`)
    .get('/PrinceCharlesCinema.dll/Seasons')
    .replyWithFile(200, `${dataDir}/seasons.html`)
    .get('/PrinceCharlesCinema.dll/Seasons?e=1')
    .replyWithFile(200, `${dataDir}/season.html`)
    .get('/PrinceCharlesCinema.dll/WhatsOn')
    .replyWithFile(200, `${dataDir}/programme.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('featured', async () => {
    expect.assertions(2);

    const [provider] = await agent.providers();
    const result = await agent.featured(provider);

    const expected = [
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=6778983',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=18258150',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=17956917',
    ];
    expect(result).toHaveLength(6);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('collections', async () => {
    expect.assertions(2);

    const [provider] = await agent.providers();
    const result = await agent.collections(provider);

    const expected = [
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/Seasons?e=1',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/Seasons?e=0',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/Seasons?e=3',
    ];
    expect(result.collections).toHaveLength(51);
    expect(result.collections.slice(0, 3)).toStrictEqual(expected);
  });

  it('collection', async () => {
    expect.assertions(3);

    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/Seasons?e=1';
    const [provider] = await agent.providers();
    const { _data } = await agent.collections(provider);
    const result = await agent.collection(url, { _data });

    const expected = {
      url,
      name: '35mm PRESENTATIONS',
    };
    const expectedProgramme = [
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=16787112',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=1865247',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=15047646',
    ];
    expect(result).toMatchObject(expected);
    expect(result.programme).toHaveLength(50);
    expect(result.programme.slice(0, 3)).toStrictEqual(expectedProgramme);
  });

  it('programme', async () => {
    expect.assertions(2);

    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=3527',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=1805929',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=1243043',
    ];
    expect(result.programme).toHaveLength(166);
    expect(result.programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    expect.assertions(2);

    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=3527';
    const [provider] = await agent.providers();
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      title: 'FARGO',
      director: ['Ethan Coen', 'Joel Coen'],
      cast: ['Frances McDormand', 'Steve Buscemi', 'William H. Macy'],
      year: 1996,
    };
    expect(result?.films).toHaveLength(1);
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=3527';
    const [provider] = await agent.providers();
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      link: 'https://princecharlescinema.com/PrinceCharlesCinema.dll/Booking?Booking=TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_18033890.TcsSection_17512153',
      dateTime: '2021-06-16T12:15:00.000Z',
      attributes: [],
    };
    expect(result?.sessions).toHaveLength(3);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
