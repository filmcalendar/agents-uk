import nock from 'nock';
import fletch from '@tuplo/fletch';

import type * as BBC from './index.d';
import mockSchedule from './__data__/schedule.json';
import {
  getAvailableDatesUrls,
  getDailySchedule,
  getSessions,
} from './helpers';

describe('bbc - helpers', () => {
  // 2020-12-13T10:07:48.000Z
  const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1607854068000);

  const dataDir = `${__dirname}/__data__`;
  nock('https://www.bbc.co.uk')
    .persist()
    .get('/iplayer/guide')
    .replyWithFile(200, `${dataDir}/guide.html`)
    .get(/iplayer\/guide\/.+/)
    .replyWithFile(200, `${dataDir}/guide-channel.html`)
    .get('/programmes/b01nx8kb')
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
    dateNowSpy.mockRestore();
  });

  it('gets available dates for a channel', async () => {
    const url = 'https://www.bbc.co.uk/iplayer/guide/bbcfour';
    const $page = await fletch.html(url);
    const result = getAvailableDatesUrls(url, $page);

    const expected = [
      'https://www.bbc.co.uk/iplayer/guide/bbcfour/20210609',
      'https://www.bbc.co.uk/iplayer/guide/bbcfour/20210610',
      'https://www.bbc.co.uk/iplayer/guide/bbcfour/20210611',
    ];
    expect(result).toHaveLength(15);
    expect(result.slice(0, 3)).toStrictEqual(expected);
  });

  it('gets a schedule for a day/channel', async () => {
    const url = 'https://www.bbc.co.uk/iplayer/guide/bbcfour/20210615';
    const result = await getDailySchedule(fletch.create())(url);

    const expected: BBC.ScheduleItem = {
      meta: {
        scheduledStart: '2021-06-17T19:00:00.000Z',
      },
      props: {
        href: '/programmes/b084zbf0',
        label: 'Film',
      },
    };
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(expected);
  });

  it('gets sessions from the schedule', () => {
    const episodeId = 'b01nx8kb';
    const result = getSessions(episodeId, mockSchedule);

    const expected = {
      tags: ['audio-described', 'sign-language'],
      dateTime: '2020-12-14T02:00:00.000Z',
      link: 'https://bbc.co.uk//programmes/b01nx8kb',
    };
    expect(result).toHaveLength(8);
    expect(result[0]).toStrictEqual(expected);
  });
});
