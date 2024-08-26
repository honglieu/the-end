import dayjs from 'dayjs';

export function combineDateAndTimeToISO(date: Date, time: number) {
  const datePayload = dayjs
    .utc(date)
    .startOf('day')
    .add(time, 'seconds')
    .toISOString();
  return datePayload;
}
