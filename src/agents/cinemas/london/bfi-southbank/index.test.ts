import nock from 'nock';
import type * as FC from '@filmcalendar/types';

import * as agent from '.';

describe('bfi-southbank', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://whatson.bfi.org.uk')
    .persist()
    .get('/Online/article/filmsindex')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get('/Online/article/seasons')
    .replyWithFile(200, `${dataDir}/seasons.html`)
    .get('/Online/article/cinematicescapes')
    .replyWithFile(200, `${dataDir}/season.html`)
    .get('/Online/article/releases')
    .replyWithFile(200, `${dataDir}/releases.html`)
    .get(/Online\/article\/.+/)
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

  it('collections', async () => {
    expect.assertions(1);
    const [provider] = await agent.providers();
    const result = await agent.collections(provider);

    expect(result.collections).toHaveLength(10);
  });

  it('collection', async () => {
    expect.assertions(1);
    const url = 'https://whatson.bfi.org.uk/Online/article/cinematicescapes';
    const result = await agent.collection(url);

    const expected = {
      description:
        'Lose yourself in the magic of cinema this month as we curate this special programme.',
      image:
        'https://whatson.bfi.org.uk/ArticleMedia/Images/WhatsOn%20images/202012/blade-runner-01.jpg',
      name: 'Cinematic Escapes',
      programme: [
        'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=7F45CB49-2899-44C7-9FE6-1B2DFAD72027',
        'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=B8E7A3D9-2DE9-43BA-811C-5615814CDD6F',
        'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=6446BCF6-EA0C-4F11-A77D-D628A169C31E',
        'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=940549AB-7978-460D-B711-FA3AEDB1457C',
        'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=A75F9B94-4D72-4551-9525-080853567746',
        'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=0C41A5DF-44B4-45D3-A10D-87E1CE00D792',
        'https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::article_id=AE3C03EF-EE87-479F-8FDD-0872E4F55B01',
      ],
      url: 'https://whatson.bfi.org.uk/Online/article/cinematicescapes',
    } as FC.Agent.Collection;
    expect(result).toStrictEqual(expected);
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
