import $ from 'cheerio';
import URL from 'url';
import seriesWith from '@tuplo/series-with';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';

import {
  findMovieUrls,
  getDirector,
  getSessions,
  getTitle,
  getYear,
} from './helpers';

export const ref = 'ica';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => [
  {
    address: 'The Mall, London SW1Y 5AH',
    email: 'info@ica.art',
    name: 'Institute of Contemporary Arts',
    phone: '02079303647',
    type: 'cinema',
    url: 'https://www.ica.art',
  },
];

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://www.ica.art/films';
  const $page = await fletch.html(url);

  const pageUrls = $page
    .find('.item.films > a')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => URL.resolve(url, href || ''));
  const list = await seriesWith<string[], string>(pageUrls, findMovieUrls);
  const prg = list
    .flat()
    .filter((u) => !/bfi-london-film-festival/.test(u))
    .filter((u) => !/shorts-programme/.test(u))
    .filter((u) => !/london-short-film-festival/i.test(u));

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
        year: getYear($page),
      },
    ],
    sessions: await getSessions($page, url),
  };
};