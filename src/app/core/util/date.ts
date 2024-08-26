import dayjs from 'dayjs';

export const differenceNowInDays = (date: string) => {
  return dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
};

export const differenceNowInMilliseconds = (date: string) => {
  return dayjs(date).startOf('day').diff(dayjs());
};

export const differenceNowInMinutes = (date: string) => {
  return dayjs(date).startOf('day').diff(dayjs(), 'minute');
};
