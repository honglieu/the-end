import { diffDaysUTCByLocalDate } from '@core';
import dayjs from 'dayjs';
import { Agency } from '@shared/types/agency.interface';

export const agencyComparator = (input1: Agency, input2: Agency) =>
  input1?.id === input2?.id;

export const calculateAndFormatRentedDays = (
  startDate: string,
  currentTimeZone
) => {
  let date: number;
  if (startDate) {
    date = diffDaysUTCByLocalDate(
      startDate,
      dayjs().utc().toISOString(),
      currentTimeZone.value
    );
  }
  let years = Math.floor(date / 365);
  date %= 365;
  let months = Math.floor(date / 30);
  date %= 30;
  let days = date;
  let yearStr = years > 1 ? 'years' : 'year';
  let monthStr = months > 1 ? 'months' : 'month';
  let dayStr = days > 1 ? 'days' : 'day';
  let rentedString = '';
  if (years > 0) {
    rentedString += `${years} ${yearStr} `;
  }
  if (months > 0) {
    rentedString += `${months} ${monthStr} `;
  }
  if (days > 0) {
    rentedString += `${days} ${dayStr}`;
  }
  return rentedString.trim();
};
