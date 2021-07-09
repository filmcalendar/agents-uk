import { URL } from 'url';
import $ from 'cheerio';
import type * as FC from '@filmcalendar/types';
import { BaseAgent } from '@filmcalendar/agents-core';

import type * as CZ from './index.d';
import {
  requestCurzonApi,
  getFilmScreeningDates,
  getFilmPeople,
  getFilmInfo,
  getSessions,
} from './helpers';

export class Agent extends BaseAgent {
  ref = 'curzon';

  register: FC.Agent.RegisterFn = () => ({
    agent: this.ref,
    country: 'uk',
    language: 'en-GB',
    type: 'films',
  });

  providers: FC.Agent.ProvidersFn = async () => {
    const url = 'https://www.curzon.com/venues/';

    const { initData } = await this.request.script<CZ.InitData>(url, {
      scriptSandbox: { window: { initialiseWidgets: () => null } },
      scriptFindFn: (script) => /initData/.test($(script).html() || ''),
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

  programme: FC.Agent.ProgrammeFn = async (provider) => {
    const filmScreeningDates = await getFilmScreeningDates(
      this.request,
      provider
    );

    const prg = filmScreeningDates
      .flatMap((fsd) => fsd.filmScreenings)
      .map((fs) => fs.filmId)
      .map((filmId) => `https://www.curzon.com/films/${filmId}`);

    return { programme: [...new Set(prg)] };
  };

  page: FC.Agent.PageFn = async (url, provider) => {
    const { _data } = provider;
    const { cinemaId } = _data as CZ.ProviderData;

    const parts = url.split('/');
    const filmId = parts[parts.length - 1];

    const { relatedData } = await requestCurzonApi<CZ.BusinessDateResponse>(
      this.request,
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
      sessions: await getSessions(this.request, filmId, provider),
    };
  };
}
