import $ from 'cheerio';
import fletch from '@tuplo/fletch';
import { URL } from 'url';
import seriesWith from '@tuplo/series-with';
import type * as FC from '@filmcalendar/types';

import {
  getPageProgramme,
  getEpisodeIdFromUrl,
  getTitle,
  getCredits,
  getAvailability,
} from './helpers';

export const ref = 'bbc-iplayer';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => [
  {
    name: 'BBC iPlayer',
    type: 'streaming',
    url: 'https://www.bbc.co.uk/iplayer',
  },
];

export const featured: FC.Agent.FeaturedFn = async () => {
  const url = 'https://www.bbc.co.uk/iplayer/group/featured';
  const $page = await fletch.html(url);

  const feats = $page
    .find('.grid__item .content-item__link')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => new URL(href || '', url).href);

  return [...new Set(feats)];
};

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://www.bbc.co.uk/iplayer/categories/films/a-z';
  const $page = await fletch.html(url);

  const otherPageUrls = $page
    .find('.pagination__list .button--clickable')
    .toArray()
    .map((a) => $(a).attr('href'))
    .map((href) => new URL(href || '', url).href);
  const pageUrls = [url, ...otherPageUrls];
  const prg = await seriesWith(pageUrls, getPageProgramme);

  return {
    programme: [...new Set(prg.flat())],
  };
};

export const page: FC.Agent.PageFn = async (url, provider) => {
  const episodeId = getEpisodeIdFromUrl(url);
  const programUrl = `https://www.bbc.co.uk/programmes/${episodeId}`;
  const $page = await fletch.html(programUrl);
  const credits = getCredits($page);

  return {
    url,
    provider,
    films: [
      {
        title: getTitle($page),
        director: credits.get('director'),
        cast: credits.get('cast'),
      },
    ],
    availability: getAvailability($page),
  };
};
