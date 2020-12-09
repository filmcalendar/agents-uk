import nock from 'nock';
import type * as FC from '@filmcalendar/types';

import * as agent from '.';

describe('ica', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://www.ica.art')
    .persist()
    .get('/films')
    .replyWithFile(200, `${dataDir}/programme.html`)
    .get(/films\/.+/i)
    .replyWithFile(200, `${dataDir}/film.html`)
    .get(/book/)
    .replyWithFile(404, `${dataDir}/book.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('programme', async () => {
    expect.assertions(2);
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://www.ica.art/films/for20',
      'https://www.ica.art/films/air-conditioner',
      'https://www.ica.art/films/for-shorts-2',
    ];
    expect(result.programme).toHaveLength(19);
    expect(result.programme).toStrictEqual(expect.arrayContaining(expected));
  });

  it('film', async () => {
    expect.assertions(1);
    const url = 'https://www.ica.art/films/a-storm-was-coming';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: 'A Storm Was Coming',
      director: ['Javier Fernández Vázquez'],
      year: 2020,
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    expect.assertions(2);
    const url = 'https://www.ica.art/films/air-conditioner';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected: FC.Agent.Session = {
      dateTime: '2020-12-13T18:00:00.000Z',
      link: {
        url:
          'https://buy.ica.art/ica/website/EventDetails.aspx?Stylesheet=main-spektrix.css&EventId=96401&resize=true',
        method: 'POST',
        formUrlEncoded: { ctl00$ContentPlaceHolder$InstanceList: '166805' },
      },
      attributes: [],
    };
    expect(result?.sessions).toHaveLength(1);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
