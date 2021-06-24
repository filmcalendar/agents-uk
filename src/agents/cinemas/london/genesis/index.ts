import { URL } from 'url';
import $ from 'cheerio';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import {
  getCast,
  getDirector,
  getEventsInline,
  getTitle,
  getYear,
  getSessions,
} from './helpers';

export const ref = 'genesis';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => [
  {
    address: '93-95 Mile End Rd, London E1 4UJ',
    name: 'Genesis Cinema',
    phone: '02077802000',
    type: 'cinema',
    url: 'https://genesiscinema.co.uk/GenesisCinema.dll/Home',
  },
];

export const featured: FC.Agent.FeaturedFn = async (provider) => {
  const { url } = provider;
  const $page = await fletch.html(url);

  const feats = $page
    .find('#banner .item a[href^=WhatsOn]')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => new URL(href || '', url).href);

  return [...new Set(feats)];
};

export const seasons: FC.Agent.SeasonsFn = async (provider) => {
  const { url } = provider;
  const $page = await fletch.html(url);

  const urls = $page
    .find('#phoenix-primary-nav li:nth-child(2)')
    .find('ul .has-children li:not(.go-back) a')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => new URL(href || '', url).href);

  return { seasonUrls: [...new Set(urls)] };
};

export const season: FC.Agent.SeasonFn = async (url) => {
  const $page = await fletch.html(url);

  const name = $page.find('#content > h2.subtitle:nth-child(1)').text();

  const prg = $page
    .find('.film-title > a')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => new URL(href || '', url).href);

  return { name, url, programme: [...new Set(prg)] };
};

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn';
  const events = await getEventsInline(url);

  const prg = events
    .filter((event) => !/Live Music, Ballet & Theatre/i.test(event.type))
    .filter((event) => !/Online Screenings/i.test(event.type))
    .filter((event) => !/Hot Desking/i.test(event.title))
    .filter((event) => !/The Yard - Book a Table/i.test(event.title))
    .filter((event) => !/Euro \d{4}/.test(event.title))
    .map((event) => event.url)
    .map((href) => new URL(href || '', url).href);

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
    sessions: getSessions($page, url),
  };
};
