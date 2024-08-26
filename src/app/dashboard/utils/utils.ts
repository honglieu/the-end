import { ITimezone } from '@core';
import dayjs from 'dayjs';

export function hoursToMilisecond(hours: number) {
  return hours * 60 * 60 * 1000;
}

export function getDateWithTimezone(date: Date, timezone: ITimezone) {
  const convertedDate = dayjs(date).tz(timezone.value);
  return new Date(convertedDate.format('YYYY-MM-DDTHH:mm:ss'));
}
