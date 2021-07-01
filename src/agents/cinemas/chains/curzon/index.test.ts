import nock from 'nock';
import type * as FC from '@filmcalendar/types';

import * as agent from '.';

describe('curzon', () => {
  const mocksDir = `${__dirname}/__data__`;
  nock('https://www.curzon.com')
    .persist()
    .get(/venues/)
    .replyWithFile(200, `${mocksDir}/venues.html`);

  nock('https://vwc.curzon.com')
    .persist()
    .get(/film-screening-dates/)
    .replyWithFile(200, `${mocksDir}/film-screening-dates.json`)
    .get(/showtimes\/business-date/)
    .replyWithFile(200, `${mocksDir}/business-date.json`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('providers', async () => {
    const result = await agent.providers();

    const expected: FC.Provider = {
      address: '2 Canter Way, London, E1 8PS',
      chain: 'Curzon',
      name: 'Aldgate',
      type: 'cinema',
      url: 'https://www.curzon.com/venues/aldgate/',
      _data: {
        apiUrl: 'https://vwc.curzon.com/WSVistaWebClient',
        authToken:
          'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRBQUQ3MUYwRDI3OURBM0Y2NkMzNjJBM0JGMDRBMDFDNDBBNzU4RjciLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiIxbWpyZm13anJ3ODB4ZjM5cXgwNzcwcTUwd2M4aDdkNTYiLCJnaXZlbl9uYW1lIjoiQ3Vyem9uIiwiZmFtaWx5X25hbWUiOiJXZWIgSG9zdCIsInZpc3RhX29yZ2FuaXNhdGlvbl9jb2RlIjoiYTFiOXNqMG05ZTRtNzluN2RhdHd0MHMzdmcwIiwidG9rZW5fdXNhZ2UiOiJhY2Nlc3NfdG9rZW4iLCJqdGkiOiIzZWY4OGY2OC03ODFiLTQ5ZjctYTUzNS1jNTIzN2EzMTcwMDMiLCJhdWQiOiJhbGwiLCJhenAiOiJDdXJ6b24gQ2luZW1hcyAtIERpZ2l0YWwgV2ViIERldiAtIFBST0QiLCJuYmYiOjE2MjM3NjIzNjAsImV4cCI6MTYyMzgwNTU2MCwiaWF0IjoxNjIzNzYyMzYwLCJpc3MiOiJodHRwczovL2F1dGgubW92aWV4Y2hhbmdlLmNvbS8ifQ.wXABdErcvAaYeGgndBnbIwj66kLdsYg0wKEfsWxKtZHPRNhWpxr6BbMYBmn6GNzPdcdLAo7rrdGQAR9fSyn9LSlbcPYYw8sRy78OMoFtLaBHXBcZTlVRcj7TQ4L-j7DGRK2IVeYU80zHDPWC41k2QWnqZIo0dlZRbI9lIMafnyrN5PCR-D5jhUR08OQ2ck32Focq0R9uU_JZsQ_QVn2Z8DL4sxXIAZP0ohsSwIradZWE6pEV9oQJygSW9MV-XMqmlKK7uXAq5zPfn4prfsLb3_aYMmkUBg1MZvMZjl8ZCsXaBTLZS_zyd2MtmN3-nExvVEYvOoOzcP-cFX0MB6rqthyIGZ_A8ySQwQqhzzsBba47tw6iodNRRIwkVULvfHX6H2P6mE_AAQEm2ve7mjyEUdL0MSB993BMyAqK00JpZED6O8sxXD45oxktOkm37ErZx1yWinMK02SGwXgENLHaIp4dIhYWiVD2ZjZajx7ma6XBbUcpuLVa81qEk4VD29ZqEBr-cO79EKqA0tG9DMIBuKXF5H6Jm7k6I5NZG1otZ2FucE76gXFnH5_O4v3RKJsdJfzmli3Lca8OJe3hA8PodWVKFlH-6hZvkMmfbko01Nnt5ZHSauZ7dOe4pGc5a3IQ2lOsOcrcmhO89pnrZ1tBIwMKGGr_kdZ_ubh9--r4Fqk',
        cinemaId: 'ALD1',
      },
    };
    expect(result).toHaveLength(13);
    expect(result[0]).toStrictEqual(expected);
  });

  it('programme', async () => {
    const [provider] = await agent.providers();
    const result = await agent.programme(provider);

    const expected = [
      'https://www.curzon.com/films/HO00003137',
      'https://www.curzon.com/films/HO00003372',
      'https://www.curzon.com/films/HO00003391',
    ];
    expect(result.programme).toHaveLength(15);
    expect(result.programme.slice(0, 3)).toStrictEqual(expected);
  });

  it('film', async () => {
    const url = 'https://www.curzon.com/films/HO00003137';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      title: 'A Quiet Place Part II',
      director: ['John Krasinski'],
      cast: [
        'Cillian Murphy',
        'Emily Blunt',
        'Djimon Hounsou',
        'John Krasinski',
        'Millicent Simmonds',
        'Noah Jupe',
      ],
    };
    expect(result?.films[0]).toStrictEqual(expected);
  });

  it('sessions', async () => {
    const url = 'https://www.curzon.com/films/HO00003137';
    const [provider] = await agent.providers();
    const result = await agent.page(url, provider);

    const expected = {
      attributes: ['subtitled'],
      dateTime: '2021-06-15T20:10:00.000Z',
      link: 'https://www.curzon.com/ticketing/seats/ALD1-27902/',
    };
    expect(result?.sessions).toHaveLength(15);
    const [firstSession] = result?.sessions || [];
    expect(firstSession).toStrictEqual(expected);
  });
});
