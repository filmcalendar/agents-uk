/* eslint-disable @typescript-eslint/lines-between-class-members */
import escapeRg from 'lodash.escaperegexp';

import slugify from 'src/lib/slugify';

import {
  cleanStr,
  separate,
  rgCommonSeparators,
  capitalizeFirstLetters,
} from './helpers';
import commonEvents from './common-finders/events.json';
import commonTags from './common-finders/tags.json';
import commonSeasons from './common-finders/seasons.json';
import commonNotFilm from './common-finders/not-film.json';

type EventTitleOptions = {
  events: string[];
  language: 'en';
  notFilm: string[];
  seasons: string[];
  tags: string[];
};

export default class EventTitle {
  knownEvents: string[];
  knownSeasons: string[];
  knownTags: string[];

  commonEvents: string[];
  commonTags: string[];
  commonSeasons: string[];

  notFilm: string[];
  rgNotFilm: RegExp;

  constructor(options?: Partial<EventTitleOptions>) {
    const {
      events = [],
      language = 'en',
      notFilm = [],
      seasons = [],
      tags = [],
    } = options || {};

    this.commonEvents = commonEvents[language];
    this.commonSeasons = commonSeasons[language];
    this.commonTags = commonTags[language];

    this.notFilm = [...notFilm, ...commonNotFilm[language]];
    this.rgNotFilm = new RegExp(this.notFilm.map(escapeRg).join('|'), 'i');

    this.knownEvents = events;
    this.knownSeasons = seasons;
    this.knownTags = tags;
  }

  getFilmTitle = (rawInput: string): string => {
    if (!this.hasSomethingToFind(rawInput)) return rawInput;

    const input = this.replaceWithSafeFinders(rawInput);
    const eventTitle = cleanStr(input);

    const filmTitle = this.getSafeFindersRg(
      this.knownEvents,
      this.knownSeasons,
      this.knownTags,
      this.commonEvents,
      this.commonTags,
      this.commonSeasons
    )
      .reduce(
        (acc, rg) => acc.filter((part) => (rg ? !rg.test(part) : true)),
        separate(eventTitle)
      )
      .map(this.revertSafeFinder)
      .join(': '); // add back a separator

    // if everything gets filtered out, return the original
    if (filmTitle.length === 0) return eventTitle;

    return cleanStr(filmTitle);
  };

  getTags = (rawInput: string): string[] => {
    if (!this.hasSomethingToFind(rawInput)) return [];

    const input = this.replaceWithSafeFinders(rawInput);
    const eventTitle = cleanStr(input);
    const parts = separate(eventTitle);

    return this.getSafeFindersRg(this.knownTags, this.commonTags)
      .flatMap((rg) => parts.filter((part) => rg && rg.test(part)))
      .map((tag) => cleanStr(tag))
      .map(this.revertSafeFinder)
      .map((tag) => slugify(tag))
      .sort((a, b) => a.localeCompare(b));
  };

  getSeasons = (rawInput: string): string[] => {
    if (!this.hasSomethingToFind(rawInput)) return [];

    const input = this.replaceWithSafeFinders(rawInput);
    const eventTitle = cleanStr(input);
    const parts = separate(eventTitle);

    return this.getSafeFindersRg(this.knownSeasons, this.commonSeasons)
      .flatMap((rg) => parts.filter((part) => rg && rg.test(part)))
      .map((tag) => cleanStr(tag))
      .map(this.revertSafeFinder)
      .map(capitalizeFirstLetters)
      .sort((a, b) => a.localeCompare(b));
  };

  hasSomethingToFind = (input: string): boolean =>
    [
      ...this.knownEvents,
      ...this.knownSeasons,
      ...this.knownTags,
      ...this.commonEvents,
      ...this.commonTags,
      ...this.commonSeasons,
    ].some((finder) => {
      const rgFinder = new RegExp(escapeRg(finder), 'i');
      return rgFinder.test(input);
    });

  isNotFilm = (input: string): boolean => this.rgNotFilm.test(input);

  getSafeFindersRg = (...finders: string[][]): RegExp[] =>
    finders
      .flat()
      .map(this.replaceSafeFinder)
      .map((safeFinder) => new RegExp(safeFinder, 'i'));

  // [common|known]-[events|seasons|tags] with separators in them
  replaceWithSafeFinders = (input: string): string =>
    [
      ...this.knownEvents,
      ...this.knownSeasons,
      ...this.knownTags,
      ...this.commonEvents,
      ...this.commonTags,
      ...this.commonSeasons,
    ].reduce((acc, finder) => {
      const safeFinder = this.replaceSafeFinder(finder);
      const rgFinder = new RegExp(escapeRg(finder), 'i');
      return acc.replace(rgFinder, safeFinder);
    }, input);

  replaceSafeFinder = (finder: string): string =>
    finder.replace(rgCommonSeparators, '#');

  revertSafeFinder = (safeFinder: string): string =>
    safeFinder.replace(/#/g, '-');
}
