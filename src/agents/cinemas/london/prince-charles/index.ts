import { URL } from 'url';
import fletch from '@tuplo/fletch';
import $ from 'cheerio';
import type * as FC from '@filmcalendar/types';
import { BaseAgent } from '@filmcalendar/agents-core';

import type * as PCC from './index.d';

import {
  getCast,
  getDirector,
  getSessions,
  getTitle,
  getWhatsOnData,
  getYear,
} from './helpers';

type SeasonData = Map<string, string>;

export class Agent extends BaseAgent {
  ref = 'prince-charles';

  register: FC.Agent.RegisterFn = () => ({
    agent: this.ref,
    country: 'uk',
    language: 'en-GB',
    type: 'films',
  });

  providers: FC.Agent.ProvidersFn = async () => [
    {
      address: '7 Leicester PL, London WC2H 7BY',
      email: 'boxofficemanager@princecharlescinema.com',
      name: 'The Prince Charles Cinema',
      phone: '02074943654',
      type: 'cinema',
      url: 'https://princecharlescinema.com/PrinceCharlesCinema.dll/Home',
    },
  ];

  featured: FC.Agent.FeaturedFn = async (provider) => {
    const { url } = provider;
    const $page = await this.request.html(url);

    const feats = $page
      .find('#Bannercv3WhatsOnWidgetBanner a[href^=WhatsOn]')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => new URL(href || '', url).href);

    return [...new Set(feats)];
  };

  seasons: FC.Agent.SeasonsFn = async () => {
    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/Seasons';
    const $page = await fletch.html(url);
    const _data = $page
      .find('.film .ninecol a[href^="Seasons?e"]:not(.info)')
      .toArray()
      .reduce((acc, a) => {
        const $a = $(a);
        const href = $a.attr('href');
        const collectionUrl = new URL(href || '', url).href;
        if (acc.has(collectionUrl)) return acc;
        acc.set(collectionUrl, $a.text().trim());

        return acc;
      }, new Map() as SeasonData);

    return { seasonUrls: [..._data.keys()], _data };
  };

  season: FC.Agent.SeasonFn = async (url, options) => {
    const data = (options?._data || new Map()) as SeasonData;
    const $page = await fletch.html(url);

    const name = data.get(url) || '';
    const urls = $page
      .find('.film a[href^="WhatsOn?f="]')
      .toArray()
      .map((a) => $(a).attr('href'))
      .map((href) => new URL(href || '', url).href);

    return { url, name, programme: [...new Set(urls)] };
  };

  programme: FC.Agent.ProgrammeFn = async () => {
    const url =
      'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn';
    const data = await getWhatsOnData(this.request, url);

    const programmeData = data.reduce((acc, event) => {
      acc.set(event.ID, event);
      return acc;
    }, new Map() as Map<number, PCC.Film>);
    const prg = data.map((event) => new URL(event.URL, url).href);

    return {
      programme: [...new Set(prg)],
      _data: { programmeData },
    };
  };

  page: FC.Agent.PageFn = async (url, provider, tempData) => {
    const { programmeData } = tempData as {
      programmeData: Map<number, PCC.Film>;
    };
    const [, id] = /WhatsOn\?f=(\d+)/i.exec(url) || ['', ''];
    const film = programmeData.get(Number(id));
    if (!film) return null;

    return {
      url,
      provider,
      films: [
        {
          title: getTitle(film),
          director: getDirector(film),
          cast: getCast(film),
          year: getYear(film),
        },
      ],
      sessions: getSessions(film, url),
    };
  };
}
