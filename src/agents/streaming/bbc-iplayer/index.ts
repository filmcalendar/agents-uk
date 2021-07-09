import $ from 'cheerio';
import { URL } from 'url';
import seriesWith from '@tuplo/series-with';
import type * as FC from '@filmcalendar/types';
import { BaseAgent } from '@filmcalendar/agents-core';

import {
  getPageProgramme,
  getEpisodeIdFromUrl,
  getTitle,
  getCredits,
  getAvailability,
} from './helpers';

export class Agent extends BaseAgent {
  ref = 'bbc-iplayer';

  register: FC.Agent.RegisterFn = () => ({
    agent: this.ref,
    country: 'uk',
    language: 'en-GB',
    type: 'films',
  });

  providers: FC.Agent.ProvidersFn = async () => [
    {
      name: 'BBC iPlayer',
      type: 'streaming',
      url: 'https://www.bbc.co.uk/iplayer',
    },
  ];

  featured: FC.Agent.FeaturedFn = async () => {
    const url = 'https://www.bbc.co.uk/iplayer/group/featured';
    const $page = await this.request.html(url);

    const feats = $page
      .find('.grid__item .content-item__link')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => new URL(href || '', url).href);

    return [...new Set(feats)];
  };

  programme: FC.Agent.ProgrammeFn = async () => {
    const url = 'https://www.bbc.co.uk/iplayer/categories/films/a-z';
    const $page = await this.request.html(url);

    const otherPageUrls = $page
      .find('.pagination__list .button--clickable')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => new URL(href || '', url).href);
    const pageUrls = [url, ...otherPageUrls];
    const prg = await seriesWith(pageUrls, getPageProgramme(this.request));

    return {
      programme: [...new Set(prg.flat())],
    };
  };

  page: FC.Agent.PageFn = async (url, provider) => {
    const episodeId = getEpisodeIdFromUrl(url);
    const programUrl = `https://www.bbc.co.uk/programmes/${episodeId}`;
    const $page = await this.request.html(programUrl);
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
}
