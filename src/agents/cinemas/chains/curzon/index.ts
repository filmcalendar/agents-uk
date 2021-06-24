import fletch from '@tuplo/fletch';
import { URL } from 'url';
import $ from 'cheerio';

import type * as FC from '@filmcalendar/types';

import type * as CZ from './index.d';
import {
  requestCurzonApi,
  getFilmScreeningDates,
  getFilmPeople,
  getFilmInfo,
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
  const url = 'https://www.curzon.com/venues/';

  const { initData } = await fletch.script<CZ.InitData>(url, {
    scriptSandbox: { window: { initialiseWidgets: () => null } },
    scriptFindFn: ($page) =>
      $page
        .find('script')
        .toArray()
        .find((script) => /initData/.test($(script).html() || '')),
  });
  if (!initData) return [];

  const venueFinderSearch = initData.componentsData.find(
    (component) => component.componentType === 'VenueFinderSearch'
  );
  if (!venueFinderSearch) return [];

  const { props } = venueFinderSearch as { props: CZ.VenueFinderSearchData };
  const { cinemas = [] } = props;
  const { api } = initData.occInititialiseData;
  const { authToken } = api;

  return cinemas.map((cinema) => {
    const { address, city, findMoreLink, id, name, postcode } = cinema;

    return {
      address: [address, city, postcode].join(', '),
      chain: 'Curzon',
      name: name.replace(/curzon/i, '').trim(),
      type: 'cinema',
      url: new URL(findMoreLink, url).href,
      _data: {
        authToken,
        cinemaId: id,
        apiUrl: api.url,
      },
    } as FC.Provider;
  });
};

export const programme: FC.Agent.ProgrammeFn = async (provider) => {
  const filmScreeningDates = await getFilmScreeningDates(provider);

  const prg = filmScreeningDates
    .flatMap((fsd) => fsd.filmScreenings)
    .map((fs) => fs.filmId)
    .map((filmId) => `https://www.curzon.com/films/${filmId}`);

  return { programme: [...new Set(prg)] };
};

export const page: FC.Agent.PageFn = async (url, provider) => {
  const { _data } = provider;
  const { cinemaId } = _data as CZ.ProviderData;

  const parts = url.split('/');
  const filmId = parts[parts.length - 1];

  const { relatedData } = await requestCurzonApi<CZ.BusinessDateResponse>(
    '/ocapi/v1/browsing/master-data/showtimes/business-date/first',
    { urlSearchParams: { filmIds: filmId, siteIds: cinemaId } },
    provider
  );
  const { films = [], castAndCrew } = relatedData;
  const filmPeople = getFilmPeople(castAndCrew);

  return {
    url,
    provider,
    films: films.map((film) => getFilmInfo(film, filmPeople)),
    sessions: await getSessions(filmId, provider),
  };
};
