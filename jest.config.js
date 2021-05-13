const esModules = ['escape-string-regexp', '@sindresorhus', '@tuplo'].join('|');

export default {
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]s$': 'ts-jest',
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
};
