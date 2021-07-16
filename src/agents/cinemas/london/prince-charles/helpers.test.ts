import nock from 'nock';
import fletch from '@tuplo/fletch';

import { getWhatsOnData, getTitle } from './helpers';

describe('prince-charles-cinema: helpers', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://princecharlescinema.com')
    .persist()
    .get(/PrinceCharlesCinema.dll\/WhatsOn/)
    .replyWithFile(200, `${dataDir}/programme.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it.each([
    [3527, 'FARGO'],
    [1578567, 'MEMORIES OF MURDER [Salinui chueok]'],
  ])('get title', async (filmId, expected) => {
    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn?f=3527';
    const films = await getWhatsOnData(fletch.create(), url);
    const film = films.find((f) => f.ID === filmId);
    if (!film) throw new Error("Can't find film");
    const result = getTitle(film);

    expect(result).toBe(expected);
  });
});
