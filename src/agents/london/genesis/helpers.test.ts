import nock from 'nock';

import { getEventsInline } from './helpers';
import mockEventsInline from './__data__/events-inline.json';

describe('genesis cinema - helpers', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://genesiscinema.co.uk')
    .persist()
    .get('/GenesisCinema.dll/WhatsOn')
    .replyWithFile(200, `${dataDir}/programme.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('extracts events inline', async () => {
    expect.assertions(1);
    const url = 'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn';
    const result = await getEventsInline(url);

    expect(result).toMatchObject(mockEventsInline);
  });
});
