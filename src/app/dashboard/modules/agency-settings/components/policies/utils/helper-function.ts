import {
  PHONE_NUMBER_PATTERN_04,
  PHONE_NUMBER_PATTERN_9,
  PHONE_NUMBER_PATTERN_DEFAULT,
  PHONE_NUMBER_PATTERN_OTHER,
  PHONE_NUMBER_PATTERN_US,
  PHONE_NUMBER_START_GROUP_1,
  PHONE_NUMBER_START_GROUP_2,
  PHONE_NUMBER_START_GROUP_3,
  PHONE_NUMBER_START_GROUP_4,
  PHONE_PREFIXES
} from '@services/constants';

export function getMaskPhoneNumber(phoneNumber, areaCode: string) {
  if (!phoneNumber) return '';
  phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
  let maskPhoneNumber = '';
  switch (areaCode) {
    case PHONE_PREFIXES.US[0]:
      if (phoneNumber.length === 10) {
        maskPhoneNumber = PHONE_NUMBER_PATTERN_US;
      } else {
        maskPhoneNumber = PHONE_NUMBER_PATTERN_DEFAULT;
      }
      break;
    case PHONE_PREFIXES.AU[0]:
      if (
        (phoneNumber.startsWith('04') ||
          phoneNumber.startsWith('1300') ||
          phoneNumber.startsWith('1800')) &&
        phoneNumber.length === 10
      ) {
        maskPhoneNumber = PHONE_NUMBER_PATTERN_04;
        break;
      }
      if (phoneNumber.length === 9) {
        maskPhoneNumber = PHONE_NUMBER_PATTERN_9;
      } else if (phoneNumber.length === 10) {
        maskPhoneNumber = PHONE_NUMBER_PATTERN_OTHER;
      } else {
        maskPhoneNumber = PHONE_NUMBER_PATTERN_DEFAULT;
      }
      break;
    default:
      maskPhoneNumber = '';
      break;
  }
  return maskPhoneNumber;
}

export function formatPhoneNumber(phoneNumber: string, areaCode: string) {
  if (!phoneNumber) return '';
  const phoneNumberWithoutPrefix = phoneNumber.replace(/[^0-9]/g, '');
  const isCharacters = /[\s\+\-\(\)]/.test(phoneNumber);

  switch (areaCode) {
    case PHONE_PREFIXES.AU[0]:
      if (phoneNumber.startsWith('+61') || phoneNumber.startsWith('(+61)')) {
        const group = getPhoneNumberGroup(phoneNumberWithoutPrefix.slice(2));

        if (group) {
          return `(${areaCode}) ${phoneNumberWithoutPrefix
            .slice(2)
            .replace(group, '$1 $2 $3')}`;
        }
      } else if (phoneNumber.length === 10 && !isCharacters) {
        if (
          phoneNumber.startsWith('1300') ||
          phoneNumber.startsWith('04') ||
          phoneNumber.startsWith('1800')
        ) {
          return phoneNumberWithoutPrefix.replace(
            PHONE_NUMBER_START_GROUP_4,
            '$1 $2 $3'
          );
        }
        return phoneNumberWithoutPrefix.replace(
          PHONE_NUMBER_START_GROUP_2,
          '$1 $2 $3'
        );
      }
      return phoneNumber;
    case PHONE_PREFIXES.US[0]:
      if (phoneNumber.startsWith('+1') || phoneNumber.startsWith('(+1)')) {
        if (phoneNumberWithoutPrefix.slice(1).length === 10) {
          return `(${areaCode}) ${phoneNumberWithoutPrefix
            .slice(1)
            .replace(PHONE_NUMBER_START_GROUP_3, '($1) $2-$3')}`;
        }
      } else if (phoneNumberWithoutPrefix.length === 10 && !isCharacters) {
        return `${phoneNumberWithoutPrefix.replace(
          PHONE_NUMBER_START_GROUP_3,
          '($1) $2-$3'
        )}`;
      }
      return phoneNumber;
    default:
      return phoneNumber;
  }
}

export function getPhoneNumberGroup(phoneNumberWithoutPrefix) {
  switch (phoneNumberWithoutPrefix.length) {
    case 9:
      return PHONE_NUMBER_START_GROUP_1;
    case 10:
      if (
        phoneNumberWithoutPrefix.startsWith('1300') ||
        phoneNumberWithoutPrefix.startsWith('04') ||
        phoneNumberWithoutPrefix.startsWith('1800')
      ) {
        return PHONE_NUMBER_START_GROUP_4;
      }
      return PHONE_NUMBER_START_GROUP_2;

    default:
      return '';
  }
}

export function convertHtmlToText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const brReplacedHtml = doc.body.innerHTML.replace(/<br\s*\/?>/gi, '\n');
  const newDoc = parser.parseFromString(brReplacedHtml, 'text/html');
  return newDoc.body.textContent || '';
}

export function convertNewlinesToBreaks(text: string): string {
  if (!text) {
    return '';
  }
  return text.replace(/\n/g, '<br>');
}

export function hightLightMatchTextReply(value) {
  return `<p style="font-weight: 500; background-color: #caf3ee; width: fit-content">${value}</p>`;
}

export function clearStylesReply(value) {
  const REGEX_CLEAR_STYLES = /<p[^>]*>(.*?)<\/p>/gi;
  return value.replace(REGEX_CLEAR_STYLES, '<p>$1</p>');
}
