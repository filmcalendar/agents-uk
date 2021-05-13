import $ from 'cheerio';
import URL from 'url';
import fletch from '@tuplo/fletch';
import seriesWith from '@tuplo/series-with';
import type * as FC from '@filmcalendar/types';

import {
  getEpisodeIdFromUrl,
  getCredits,
  getTitle,
} from '../../streaming/bbc-iplayer/helpers';
import type * as BBC from './index.d';
import {
  getAvailableDatesUrls,
  getDailySchedule,
  getReduxState,
  getSessions,
} from './helpers';

export const ref = 'bbc';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

type ProviderData = {
  tvGuideUrl: string;
};

export const providers: FC.Agent.ProvidersFn = async () => {
  const url = 'https://www.bbc.co.uk/iplayer/guide';
  const $page = await fletch.html(url);

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
        url: URL.resolve(url, href || ''),
        _data: {
          tvGuideUrl: `https://www.bbc.co.uk/iplayer/guide/${slug}`,
        },
      };
    });
};

export const featured: FC.Agent.FeaturedFn = async (provider) => {
  const { url } = provider;
  const { highlights } = await getReduxState<BBC.Channel>(url);
  const { items = [] } = highlights;

  const feats = items
    .filter((item) => {
      const { secondaryLabel } = item.props;
      return /film/i.test(secondaryLabel);
    })
    .map((item) => URL.resolve(url, item.props.href));

  return [...new Set(feats)];
};

export const collections: FC.Agent.CollectionsFn = async (provider) => {
  const { url } = provider;
  const { groups = [] } = await getReduxState<BBC.Channel>(url);

  const urls = groups.map(
    (group) => `https://www.bbc.co.uk/iplayer/group/${group.id}`
  );

  return { collections: [...new Set(urls)] };
};

export const collection: FC.Agent.CollectionFn = async (url) => {
  const { header, entities } = await getReduxState<BBC.Group>(url);
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
    .map((entity) => URL.resolve(url, entity.props.href));

  return {
    name: title,
    description: subtitle,
    url,
    programme: [...new Set(prg)],
  };
};

export const programme: FC.Agent.ProgrammeFn = async (provider) => {
  const { _data } = provider;
  const { tvGuideUrl: url } = _data as ProviderData;
  const $page = await fletch.html(url);

  const availableDatesUrls = getAvailableDatesUrls(url, $page);
  const schedule = await seriesWith(availableDatesUrls, getDailySchedule).then(
    (data) => data.flat()
  );
  const prg = schedule
    .map((item) => item.props.href)
    .map((href) => URL.resolve(url, href || ''));

  return { programme: [...new Set(prg)], _data: { schedule } };
};

export const page: FC.Agent.PageFn = async (url, provider, _data) => {
  const $page = await fletch.html(url);
  const credits = getCredits($page);

  const episodeId = getEpisodeIdFromUrl(url);
  const { schedule } = _data as { schedule: BBC.ScheduleItem[] };
  const sessions = getSessions(episodeId, schedule);

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
    sessions,
  };
};
