class JestDayjs {
  _input: Date;
  constructor(...args) {
    this._input = args?.length > 0 ? new Date(args[0]) : new Date();
  }

  isSameOrAfter(...args) {
    console.log('test', args);
    return false;
  }

  tz(timezone: string) {
    return new JestDayjs();
  }
}

jest.mock('dayjs', () => ({
  default: jest.fn((...args) => {
    return new JestDayjs(args);
  }),
  locale: jest.fn(),
  updateLocale: jest.fn(),
  extend: jest.fn()
}));

jest.mock('dayjs/plugin/advancedFormat', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/customParseFormat', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/duration', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/isLeapYear', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/isSameOrBefore', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/isSameOrAfter', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/utc', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/timezone', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/updateLocale', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/localizedFormat', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/isBetween', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/quarterOfYear', () => ({
  default: jest.fn()
}));
jest.mock('dayjs/plugin/relativeTime', () => ({
  default: jest.fn()
}));
