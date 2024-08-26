import { omitBy } from 'lodash-es';

export const pickByObject = (current: object) => {
  return omitBy(current, (v) => ['', null, undefined].includes(v));
};
