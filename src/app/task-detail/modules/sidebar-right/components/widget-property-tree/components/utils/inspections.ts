import dayjs from 'dayjs';

export function getISOStringTime(time: number = 0, dateTime: string) {
  const date = dayjs.utc(dateTime).startOf('day').toISOString() || null;

  if (date) {
    return dayjs(date).add(time, 's').toISOString();
  } else {
    return new Date().toISOString();
  }
}
