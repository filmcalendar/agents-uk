import nock from 'nock';

import { Agent } from './index';

describe('bbc-iplayer', () => {
  const agent = new Agent();

  // 2021-06-16
  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1623848047000);

  const dataDir = `${__dirname}/__data__`;
  nock('https://www.bbc.co.uk')
    .persist()
    .get('/iplayer/group/featured')
    .replyWithFile(200, `${dataDir}/featured.html`)
    .get(/iplayer\/categories\/films\/a-z/)
    .replyWithFile(200, `${dataDir}/films.html`)
    .get(/programmes/)
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
    dateNowSpy.mockRestore();
  });

  it('featured', async () => {
    const [provider] = await agent.providers();
    const result = await agent.featured(provider);

    const expected = [
      'https://www.bbc.co.uk/iplayer/episode/m000x36m/euro-2020-replay-france-v-germany',
      'https://www.bbc.co.uk/iplayer/episode/p09fs2x4/time-series-1-episode-1',
      'https://www.bbc.co.uk/iplayer/episode/p09jjyrc/cristiano-ronaldo-impossible-to-ignore',
    ];
    expect(result).toHaveLength(33);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('programme', async () => {
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://www.bbc.co.uk/iplayer/episode/m0007zh7/20th-century-women',
      'https://www.bbc.co.uk/iplayer/episode/m000kkby/310-to-yuma-2007',
      'https://www.bbc.co.uk/iplayer/episode/b0078tnk/a-damsel-in-distress',
    ];
    expect(result.programme).toHaveLength(36);
    expect(result.programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    const url =
      'https://www.bbc.co.uk/iplayer/episode/m0007zh7/20th-century-women';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: '20th Century Women',
      director: ['Mike Mills'],
      cast: [
        'Annette Bening',
        'Elle Fanning',
        'Greta Gerwig',
        'Billy Crudup',
        'Lucas Jade Zumann',
        'Alison Elliott',
        'Thea Gill',
      ],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });
});
