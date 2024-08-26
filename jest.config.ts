import type { Config } from 'jest';

const ignoreModules = ['swiper'].join('|');

const jestConfig: Config = {
  rootDir: __dirname,
  preset: 'jest-preset-angular',
  roots: ['<rootDir>/src/'],
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  setupFilesAfterEnv: [
    '<rootDir>/src/test.ts',
    '<rootDir>/src/tests/__mocks__/dayjs.ts',
    '<rootDir>/src/tests/__mocks__/editor.ts'
  ],
  collectCoverage: true,
  coverageReporters: ['text-summary', 'html'],
  coverageDirectory: 'coverage/angular-jest',
  coverageThreshold: {
    global: {
      branches: 18,
      functions: 22,
      lines: 57,
      statements: 56
    }
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  transformIgnorePatterns: [`node_modules/(?!${ignoreModules})/`],
  globalSetup: 'jest-preset-angular/global-setup',
  transform: {
    '^.+\\.(ts|js|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        isolatedModules: true
      }
    ]
  },
  moduleNameMapper: {
    '.*shared-worker.service': '<rootDir>/src/app/shared-worker.service.fake',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '@sentry/angular-ivy':
      '<rootDir>/node_modules/@sentry/angular-ivy/bundles/sentry-angular-ivy.umd.js',
    '^d3$': '<rootDir>/node_modules/d3/dist/d3.min.js'
  },
  testRunner: 'jest-jasmine2'
};

export default jestConfig;
