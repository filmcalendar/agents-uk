import $ from 'cheerio';
import URL from 'url';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';

import {
  getTitle,
  getDirector,
  getCast,
  getYear,
  getSessions,
} from './helpers';

export const ref = 'the-castle';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'cinemas',
});

export const venues: FC.Agent.VenuesFn = async () => [
  {
    name: 'The Castle Cinema',
    url: 'https://thecastlecinema.com',
    address: "First floor, 64-66 Brooksby's Walk, Hackney, London E9 6DA",
    email: 'hello@thecastlecinema.com',
  },
];

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://thecastlecinema.com/calendar/film/';
  const $page = await fletch.html(url);

  const prg = $page
    .find('.main .tile .tile-details > a')
    .toArray()
    .filter((a) => !/Pitchblack Playback/i.test($(a).text()))
    .map((a) => $(a).attr('href'))
    .map((href) => (href ? URL.resolve(url, href) : ''))
    .filter(Boolean);

  return { programme: [...new Set(prg)] };
};

export const page: FC.Agent.PageFn = async (url, venue) => {
  const $page = await fletch.html(url);

  return {
    url,
    venue,
    films: [
      {
        title: getTitle($page),
        director: getDirector($page),
        cast: getCast($page),
        year: getYear($page),
      },
    ],
    sessions: getSessions($page),
  };
};
