import $ from 'cheerio';
import URL from 'url';
import fletch from '@tuplo/fletch';

import type * as FC from '@filmcalendar/types';
import {
  getCast,
  getCredits,
  getDirector,
  getSessions,
  getTitle,
  getYear,
} from './helpers';

export const ref = 'bfi-southbank';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => [
  {
    address: 'Belvedere Road, South Bank, London SE1 8XT',
    name: 'BFI Southbank',
    phone: '02079283232',
    type: 'cinema',
    url: 'https://whatson.bfi.org.uk/Online/',
  },
];

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://whatson.bfi.org.uk/Online/article/filmsindex';
  const $page = await fletch.html(url);

  const prg = $page
    .find('.main-article-body ul li a')
    .toArray()
    .filter((a) => {
      const t = $(a).text();
      return (
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
    .map((href) => URL.resolve(url, href || ''));

  return { programme: [...new Set(prg)] };
};

export const page: FC.Agent.PageFn = async (url, provider) => {
  const $page = await fletch.html(url, {
    validateStatus: (status) =>
      status <= 400 || status === 503 || status === 500,
  });
  if (/fetch failed|Internal server error/i.test($page.find('title').text())) {
    return null;
  }

  const credits = getCredits($page);
  // they always fill in the director for films, without it it's talks, tv, ...
  const director = getDirector(credits);
  if (director.length === 0) return null;

  return {
    url,
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
