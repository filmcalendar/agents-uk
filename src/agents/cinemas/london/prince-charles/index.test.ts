import nock from 'nock';
import * as agent from '.';

describe('prince-charles-cinema', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://princecharlescinema.com')
    .persist()
    .get('/PrinceCharlesCinema.dll/Home')
    .replyWithFile(200, `${dataDir}/home.html`)
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
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=17526412',
    ];
    expect(result).toHaveLength(1);
    expect(result).toStrictEqual(expected);
  });

  it('programme', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=17526412',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=17406753',
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=1865921',
    ];
    expect(result.programme).toHaveLength(47);
    expect(result.programme).toStrictEqual(expect.arrayContaining(expected));
  });

  it('film', async () => {
    expect.assertions(1);
    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=17526412';
    const [provider] = await agent.providers();
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = [
      {
        title: 'MANK',
        director: ['David Fincher'],
        cast: [
          'Gary Oldman',
          'Lily Collins',
          'Amanda Seyfried',
          'Tom Burke',
          'Charles Dance',
        ],
        year: 2020,
      },
    ];
    expect(result?.films).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=17526412';
    const [provider] = await agent.providers();
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      link:
        'https://princecharlescinema.com/PrinceCharlesCinema.dll/Booking?Booking=TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_17638266.TcsSection_17512153',
      dateTime: '2020-12-03T11:45:00.000Z',
      attributes: [],
    };
    expect(result?.sessions).toHaveLength(29);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
