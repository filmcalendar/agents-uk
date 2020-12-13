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
    .get(/iplayer\/guide\/.+/)
    .replyWithFile(200, `${dataDir}/guide-channel.html`)
    .get('/bbcfour')
    .replyWithFile(200, `${dataDir}/channel.html`)
    .get('/iplayer/group/p0841x0t')
    .replyWithFile(200, `${dataDir}/group.html`)
    .get('/programmes/b01nx8kb')
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
      type: 'live-tv' as FC.Agent.ProviderType,
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
      'https://www.bbc.co.uk/iplayer/episode/m000q5hp/storyville-red-penguins-murder-money-and-ice-hockey',
      'https://www.bbc.co.uk/iplayer/episode/m0001qyv/bros-after-the-screaming-stops',
      'https://www.bbc.co.uk/iplayer/episode/m000pz1w/storyville-locked-in-breaking-the-silence',
    ];
    expect(result).toHaveLength(6);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('collections', async () => {
    expect.assertions(2);
    const provider = await getBbcFourProvider();
    const result = await agent.collections(provider);

    const expected = [
      'https://www.bbc.co.uk/iplayer/group/p08ywb7x',
      'https://www.bbc.co.uk/iplayer/group/p06zl22b',
      'https://www.bbc.co.uk/iplayer/group/p0841x0t',
    ];
    expect(result.collections).toHaveLength(3);
    expect(result.collections.slice(0, 3)).toStrictEqual(expected);
  });

  it('collection', async () => {
    expect.assertions(3);
    const url = 'https://www.bbc.co.uk/iplayer/group/p0841x0t';
    const result = await agent.collection(url);

    const expected = {
      url: 'https://www.bbc.co.uk/iplayer/group/p0841x0t',
      name: 'Documentary Films',
      description:
        'Compelling stories from around the world - captured on camera.',
    };
    const expectedProgramme = [
      'https://www.bbc.co.uk/iplayer/episode/p07cttsd/minding-the-gap-an-american-skateboarding-story',
      'https://www.bbc.co.uk/iplayer/episode/p08q6jh8/any-one-of-us',
      'https://www.bbc.co.uk/iplayer/episode/m0001qyv/bros-after-the-screaming-stops',
    ];
    expect(result).toMatchObject(expected);
    expect(result.programme).toHaveLength(6);
    expect(result.programme.slice(0, 3)).toStrictEqual(expectedProgramme);
  });

  it('programme', async () => {
    expect.assertions(1);
    const provider = await getBbcFourProvider();
    const result = await agent.programme(provider);

    const expected = ['https://www.bbc.co.uk/programmes/b01nx8kb'];
    expect(result.programme).toStrictEqual(expected);
  });

  it('film', async () => {
    expect.assertions(1);
    const provider = await getBbcFourProvider();
    const { _data } = await agent.programme(provider);
    const url = 'https://www.bbc.co.uk/programmes/b01nx8kb';
    const result = await agent.page(url, provider, _data);

    const expected = {
      title: 'My Week with Marilyn',
      director: ['Simon Curtis'],
      cast: [
        'Michelle Williams',
        'Eddie Redmayne',
        'Kenneth Branagh',
        'Julia Ormond',
        'Judi Dench',
        'Zoe Wanamaker',
        'Derek Jacobi',
        'Jim Carter',
        'Toby Jones',
        'Dougray Scott',
        'Pip Torrens',
        'Geraldine Somerville',
        'Emma Watson',
        'Ruth Fowler',
      ],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const provider = await getBbcFourProvider();
    const { _data } = await agent.programme(provider);
    const url = 'https://www.bbc.co.uk/programmes/b01nx8kb';
    const result = await agent.page(url, provider, _data);

    const expected = {
      attributes: ['audio-described', 'sign-language'],
      dateTime: '2020-12-14T02:00:00.000Z',
      link: 'https://bbc.co.uk//programmes/b01nx8kb',
    };
    expect(result?.sessions).toHaveLength(8);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
