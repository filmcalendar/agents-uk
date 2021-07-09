import nock from 'nock';
import type * as FC from '@filmcalendar/types';

import { Agent } from './index';

describe('channel-4', () => {
  const agent = new Agent();

  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1623845912000);

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
    const result = await agent.providers();

    const expected = {
      ref: 'channel-4',
      name: 'Channel 4',
      url: 'https://www.channel4.com/now/C4',
      type: 'live-tv' as FC.ProviderType,
      _data: {
        id: 'C4',
        availableDates: [
          '2021-06-17',
          '2021-06-18',
          '2021-06-19',
          '2021-06-20',
          '2021-06-21',
          '2021-06-22',
          '2021-06-23',
          '2021-06-24',
          '2021-06-25',
          '2021-06-26',
        ],
      },
    };
    expect(result).toHaveLength(6);
    expect(result[0]).toStrictEqual(expected);
  });

  it('programme', async () => {
    const providers = await agent.providers();
    const provider = providers.find((prv) => prv.ref === 'film-4');
    if (!provider) throw new Error('Film4 not found');
    const { programme } = await agent.programme(provider);

    const expected = [
      'https://www.channel4.com/tv-guide/2021/06/16/F4/30507740',
      'https://www.channel4.com/tv-guide/2021/06/16/F4/30507741',
      'https://www.channel4.com/tv-guide/2021/06/16/F4/30507742',
    ];
    expect(programme).toHaveLength(8);
    expect(programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    const url = 'https://www.channel4.com/tv-guide/2021/06/16/F4/30507740';
    const providers = await agent.providers();
    const provider = providers.find((prv) => prv.ref === 'film-4');
    if (!provider) throw new Error('Film4 not found');
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      title: 'My Man Godfrey',
      year: 1936,
    };
    expect(result?.films[0]).toStrictEqual(expected as FC.Film);
  });

  it('sessions', async () => {
    const url = 'https://www.channel4.com/tv-guide/2021/06/16/F4/30507740';
    const providers = await agent.providers();
    const provider = providers.find((prv) => prv.ref === 'film-4');
    if (!provider) throw new Error('Film4 not found');
    const { _data } = await agent.programme(provider);
    const result = await agent.page(url, provider, _data);

    const expected = {
      tags: [],
      link: url,
      dateTime: '2021-06-16T10:00:00.000Z',
    };
    expect(result?.sessions).toHaveLength(1);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
