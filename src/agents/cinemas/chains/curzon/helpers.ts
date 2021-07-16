import seriesWith from '@tuplo/series-with';
import type { FletchInstance } from '@tuplo/fletch';

import slugify from 'src/lib/slugify';
import EventTitle from 'src/lib/event-title';
import type * as FC from '@filmcalendar/types';
import type * as CZ from './index.d';

const evt = new EventTitle({
  tags: ['dochouse'],
});

export function isNotFilm(input: string): boolean {
  return evt.isNotFilm(input);
}

export function requestCurzonApi<T>(
  request: FletchInstance,
  path: string,
  options: Record<string, unknown>,
  provider: FC.Provider
): Promise<T> {
  const { _data } = provider;
  const { apiUrl, authToken } = _data as CZ.ProviderData;
  const url = [apiUrl, path].join('');

  return request.json<T>(url, {
    headers: { authorization: `Bearer ${authToken}` },
    ...options,
  });
}

export async function getFilmScreeningDates(
  request: FletchInstance,
  provider: FC.Provider
): Promise<CZ.FilmScreeningDates[]> {
  const { _data } = provider;
  const { cinemaId } = _data as CZ.ProviderData;

  const { filmScreeningDates = [] } =
    await requestCurzonApi<CZ.FilmScreeningDatesResponse>(
      request,
      '/ocapi/v1/browsing/master-data/film-screening-dates',
      {},
      provider
    );

  return filmScreeningDates.filter((fsd) =>
    fsd.filmScreenings.filter((fs) =>
      fs.sites.find((s) => s.siteId === cinemaId)
    )
  );
}

export function getFilmPeople(castAndCrew: CZ.Person[]): CZ.FilmPeople {
  return (castAndCrew || []).reduce((acc, person) => {
    const { id, name } = person;
    const { givenName, middleName, familyName } = name;
    acc[id] = [givenName, middleName, familyName]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/, ' ');
    return acc;
  }, {} as Record<string, string>);
}

export function getFilmInfo(data: CZ.Film, filmPeople: CZ.FilmPeople): FC.Film {
  const { castAndCrew = [], title } = data;

  const { text: titleText = '' } = title;

  return {
    title: evt.getFilmTitle(titleText),
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
  request: FletchInstance,
  date: string,
  filmId: string,
  cinemaId: string,
  provider: FC.Provider
): Promise<FC.Session[]> {
  const path = `/ocapi/v1/browsing/master-data/showtimes/business-date/${date}`;
  const { showtimes = [], relatedData } =
    await requestCurzonApi<CZ.BusinessDateResponse>(
      request,
      path,
      { urlSearchParams: { filmIds: filmId } },
      provider
    );
  const attributes = getAttributes(relatedData);

  return showtimes
    .filter((showtime) => showtime.siteId === cinemaId)
    .map((showtime) => {
      const { id, schedule, attributeIds = [] } = showtime;
      const { startsAt } = schedule;

      return {
        dateTime: new Date(startsAt).toISOString(),
        tags: attributeIds.map((attrId) => attributes[attrId]),
        link: `https://www.curzon.com/ticketing/seats/${id}/`,
      };
    });
}

export async function getSessions(
  request: FletchInstance,
  filmId: string,
  provider: FC.Provider
): Promise<FC.Session[]> {
  const { _data } = provider;
  const { cinemaId } = _data as CZ.ProviderData;

  const { filmScreeningDates = [] } =
    await requestCurzonApi<CZ.FilmScreeningDatesResponse>(
      request,
      '/ocapi/v1/browsing/master-data/film-screening-dates',
      { urlSearchParams: { filmIds: filmId } },
      provider
    );

  const businessDates = filmScreeningDates
    .filter((fsd) =>
      fsd.filmScreenings.find((fs) =>
        fs.sites.find((s) => s.siteId === cinemaId)
      )
    )
    .map((fsd) => fsd.businessDate);

  return seriesWith(businessDates, (date) =>
    getSessionsForDate(request, date, filmId, cinemaId, provider)
  ).then((data) => data.flat());
}
