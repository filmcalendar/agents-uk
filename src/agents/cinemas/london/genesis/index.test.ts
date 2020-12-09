import nock from 'nock';
import * as agent from '.';

describe('genesis', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://genesiscinema.co.uk')
    .persist()
    .get('/GenesisCinema.dll/WhatsOn')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/GenesisCinema.dll/WhatsOn?Film=14448909')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('programme', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=22804686',
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=14448909',
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=22712062',
    ];
    expect(result.programme).toHaveLength(16);
    expect(result.programme).toStrictEqual(expect.arrayContaining(expected));
  });

  it('film', async () => {
    expect.assertions(1);
    const url =
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=14448909';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = [
      {
        title: 'V For Vendetta',
        director: ['James McTeigue'],
        cast: [
          'Natalie Portman',
          'Hugo Weaving',
          'Stephen Rea',
          'John Hurt',
          'Roger Allam',
          'Sinead Cusack',
          'Nicolas De Pruyssenaere',
        ],
        year: 2005,
      },
    ];
    expect(result?.films).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url =
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=14448909';
    const [provider] = await agent.providers();
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      dateTime: '2020-12-03T21:00:00.000Z',
      link:
        'https://genesiscinema.co.uk/GenesisCinema.dll/Booking?Booking=TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_22710131.TcsSection_4496269',
      attributes: [],
    };
    expect(result?.sessions).toHaveLength(1);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
