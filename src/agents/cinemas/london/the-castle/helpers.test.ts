import nock from 'nock';
import fletch from '@tuplo/fletch';

import {
  getBookingIdFromUrl,
  getSessionAttributes,
  getSessions,
} from './helpers';

describe('the castle - helpers', () => {
  const dataDir = `${__dirname}/__data__`;
  nock('https://thecastlecinema.com')
    .persist()
    .get(/it-s-a-wonderful-life\/$/)
    .replyWithFile(200, `${dataDir}/film.html`);

  afterAll(() => {
    nock.cleanAll();
  });

  it('get booking id from url', () => {
    const url = 'https://thecastlecinema.com/bookings/3141391/';
    const result = getBookingIdFromUrl(url);

    const expected = '3141391';
    expect(result).toBe(expected);
  });

  it.each([
    ['https://thecastlecinema.com/bookings/3141391/', ['5-mondays']],
    ['https://thecastlecinema.com/bookings/3141399/', ['parent-and-baby']],
    ['https://thecastlecinema.com/bookings/3141397/', []],
  ])('get sessions attributes', async (bookingLink, expected) => {
    const url =
      'https://thecastlecinema.com/programme/4375/it-s-a-wonderful-life/';
    const $page = await fletch.html(url);
    const result = getSessionAttributes($page, bookingLink);

    expect(result).toStrictEqual(expected);
  });

  it('get sessions', async () => {
    const url =
      'https://thecastlecinema.com/programme/4375/it-s-a-wonderful-life/';
    const $page = await fletch.html(url);
    const result = getSessions($page);

    const expected = {
      dateTime: '2020-12-14T21:00:00.000Z',
      link: 'https://thecastlecinema.com/bookings/3141391/',
      attributes: ['5-mondays'],
    };
    expect(result).toHaveLength(6);
    expect(result[0]).toStrictEqual(expected);
  });
});
