import nock from 'nock';
import type * as FC from '@filmcalendar/types';

import { Agent } from './index';

describe('bfi-southbank', () => {
  const agent = new Agent();

  const dataDir = `${__dirname}/__data__`;
  nock('https://whatson.bfi.org.uk')
    .persist()
    .get('/Online/article/releases')
    .replyWithFile(200, `${dataDir}/releases.html`)
    .get('/Online/article/filmsindex')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/Online/article/seasons')
    .replyWithFile(200, `${dataDir}/seasons.html`)
    .get('/Online/article/robertaltman')
    .replyWithFile(200, `${dataDir}/season.html`)
    .get(/Online\/article\/.+/)
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('featured', async () => {
    const [provider] = await agent.providers();
    const result = await agent.featured(provider);
    const expected = [
      'https://whatson.bfi.org.uk/Online/article/nomadland2021',
      'https://whatson.bfi.org.uk/Online/article/firstcow',
      'https://whatson.bfi.org.uk/Online/article/afterlove2021',
    ];
    expect(result).toHaveLength(17);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('seasons', async () => {
    const [provider] = await agent.providers();
    const result = await agent.seasons(provider);
    const expected = [
      'https://whatson.bfi.org.uk/Online/article/dreampalace',
      'https://whatson.bfi.org.uk/Online/article/robertaltman',
      'https://whatson.bfi.org.uk/Online/article/hervoice',
    ];
    expect(result.seasonUrls).toHaveLength(11);
    expect(result.seasonUrls.slice(0, 3)).toStrictEqual(expected);
  });

  it('season', async () => {
    const url = 'https://whatson.bfi.org.uk/Online/article/robertaltman';
    const result = await agent.season(url);
    const expected = {
      description:
        'We pay tribute to one of the most distinctive and audacious American directors.',
      image:
        'https://whatson.bfi.org.uk/content/Images/WhatsOn%20images/20210506/robert-altman-season-01.jpg',
      name: 'Robert Altman',
      url: 'https://whatson.bfi.org.uk/Online/article/robertaltman',
    };
    expect(result).toMatchObject(expected);
    expect(result.programme).toHaveLength(30);
  });

  it('programme', async () => {
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);
    const expected = [
      'https://whatson.bfi.org.uk/Online/article/20feetfromstardom',
      'https://whatson.bfi.org.uk/Online/article/35shotsofrum2021',
      'https://whatson.bfi.org.uk/Online/article/35shotsofrum2021intro',
    ];
    expect(result.programme).toHaveLength(236);
    expect(result.programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    const url = 'https://whatson.bfi.org.uk/Online/article/nomadland2021';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);
    const expected = {
      title: 'Nomadland',
      year: 2020,
      director: ['Chloé Zhao'],
      cast: ['Frances McDormand', 'David Strathairn', 'Linda May', 'Swankie'],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    const url = 'https://whatson.bfi.org.uk/Online/article/akira2020';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);
    const expected = {
      dateTime: '2021-06-16T14:40:00.000Z',
      tags: ['hoh-subtitles'],
      link: {
        method: 'POST',
        url: 'https://whatson.bfi.org.uk/Online/mapSelect.asp',
        formUrlEncoded: {
          'BOset::WSmap::seatmap::performance_ids':
            'B98AF6E9-E4EC-4B26-A6A8-632A02CA0273',
          'createBO::WSmap': '1',
        },
      },
    };
    expect(result?.sessions).toHaveLength(1);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected as FC.Session);
  });
});
