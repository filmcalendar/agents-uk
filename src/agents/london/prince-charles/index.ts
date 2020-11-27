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
  type: 'cinemas',
});

export const venues: FC.Agent.VenuesFn = async () => [
  {
    name: 'The Prince Charles Cinema',
    url: 'https://princecharlescinema.com/PrinceCharlesCinema.dll/Home',
    address: '7 Leicester PL, London WC2H 7BY',
    phone: '02074943654',
    email: 'boxofficemanager@princecharlescinema.com',
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

export const page: FC.Agent.PageFn = async (url, venue, tempData) => {
  const { programmeData } = tempData as {
    programmeData: Map<number, PCC.Film>;
  };
  const [, id] = /WhatsOn\?f=(\d+)/i.exec(url) || ['', ''];
  const film = programmeData.get(Number(id));
  if (!film) return null;

  return {
    url,
    venue,
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
