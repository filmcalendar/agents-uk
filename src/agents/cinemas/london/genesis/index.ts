import URL from 'url';
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

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://genesiscinema.co.uk/GenesisCinema.dll/WhatsOn';
  const events = await getEventsInline(url);

  const prg = events
    .filter(
      (event) =>
        !/Live Music, Ballet & Theatre/i.test(event.type) &&
        !/Online Screenings/.test(event.type)
    )
    .filter((event) => !/Hot Desking/i.test(event.title))
    .map((event) => event.url)
    .map((href) => URL.resolve(url, href || ''));

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
