import { separate } from './helpers';

describe('event title - helpers', () => {
  it.each([
    ['Film: UK Premiere', ['Film', 'UK Premiere']],
    ['Film & Panel', ['Film', 'Panel']],
    ['Film - Festival', ['Film', 'Festival']],
    ['Film 1 (UK Premiere)', ['Film 1', 'UK Premiere']],
  ])('separates by common use separators: %s', (eventTitle, expected) => {
    const result = separate(eventTitle);
    expect(result).toStrictEqual(expected);
  });
});
