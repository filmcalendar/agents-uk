import $ from 'cheerio';
import { URL } from 'url';
import type * as FC from '@filmcalendar/types';
import { BaseAgent } from '@filmcalendar/agents-core';

import isNotFilm from 'src/lib/is-not-film';
import {
  getArticleContext,
  getCast,
  getCredits,
  getDirector,
  getSessions,
  getTitle,
  getYear,
  getExpandedUrlFromPage,
  getExpandedUrl,
} from './helpers';

export class Agent extends BaseAgent {
  ref = 'bfi-southbank';

  register: FC.Agent.RegisterFn = () => ({
    agent: this.ref,
    country: 'uk',
    language: 'en-GB',
    type: 'films',
  });

  providers: FC.Agent.ProvidersFn = async () => [
    {
      address: 'Belvedere Road, South Bank, London SE1 8XT',
      name: 'BFI Southbank',
      phone: '02079283232',
      type: 'cinema',
      url: 'https://whatson.bfi.org.uk/Online/',
    },
  ];

  featured: FC.Agent.FeaturedFn = async () => {
    const url = 'https://whatson.bfi.org.uk/Online/article/releases';
    const $page = await this.request.html(url);

    const feats = $page
      .find('.editorial-component h4 a')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => `https://whatson.bfi.org.uk/Online/${href}`);

    return [...new Set(feats)];
  };

  seasons: FC.Agent.SeasonsFn = async () => {
    const url = 'https://whatson.bfi.org.uk/Online/article/seasons';
    const $page = await this.request.html(url);

    const urls = $page
      .find('h4 a')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => `https://whatson.bfi.org.uk/Online/${href}`);

    return { seasonUrls: [...new Set(urls)] };
  };

  season: FC.Agent.SeasonFn = async (url) => {
    const $page = await this.request.html(url);

    const name = $page.find('.main-article-body > h1').text();
    const description = $page
      .find('.main-article-body > h3:first-of-type')
      .text();
    const [image] = $page
      .find('[href^="#synopsis"] > img')
      .toArray()
      .map((img) => $(img).attr('src'))
      .map((src) => new URL(src || '', url).href);

    const { searchResults = [] } = getArticleContext($page);
    const prg = searchResults
      .map((result) => result[18])
      .map((href) => {
        const [, articleId] = /article_id=([A-Z0-9-]+)/.exec(href) || ['', ''];
        return getExpandedUrl(articleId);
      });

    return { url, name, description, image, programme: [...new Set(prg)] };
  };

  programme: FC.Agent.ProgrammeFn = async () => {
    const url = 'https://whatson.bfi.org.uk/Online/article/filmsindex';
    const $page = await this.request.html(url);

    const prg = $page
      .find('.main-article-body ul li a')
      .toArray()
      .filter((a) => {
        const t = $(a).text();
        return (
          !isNotFilm(t) &&
          !/^TV Preview/i.test(t) &&
          !/in Conversation/i.test(t) &&
          !/Griefcast/i.test(t) &&
          !/Seniors Free Talk/i.test(t)
        );
      })
      .map((a) => $(a).attr('href'))
      .filter(Boolean)
      .sort((a, b) => (a && b ? a.localeCompare(b) : 0))
      .map((href) => `/Online/${href}`)
      .map((href) => new URL(href || '', url).href);

    return { programme: [...new Set(prg)] };
  };

  page: FC.Agent.PageFn = async (url, provider) => {
    const $page = await this.request.html(url, {
      validateStatus: (status) =>
        status <= 400 || status === 503 || status === 500,
    });
    if (
      /fetch failed|Internal server error/i.test($page.find('title').text())
    ) {
      return null;
    }

    const credits = getCredits($page);
    // they always fill in the director for films, without it it's talks, tv, ...
    const director = getDirector(credits);
    if (director.length === 0) return null;

    return {
      // so that it matches with Collections
      url: getExpandedUrlFromPage($page),
      provider,
      films: [
        {
          title: getTitle($page),
          director: getDirector(credits),
          cast: getCast(credits),
          year: getYear(credits),
        },
      ],
      sessions: getSessions($page),
    };
  };
}
