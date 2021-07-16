import escapeRg from 'lodash.escaperegexp';

export const commonSeparators = ['-', ':', '+', '|', '&', '(', ')'];
export const rgCommonSeparators = new RegExp(
  `[${commonSeparators.join('')}]`,
  'ig'
);

export function rgCombine(parts: string[]): RegExp | null {
  if (parts.length === 0) return null;
  return new RegExp(parts.map(escapeRg).join('|'), 'i');
}

export function cleanStr(input: string): string {
  return input.replace(/\s\s*/g, ' ').trim();
}

export function separate(eventTitle: string): string[] {
  return eventTitle.split(rgCommonSeparators).map(cleanStr).filter(Boolean);
}

export function capitalizeFirstLetters(string: string): string {
  return string
    .split(' ')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
