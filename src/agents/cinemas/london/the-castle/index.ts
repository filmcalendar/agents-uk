import $ from 'cheerio';
import { URL } from 'url';
import type * as FC from '@filmcalendar/types';
import { BaseAgent } from '@filmcalendar/agents-core';

import {
  getTitle,
  getDirector,
  getCast,
  getYear,
  getSessions,
  isNotFilm,
} from './helpers';

type SeasonData = Map<string, FC.Season>;

export class Agent extends BaseAgent {
  ref = 'the-castle';

  register: FC.Agent.RegisterFn = () => ({
    agent: this.ref,
    country: 'uk',
    language: 'en-GB',
    type: 'films',
  });

  providers: FC.Agent.ProvidersFn = async () => [
    {
      name: 'The Castle Cinema',
      url: 'https://thecastlecinema.com',
      address: "First floor, 64-66 Brooksby's Walk, Hackney, London E9 6DA",
      email: 'hello@thecastlecinema.com',
      type: 'cinema',
    },
  ];

  featured: FC.Agent.FeaturedFn = async (provider) => {
    const { url } = provider;
    const $page = await this.request.html(url);

    const feats = $page
      .find('.hero-home a[href^="/programme"]')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => new URL(href || '', url).href);

    return [...new Set(feats)];
  };

  seasons: FC.Agent.SeasonsFn = async () => {
    const url = 'https://thecastlecinema.com/listings/';
    const $page = await this.request.html(url);

    const seasonData = $page
      .find('.tile-eventname')
      .toArray()
      .reduce((acc, event) => {
        const $event = $(event);
        const $eventLink = $event.find('a:nth-child(2)');
        const href = $eventLink.attr('href');
        const pageUrl = $event.find('a[href^="/programme"]').attr('href');
        if (!href || !pageUrl) return acc;
        if (/^\/organisation/.test(href)) return acc;

        const collectionUrl = new URL(href, url).href;
        const newCollection =
          acc.get(collectionUrl) ||
          ({ url: '', name: '', programme: [] } as FC.Season);
        newCollection.url = collectionUrl;
        newCollection.name = $eventLink.text();
        newCollection.programme = newCollection.programme || [];
        newCollection.programme.push(pageUrl);
        acc.set(collectionUrl, newCollection);

        return acc;
      }, new Map() as SeasonData);

    return { seasonUrls: [...seasonData.keys()], _data: seasonData };
  };

  season: FC.Agent.SeasonFn = async (url, options) => {
    const data = (options?._data || new Map()) as SeasonData;
    if (/listings/.test(url)) return data.get(url) as FC.Season;

    const $page = await this.request.html(url);

    const name = $page.find('.hero-title h3').text();
    const [description] = $page
      .find('.intro p')
      .toArray()
      .map((p) => $(p).text().trim())
      .filter(Boolean);
    const image = new URL($page.find('.hero-image img').attr('src') || '', url)
      .href;

    const prg = $page
      .find('.tile-details > a')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => new URL(href || '', url).href);

    return { name, description, image, url, programme: [...new Set(prg)] };
  };

  programme: FC.Agent.ProgrammeFn = async () => {
    const url = 'https://thecastlecinema.com/listings/';
    const $page = await this.request.html(url);

    const prg = $page
      .find('.main .tile .tile-details > a')
      .toArray()
      .filter((a) => !isNotFilm($(a).text()))
      .map((a) => $(a).attr('href'))
      .map((href) => (href ? new URL(href, url).href : ''))
      .filter(Boolean);

    return { programme: [...new Set(prg)] };
  };

  page: FC.Agent.PageFn = async (url, provider) => {
    const $page = await this.request.html(url);

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
}
