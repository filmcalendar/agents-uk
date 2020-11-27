import fs from 'fs';
import nock from 'nock';
import $ from 'cheerio';

import { findMovieUrls, getDirector } from './helpers';

const mockFilmHtml = fs.readFileSync(`${__dirname}/__data__/film.html`, 'utf8');

describe('ica - helpers', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://www.ica.art')
    .persist()
    .get('/films')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/films/air-conditioner')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('finds movies url', async () => {
    expect.assertions(2);
    const url = 'https://www.ica.art/films/air-conditioner';
    const result = await findMovieUrls(url);

    const expected = [
      'https://www.ica.art/films/air-conditioner',
      'https://www.ica.art/films/for20',
    ];
    expect(expected).toHaveLength(2);
    expect(result).toStrictEqual(expected);
  });

  it('finds director', () => {
    expect.assertions(1);
    const $page = $.load(mockFilmHtml).root();
    const result = getDirector($page);

    const expected = ['Javier Fernández Vázquez'];
    expect(result).toStrictEqual(expected);
  });
});
