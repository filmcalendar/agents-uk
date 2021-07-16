import EventTitle from './index';

describe('process event title', () => {
  describe('safe finders', () => {
    it.each([
      ['Film 1: Sing-a-long', 'Film 1: sing#a#long'],
      ['Film 1: Foo+bar', 'Film 1: foo#bar'],
      ['Film 1: Q&A', 'Film 1: q#a'],
    ])('replaces finders with separators: %s', (eventTitle, expected) => {
      const evt = new EventTitle({ tags: ['sing-a-long', 'foo+bar'] });
      const result = evt.replaceWithSafeFinders(eventTitle);
      expect(result).toBe(expected);
    });

    it.each([
      ['Film 1: sing#a#long', 'Film 1: sing-a-long'],
      ['Film 1: foo#bar', 'Film 1: foo-bar'],
      ['Film 1: q#a', 'Film 1: q-a'],
    ])('reverts back finders with separators: %s', (eventTitle, expected) => {
      const evt = new EventTitle({ tags: ['sing-a-long', 'foo+bar'] });
      const result = evt.revertSafeFinder(eventTitle);
      expect(result).toBe(expected);
    });
  });

  describe('film titles', () => {
    it.each([
      ['Film 1 - Festival', 'Film 1'],
      ['Film 1 + Q&A', 'Film 1'],
      ['Film 1 + Panel & Afterparty', 'Film 1'],
      ['Film 1 - Black Lens Film Festival', 'Film 1'],
      ['Film 1 + director Q&A - Black Lens Film Festival', 'Film 1'],
      ['Film 1 (UK Premiere)', 'Film 1'],
      ['Bob & Carol & Ted & Alice', 'Bob & Carol & Ted & Alice'],
    ])(
      'gets film title by removing common events: %s',
      (eventTitle, expected) => {
        const evt = new EventTitle();
        const result = evt.getFilmTitle(eventTitle);
        expect(result).toBe(expected);
      }
    );

    it.each([
      ['Film 1 - LFF', 'Film 1'],
      ['LFF: Film 1', 'Film 1'],
    ])(
      "gets film title by removing agent's known seasons: %s",
      (eventTitle, expected) => {
        const evt = new EventTitle({ seasons: ['LFF'] });
        const result = evt.getFilmTitle(eventTitle);
        expect(result).toStrictEqual(expected);
      }
    );
  });

  describe('tags', () => {
    it.each([
      ['Film 1: Panel', ['panel']],
      ['Films - Double feature', ['double-feature']],
      ['Films : Q&A + Panel', ['panel', 'q-a']],
      ['Film 1: Parent & baby', ['parent-baby']],
      ['Film 1: Parent and baby', ['parent-and-baby']],
    ])('gets common tags from event title: %s', (eventTitle, expected) => {
      const evt = new EventTitle();
      const result = evt.getTags(eventTitle);
      expect(result).toStrictEqual(expected);
    });

    it.each([
      ['Film 1: Kids', ['kids']],
      ['Film 1: Kids + Q&A', ['kids', 'q-a']],
    ])("gets agent's known tags: %s", (eventTitle, expected) => {
      const evt = new EventTitle({ tags: ['kids'] });
      const result = evt.getTags(eventTitle);
      expect(result).toStrictEqual(expected);
    });

    it.each([
      ['sing-a-long', 'Film - Sing-a-long', ['sing-a-long']],
      ['P&B', 'Film - P&B', ['p-b']],
    ])(
      "handles agents' tags with special characters: %s",
      (tag, eventTitle, expected) => {
        const evt = new EventTitle({ tags: [tag] });
        const result = evt.getTags(eventTitle);
        expect(result).toStrictEqual(expected);
      }
    );
  });

  describe('seasons', () => {
    it.each([['Film 1: Festival 1', ['Festival 1']]])(
      'gets common festivals: %s',
      (eventTitle, expected) => {
        const evt = new EventTitle();
        const result = evt.getSeasons(eventTitle);
        expect(result).toStrictEqual(expected);
      }
    );
  });

  describe('not film', () => {
    it("checks if an event isn't a film", () => {
      const evt = new EventTitle();
      const result = evt.isNotFilm('National Theatre Live: Hamlet');
      expect(result).toBe(true);
    });
  });
});
