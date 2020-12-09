import URL from 'url';

import type * as FC from '@filmcalendar/types';
import type * as PCC from './index.d';

import {
  getCast,
  getDirector,
  getSessions,
  getTitle,
  getWhatsOnData,
  getYear,
} from './helpers';

export const ref = 'prince-charles';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => [
  {
    address: '7 Leicester PL, London WC2H 7BY',
    email: 'boxofficemanager@princecharlescinema.com',
    name: 'The Prince Charles Cinema',
    phone: '02074943654',
    type: 'cinema',
    url: 'https://princecharlescinema.com/PrinceCharlesCinema.dll/Home',
  },
];

export const programme: FC.Agent.ProgrammeFn = async () => {
  const url = 'https://princecharlescinema.com/PrinceCharlesCinema.dll/WhatsOn';
  const data = await getWhatsOnData(url);

  const programmeData = data.reduce((acc, event) => {
    acc.set(event.ID, event);
    return acc;
  }, new Map() as Map<string, PCC.Film>);
  const prg = data.map((event) => URL.resolve(url, event.URL));

  return {
    programme: [...new Set(prg)],
    _data: { programmeData },
  };
};

export const page: FC.Agent.PageFn = async (url, provider, tempData) => {
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