import dayjs from 'dayjs';
import spacetime from 'spacetime';
import soft from 'timezone-soft';

export interface ITimezone {
  value: string;
  label: string;
  original: string;
  tzLabel: string;
  offsetLabel: string;
  offset: number;
  abbrev: string;
  altName: string;
  gmt: string;
}

export enum EFunctionMode {
  START_OF_DAY
}

const displayValue = 'UTC';
const shortDateFormat = 'YYYY-MM-DDTHH:mm:ss';

export const allTimezones: Record<string, string> = {
  'Pacific/Pago_Pago': 'Midway Island, American Samoa',
  'America/Adak': 'Aleutian Islands',
  'Pacific/Honolulu': 'Hawaii',
  'Pacific/Marquesas': 'Marquesas Islands',
  'America/Anchorage': 'Alaska',
  'America/Tijuana': 'Baja California',
  'America/Los_Angeles': 'Pacific Time (US and Canada)',
  'America/Phoenix': 'Arizona',
  'America/Denver': 'Mountain Time (US and Canada), Navajo Nation',
  'America/Belize': 'Central America',
  'America/Chicago': 'Central Time (US and Canada)',
  'America/Chihuahua': 'Chihuahua, La Paz, Mazatlan',
  'Pacific/Easter': 'Easter Island',
  'America/Mexico_City': 'Guadalajara, Mexico City, Monterrey',
  'America/Regina': 'Saskatchewan',
  'America/Bogota': 'Bogota, Lima, Quito',
  'America/Cancun': 'Chetumal',
  'America/New_York': 'Eastern Time (US and Canada)',
  'America/Port-au-Prince': 'Haiti',
  'America/Havana': 'Havana',
  'America/Indiana/Indianapolis': 'Indiana (East)',
  'America/Asuncion': 'Asuncion',
  'America/Halifax': 'Atlantic Time (Canada)',
  'America/Caracas': 'Caracas',
  'America/Cuiaba': 'Cuiaba',
  'America/Manaus': 'Georgetown, La Paz, Manaus, San Juan',
  'America/Santiago': 'Santiago',
  'America/Grand_Turk': 'Turks and Caicos',
  'America/St_Johns': 'Newfoundland',
  'America/Fortaleza': 'Araguaina',
  'America/Sao_Paulo': 'Brasilia',
  'America/Cayenne': 'Cayenne, Fortaleza',
  'America/Argentina/Buenos_Aires': 'City of Buenos Aires',
  'America/Nuuk': 'Greenland',
  'America/Montevideo': 'Montevideo',
  'America/Miquelon': 'Saint Pierre and Miquelon',
  'America/Bahia': 'Salvador',
  'America/Noronha': 'Fernando de Noronha',
  'Atlantic/Azores': 'Azores',
  'Atlantic/Cape_Verde': 'Cabo Verde Islands',
  'Europe/London': 'Dublin, Edinburgh, Lisbon, London',
  'Africa/Monrovia': 'Monrovia, Reykjavik',
  'Europe/Amsterdam': 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Europe/Belgrade': 'Belgrade, Bratislava, Budapest, Ljubljana, Prague',
  'Europe/Brussels': 'Brussels, Copenhagen, Madrid, Paris',
  'Europe/Warsaw': 'Sarajevo, Skopje, Warsaw, Zagreb',
  'Africa/Algiers': 'West Central Africa',
  'Africa/Casablanca': 'Casablanca',
  'Africa/Windhoek': 'Windhoek',
  'Europe/Athens': 'Athens, Bucharest',
  'Asia/Beirut': 'Beirut',
  'Africa/Cairo': 'Cairo',
  'Asia/Damascus': 'Damascus',
  'Asia/Gaza': 'Gaza, Hebron',
  'Africa/Maputo': 'Harare, Pretoria',
  'Europe/Helsinki': 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
  'Asia/Jerusalem': 'Jerusalem',
  'Europe/Kaliningrad': 'Kaliningrad',
  'Africa/Tripoli': 'Tripoli',
  'Asia/Amman': 'Amman',
  'Asia/Baghdad': 'Baghdad',
  'Europe/Istanbul': 'Istanbul',
  'Asia/Riyadh': 'Kuwait, Riyadh',
  'Europe/Minsk': 'Minsk',
  'Europe/Moscow': 'Moscow, St. Petersburg',
  'Africa/Nairobi': 'Nairobi',
  'Asia/Tehran': 'Tehran',
  'Asia/Dubai': 'Abu Dhabi, Muscat',
  'Europe/Astrakhan': 'Astrakhan, Ulyanovsk, Volgograd',
  'Asia/Baku': 'Baku',
  'Europe/Samara': 'Izhevsk, Samara',
  'Indian/Mauritius': 'Port Louis',
  'Asia/Tbilisi': 'Tbilisi',
  'Asia/Yerevan': 'Yerevan',
  'Asia/Kabul': 'Kabul',
  'Asia/Tashkent': 'Tashkent, Ashgabat',
  'Asia/Yekaterinburg': 'Ekaterinburg',
  'Asia/Karachi': 'Islamabad, Karachi',
  'Asia/Calcutta': 'Chennai, Kolkata, Mumbai, New Delhi',
  'Asia/Colombo': 'Sri Jayawardenepura',
  'Asia/Kathmandu': 'Kathmandu',
  'Asia/Almaty': 'Astana',
  'Asia/Dhaka': 'Dhaka',
  'Asia/Yangon': 'Yangon (Rangoon)',
  'Asia/Novosibirsk': 'Novosibirsk',
  'Asia/Bangkok': 'Bangkok, Hanoi, Jakarta',
  'Asia/Barnaul': 'Barnaul, Gorno-Altaysk',
  'Asia/Hovd': 'Hovd',
  'Asia/Krasnoyarsk': 'Krasnoyarsk',
  'Asia/Tomsk': 'Tomsk',
  'Asia/Shanghai': 'Beijing, Chongqing, Hong Kong SAR, Urumqi',
  'Asia/Irkutsk': 'Irkutsk',
  'Asia/Singapore': 'Kuala Lumpur, Singapore',
  'Australia/Perth': 'Perth',
  'Asia/Taipei': 'Taipei',
  'Asia/Ulaanbaatar': 'Ulaanbaatar',
  'Asia/Pyongyang': 'Pyongyang',
  'Australia/Eucla': 'Eucla',
  'Asia/Chita': 'Chita',
  'Asia/Tokyo': 'Osaka, Sapporo, Tokyo',
  'Asia/Seoul': 'Seoul',
  'Asia/Yakutsk': 'Yakutsk',
  'Australia/Adelaide': 'Adelaide',
  'Australia/Darwin': 'Darwin',
  'Australia/Brisbane': 'Brisbane',
  'Australia/Sydney': 'Canberra, Melbourne, Sydney',
  'Pacific/Guam': 'Guam, Port Moresby',
  'Australia/Hobart': 'Hobart',
  'Asia/Vladivostok': 'Vladivostok',
  'Australia/Lord_Howe': 'Lord Howe Island',
  'Pacific/Bougainville': 'Bougainville Island',
  'Asia/Srednekolymsk': 'Chokurdakh',
  'Asia/Magadan': 'Magadan',
  'Pacific/Norfolk': 'Norfolk Island',
  'Asia/Sakhalin': 'Sakhalin',
  'Pacific/Guadalcanal': 'Solomon Islands, New Caledonia',
  'Asia/Anadyr': 'Anadyr, Petropavlovsk-Kamchatsky',
  'Pacific/Auckland': 'Auckland, Wellington',
  'Pacific/Fiji': 'Fiji Islands',
  'Pacific/Chatham': 'Chatham Islands',
  'Pacific/Tongatapu': "Nuku'alofa",
  'Pacific/Apia': 'Samoa',
  'Pacific/Kiritimati': 'Kiritimati Island'
};

