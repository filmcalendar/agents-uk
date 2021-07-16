import $ from 'cheerio';
import { URL } from 'url';
import seriesWith from '@tuplo/series-with';
import type * as FC from '@filmcalendar/types';
import { BaseAgent } from '@filmcalendar/agents-core';

import {
  getEpisodeIdFromUrl,
  getCredits,
  getTitle,
  getSeasonsFromTitle,
} from 'src/agents/streaming/bbc-iplayer/helpers';

import type * as BBC from './index.d';
import {
  getAvailableDatesUrls,
  getDailySchedule,
  getReduxState,
  getSessions,
} from './helpers';

type ProviderData = {
  tvGuideUrl: string;
};

export class Agent extends BaseAgent {
  ref = 'bbc';

  register: FC.Agent.RegisterFn = () => ({
    agent: this.ref,
    country: 'uk',
    language: 'en-GB',
    type: 'films',
  });

  providers: FC.Agent.ProvidersFn = async () => {
    const url = 'https://www.bbc.co.uk/iplayer/guide';
    const $page = await this.request.html(url);

    return $page
      .find('.navigation__container .channels-nav .channels-nav__item')
      .toArray()
      .map((a) => {
        const $a = $(a);
        const href = $a.attr('href');
        const [, slug] = /\/([^/]+)$/.exec(href || '') || ['', ''];
        const name = $a.find('.lnk__label > span').text();

        return {
          ref: slug,
          name,
          type: 'live-tv',
          url: new URL(href || '', url).href,
          _data: {
            tvGuideUrl: `https://www.bbc.co.uk/iplayer/guide/${slug}`,
          },
        };
      });
  };

  featured: FC.Agent.FeaturedFn = async (provider) => {
    const { url } = provider;
    const { highlights } = await getReduxState<BBC.Channel>(this.request, url);
    const { items = [] } = highlights;

    const feats = items
      .filter((item) => {
        const { secondaryLabel } = item.props;
        return /film/i.test(secondaryLabel);
      })
      .map((item) => new URL(item.props.href, url).href);

    return [...new Set(feats)];
  };

  seasons: FC.Agent.SeasonsFn = async (provider) => {
    const { url } = provider;
    const { groups = [] } = await getReduxState<BBC.Channel>(this.request, url);

    const urls = groups.map(
      (group) => `https://www.bbc.co.uk/iplayer/group/${group.id}`
    );

    return { seasonUrls: [...new Set(urls)] };
  };

  season: FC.Agent.SeasonFn = async (url) => {
    const { header, entities } = await getReduxState<BBC.Group>(
      this.request,
      url
    );
    const { title, subtitle } = header;

    const prg = entities
      .filter((entity) => {
        const { props } = entity;
        const { secondaryLabel } = props;
        return /film/i.test(secondaryLabel);
      })
      .filter((entity) => {
        const { props } = entity;
        return !/storyville/i.test(props.title);
      })
      .map((entity) => new URL(entity.props.href, url).href);

    return {
      name: title,
      description: subtitle,
      url,
      programme: [...new Set(prg)],
    };
  };

  programme: FC.Agent.ProgrammeFn = async (provider) => {
    const { _data } = provider;
    const { tvGuideUrl: url } = _data as ProviderData;
    const $page = await this.request.html(url);

    const availableDatesUrls = getAvailableDatesUrls(url, $page);
    const schedule = await seriesWith(
      availableDatesUrls,
      getDailySchedule(this.request)
    ).then((data) => data.flat());
    const prg = schedule
      .map((item) => item.props.href)
      .map((href) => new URL(href || '', url).href);

    return { programme: [...new Set(prg)], _data: { schedule } };
  };

  page: FC.Agent.PageFn = async (url, provider, _data) => {
    const $page = await this.request.html(url);
    const credits = getCredits($page);

    const episodeId = getEpisodeIdFromUrl(url);
    const { schedule } = _data as { schedule: BBC.ScheduleItem[] };

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
      sessions: getSessions(episodeId, schedule),
      seasons: getSeasonsFromTitle($page),
    };
  };
}
