import nock from 'nock';
import type * as FC from '@filmcalendar/types';

import * as agent from '.';

describe('bfi-southbank', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://whatson.bfi.org.uk')
    .persist()
    .get('/Online/article/filmsindex')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/Online/article/releases')
    .replyWithFile(200, `${dataDir}/releases.html`)
    .get('/Online/article/akira2020')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('featured', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.featured(provider);

    const expected = [
      'https://whatson.bfi.org.uk/Online/article/mogulmowgli2020',
      'https://whatson.bfi.org.uk/Online/article/countylines202010',
      'https://whatson.bfi.org.uk/Online/article/countylinesplusqanda',
    ];
    expect(result).toHaveLength(10);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('programme', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://whatson.bfi.org.uk/Online/article/35shotsofrum2020',
      'https://whatson.bfi.org.uk/Online/article/akira2020',
      'https://whatson.bfi.org.uk/Online/article/allaboutmymother2020',
    ];
    expect(result.programme).toHaveLength(58);
    expect(result.programme).toMatchObject(expect.arrayContaining(expected));
  });

  it('film', async () => {
    expect.assertions(1);
    const url = 'https://whatson.bfi.org.uk/Online/article/akira2020';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: 'Akira',
      year: 1988,
      director: ['Katsuhiro Otomo'],
      cast: ['Mitsuo Iwata', 'Nozomu Sasaki', 'Mami Koyama'],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url = 'https://whatson.bfi.org.uk/Online/article/akira2020';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      dateTime: '2020-12-03T20:35:00.000Z',
      attributes: ['cinematic-escapes', 'subtitles'],
      link: {
        method: 'POST',
        url: 'https://whatson.bfi.org.uk/Online/mapSelect.asp',
        formUrlEncoded: {
          'BOset::WSmap::seatmap::performance_ids':
            'B7F26229-1292-4042-B748-30C41E42D16A',
          'createBO::WSmap': '1',
        },
      },
    };
    expect(result?.sessions).toHaveLength(4);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected as FC.Agent.Session);
  });
});