export const getZonedOffset = (
  timeZone: string,
  givenDate?: Date | string | number
) => {
  const atTime = Boolean(givenDate) ? new Date(givenDate) : new Date();
  const localizedTime = new Date(atTime.toLocaleString('en-US', { timeZone }));
  const utcTime = new Date(atTime.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = Math.round(
    (localizedTime.getTime() - utcTime.getTime()) / (60 * 1000)
  );

  const min = offset % 60;
  const hour = (offset / 60) ^ 0;
  const hourStr = `${Math.abs(hour)}`.padStart(2, '0');
  const hr = `${hour < 0 ? '-' : '+'}${hourStr}:${
    min === 0 ? '00' : Math.abs(min)
  }`;
  return {
    offsetHour: offset / 60,
    offsetLabel: hr
  };
};

// Example:
// {
//   "value": "America/New_York",
//   "label": "(UTC -05:00) Eastern Time (US and Canada)",
//   "original": "(UTC -05:00) Eastern Time (US and Canada)",
//   "tzLabel": "Eastern Time (US and Canada)",
//   "offsetLabel": "-05:00",
//   "offset": -5,
//   "abbrev": "EST",
//   "altName": "Eastern Standard Time",
//   "gmt": "(UTC -05:00)"
// }
export const getTimezoneDetail = (tzIdentifier: string): ITimezone => {
  const tzLabel = allTimezones[tzIdentifier] || '';
  const now = spacetime.now(tzIdentifier);
  const isDstString = now.isDST() ? 'daylight' : 'standard';
  const tz = now.timezone();
  const tzStrings = soft(tzIdentifier);

  const abbr = tzStrings?.[0]?.[isDstString]?.abbr;
  const altName = tzStrings?.[0]?.[isDstString]?.name;

  const currentOffset = getZonedOffset(tzIdentifier);
  const gmt = `(${displayValue}${currentOffset.offsetLabel})`;
  const prefix = `${gmt} ${tzLabel}`;

  const result = {
    value: tz.name,
    label: prefix,
    original: prefix,
    tzLabel,
    offsetLabel: currentOffset.offsetLabel,
    offset: currentOffset.offsetHour,
    abbrev: abbr,
    altName: altName,
    gmt: gmt
  };

  return result;
};

export const initTimezoneOptions = (): ITimezone[] => {
  const options = Object.keys(allTimezones)
    .map((zone) => {
      try {
        return getTimezoneDetail(zone);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.offset - b.offset);
  return options;
};

export const convertUTCToLocalDateTime = (
  dateTime,
  timeZone: string
): string => {
  if (!timeZone) throw new Error('timeZone is required!');
  const dateTimeStr =
    dateTime instanceof Date ? dateTime.toISOString() : dateTime;
  if (!!dateTimeStr && dateTimeStr.includes('Z')) {
    return dayjs(dateTimeStr).tz(timeZone).format(shortDateFormat);
  }
  return dateTimeStr;
};

export const diffDaysUTCByLocalDate = (
  startDateUTC: string | Date,
  endDateUTC: string | Date,
  timeZone: string
) => {
  const startDateLocal = dayjs(
    convertUTCToLocalDateTime(startDateUTC, timeZone)
  ).startOf('day');
  const endDateWithExtraDay = dayjs(endDateUTC).add(1, 'day').toISOString();
  const endDateLocal = dayjs(
    convertUTCToLocalDateTime(endDateWithExtraDay, timeZone)
  ).startOf('day');

  return endDateLocal.diff(startDateLocal, 'days');
};

export const formatUTCAndTimezone = (
  dateTime,
  tz: ITimezone,
  mode?: EFunctionMode
) => {
  if (!tz) throw new Error('timeZone is required!');
  if (!dateTime) throw new Error('dateTime is required!');

  const zonedOffset = getZonedOffset(tz.value, dateTime);
  switch (mode) {
    case EFunctionMode.START_OF_DAY:
      return `${dayjs(dateTime).startOf('day').format(shortDateFormat)}${
        zonedOffset.offsetLabel
      }`;
    default:
      return `${dayjs(dateTime).format(shortDateFormat)}${
        zonedOffset.offsetLabel
      }`;
  }
};
