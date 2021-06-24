import nock from 'nock';

import type * as FC from '@filmcalendar/types';
import * as agent from '.';

describe('bbc', () => {
  // 2020-12-13T10:07:48.000Z
  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1607854068000);

  const dataDir = `${__dirname}/__data__`;
  nock('https://www.bbc.co.uk')
    .persist()
    .get('/iplayer/guide')
    .replyWithFile(200, `${dataDir}/guide.html`)
    .get('/bbcfour')
    .replyWithFile(200, `${dataDir}/channel.html`)
    .get('/iplayer/group/p099ct9m')
    .replyWithFile(200, `${dataDir}/group.html`)
    .get(/iplayer\/guide\/.+/)
    .replyWithFile(200, `${dataDir}/guide-channel.html`)
    .get('/programmes/b084zbf0')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
    dateNowSpy.mockRestore();
  });

  const getBbcFourProvider = async () => {
    const provider = await agent
      .providers()
      .then((providers) => providers.find((prv) => prv.ref === 'bbcfour'));
    if (!provider) throw new Error('Provider found');
    return provider;
  };

  it('providers', async () => {
    expect.assertions(2);

    const result = await agent.providers();

    const expected = {
      ref: 'bbcone',
      name: 'BBC One',
      url: 'https://www.bbc.co.uk/bbcone',
      type: 'live-tv' as FC.ProviderType,
      _data: {
        tvGuideUrl: 'https://www.bbc.co.uk/iplayer/guide/bbcone',
      },
    };
    expect(result).toHaveLength(12);
    expect(result[0]).toStrictEqual(expected);
  });

  it('featured', async () => {
    expect.assertions(2);

    const provider = await getBbcFourProvider();
    const result = await agent.featured(provider);

    const expected = [
      'https://www.bbc.co.uk/iplayer/episode/m000pz1w/storyville-locked-in-breaking-the-silence',
    ];
    expect(result).toHaveLength(1);
    expect(result).toStrictEqual(expected);
  });

  it('seasons', async () => {
    expect.assertions(2);

    const provider = await getBbcFourProvider();
    const result = await agent.seasons(provider);

    const expected = [
      'https://www.bbc.co.uk/iplayer/group/p08ywb7x',
      'https://www.bbc.co.uk/iplayer/group/p099ct9m',
      'https://www.bbc.co.uk/iplayer/group/p09jnrs0',
    ];
    expect(result.seasonUrls).toHaveLength(3);
    expect(result.seasonUrls.slice(0, 3)).toStrictEqual(expected);
  });

  it('season', async () => {
    expect.assertions(3);

    const url = 'https://www.bbc.co.uk/iplayer/group/p099ct9m';
    const result = await agent.season(url);

    const expected = {
      url,
      name: 'Storyville',
      description: 'Series showcasing the best in international documentaries.',
    };
    const expectedProgramme = [
      'https://www.bbc.co.uk/iplayer/episode/m000sl86/storyville-into-the-storm-surfing-to-survive',
      'https://www.bbc.co.uk/iplayer/episode/m000nr85/the-mole-infiltrating-north-korea-series-1-part-1',
    ];
    expect(result).toMatchObject(expected);
    expect(result.programme).toHaveLength(2);
    expect(result.programme).toStrictEqual(expectedProgramme);
  });

  it('programme', async () => {
    expect.assertions(1);

    const provider = await getBbcFourProvider();
    const result = await agent.programme(provider);

    const expected = ['https://www.bbc.co.uk/programmes/b084zbf0'];
    expect(result.programme).toStrictEqual(expected);
  });

  it('film', async () => {
    expect.assertions(1);

    const provider = await getBbcFourProvider();
    const { _data } = await agent.programme(provider);
    const url = 'https://www.bbc.co.uk/programmes/b084zbf0';
    const result = await agent.page(url, provider, _data);

    const expected = {
      title: 'Florence Foster Jenkins',
      director: ['Stephen Frears'],
      cast: [
        'Meryl Streep',
        'Hugh Grant',
        'Simon Helberg',
        'Rebecca Ferguson',
        'Nina Arianda',
        'David Haig',
        'Brid Brennan',
        'John Kavanagh',
        'Stanley Townsend',
        'Allan Corduner',
        'Christian McKay',
        'John Sessions',
        'Maggie Steed',
        'Thelma Barlow',
        'Paola Dionisotti',
        'Carl Davis',
        'Nat Luurtsema',
      ],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);

    const provider = await getBbcFourProvider();
    const { _data } = await agent.programme(provider);
    const url = 'https://www.bbc.co.uk/programmes/b084zbf0';
    const result = await agent.page(url, provider, _data);

    const expected = {
      attributes: ['audio-described', 'sign-language'],
      dateTime: '2021-06-17T19:00:00.000Z',
      link: 'https://bbc.co.uk//programmes/b084zbf0',
    };
    expect(result?.sessions).toHaveLength(15);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
