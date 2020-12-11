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
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => [
  {
    name: 'The Castle Cinema',
    url: 'https://thecastlecinema.com',
    address: "First floor, 64-66 Brooksby's Walk, Hackney, London E9 6DA",
    email: 'hello@thecastlecinema.com',
    type: 'cinema',
  },
];

export const featured: FC.Agent.FeaturedFn = async (provider) => {
  const { url } = provider;
  const $page = await fletch.html(url);

  const feats = $page
    .find('.hero-home a[href^="/programme"]')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => URL.resolve(url, href || ''));

  return [...new Set(feats)];
};

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://thecastlecinema.com/listings/';
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

export const page: FC.Agent.PageFn = async (url, provider) => {
  const $page = await fletch.html(url);

  return {
    url,
    provider,
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
