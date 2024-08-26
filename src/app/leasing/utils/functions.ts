import dayjs from 'dayjs';
import { SHORT_ISO_DATE } from '@services/constants';
import { ICreditorInvoiceOption } from '@shared/types/tenancy-invoicing.interface';

export const getCreditorName = (firstName: string, lastName: string) => {
  if (!firstName) return lastName;
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

export const getSupplierId = (id: string, arr: ICreditorInvoiceOption[]) => {
  if (arr?.some((it) => it.id === id)) return id;
  return '';
};

export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0;
};

export const convertStringToNum = (value: string) => {
  return +String(value)?.replace(/[^0-9.]/g, '');
};

export const convertTimeUTC = (date: Date, hour: number) => {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour / 3600,
      (hour % 3600) / 60,
      0
    )
  ).toISOString();
};

export const reverseObj = (obj) => {
  return Object.fromEntries(Object.entries(obj).map((a) => a.reverse()));
};

export const convertToISOString = (date) => {
  return date ? dayjs(date).toISOString() : null;
};

export const convertDateISO = (date) => {
  return date ? dayjs(date).format(SHORT_ISO_DATE) : null;
};

export const convertTime12to24 = (time12h) => {
  const [time, modifier] = time12h.split(' ');
  if (!modifier) return time12h;
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier.toUpperCase() === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}:00`;
};
