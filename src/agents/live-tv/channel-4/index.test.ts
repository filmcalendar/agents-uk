import nock from 'nock';
import type * as FC from '@filmcalendar/types';
import * as agent from '.';

describe('channel-4', () => {
  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1607380796000);

  const dataDir = `${__dirname}/__data__`;
  nock('https://www.channel4.com')
    .persist()
    .get(/tv-guide\/api/)
    .replyWithFile(200, `${dataDir}/day.json`);

  afterAll(() => {
    nock.cleanAll();
    dateNowSpy.mockRestore();
  });

  it('providers', async () => {
    expect.assertions(2);
    const result = await agent.providers();

    const expected = {
      ref: 'channel-4',
      name: 'Channel 4',
      url: 'https://www.channel4.com/now/C4',
      type: 'live-tv' as FC.Agent.ProviderType,
      _data: {
        id: 'C4',
        availableDates: [
          '2020-12-08',
          '2020-12-09',
          '2020-12-10',
          '2020-12-11',
          '2020-12-12',
          '2020-12-13',
          '2020-12-14',
          '2020-12-15',
          '2020-12-16',
          '2020-12-17',
        ],
      },
    };
    expect(result).toHaveLength(6);
    expect(result[0]).toStrictEqual(expected);
  });

  it('programme', async () => {
    expect.assertions(1);
    const providers = await agent.providers();
    const provider = providers.find((prv) => prv.ref === 'film-4');
    if (!provider) throw new Error('Film4 not found');
    const { programme } = await agent.programme(provider);

    const expected = [
      'https://www.channel4.com/tv-guide/2020/12/08/F4/30401988',
      'https://www.channel4.com/tv-guide/2020/12/08/F4/30401989',
      'https://www.channel4.com/tv-guide/2020/12/08/F4/30401990',
      'https://www.channel4.com/tv-guide/2020/12/08/F4/30401991',
      'https://www.channel4.com/tv-guide/2020/12/08/F4/30401993',
      'https://www.channel4.com/tv-guide/2020/12/08/F4/30401994',
    ];
    expect(programme).toStrictEqual(expected);
  });

  it('film', async () => {
    expect.assertions(1);
    const url = 'https://www.channel4.com/tv-guide/2020/12/08/F4/30401994';
    const providers = await agent.providers();
    const provider = providers.find((prv) => prv.ref === 'film-4');
    if (!provider) throw new Error('Film4 not found');
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      title: 'Legend',
      year: 2015,
    };
    expect(result?.films[0]).toStrictEqual(expected as FC.Agent.Film);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url = 'https://www.channel4.com/tv-guide/2020/12/08/F4/30401994';
    const providers = await agent.providers();
    const provider = providers.find((prv) => prv.ref === 'film-4');
    if (!provider) throw new Error('Film4 not found');
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      attributes: ['audio-described'],
      link: 'https://www.channel4.com/tv-guide/2020/12/08/F4/30401994',
      dateTime: '2020-12-08T23:25:00.000Z',
    };
    expect(result?.sessions).toHaveLength(1);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
