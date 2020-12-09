import fletch from '@tuplo/fletch';
import slugify from '@sindresorhus/slugify';
import seriesWith from '@tuplo/series-with';
import URL from 'url';

import type * as FC from '@filmcalendar/types';
import isSpecialScreening from 'src/lib/is-special-screening';

import type * as CZ from './index.d';
import {
  getCinemaInfo,
  getPageFilmData,
  getFilmData,
  getTitle,
  getDirector,
  getCast,
  getSessions,
} from './helpers';

export const ref = 'curzon';

export const register: FC.Agent.RegisterFn = () => ({
  agent: ref,
  country: 'uk',
  language: 'en-GB',
  type: 'films',
});

export const providers: FC.Agent.ProvidersFn = async () => {
  const url = 'https://movie-curzon.peachdigital.com/quickbook/GetCinemas/36';

  const json = await fletch.json<CZ.Cinema[]>(url);
  const providerList = json.map((item) => {
    const { CinemaName: name, Cinema_Id: cinemaId } = item;
    const slug = slugify(name);
    const _data: CZ.ProviderData = {
      cinemaId,
      urlThisWeek: `https://www.curzoncinemas.com/${slug}/this-week`,
      urlComingSoon: `https://www.curzoncinemas.com/${slug}/coming-soon`,
    };

    return {
      name,
      chain: 'Curzon',
      url: `https://www.curzoncinemas.com/${slug}/info`,
      _data,
    };
  });

  return seriesWith(providerList, getCinemaInfo);
};

export const programme: FC.Agent.ProgrammeFn = async (provider) => {
  const { urlThisWeek, urlComingSoon } = provider._data as CZ.ProviderData;

  const programmes = await seriesWith(
    [urlThisWeek, urlComingSoon],
    getPageFilmData
  );

  const prg = programmes
    .flat()
    .filter((film) => !isSpecialScreening(film.Title))
    .map((film) => film.FriendlyName)
    .map((path) => URL.resolve(urlThisWeek, path));

  return { programme: [...new Set(prg)] };
};

export const page: FC.Agent.PageFn = async (url, provider) => {
  const $page = await fletch.html(url);
  const [film] = getFilmData($page);

  return {
    url,
    provider,
    films: [
      {
        title: getTitle(film),
        director: getDirector(film),
        cast: getCast(film),
      },
    ],
    sessions: getSessions(film),
  };
};
