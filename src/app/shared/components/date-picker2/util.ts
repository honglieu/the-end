import { CandyDate } from '@trudi-ui';

import {
  DisabledDateFn,
  DisabledTimeConfig,
  DisabledTimeFn
} from './standard-types';
import { IHourd } from '@shared/components/time-picker/time-picker';
import { TimeRegex } from '@services/constants';

export const PREFIX_CLASS = 'trudi-picker';

const defaultDisabledTime: DisabledTimeConfig = {
  trudiDisabledHours(): number[] {
    return [];
  },
  trudiDisabledMinutes(): number[] {
    return [];
  },
  trudiDisabledSeconds(): number[] {
    return [];
  }
};

export function getTimeConfig(
  value: CandyDate,
  disabledTime?: DisabledTimeFn
): DisabledTimeConfig {
  let disabledTimeConfig = disabledTime
    ? disabledTime(value && value.nativeDate)
    : ({} as DisabledTimeConfig);
  disabledTimeConfig = {
    ...defaultDisabledTime,
    ...disabledTimeConfig
  };
  return disabledTimeConfig;
}

export function isTimeValidByConfig(
  value: CandyDate,
  disabledTimeConfig: DisabledTimeConfig
): boolean {
  let invalidTime = false;
  if (value) {
    const hour = value.getHours();
    const minutes = value.getMinutes();
    const seconds = value.getSeconds();
    const disabledHours = disabledTimeConfig.trudiDisabledHours();
    if (disabledHours.indexOf(hour) === -1) {
      const disabledMinutes = disabledTimeConfig.trudiDisabledMinutes(hour);
      if (disabledMinutes.indexOf(minutes) === -1) {
        const disabledSeconds = disabledTimeConfig.trudiDisabledSeconds(
          hour,
          minutes
        );
        invalidTime = disabledSeconds.indexOf(seconds) !== -1;
      } else {
        invalidTime = true;
      }
    } else {
      invalidTime = true;
    }
  }
  return !invalidTime;
}

export function isTimeValid(
  value: CandyDate,
  disabledTime: DisabledTimeFn
): boolean {
  const disabledTimeConfig = getTimeConfig(value, disabledTime);
  return isTimeValidByConfig(value, disabledTimeConfig);
}

export function isAllowedDate(
  value: CandyDate,
  disabledDate?: DisabledDateFn,
  disabledTime?: DisabledTimeFn
): boolean {
  if (!value) {
    return false;
  }
  if (disabledDate) {
    if (disabledDate(value.nativeDate)) {
      return false;
    }
  }
  if (disabledTime) {
    if (!isTimeValid(value, disabledTime)) {
      return false;
    }
  }
  return true;
}

export function hmsToSecondsOnly(str: string) {
  if (!str) return null;
  var p = str.split(':'),
    s = 0,
    m = 1;
  if (p?.length === 2) {
    p.push('00');
  }
  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }
  return s;
}

export function secondsToHmsOnly(seconds: number) {
  const date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().slice(11, 19);
}

export function sortTimesStartingFrom(seconds: number, timeArray: any[]) {
  return timeArray.sort(
    (time1: { value: number }, time2: { value: number }) => {
      const adjustedSeconds1 = (time1.value - seconds + 86400) % 86400;
      const adjustedSeconds2 = (time2.value - seconds + 86400) % 86400;

      return adjustedSeconds1 - adjustedSeconds2;
    }
  );
}

export function initTime(
  rangeFrom?: number,
  rangeTo?: number,
  isFrom?: boolean,
  isTo?: boolean,
  minuteControl: number = 5,
  isFilter?: boolean,
  rangeStartTime?: number
): IHourd[] {
  let second = -minuteControl * 60;
  let hours = Array(24 * (60 / minuteControl))
    .fill(null)
    .map(() => {
      second += minuteControl * 60;
      return mapTime(second, rangeFrom, rangeTo, isFrom, isTo);
    })
    .filter((item) => (isFilter ? !item.disabled : true));
  if (rangeStartTime || rangeStartTime === 0) {
    hours = sortTimesStartingFrom(rangeStartTime, hours);
  }
  if (isFilter) {
    if (isFrom && rangeTo) {
      hours = hours.filter((item) => (item.value as number) < rangeTo);
    }

    if (isTo && rangeFrom) {
      hours = hours.filter((item) => (item.value as number) > rangeFrom);
    }
  }

  return hours;
}

export function formatTime(str: string) {
  const [hourString, minute] = str.split(':');
  const hour = +hourString % 24;
  return (hour % 12 || 12) + ':' + minute + (hour < 12 ? ' am' : ' pm');
}

export function mapTime(
  second: any,
  rangeFrom?: number,
  rangeTo?: number,
  isFrom?: boolean,
  isTo?: boolean
): IHourd {
  if (Number.isInteger(second)) {
    return {
      value: second,
      label: formatTime(
        new Date(second * 1000).toISOString().substring(11, 16)
      ),
      disabled:
        !!(isTo && rangeFrom >= second) ||
        !!(isFrom && rangeTo && rangeTo <= second)
    };
  }
  if (typeof second === 'string' && !TimeRegex.test(formatTime(second))) {
    return {
      value: second,
      label: second,
      disabled: false
    };
  }
  return {
    value: hmsToSecondsOnly(second),
    label: formatTime(second),
    disabled: false
  };
}
