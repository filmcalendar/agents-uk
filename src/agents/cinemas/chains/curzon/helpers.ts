import fletch from '@tuplo/fletch';
import seriesWith from '@tuplo/series-with';
import slugify from '@sindresorhus/slugify';

import type * as FC from '@filmcalendar/types';
import type * as CZ from './index.d';

export function requestCurzonApi<T>(
  path: string,
  options: Record<string, unknown>,
  provider: FC.Agent.Provider
): Promise<T> {
  const { _data } = provider;
  const { apiUrl, authToken } = _data as CZ.ProviderData;
  const url = [apiUrl, path].join('');

  return fletch.json<T>(url, {
    headers: { authorization: `Bearer ${authToken}` },
    ...options,
  });
}

export async function getFilmScreeningDates(
  provider: FC.Agent.Provider
): Promise<CZ.FilmScreeningDates[]> {
  const { _data } = provider;
  const { cinemaId } = _data as CZ.ProviderData;

  const { filmScreeningDates = [] } =
    await requestCurzonApi<CZ.FilmScreeningDatesResponse>(
      '/ocapi/v1/browsing/master-data/film-screening-dates',
      { urlSearchParams: { siteIds: cinemaId } },
      provider
    );

  return filmScreeningDates;
}

export function getFilmPeople(castAndCrew: CZ.Person[]): CZ.FilmPeople {
  return castAndCrew.reduce((acc, person) => {
    const { id, name } = person;
    const { givenName, middleName, familyName } = name;
    acc[id] = [givenName, middleName, familyName]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/, ' ');
    return acc;
  }, {} as Record<string, string>);
}

export function getFilmInfo(
  data: CZ.Film,
  filmPeople: CZ.FilmPeople
): FC.Agent.Film {
  const { castAndCrew = [], title } = data;

  return {
    title: title?.text || '',
    director: castAndCrew
      .filter((cc) => cc.roles.includes('Director'))
      .map((cc) => filmPeople[cc.castAndCrewMemberId]),
    cast: castAndCrew
      .filter((cc) => cc.roles.includes('Actor'))
      .map((cc) => filmPeople[cc.castAndCrewMemberId]),
  };
}

export function getAttributes(relatedData: CZ.RelatedData): CZ.AttributesMap {
  const { attributes = [] } = relatedData;

  return attributes.reduce((acc, attribute) => {
    const { id, shortName } = attribute;
    acc[id] = slugify(shortName.text);
    return acc;
  }, {} as CZ.AttributesMap);
}

export async function getSessionsForDate(
  date: string,
  filmId: string,
  cinemaId: string,
  provider: FC.Agent.Provider
): Promise<FC.Agent.Session[]> {
  const path = `/ocapi/v1/browsing/master-data/showtimes/business-date/${date}`;
  const { showtimes = [], relatedData } =
    await requestCurzonApi<CZ.BusinessDateResponse>(
      path,
      { urlSearchParams: { siteIds: cinemaId, filmIds: filmId } },
      provider
    );
  const attributes = getAttributes(relatedData);

  return showtimes.map((showtime) => {
    const { id, schedule, attributeIds = [] } = showtime;
    const { startsAt } = schedule;

    return {
      dateTime: new Date(startsAt).toISOString(),
      attributes: attributeIds.map((attrId) => attributes[attrId]),
      link: `https://www.curzon.com/ticketing/seats/${id}/`,
    };
  });
}

export async function getSessions(
  filmId: string,
  provider: FC.Agent.Provider
): Promise<FC.Agent.Session[]> {
  const { _data } = provider;
  const { cinemaId } = _data as CZ.ProviderData;

  const { filmScreeningDates = [] } =
    await requestCurzonApi<CZ.FilmScreeningDatesResponse>(
      '/ocapi/v1/browsing/master-data/film-screening-dates',
      { urlSearchParams: { siteIds: cinemaId, filmIds: filmId } },
      provider
    );

  const businessDates = filmScreeningDates.map((fsc) => fsc.businessDate);

  return seriesWith(businessDates, (date) =>
    getSessionsForDate(date, filmId, cinemaId, provider)
  ).then((data) => data.flat());
}
