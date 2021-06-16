import nock from 'nock';

import type * as C4 from './index.d';

import type { GetDailyProgrammeParams } from './helpers';
import {
  getAvailableDates,
  trimProgram,
  getDailyProgramme,
  getSlotIdFromUrl,
  getYear,
  getSessions,
} from './helpers';

import mockResponse from './__data__/day.json';

const mockProgram: C4.Program = {
  isMovie: 'true',
  slotId: '30401994',
  startDate: '2020-12-08T23:25:00.000Z',
  summary:
    "(2015) Tom Hardy plays both leads in a biopic of London gangsters Ronnie and Reggie Kray that's by turns humorous and brutally violent. With Emily Browning. Very strong, offensive language.",
  title: 'Legend',
  url: '/tv-guide/2020/12/08/F4/30401994',
  isSubtitled: false,
  isAudioDescribed: true,
};

describe('channel4 - helpers', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://www.channel4.com')
    .persist()
    .get(/tv-guide\/api/)
    .replyWithFile(200, `${dataDir}/day.json`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('gets available dates', () => {
    expect.assertions(1);

    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1607380796000);
    const result = getAvailableDates(
      mockResponse as unknown as C4.DailyProgramme
    );

    const expected = [
      '2021-06-09',
      '2021-06-10',
      '2021-06-11',
      '2021-06-12',
      '2021-06-13',
      '2021-06-14',
      '2021-06-15',
      '2021-06-16',
      '2021-06-17',
      '2021-06-18',
      '2021-06-19',
      '2021-06-20',
      '2021-06-21',
      '2021-06-22',
      '2021-06-23',
      '2021-06-24',
      '2021-06-25',
      '2021-06-26',
    ];
    expect(result).toStrictEqual(expected);
    dateNowSpy.mockRestore();
  });

  it('trims a C4.Program', () => {
    expect.assertions(1);

    const mockProgramRaw = {
      slotId: '30401994',
      distribution: 'F4',
      startDate: '2020-12-08T23:25:00.000Z',
      endDate: '2020-12-09T02:05:00.000Z',
      durationSeconds: 9600,
      brandTitle: 'Legend',
      brandWebSafeTitle: '',
      title: 'Legend',
      summary:
        "(2015) Tom Hardy plays both leads in a biopic of London gangsters Ronnie and Reggie Kray that's by turns humorous and brutally violent. With Emily Browning. Very strong, offensive language.",
      isRepeat: true,
      isSubtitled: false,
      isAudioDescribed: true,
      isHD: false,
      programmeId: '63520/001',
      isMovie: 'true',
      ageRating: 0,
      guidance: '',
      isOnCatchup: false,
      isOnSimulcast: true,
      hasReminder: false,
      isSelected: false,
      moreInfoUrl: '',
      url: '/tv-guide/2020/12/08/F4/30401994',
    };
    const result = trimProgram(mockProgramRaw as C4.Program);

    expect(result).toStrictEqual(mockProgram);
  });

  it('gets daily programme for a channel', async () => {
    expect.assertions(2);

    const params: GetDailyProgrammeParams = {
      channelId: 'F4',
      date: '2020-12-07',
    };
    const result = await getDailyProgramme(params);

    const expected = {
      ageRating: 0,
      brandTitle: 'My Man Godfrey',
      brandWebSafeTitle: '',
      distribution: 'F4',
      durationSeconds: 6900,
      endDate: '2021-06-16T11:55:00.000Z',
      guidance: '',
      hasReminder: false,
      isAudioDescribed: false,
      isHD: true,
      isMovie: 'true',
      isOnCatchup: false,
      isOnSimulcast: true,
      isRepeat: true,
      isSelected: false,
      isSubtitled: false,
      moreInfoUrl: '',
      programmeId: '3465/001',
      slotId: '30507740',
      startDate: '2021-06-16T10:00:00.000Z',
      summary:
        "(1936) Classic screwball comedy with Carole Lombard and William Powell. A young rich woman hires a 'forgotten man' as a butler. Attitudes of the era that may now offend.",
      title: 'My Man Godfrey',
      url: '/tv-guide/2021/06/16/F4/30507740',
    } as C4.Program;
    expect(result).toHaveLength(8);
    expect(result[0]).toStrictEqual(expected);
  });

  it('gets slotId from program url', () => {
    expect.assertions(1);

    const url = 'https://www.channel4.com/tv-guide/2020/12/08/F4/30401988';
    const result = getSlotIdFromUrl(url);

    const expected = '30401988';
    expect(result).toBe(expected);
  });

  it('gets film year', () => {
    expect.assertions(1);

    const result = getYear(mockProgram);

    const expected = 2015;
    expect(result).toBe(expected);
  });

  it('gets sessions', () => {
    expect.assertions(2);

    const result = getSessions(mockProgram);

    const expected = {
      attributes: ['audio-described'],
      link: 'https://www.channel4.com/tv-guide/2020/12/08/F4/30401994',
      dateTime: '2020-12-08T23:25:00.000Z',
    };
    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual(expected);
  });
});
