import nock from 'nock';
import * as agent from '.';

describe('bbc-iplayer', () => {
  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1607380796000);

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
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.featured(provider);

    const expected = [
      'https://www.bbc.co.uk/iplayer/episode/m000q6rf/small-axe-series-1-alex-wheatle',
      'https://www.bbc.co.uk/iplayer/episode/m000pb15/his-dark-materials-series-2-1-the-city-of-magpies',
      'https://www.bbc.co.uk/iplayer/episode/p08xhqx8/we-are-who-we-are-series-1-1-right-here-right-now',
    ];
    expect(result).toHaveLength(31);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('programme', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://www.bbc.co.uk/iplayer/episode/p04b183c/adam-curtis-hypernormalisation',
      'https://www.bbc.co.uk/iplayer/episode/b0078tnk/a-damsel-in-distress',
      'https://www.bbc.co.uk/iplayer/episode/p07ctvvn/a-high-school-rape-goes-viral-roll-red-roll',
    ];
    expect(result.programme).toHaveLength(36);
    expect(result.programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    expect.assertions(1);
    const url = 'https://www.bbc.co.uk/iplayer/episode/b0074n82/citizen-kane';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: 'Citizen Kane',
      director: ['Orson Welles'],
      cast: [
        'Orson Welles',
        'Buddy Swan',
        'Sonny Bupp',
        'Harry Shannon',
        'Joseph Cotten',
        'Everett Sloane',
        'Agnes Moorehead',
        'Ray Collins',
        'Dorothy Comingore',
        'George Coulouris',
        'Paul Stewart',
        'Ruth Warrick',
        'Fortunio Bonanova',
        'Gus Schilling',
        'Erskine Sanford',
        'Philip Van Zandt',
        'William Alland',
      ],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });
});
