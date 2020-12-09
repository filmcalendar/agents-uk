import vm from 'vm';
import $ from 'cheerio';
import fletch from '@tuplo/fletch';
import splitNamesList from '@tuplo/split-names-list';
import slugify from '@sindresorhus/slugify';

import type * as FC from '@filmcalendar/types';

import type * as CZ from './index.d';

type GetAddressFn = ($page: cheerio.Cheerio) => string;
export const getAddress: GetAddressFn = ($page) => {
  const cAddress = $page.find('.cAddress').html();
  if (cAddress === null) return '';

  return cAddress
    .split('<br>')
    .slice(0, 3)
    .map((line) => $(`<div>${line}</div>`).text().trim())
    .join(', ');
};

type CinemaRef = { name: string; chain: string; url: string };
type GetCinemaInfoFn = (venue: CinemaRef) => Promise<FC.Agent.Provider>;
export const getCinemaInfo: GetCinemaInfoFn = async (venue) => {
  const { url } = venue;
  const $page = await fletch.html(url);
  const address = getAddress($page);

  return { ...venue, address, type: 'cinema' };
};

type Sandbox = { filmData?: CZ.FilmData[] | CZ.FilmData };
type GetFilmDataFn = ($page: cheerio.Cheerio) => CZ.FilmData[];
export const getFilmData: GetFilmDataFn = ($page) => {
  const src = $page
    .find('script')
    .toArray()
    .map((s) => $(s).html())
    .find((s) => /var filmData/i.test(s || ''));
  if (!src) return [];

  const sandbox: Sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  const { filmData } = sandbox;
  if (!filmData) return [];

  return Array.isArray(filmData)
    ? filmData
    : [filmData.FilmData as CZ.FilmData];
};

type GetPageFilmDataFn = (url: string) => Promise<CZ.FilmData[]>;
export const getPageFilmData: GetPageFilmDataFn = async (url) => {
  const $page = await fletch.html(url);
  return getFilmData($page);
};

type GetTitleFn = (film: CZ.FilmData) => string;
export const getTitle: GetTitleFn = (film) =>
  film.Title.replace(/-\s?Birthday Special/i, '')
    .replace(/\sPlus Live Q&A/i, '')
    .replace(/3D/i, '')
    .replace(/Doc'n'Roll Film Festival\s*:/i, '')
    .replace(/Doc'n'Roll \d{4}:/i, '')
    .replace(/DocHouse\s*:/i, '')
    .replace(/Edible Cinema:/i, '')
    .replace(/fff\s?:/i, '')
    .replace(/focus\s?:/i, '')
    .replace(/HRWFF \d{4}:/, '')
    .replace(/LPFF \d{4}/i, '')
    .replace(/Meet the World\s*:/i, '')
    .replace(/Open City DocFest \d{4}\s*:/i, '')
    .replace(/RFW \d{4}\s?:/i, '')
    .replace(/Romanian Film Festival\s*:/i, '')
    .replace(/Russian Film Week\s*:/i, '')
    .replace(/Scala Double Bill:/i, '')
    .replace(/shortfusion\s?:/i, '')
    .replace(/Sing-Along/i, '')
    .replace(/UFF Special Presentation\s*:/i, '')
    .replace(/UFF\s*:/i, '')
    .replace(/[-+].+Q&A/i, '')
    .replace(/\s\s*/, ' ')
    .trim();

type GetDirectorFn = (film: CZ.FilmData) => string[];
export const getDirector: GetDirectorFn = (film) =>
  !/TBC|Various|N\/a/.test(film.Director) ? splitNamesList(film.Director) : [];

type GetCastFn = (film: CZ.FilmData) => string[];
export const getCast: GetCastFn = (film) =>
  !/TBC|Various|N\/a/.test(film.Cast) ? splitNamesList(film.Cast) : [];

type GetSessionAttributesFn = (session: CZ.Screening) => string[];
const getSessionAttributes: GetSessionAttributesFn = (session) =>
  (session.Experience || [])
    .map((experience) => slugify(experience.Name))
    .filter(Boolean);

type GetSessionFn = (
  session: CZ.Screening,
  eventAttributes: string[]
) => FC.Agent.Session;
const getSession: GetSessionFn = (session, eventAttributes) => {
  const { StartDateTime, CinemaId, Scheduleid } = session;
  const dateTime = new Date(StartDateTime.substr(0, 16)).toISOString();
  const link = `https://www.curzoncinemas.com/booking/${CinemaId}/${Scheduleid}`;

  return {
    dateTime,
    link,
    attributes: [...getSessionAttributes(session), ...eventAttributes]
      .filter((attrib) => !/bertha-dochouse/.test(attrib))
      .filter((e, i, a) => a.indexOf(e) === i),
  };
};

type GetEventAttributesFn = (film: CZ.FilmData) => string[];
const getEventAttributes: GetEventAttributesFn = (film) => {
  const attributes = [];
  if (/Sing-Along/.test(film.Title)) attributes.push('sing-along');
  if (/Q&A/.test(film.Title)) attributes.push('q-and-a');

  return attributes;
};

type GetSessionsFn = (film: CZ.FilmData) => FC.Agent.Session[];
export const getSessions: GetSessionsFn = (film) =>
  film.Sessions.map((session) =>
    session.ExperienceTypes.map((experience) => experience.Times)
  )
    .flat(2)
    .map((session) => getSession(session, getEventAttributes(film)));
