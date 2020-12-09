import escapeRg from 'lodash.escaperegexp';

const specials = [
  "All'Opera",
  'Australian Ballet',
  'Berliner Philharmoniker',
  'Bite Sized Ballet',
  'Bolshoi Ballet',
  'Bolshoi',
  'Bristol Old Vic',
  'Concert From Sydney',
  '(encore)',
  'English National Ballet',
  'EOS',
  'Exhibition On Screen',
  'From The London Palladium',
  'Live Arts On Screen',
  'Live Concert from',
  'Live From Shakespeares Globe',
  "Live from Shakespeare's Globe",
  'Live From the Met',
  'Live from the Royal Albert Hall',
  'Live: Tour',
  'Maastricht Concert',
  'Met in HD',
  'Met HD',
  'Met Live',
  'Met Opera',
  'Metropolitan Opera',
  'National Theatre Live',
  'National Theatre',
  'Northern Ballet',
  'NT Encore',
  'NT Live',
  'NTLive',
  'NT-',
  'NT -',
  'NT:',
  'NY MET',
  'Oscar Wilde Season',
  'Oscar Wilde:',
  'Oscar Wilde Live',
  'Recorded as Live',
  'Royal Opera House',
  'ROYAL OPERA',
  'ROH Encore',
  'ROH Ballet',
  'ROH Live',
  'ROH',
  'Royal Shakespeare Company',
  'Royal Ballet',
  'RSC Live',
  'RSC Encore',
  'RSC',
  'Screen Arts',
  'Shakespeare’s Globe Live',
  'Stage Russia',
  'Stage To Screen',
  'Sydney Harbour',
  'Teatro Alla Scala',
  'Teatro Comunale',
  'Teatro dell',
];

export const rgSpecialScreening = new RegExp(
  specials.map(escapeRg).join('|'),
  'i'
);

type IsSpecialScreeningFn = (title: string) => boolean;
const isSpecialScreening: IsSpecialScreeningFn = (title) =>
  rgSpecialScreening.test(title);

export default isSpecialScreening;
