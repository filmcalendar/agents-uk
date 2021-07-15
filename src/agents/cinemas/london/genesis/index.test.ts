import nock from 'nock';

import { Agent } from './index';

describe('genesis', () => {
  const agent = new Agent();

  const dataDir = `${__dirname}/__data__`;
  nock('https://genesiscinema.co.uk')
    .persist()
    .get('/GenesisCinema.dll/Home')
    .replyWithFile(200, `${dataDir}/home.html`)
    .get('/GenesisCinema.dll/Page?PageID=1&SubListID=0&SubPageID=63')
    .replyWithFile(200, `${dataDir}/season.html`)
    .get('/GenesisCinema.dll/WhatsOn')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/GenesisCinema.dll/WhatsOn?Film=23309654')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('featured', async () => {
    const [provider] = await agent.providers();
    const result = await agent.featured(provider);

    const expected = [
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=23008918',
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=23070069',
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=21743960',
    ];
    expect(result).toHaveLength(20);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('seasons', async () => {
    const [provider] = await agent.providers();
    const result = await agent.seasons(provider);

    const expected = [
      'https://genesiscinema.co.uk/GenesisCinema.dll/Page?PageID=1&SubListID=0&SubPageID=50',
    ];
    expect(result.seasonUrls).toHaveLength(1);
    expect(result.seasonUrls.slice(0, 3)).toStrictEqual(expected);
  });

  it('season', async () => {
    const url =
      'https://genesiscinema.co.uk/GenesisCinema.dll/Page?PageID=1&SubListID=0&SubPageID=63';
    const result = await agent.season(url);

    const expected = {
      url: 'https://genesiscinema.co.uk/GenesisCinema.dll/Page?PageID=1&SubListID=0&SubPageID=63',
      name: 'Anniversary Season',
      programme: [
        'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=2572401',
        'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=22663092',
      ],
    };
    expect(result).toStrictEqual(expected);
  });

  it('programme', async () => {
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=23309654',
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=23236443',
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=23070069',
    ];
    expect(result.programme).toHaveLength(48);
    expect(result.programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    const url =
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=23309654';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = [
      {
        title: 'Nobody',
        director: ['Ilya Naishuller'],
        cast: [
          'Bob Odenkirk',
          'Aleksey Serebryakov',
          'Connie Nielson',
          'Christopher Llyod',
        ],
        year: 2021,
      },
    ];
    expect(result?.films).toStrictEqual(expected);
  });

  it('sessions', async () => {
    const url =
      'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn?Film=23309654';
    const [provider] = await agent.providers();
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      dateTime: '2021-06-16T15:25:00.000Z',
      link: 'https://genesiscinema.co.uk/GenesisCinema.dll/Booking?Booking=TSelectItems.waSelectItemsPrompt.TcsWebMenuItem_0.TcsWebTab_0.TcsPerformance_23432225.TcsSection_22011588',
      tags: [],
    };
    expect(result?.sessions).toHaveLength(4);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
