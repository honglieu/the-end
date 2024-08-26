import dayjs from 'dayjs';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  PLAIN_LINK_REGEX,
  base64PNGImagePrefix,
  listFileDisplayThumbnail,
  listPhotoDisplayThumbnail,
  trudiUserId
} from '@services/constants';
import { MessageStatus } from '@services/conversation.service';
import {
  TrudiButtonEnumStatus,
  TrudiButtonReminderTimeStatus
} from '@shared/enum/trudiButton.enum';
import { CategoryUser } from '@shared/types/action-link.interface';
import {
  IListConversationConfirmProperties,
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import { ReminderTimeDetail } from '@shared/types/routine-inspection.interface';
import { TrudiButtonBase } from '@shared/types/trudi.interface';
import { SocketType } from '@shared/enum/socket.enum';
import { SocketJob } from '@shared/types/socket.interface';
import { startCase } from 'lodash-es';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import { FormGroup } from '@angular/forms';
import { LocalFile } from '@services/files.service';
import { replaceImageLoading } from '@shared/components/tiny-editor/utils/functions';
import {
  EStatusTicket,
  ETooltipQuoteMessage
} from '@shared/types/message.interface';
import * as HTMLParser from 'node-html-parser';
import { EOptionType } from '@shared/enum/optionType.enum';
import { ElementRef } from '@angular/core';
import { convertTime24to12 } from '@/app/trudi-send-msg/utils/helper-functions';
import { ECountryName } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { IAddPolicyPopoverStyle } from '@/app/share-pop-up/select-policy-type-pop-up/select-policy-type-pop-up.component';
import { EConversationType } from '@/app/shared/enum';
import { Property, UserPropertyInPeople } from '@/app/shared/types';

export function formatCurrency(number, currencyCode = 'USD', locale = 'en-US') {
  if (!isNaN(parseFloat(number))) {
    const currency = new Intl.NumberFormat(locale, {
      style: 'currency',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: currencyCode
    }).format(number);
    return currency;
  }
  return null;
}

export function getFirstCharOfName(
  firstName: string,
  lastName: string
): string {
  return firstName?.charAt(0) + lastName?.charAt(0);
}

export function getActionLinkImgSrc(
  categoryId: string,
  categoryList: CategoryUser[]
): CategoryUser {
  const categoryDetails = categoryList.find((cat) => cat.id === categoryId);
  if (categoryId === '0d2817fa-9687-11e9-bc42-526af7764f64') {
    categoryDetails.svg = 'old-rent.svg';
    categoryDetails.color = 'rgb(0, 169, 159)';
    categoryDetails.hideEdit = true;
  }
  return categoryDetails;
}

export function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

export function historyGoBack(delta = -1): void {
  history.go(delta);
}

export function validateFileExtension(
  file: File,
  filePattern: string[] = FILE_VALID_TYPE
): boolean {
  if (!file) return false;
  const fileToCheck = file[0] || file;
  const name = fileToCheck.name || fileToCheck.fileName;
  const spl = name.split('.');
  const tail = spl[spl.length - 1];
  return filePattern.includes(tail.toLowerCase());
}

export function blockOverlayScroll(state: boolean) {
  document.body.style.overflow = state ? 'hidden' : 'auto';
}

export function isObjectEmpty(object) {
  return !Object.keys(object).length;
}

export function setPrefixUrl(url) {
  if (!url) return null;
  return url.startsWith('https://') || url.startsWith('http://')
    ? url
    : 'https://' + url;
}

export function validateFileType(file: File, type: string): boolean {
  if (file.type !== type) return false;
  return true;
}

export function validateFileSize(file: File, size: number): boolean {
  if (file.size / 1024 ** 2 > size) return false;
  return true;
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toCamelCase(inputString) {
  let wordsList = [];
  let currentWord = '';

  for (let i = 0; i < inputString.length; i++) {
    let currentChar = inputString[i];
    if (currentChar === ' ' || currentChar === '-') {
      wordsList.push(currentWord);
      currentWord = '';
    } else {
      currentWord += currentChar;
    }
  }

  wordsList.push(currentWord);

  let camelcaseString = wordsList[0].toLowerCase();
  for (let i = 1; i < wordsList.length; i++) {
    let currentWord = wordsList[i];
    let capitalizedWord =
      currentWord[0].toUpperCase() + currentWord.substring(1);
    camelcaseString += capitalizedWord;
  }

  return camelcaseString;
}

export function replaceMessageToOneLine(
  message: string,
  isReplaceBreakClosingTag?: boolean,
  isReplaceBreak?: boolean
) {
  const regex = /<!DOCTYPE html/i;
  if (!message || !message?.length) return '';

  message = message?.split("<div id='email-signature'>")[0];
  if (isReplaceBreakClosingTag) {
    message = message?.replace(/<br\/>/g, ' ');
  }
  if (isReplaceBreak) {
    message = message?.replace(/<br>/g, ' ');
  }
  if (regex.test(message)) {
    message = message?.replace(/<style[^>]*>[\s\S]*?<\/style>/g, ' ');
  }
  message = message?.replace(/<.*?>|<\/.*?>|class=".*?"|class='.*?'/gi, '');
  message = message?.replace(/<[^>]*>/g, '');
  message = message?.replace(/\&nbsp;/g, ' ');
  message = message?.replace(/\s{2}>/g, ' ');
  const matches = message.match(PLAIN_LINK_REGEX);
  if (matches) {
    message = message.replace(PLAIN_LINK_REGEX, (link) => {
      const shortenLinks = link.match(/.+\/([^\?\/]+)/);
      let shortenLink = link;
      if (shortenLinks && shortenLinks.length > 1) {
        shortenLink = shortenLinks[1];
      }
      return shortenLink;
    });
  }

  return message;
}

export function formatMessageInLine(message: string) {
  message = removeQuote(message);
  const removeHtmlMessage = replaceMessageToOneLine(message);
  if (removeHtmlMessage.trim().length === 0) {
    const content = replaceMessageToOneLine(message);
    return content;
  } else {
    return removeHtmlMessage;
  }
}

export function extractTextFromQuote(text: string) {
  const htmlContent = HTMLParser.parse(text);
  let content = htmlContent.querySelector('[role="module-content"]');
  if (!content) {
    return '';
  }

  let signatures = content.querySelectorAll('[id$="email-signature"]');
  signatures?.forEach((signature) => {
    if (signature && signature.parentNode) {
      signature.parentNode.removeChild(signature);
    }
  });

  let contentHTML = content.innerHTML.replace(/<\/[^>]+>/g, ' ');
  let parser = new DOMParser();
  let doc = parser.parseFromString(contentHTML, 'text/html');
  let textContent = doc.body ? doc.body.textContent || '' : '';
  textContent = textContent.replace(/(\n\s*){2,}/g, ' ');
  textContent = textContent.replace(/\t/g, '');
  textContent = textContent.replace(/ {2,}/g, ' ');
  return textContent;
}

export function removeQuote(text: string) {
  try {
    const htmlContent = HTMLParser.parse(text);

    // Gmail
    let gmailBlockquoteElements = htmlContent.querySelectorAll('blockquote');
    if (gmailBlockquoteElements && gmailBlockquoteElements.length) {
      for (const blockquoteElement of gmailBlockquoteElements) {
        blockquoteElement.remove();
      }
    }
    gmailBlockquoteElements = htmlContent.querySelectorAll('.gmail_quote');
    if (gmailBlockquoteElements && gmailBlockquoteElements.length) {
      for (const blockquoteElement of gmailBlockquoteElements) {
        const previousElement = blockquoteElement.previousElementSibling;
        if (previousElement && previousElement.rawTagName === 'br') {
          previousElement.remove();
        }
        blockquoteElement.remove();
      }
    }

    // Outlook
    const outlookBlockquoteElement =
      htmlContent.getElementById('divRplyFwdMsg');
    if (outlookBlockquoteElement) {
      const previousElement = outlookBlockquoteElement.previousElementSibling;
      if (previousElement && previousElement.rawTagName === 'hr') {
        previousElement.remove();
      }
    }

    // Reply and forward across different email clients
    const mailEditorElement = htmlContent.getElementById(
      'mail-editor-reference-message-container'
    );
    if (mailEditorElement) {
      const previousElement = mailEditorElement.previousElementSibling;
      if (previousElement && previousElement.rawTagName === 'br') {
        previousElement.remove();
      }
    }

    let messageContent = htmlContent.toString();
    messageContent = messageContent.replace(
      /<div id="divRplyFwdMsg" dir="ltr"[^>]*>[\s\S]*?<\/body>/,
      '</body>'
    );
    messageContent = messageContent.replace(
      /<div id="mail-editor-reference-message-container"[^>]*>[\s\S]*?<\/body>/,
      '</body>'
    );

    return messageContent;
  } catch (error) {
    console.error('Remove_Blockquote_Error', error.message);
    return text;
  }
}

export function replaceUrlWithAnchorTag(input: string) {
  const filteredPlainLinks = input?.match(PLAIN_LINK_REGEX);
  filteredPlainLinks?.forEach((link) => {
    const originalLink = link
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .replace(/\n/g, '');
    link = originalLink.startsWith('www')
      ? `https://${originalLink}`
      : originalLink;
    if (!link.startsWith('http')) {
      return;
    }

    if (link.includes('&nbsp;')) {
      link = link.replace(/\&nbsp;/g, '');
    }

    const shortenLinks = link.match(/.+\/([^\?\/]+)/);
    let shortenLink = link;
    if (shortenLinks && shortenLinks.length > 1) {
      shortenLink = shortenLinks[1];
    }
    const anchorTag = `<a href="${link}" target="_blank">${shortenLink}</a>`;
    const escapedLink = originalLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const excludeInsideAnchorTagRegex = new RegExp(
      `(?<!<[aA]\\b[^>]*?)(?:https?:\\/\\/)?${escapedLink}(?![^<]*?<\\/a\\b)`,
      'g'
    );
    input = input.replace(excludeInsideAnchorTagRegex, anchorTag);
  });
  return extractAlias(input);
}

function extractAlias(input: string) {
  const links = input?.match(/alias-((?!-href).|\n)*-href-[^\s\]\)]*/g);
  links?.forEach((link) => {
    const text = link.replace(/alias-((.|\n)*)-href-[^\s]*/g, '$1');
    const href = link.replace(/alias-(.|\n)*-href-([^\s]*)/g, '$2');

    let shortenLink = text.replace(/^\n*|\n*$/g, '').replace(/\n/g, ' ');
    if (text === href) {
      const shortenLinks = text.match(/.+\/([^\?\/]+)/);
      if (shortenLinks && shortenLinks.length > 1) {
        shortenLink = shortenLinks[1];
      }
    }
    const anchorTag = `<a href="${href}" target="_blank">${shortenLink}</a>`;
    input = input.replace(link, anchorTag);
  });
  return input;
}

export function shortenLinkText(input: string) {
  let parser = new DOMParser();
  let doc = parser.parseFromString(input, 'text/html');
  let links = doc.querySelectorAll('a');

  links.forEach((link) => {
    if (link.textContent !== link.href) {
      return;
    }
    let url = new URL(link.href);
    let pathParts = url.pathname.split('/');
    let lastPathPart = pathParts[pathParts.length - 1];

    if (lastPathPart) {
      link.textContent = lastPathPart;
    }
  });

  return doc.body.innerHTML;
}

export function isIncludeEmailSignature(message: string) {
  return message?.split("<div id='email-signature'>").length > 1;
}

export function replaceMessageToManyLine(message: string) {
  if (!message || !message?.length) return '';

  message = message?.split("<div id='email-signature'>")[0];

  return message;
}

export function reversePopup(refs) {
  const hostPosition = (
    refs.target || refs.nativeElement
  ).getBoundingClientRect();
  const bodyElement = document.querySelector('body');
  const oneThirdOfScreenHeight = bodyElement.clientHeight / 3;
  return (
    hostPosition.bottom > bodyElement.clientHeight - oneThirdOfScreenHeight
  );
}

function convertSummaryMessageHtmlToText(message: string): string {
  let prefix = [''];
  let element = '';
  let init = ' ';
  let resolve = false;

  if (message.includes('voicemailEmergency')) {
    message = message.replace(/ style="[^"]*"/g, '').replace(/<\/span>/g, ' ');
    element = `<p id="voicemailEmergency">`;
    resolve = true;
  }

  if (message.includes('</li>')) {
    message = message.replace('/<br/> ', '');
    prefix = [' ', '&bull; '];
    init = ' - ';
    resolve = true;
    element = '<li>';
    if (message.includes('mylistitemclass')) {
      element = "<li class='mylistitemclass'>";
    }
  }

  if (resolve) {
    return message
      .split(element)
      .map((e, index) => (prefix?.[index] || init) + replaceMessageToOneLine(e))
      .join('')
      .trim();
  }

  return null;
}

export function toSummaryMessage(
  message: string,
  isRemoveBreak?: boolean,
  isRemoveBr?: boolean
) {
  if (!message) return '';
  if (isRemoveBreak) {
    const resolveSummary = convertSummaryMessageHtmlToText(message);
    if (resolveSummary) return resolveSummary;
  }

  return replaceMessageToOneLine(message, true, isRemoveBr).replace(/<|>/g, '');
}

function parseStringToArray(arrayString) {
  if (typeof arrayString === 'string') {
    const listOfMessageOptiopns = JSON.parse(arrayString);
    return [listOfMessageOptiopns.length - 1];
  } else if (Array.isArray(arrayString)) {
    return arrayString[arrayString.length - 1] || '';
  }

  return '';
}

function replaceBr(message) {
  return message.replace(/<br>/gi, '');
}

export function isEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z.]+$/;
  return emailRegex.test(email);
}

export function displayName(
  firstName: string,
  lastName: string,
  phoneNumber?: string,
  isShowPhoneNumber?: boolean
): string {
  if (!firstName && !lastName) {
    if (isShowPhoneNumber) {
      return phoneNumber;
    }
    return 'Unknown';
  }
  if (!firstName) {
    return lastName;
  }
  return (firstName || '') + ' ' + (lastName || '');
}

export function formatTitle(title: string) {
  return isEmail(title)
    ? title
    : title
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function getLastMessage(
  conversation: PreviewConversation,
  curentUserId: string
) {
  const message =
    conversation.textContent || conversation.textContent === ''
      ? conversation.textContent
      : conversation.message;
  if (message) {
    const { lastUser } = conversation;
    const messageComeFromVoiceMail =
      conversation?.messageComeFrom === EMessageComeFromType.VOICE_MAIL &&
      !conversation?.email &&
      !lastUser.firstName &&
      !lastUser.lastName;
    if (messageComeFromVoiceMail) {
      return 'Unknown: ' + message;
    } else if (lastUser.id === curentUserId) {
      return replaceBr('You' + ': ' + message);
    } else if (lastUser.id === trudiUserId) {
      if (message?.trim() === 'Resolved') return 'Trudi: Answered';
      return replaceBr('Trudi' + ': ' + message);
    } else if (conversation.type === EUserPropertyType.SUPPLIER) {
      const displayNameTitleCase = customTitleCase(
        displayName(lastUser.firstName, lastUser.lastName)?.trim()
      );
      return replaceBr(displayNameTitleCase + ': ' + message);
    } else if (isEmail(lastUser.firstName)) {
      return lastUser.firstName.trim() + ': ' + message;
    } else {
      return replaceBr(
        startCase(displayName(lastUser.firstName, lastUser.lastName))?.trim() +
          ': ' +
          message
      );
    }
  } else if (conversation.status === MessageStatus.resolved) {
    return 'Trudi: Answered';
  } else if (conversation.status === MessageStatus.schedule) {
    return ``;
  } else if (conversation.messageOptions) {
    return replaceBr(
      'Trudi: ' + parseStringToArray(conversation.messageOptions)
    );
  } else {
    return 'new conversation';
  }
}

export function validateWhiteSpaceHtml(value: string): boolean {
  if (!value) return true;
  // const regex = /^(<p>(&nbsp;|\s)*<\/p>)*<p>(&nbsp;|\s)+<\/p>(<p>(&nbsp;|\s)*<\/p>)*$/;  shift enter not work
  value = replaceImageLoading(value);
  const regex = /^(?:\s|&nbsp;|<br\s*\/?>)*$/;
  return regex.test(value.trim().replace(/<\/?p>/g, ''));
}

export function countRemainingDay(date): number {
  const today = new Date();
  const input = new Date(date);
  const diffTime = input.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return -Math.abs(diffDays);
  } else if (diffDays === 0) {
    return 0;
  } else {
    return diffDays;
  }
}

export function handleFormatDataListTaskMove(data) {
  if (!data) return {};
  return Object.entries(data).reduce((acc, [key, value]) => {
    Object.entries(value).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        acc[key] = [...(acc[key] || []), ...v];
      }
    });
    return acc;
  }, {});
}

export function countOccurrences(arr) {
  const map = new Map();
  if (!Array.isArray(arr)) return map;
  for (const item of arr) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return map;
}

export function groupReminderTimesByTime(reminderTimes: ReminderTimeDetail[]) {
  if (reminderTimes && reminderTimes.length) {
    const remainingReminderTimes = reminderTimes.filter(
      (r) => r.status !== TrudiButtonReminderTimeStatus.FORCE_COMPLETE
    );
    const reminderTimesDisplay = Array.from(
      new Set(
        remainingReminderTimes.map((reminderTime) => reminderTime.time).sort()
      )
    );
    return reminderTimesDisplay.map(
      (time) =>
        ({
          status: remainingReminderTimes.find((t) => t.time === time).status,
          time: time
        } as ReminderTimeDetail)
    );
  }
  return [];
}

export function updateTrudiButtonReminderTimeStatus(
  { reminderTimes, status }: TrudiButtonBase,
  res: SocketJob
) {
  const { type, jobId, reminderTime } = res;
  const modelReminderTimes = reminderTimes
    .filter((r) => type !== SocketType.removedJob || r.id !== jobId)
    .map((el) => {
      if (el.id === jobId) {
        return {
          ...el,
          status:
            type === SocketType.completeJob
              ? TrudiButtonReminderTimeStatus.COMPLETE
              : type === SocketType.forceCompleteJob
              ? TrudiButtonReminderTimeStatus.FORCE_COMPLETE
              : el.status,
          time: type === SocketType.updatedJob ? reminderTime : el.time
        };
      }
      return el;
    });
  const remainingReminderTimes = modelReminderTimes.filter(
    (r) => r.status !== TrudiButtonReminderTimeStatus.FORCE_COMPLETE
  );
  const reminderTimesDisplay = groupReminderTimesByTime(remainingReminderTimes);
  const allButtonCompleted =
    (!modelReminderTimes.length && type !== SocketType.removedJob) ||
    (modelReminderTimes.length && !remainingReminderTimes.length) ||
    (remainingReminderTimes.length &&
      remainingReminderTimes.every(
        (el) => el.status === TrudiButtonReminderTimeStatus.COMPLETE
      ));

  return {
    reminderTimes: reminderTimesDisplay,
    modelReminderTimes,
    currentStatus: allButtonCompleted ? TrudiButtonEnumStatus.COMPLETED : status
  };
}

export function updateTrudiButtonReminderTimeStatusV2(
  { reminderTimes, status }: TrudiButtonBase,
  res: SocketJob
) {
  const { type, jobId, reminderTime } = res;
  const modelReminderTimes = reminderTimes
    .filter((r) => type !== SocketType.removedJob || r.id !== jobId)
    .map((el) => {
      if (el.id === jobId) {
        return {
          ...el,
          status:
            type === SocketType.completeJob
              ? TrudiButtonReminderTimeStatus.COMPLETE
              : type === SocketType.forceCompleteJob
              ? TrudiButtonReminderTimeStatus.FORCE_COMPLETE
              : el.status,
          time: type === SocketType.updatedJob ? reminderTime : el.time
        };
      }
      return el;
    });
  const remainingReminderTimes = modelReminderTimes.filter(
    (r) => r.status !== TrudiButtonReminderTimeStatus.FORCE_COMPLETE
  );
  const allButtonCompleted =
    (!modelReminderTimes.length && type !== SocketType.removedJob) ||
    (modelReminderTimes.length && !remainingReminderTimes.length) ||
    (remainingReminderTimes.length &&
      remainingReminderTimes.every(
        (el) => el.status === TrudiButtonReminderTimeStatus.COMPLETE
      ));

  return {
    modelReminderTimes,
    currentStatus: allButtonCompleted ? TrudiButtonEnumStatus.COMPLETED : status
  };
}

function reverse(str: string): string {
  return str.split('').reverse().join('');
}

function customTitleCase(input: string): string {
  if (!input) return input;

  return input
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function numStr(num: string): string {
  return reverse(
    reverse(num + '')
      .replace(/\d{3}/g, '$&,')
      .replace(/\,$/, '')
  );
}

export function formatterAmount(
  value: number | string,
  isFormattedWholePart = true,
  maxLengthNumber?: number
): string {
  let numericValue = String(value).replace(/[^0-9.]/g, '');
  if (
    numericValue &&
    String(numericValue).replace(/[^0-9]/g, '').length > maxLengthNumber
  ) {
    numericValue = numericValue.slice(0, -1);
  }
  const hasDecimalPoint = numericValue.includes('.');
  const [wholePart, decimalPart] = numericValue.split('.');
  const formattedWholePart = isFormattedWholePart
    ? numStr(wholePart)
    : wholePart;
  const transformedValue = hasDecimalPoint
    ? `${formattedWholePart}.${decimalPart}`
    : numericValue
    ? formattedWholePart
    : '';

  return transformedValue;
}

export const getErrorMessageReiForm = () => {
  const reiFormErrorNotFound = {
    status: true,
    message: [
      {
        text: 'Ready to use REI Forms Live? Link your account in ',
        href: ''
      },
      {
        text: 'profile setting.',
        href: `/dashboard/profile-settings/integrations`
      }
    ]
  };

  const getReiFormError = {
    status: true,
    message: [
      {
        text: 'We’ve detected an issue with your REI Forms Live integration. Check your ',
        href: ''
      },
      {
        text: 'profile settings',
        href: `/dashboard/profile-settings/integrations`
      },
      {
        text: ' and try again.',
        href: ''
      }
    ]
  };

  return { reiFormErrorNotFound, getReiFormError };
};

export const getDeepKey = (obj, key) => {
  if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }
  for (let k in obj) {
    if (typeof obj === 'object' && obj[k]) {
      const value = getDeepKey(obj[k], key);
      if (value !== undefined) {
        return value;
      }
    }
  }
  return undefined;
};

export const pickDeep = (obj, key, depth = 1) => {
  const result = [];

  const pick = (obj) => {
    if (depth <= 0 || obj === null) return;
    if (obj[key]) {
      result.push(obj[key]);
    }
    if (typeof obj === 'object') {
      for (let k in obj) {
        if (typeof obj[k] === 'object' && obj[k] !== undefined) {
          pick(obj[k]);
        }
      }
    }
  };
  pick(obj);

  return result.length ? { [key]: result } : null;
};

export const pick = (object, keys, hasGetAll = false) => {
  if (hasGetAll) {
    return keys.reduce((obj, key) => {
      const deepKey = pickDeep(object, key);
      if (deepKey && Object.values(deepKey).length) {
        obj[key] = deepKey[key];
      }
      return obj;
    }, {});
  } else {
    return keys.reduce((obj, key) => {
      const deepKey = getDeepKey(object, key);
      if (deepKey) {
        obj[key] = deepKey;
      }
      return obj;
    }, {});
  }
};

export function filterOutUnwantedKeys(
  data,
  filterValues = ['', null, NaN, undefined]
) {
  for (var key in data) {
    if (data.hasOwnProperty(key) && filterValues.includes(data[key])) {
      delete data[key];
    }
  }
  return data;
}

export const emailRegex =
  /^[a-zA-Z0-9._](?:[a-zA-Z0-9._-]*[a-zA-Z0-9._])?@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const trimFormGroupValues = (formGroup: FormGroup) => {
  Object.keys(formGroup.controls).forEach((controlName) => {
    const control = formGroup.get(controlName);

    if (control instanceof FormGroup) {
      trimFormGroupValues(control);
    } else {
      if (control && control.value && typeof control.value === 'string') {
        control.setValue(control.value.trim());
      }
    }
  });
};

export function coverIframeHeight(iframe: HTMLIFrameElement) {
  updateIframeHeight(iframe);
  checkAllImagesLoaded(iframe);
}

export function updateIframeHeight(iframe: HTMLIFrameElement) {
  if (
    iframe.style.height ===
    iframe?.contentWindow?.document?.body?.scrollHeight + 'px'
  ) {
    iframe.style.height =
      (iframe?.contentWindow?.document?.body?.offsetHeight || 0) + 20 + 'px';
  } else {
    iframe.style.height =
      (iframe?.contentWindow?.document?.body?.scrollHeight || 0) + 20 + 'px';
  }
}

export function checkAllImagesLoaded(iframe: HTMLIFrameElement) {
  const document = iframe.contentWindow.document;
  let images = Array.from(document.images);
  let totalImages = images.length;
  let imagesLoaded = 0;

  const onImageLoad = (event: Event) => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      updateIframeHeight(iframe);
      event.target.removeEventListener('load', onImageLoad);
      event.target.removeEventListener('error', onImageLoad);
    }
  };

  images.forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', onImageLoad);
      img.addEventListener('error', onImageLoad);
    } else {
      imagesLoaded++;
    }
  });

  if (imagesLoaded === totalImages) {
    updateIframeHeight(iframe);
  }
}

export function setTranslatedContent(
  languageCode: string,
  isLanguageTranslationDisabled: boolean,
  translatedContent: string,
  originalContent: string
) {
  return languageCode && languageCode !== 'en' && languageCode !== 'und'
    ? isLanguageTranslationDisabled
      ? translatedContent || originalContent
      : translatedContent
    : originalContent;
}

export async function getThumbnailForVideo(videoUrl) {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  video.style.display = 'none';
  canvas.style.display = 'none';

  // Trigger video load
  await new Promise<void>((resolve, reject) => {
    video.addEventListener('loadedmetadata', () => {
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Seek the video to 25%
      video.currentTime = video.duration * 0.25;
    });
    video.addEventListener('seeked', () => resolve());
    video.src = videoUrl;
  });

  // Draw the thumbnail
  canvas
    .getContext('2d')
    .drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  const imageUrl = canvas.toDataURL('image/png');
  if (
    !imageUrl ||
    (!!imageUrl &&
      !imageUrl
        .substring(0, imageUrl.indexOf(',') + 1)
        .startsWith(base64PNGImagePrefix))
  ) {
    return null;
  }
  return imageUrl;
}

export function isRegexValid(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch (error) {
    return false;
  }
}

export async function processFile(
  file: LocalFile,
  fileExtension: string,
  acceptTypeFile: string = ACCEPT_ONLY_SUPPORTED_FILE
) {
  if (acceptTypeFile.includes(fileExtension)) {
    if (
      file.type?.indexOf('video') > -1 &&
      listFileDisplayThumbnail.includes(fileExtension)
    ) {
      const fileUrl = URL.createObjectURL(file);
      file.localThumb = await getThumbnailForVideo(fileUrl);
      file.isSupportedVideo = true;
    } else if (file.type?.indexOf('video') > -1) {
      file.localThumb = 'assets/images/icons/video.svg';
    }
    if (
      file.type?.indexOf('image') > -1 &&
      listPhotoDisplayThumbnail.includes(fileExtension)
    ) {
      file.localThumb = URL.createObjectURL(file);
    }
  }
}

export function isHtmlContent(html: string) {
  return /<html[\s\S]*>/i.test(html);
}

export function mapThreeDotsForMessage(
  message,
  field = 'message',
  disableCursorPointer = false
): string {
  const scriptThreeDots = `<script>
    var isShowTrimContent = false;
    function checkQuoteToReplace() {
      const emailQuote = document.querySelector("div.email-quote") || document.querySelector("div.gmail_quote");
      if (emailQuote) {
        emailQuote.style.whiteSpace = 'normal';
        const btnWrapper = document.createElement("button");
        const btnElement = document.createElement("img");
        const tooltipElement = document.createElement('span');
        tooltipElement.classList.add('tooltip-quote');
        tooltipElement.innerHTML = '${ETooltipQuoteMessage.SHOW_QUOTE}';
        btnWrapper.classList.add("btn-toggle-est");
        btnElement.src ="/assets/icon/show-more-icon.svg";
        btnWrapper.appendChild(btnElement);
        btnWrapper.appendChild(tooltipElement);
        emailQuote?.classList.add("hide");
        emailQuote.parentNode.insertBefore(btnWrapper, emailQuote);
        btnWrapper.addEventListener("click", () => {
          onToggleQuote()
          tooltipElement.innerHTML = isShowTrimContent ? '${ETooltipQuoteMessage.HIDE_QUOTE}' : '${ETooltipQuoteMessage.SHOW_QUOTE}';
        });
        changeHeightIframe();
      }
    }
    checkQuoteToReplace();

    function onToggleQuote() {

      const emailQuoteElement = document.querySelector("div.email-quote");
      if (!emailQuoteElement) return;
      if (emailQuoteElement.classList.contains("hide")) {
        emailQuoteElement?.classList.remove("hide");
        isShowTrimContent = true;
      } else {
        emailQuoteElement?.classList.add("hide");
        isShowTrimContent = false;
      }
      changeHeightIframe();
    };
    function changeHeightIframe() {
      const event = new CustomEvent('eventChangeQuoteSize', { detail: { messageId: "${message.id}"} });
      window.parent.document.dispatchEvent(event);
    }
  </script>`;
  const scriptReplyQuote = `<script>
  function checkReplyBlock() {
    const replyBlock = document.querySelector("div#reply_quote");
    if(replyBlock) {
      replyBlock.classList.add('email-quote')
    }
  }
  checkReplyBlock();
  </script>`;
  const host = window.location.origin;
  let styleContentHtml = `<style>
    @font-face {
      font-family: Inter;
      src: url(${host}/Inter-Regular.woff2) format("woff2"),url(${host}/Inter-Regular.woff) format("woff"),url(${host}/Inter-Regular.ttf) format("truetype");
      font-weight: 400;
      font-style: normal;
      font-display: swap
    }
    .btn-toggle-est {
      cursor: pointer;
      position: relative;
      border-radius: 4px;
      border: none;
      background-color: transparent;
      padding: 0;
      display:flex;
      margin: 20px 0 4px 2px;
    }
    .tooltip-quote::before {
      content: "";
      position: absolute;
      left: 5px;
      z-index: 9999;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(100, 100, 100, 0.8);
      bottom: -6px;;
    }
    .btn-toggle-est .tooltip-quote {
      visibility: hidden;
      width: 148px;
      background-color: rgba(100, 100, 100, 0.8);
      color: #fff;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 16px;
      border-radius: 4px;
      padding: 4px 6px;
      position: absolute;
      z-index: 9999;
      top: -25px;
      font-family: 'Inter';
    }
    .btn-toggle-est:focus-visible{
      outline: none;
      box-shadow: inset 0px 0px 0px 2px #00AA9F, 0px 0px 0px 2px rgba(0, 170, 159, 0.6) !important;
    }
    .btn-toggle-est:hover .tooltip-quote {
      visibility: visible;
      opacity: 1;
    }
    .hide {
      display: none;
    }
    .email-quote {
      margin-top: 4px;
    }
    .gmail_quote.email-quote {
      margin-top: 12px;
    }
    blockquote[type="cite"] {
      margin: 12px 0 0 0;
    }
    #email-signature.email-quote {
      margin-top: 12px;
    }
    body {
      height: fit-content;
    }
    ${
      disableCursorPointer &&
      'a, span, p, img, tbody tr td {pointer-events: none !important;cursor: none !important;} .btn-toggle-est {display: none;}'
    }
    </style></head>`;
  const headTagRegex = /<head>[\s\S]*?<\/head>/gi;
  const regexOutlook = /<div id="appendonsend">[\s\S]*?<\/body>/gi;
  const regexOutlookApp =
    /<hr\b[^>]*>[\s\S]*?<div id="divRplyFwdMsg"[^>]*>[\s\S]*?<\/body>/i;
  const regexGmailQuote = /<div class="gmail_quote">[\s\S]*?<\/body>/gi;
  const regexBlockquote =
    /<blockquote\b[^>]* type="cite"[^>]*>[\s\S]*?<\/blockquote>/gi;

  const regexReplyQuote = /<div\s+id="reply_quote"\s*[^>]*>/;
  const regexMsoQuote =
    /<div\s+style="border:none;\s*border-top:solid\s*#[0-9A-Fa-f]{6}\s*1\.0pt;\s*padding:3\.0pt\s*0cm\s*0cm\s*0cm">\s*/g;

  let textContent = message[field];
  const htmlContent = HTMLParser.parse(textContent);
  const matchHeadTag = textContent?.match(headTagRegex);
  const matchOutlookQuote = textContent?.match(regexOutlook);
  const matchGmailQuote = textContent?.match(regexGmailQuote);
  const matchReplyQuote = textContent?.match(regexReplyQuote); // Case reply
  const matchBlockQuote = textContent?.match(regexBlockquote); // Case icloud
  const matchOutlookQuoteApp = textContent?.match(regexOutlookApp); // Case app outlook
  const matchMsoQuoteApp = textContent?.match(regexMsoQuote); // Case outlook with template Mso
  if (
    (/<!DOCTYPE html>/.test(textContent || '') ||
      textContent?.startsWith('<html')) &&
    (matchOutlookQuote ||
      matchGmailQuote ||
      matchBlockQuote ||
      matchOutlookQuoteApp ||
      matchReplyQuote ||
      matchMsoQuoteApp)
  ) {
    const gmailQuoteBlock = htmlContent.querySelector(
      'div.gmail_quote' +
        ':not(div.gmail_quote div.gmail_quote)' +
        ':not(blockquote[type="cite"] div.gmail_quote)' +
        ':not(div.reply_quote div.gmail_quote)' +
        ':not(div#divRplyFwdMsg div.gmail_quote)'
    );
    const quoteBlockList = htmlContent.querySelectorAll(
      'blockquote[type="cite"]' +
        ':not(blockquote[type="cite"] blockquote[type="cite"])' +
        ':not(div.reply_quote blockquote[type="cite"])' +
        ':not(div#divRplyFwdMsg blockquote[type="cite"])' +
        ':not(div.gmail_quote blockquote[type="cite"])'
    );
    const replyBlock = htmlContent.querySelector(
      'div#reply_quote' +
        ':not(div#reply_quote div#reply_quote)' +
        ':not(blockquote[type="cite"] div#reply_quote)' +
        ':not(div#divRplyFwdMsg div#reply_quote)' +
        ':not(div.gmail_quote div#reply_quote)'
    );
    const outlookAppBlock = htmlContent.querySelector(
      'body > div#divRplyFwdMsg' +
        ':not(div#divRplyFwdMsg div#divRplyFwdMsg)' +
        ':not(div#reply_quote div#divRplyFwdMsg)' +
        ':not(blockquote[type="cite"] div#divRplyFwdMsg)' +
        ':not(div.gmail_quote div#divRplyFwdMsg)'
    );

    const outlookQuoteBlock = htmlContent.querySelector(
      'body > div#appendonsend'
    );

    const divMsoTemplate =
      'div[style*="border:none"][style*="border-top:solid"][style*="padding:3.0pt 0cm 0cm 0cm"]';
    const divMsoQuote = htmlContent.querySelector(
      `div > ${divMsoTemplate}` +
        `:not(div#divRplyFwdMsg ${divMsoTemplate})` +
        `:not(div#reply_quote ${divMsoTemplate})` +
        `:not(blockquote[type="cite"] ${divMsoTemplate})` +
        `:not(div.gmail_quote ${divMsoTemplate})`
    );

    switch (true) {
      case !!divMsoQuote:
        textContent = `${mapMsoQuote(divMsoQuote, htmlContent).replace(
          '</body>',
          `${scriptThreeDots}</body>`
        )}`;
        break;
      case !!matchReplyQuote && !!replyBlock && !outlookAppBlock:
        textContent = `${textContent.replace(
          '</body>',
          `${scriptReplyQuote + scriptThreeDots}</body>`
        )}`;
        break;
      case !!matchBlockQuote && !!quoteBlockList.length && !outlookAppBlock:
        textContent = `${mapAllBlockQuote(textContent, quoteBlockList)?.replace(
          '</body>',
          `${scriptThreeDots}</body>`
        )}`;
        break;
      case !!matchOutlookQuote &&
        (!!outlookQuoteBlock ? true : !outlookAppBlock):
        textContent = `${textContent?.replace(
          regexOutlook,
          `<div class="email-quote">${matchOutlookQuote[0]?.replace(
            '</body>',
            ''
          )}</div>
            ${scriptThreeDots}</body>`
        )}`;
        break;
      case !!matchGmailQuote && !!gmailQuoteBlock && !outlookAppBlock:
        textContent = `${textContent
          ?.replace(
            '<div class="gmail_quote">',
            `<div class="gmail_quote email-quote">`
          )
          ?.replace('</body>', `${scriptThreeDots}</body>`)}`;
        break;
      case !!matchOutlookQuoteApp && !!outlookAppBlock:
        textContent = `${textContent?.replace(
          matchOutlookQuoteApp[0],
          `<div class="email-quote">${matchOutlookQuoteApp[0]?.replace(
            '</body>',
            ''
          )}</div>
            ${scriptThreeDots}</body>`
        )}`;
        break;
      default:
        break;
    }
  }
  textContent = `${textContent?.replace(
    matchHeadTag ? '</head>' : '<body>',
    matchHeadTag ? `${styleContentHtml}` : `<head>${styleContentHtml}<body>`
  )}`;
  return textContent;
}

export function showEmailQuoteHelper(
  elr: ElementRef,
  setIsShowQuote: (value: boolean) => void,
  isShowQuote: boolean
) {
  const emailQuote = elr.nativeElement.querySelector('div.gmail_quote');
  if (emailQuote) {
    const content =
      elr.nativeElement.querySelector('div.text-value')?.children?.[0];
    emailQuote.style.whiteSpace = 'normal';
    emailQuote.classList.add('mt-12');
    const divEmpty = document.createElement('div');
    const btnWrapper = document.createElement('button');
    const tooltipElement = document.createElement('span');
    const btnElement = document.createElement('img');

    btnElement.src = '/assets/icon/show-more-icon.svg';
    btnWrapper.classList.add('btn-toggle-est', 'gmail-quote-button');
    tooltipElement.classList.add('tooltip-quote', 'gmail-quote-tooltip');
    tooltipElement.innerHTML = ETooltipQuoteMessage.SHOW_QUOTE;
    btnWrapper.appendChild(btnElement);
    btnWrapper.appendChild(tooltipElement);

    const clickListener = () => {
      if (emailQuote.classList.contains('hide')) {
        emailQuote.classList.remove('hide');
        setIsShowQuote(false);
      } else {
        emailQuote.classList.add('hide');
        setIsShowQuote(true);
      }
      tooltipElement.innerHTML = isShowQuote
        ? ETooltipQuoteMessage.HIDE_QUOTE
        : ETooltipQuoteMessage.SHOW_QUOTE;
    };

    btnWrapper.addEventListener('click', clickListener);

    content && content.parentNode.insertBefore(divEmpty, content);
    emailQuote.parentNode.insertBefore(btnWrapper, emailQuote);
    emailQuote.classList.add('hide');

    return () => {
      btnWrapper.removeEventListener('click', clickListener);
    };
  }
  return () => {};
}

function mapMsoQuote(
  divMsoQuote: HTMLParser.HTMLElement,
  htmlContent: HTMLParser.HTMLElement
) {
  const divQuote = divMsoQuote?.parentNode;
  if (divQuote) {
    if (divQuote?.classList?.contains('WordSection1')) {
      const newDiv = new HTMLParser.HTMLElement(
        'div',
        { class: 'email-quote' },
        '',
        null,
        null
      );
      const index = divQuote?.childNodes?.indexOf(divMsoQuote);
      if (index >= 0) {
        divQuote?.childNodes?.splice(index, 0, newDiv);
        while (divQuote?.childNodes?.length > index + 1) {
          const nodeToMove = divQuote?.childNodes?.[index + 1];
          newDiv.appendChild(nodeToMove);
        }
      }
    } else {
      divQuote.classList.add('email-quote');
      let nextElement = divQuote.nextElementSibling;
      while (nextElement) {
        divQuote.appendChild(nextElement);
        nextElement = divQuote.nextElementSibling;
      }
    }
  }
  return htmlContent.toString();
}

function mapAllBlockQuote(
  message: string,
  blockQuoteList: HTMLParser.HTMLElement[]
) {
  let textContent = message;
  const parser = new DOMParser();
  const html = parser.parseFromString(textContent, 'text/html');
  const firstBlockQuote = Array.from(html.querySelectorAll('div')).find(
    (div) =>
      div.querySelector('blockquote') &&
      !div.querySelector('blockquote blockquote')
  );
  const divQuote = document.createElement('div');
  divQuote.classList.add('email-quote');
  if (firstBlockQuote) {
    let nextElement = firstBlockQuote.nextElementSibling;
    while (nextElement) {
      divQuote.appendChild(nextElement);
      nextElement = nextElement.nextElementSibling;
    }
    divQuote.prepend(firstBlockQuote);
    if (divQuote.childNodes.length > 0) {
      html?.body?.appendChild(divQuote);
    }
  } else if (blockQuoteList.length) {
    const lastBlockElement = blockQuoteList[blockQuoteList.length - 1];
    const previousLastBlock = lastBlockElement.previousElementSibling;
    textContent = textContent.replace(
      lastBlockElement.outerHTML,
      `<div class="email-quote">${lastBlockElement.outerHTML}</div>`
    );
    if (previousLastBlock && previousLastBlock.rawTagName === 'blockquote') {
      textContent = textContent
        .replace(previousLastBlock.outerHTML, '')
        .replace(
          '<div class="email-quote">',
          `<div class="email-quote">${previousLastBlock.outerHTML}`
        );
    }
    return textContent;
  }
  return html?.documentElement?.innerHTML || '';
}

export function handleIframeImageErrors(iframe) {
  if (!iframe?.contentWindow) return;
  const script = iframe.contentWindow.document.createElement('script');
  script.type = 'text/javascript';
  script.text = `
    function handleIframeImages() {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.onload = function() {
          img.onload = null;
          img.onerror = null;
        };
        img.onerror = function() {
          img.src = '/assets/icon/icon-loading-image.svg';
          img.onerror = null;
          img.onload = null;
        };
      });
    }
    handleIframeImages();
  `;
  iframe.contentWindow.document?.body?.appendChild(script);
}

export function findLastItemMsgTypeTextOrTicket(array) {
  let lastIndex = -1;
  for (let i = array.length - 1; i >= 0; i--) {
    if (
      array[i].messageType === EMessageType.defaultText ||
      array[i].messageType === EMessageType.ticket
    ) {
      lastIndex = i;
      break;
    }
  }

  if (lastIndex !== -1) {
    return array[lastIndex];
  }
}

export function HandleInitAISummaryContent(message: string) {
  const aiSummaryContent = `<div id='ai-summary-content'>${message}</div>`;
  return aiSummaryContent;
}

export function formatNameHasEmail(email) {
  return email.match(/^[^@]+/)?.[0] ?? '';
}

export function handleTemplateTypeTicket(
  type: EOptionType,
  payloadTicket,
  availabilityDateFormat,
  createFrom?,
  customFontSetting?
) {
  let template = '';
  const isAvailable_time = [
    EConversationType.MESSENGER,
    EConversationType.SMS,
    EConversationType.WHATSAPP,
    EConversationType.EMAIL
  ].includes(createFrom);
  switch (type) {
    case EOptionType.FINAL_INSPECTION:
      if (payloadTicket?.available_time) {
        template = generateTemplate(
          'Available date:',
          payloadTicket?.available_time,
          undefined,
          createFrom,
          customFontSetting
        );
      }
      break;
    case EOptionType.RESCHEDULE_INSPECTION_REQUEST:
      const suggestedDate = generateTemplate(
        'Suggested date:',
        availabilityDateFormat,
        undefined,
        createFrom,
        customFontSetting
      );
      const suggestedTime = generateTemplate(
        'Suggested time:',
        isAvailable_time
          ? payloadTicket?.available_time
          : payloadTicket?.time_availability,
        undefined,
        createFrom,
        customFontSetting
      );
      const reason = generateTemplate(
        'Reason:',
        payloadTicket?.reschedule_reason,
        undefined,
        createFrom,
        customFontSetting
      );
      const formatRescheduleTemplate = [
        suggestedDate,
        suggestedTime,
        reason
      ].join('');
      template = formatRescheduleTemplate;
      break;

    case EOptionType.VACATE_REQUEST:
      const type = generateTemplate(
        'Type:',
        payloadTicket?.vacate_type?.[0]?.value,
        undefined,
        createFrom,
        customFontSetting
      );
      const moveOutDate = generateTemplate(
        'Intended move out date:',
        payloadTicket?.move_out_date,
        undefined,
        createFrom,
        customFontSetting
      );
      const note = generateTemplate(
        'Note:',
        payloadTicket?.note,
        undefined,
        createFrom,
        customFontSetting
      );

      const formatVacateTemplate = [type, moveOutDate, note].join('');
      template = formatVacateTemplate;
      break;
    default:
      const defaultTemplate = generateTemplate(
        payloadTicket?.name ? `${payloadTicket?.name}:` : payloadTicket?.name,
        getRequestSummary(payloadTicket),
        undefined,
        createFrom,
        customFontSetting
      );
      template = defaultTemplate;
      break;
  }
  return template;
}

function getRequestSummary(payloadTicket) {
  const summaryFields = [
    'request_summary',
    'maintenance_issue',
    'maintenance_object',
    'general_inquiry',
    'note',
    'reschedule_reason',
    'key_request',
    'pet_request',
    'break_in_incident',
    'key_handover_request',
    'domestic_violence_support',
    'call_back_request',
    'change_tenant_request',
    'ask_property_manager',
    'request_inspection_reschedule',
    'submit_vacate_request',
    'log_maintenance_request',
    'pet_description',
    'key_request_reason',
    'incident_detail',
    'situation',
    'call_back_reason',
    'need_human_follow_up',
    'noted_issues',
    'urgency',
    'change_tenancy_details'
  ];

  for (const field of summaryFields) {
    if (payloadTicket[field]) {
      return payloadTicket[field];
    }
  }
  return undefined;
}

export function generateTemplate(
  label: string,
  value: string,
  lastValue?: boolean,
  createFrom?: EMessageComeFromType,
  customFontSetting?: { fontSize?: string; fontStyle?: string }
): string {
  if (!value) return '';

  const isMobileSource = [
    EMessageComeFromType.MOBILE,
    EMessageComeFromType.SMS,
    EMessageComeFromType.MESSENGER,
    EMessageComeFromType.VOICE_MAIL
  ].includes(createFrom);

  const defaultFontSize = isMobileSource ? '11pt' : '12px';
  const defaultFontFamily = customFontSetting?.fontStyle || '';

  const labelStyle = `font-size: ${
    customFontSetting?.fontSize || defaultFontSize
  }; font-family: ${defaultFontFamily}; font-weight: 600;`;
  const valueStyle = `font-size: ${
    customFontSetting?.fontSize || defaultFontSize
  }; font-family: ${defaultFontFamily}; font-weight: 400; ${
    !isMobileSource
      ? `line-height: 20px; word-break: break-word; white-space: pre-line;`
      : ''
  }`;

  if (!label) {
    return `<p style="${valueStyle}">${value}</p>${lastValue ? '' : '\n'}`;
  }

  const template = `
    <p style="${labelStyle}">${label}
      <span style="${valueStyle}">${value}</span>
    </p>
  `;

  return lastValue ? template : template + '\n';
}

export function handleMapRoleUser(item) {
  let userRole: string;
  const isDeletedOrArchived = (crmStatus: string) => {
    return crmStatus === 'DELETED' || crmStatus === 'ARCHIVED';
  };
  if (item?.userType && item?.userType === EUserPropertyType.OTHER) {
    userRole =
      item.contactType === EUserPropertyType.OTHER
        ? 'other contact'
        : item.contactType?.replace('_', ' ');
  }
  if (
    (item?.userPropertyType || item.userType) &&
    item?.userType !== EUserPropertyType.OTHER
  ) {
    userRole =
      (isDeletedOrArchived(item?.crmStatus) ? item?.crmStatus + ' ' : '') +
      (item?.isPrimary ? 'primary' + ' ' : '') +
      (item?.userPropertyType === EUserPropertyType.LANDLORD
        ? EUserPropertyType.OWNER
        : item?.userPropertyType === EUserPropertyType.LANDLORD_PROSPECT
        ? EUserPropertyType.OWNER + ' ' + 'PROSPECT'
        : item?.userPropertyType?.replace('_', ' ') ||
          item?.userType?.replace('_', ' '));
  }
  return userRole || '';
}

export function formatDateTimeVacate(date: string, dateFormat: string): string {
  try {
    if (date === 'Invalid date' || !date) return date || '';

    return dayjs(date, 'DD/MM/YYYY').format(dateFormat);
  } catch (err) {
    return '';
  }
}

export function formatDateTimeInspection(
  date: string,
  dateformat: string
): string {
  try {
    if (date === 'Invalid date' || !date) return date || '';

    return dayjs(date.split(' ')?.[0].substring(0, 19)).format(
      `dddd ${dateformat}`
    );
  } catch (err) {
    return '';
  }
}

export function displayCapitalizeFirstLetter(string: string) {
  if (!string) return '';
  return string?.charAt(0)?.toUpperCase() + string?.slice(1);
}

let currentCountry: ECountryName;

export function setCurrentCountry(country: ECountryName) {
  currentCountry = country;
}

function formatCancelTime(inputDate) {
  const date = new Date(inputDate);
  let timeStamp = dayjs(inputDate).format('HH:mm');
  const time = convertTime24to12(timeStamp);
  const day = ('0' + date.getDate()).slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();
  const formattedDate =
    currentCountry === ECountryName.AUSTRALIA
      ? `${time}, ${day}/${month}/${year}`
      : `${time}, ${month}/${day}/${year}`;
  return formattedDate;
}

export function cancelledMessage(typeText: string, timeCancel: string) {
  return `${typeText} cancelled at ${formatCancelTime(timeCancel)}`;
}

export function getSummaryMessage(
  message:
    | PreviewConversation
    | IListConversationConfirmProperties
    | UserConversation,
  dateFormat: string,
  isFormatContent: boolean = false,
  isSmsMessage: boolean = false
): string {
  let response;
  try {
    const option = JSON.parse(message?.options || '{}') || {};
    response = option?.response;
  } catch (e) {}

  if (isFormatContent) {
    if (response?.payload?.ticket?.status === EStatusTicket.CANCEL) {
      return cancelledMessage(
        response?.payload?.ticket?.conversationTopic,
        response?.payload?.ticket?.createdAt
      );
    }
  }

  switch (response?.type as EOptionType) {
    case EOptionType.GENERAL_ENQUIRY:
      return displayCapitalizeFirstLetter(
        response?.payload?.ticket?.general_inquiry || ''
      );

    case EOptionType.VACATE_REQUEST:
      const moveOutDate = formatDateTimeVacate(
        response?.payload?.ticket.move_out_date,
        dateFormat
      );
      return `Intended move out date: ${moveOutDate}`;

    case EOptionType.RESCHEDULE_INSPECTION_REQUEST:
      const { availability, available_date } = response?.payload?.ticket || {};
      if (isSmsMessage) {
        const inspectionDate = getSuggestedDateInSms(
          availability,
          available_date,
          dateFormat
        );
        return suggestedDateTitle(inspectionDate);
      }
      const suggestedDate = formatDateTimeInspection(availability, dateFormat);
      return suggestedDateTitle(suggestedDate);

    case EOptionType.MAINTENANCE_REQUEST:
      return displayCapitalizeFirstLetter(
        response?.payload?.ticket?.maintenance_object || ''
      );

    default:
      return (message.textContent || message.message || '').replace(
        /\[(http|https):\/\/[^\[\]]*\]/g,
        ''
      );
  }
}

function suggestedDateTitle(date) {
  return `Suggested date: ${date}`;
}

export function isValidDate(dateString: string): boolean {
  return dayjs(dateString).isValid();
}

export function getSuggestedDateInSms(availability, availableDate, dateFormat) {
  const inspectionDate = isValidDate(availability)
    ? availability
    : availableDate;
  return dayjs(inspectionDate, 'DD/MM/YYYY').format(`dddd ${dateFormat}`);
}

export function combineNames(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function generateLink(link) {
  const baseUrl = `${link.domain}${link.path}`;
  const paramsString = Object.entries(link.params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&');
  const fullUrl = paramsString ? `${baseUrl}?${paramsString}` : baseUrl;
  return fullUrl;
}

export function getPolicyPopoverStyle(
  selectedTextRect: DOMRectReadOnly,
  iframeRect: DOMRectReadOnly,
  wrapperReact?: DOMRectReadOnly
): {
  button: IAddPolicyPopoverStyle;
  popup: IAddPolicyPopoverStyle;
} {
  const finalPosition = {
    top: selectedTextRect.top + (iframeRect?.top || 0),
    left: selectedTextRect.left + (iframeRect?.left || 0),
    bottom: selectedTextRect.bottom + (iframeRect?.top || 0),
    right: selectedTextRect.right + (iframeRect?.left || 0)
  };
  const defaultStyle = {
    top: `${finalPosition.bottom}px`,
    left: `${finalPosition.left}px`,
    bottom: 'unset',
    right: 'unset',
    position: 'absolute'
  };
  const selectPolicyPopupMinWitdh = 500;
  const selectPolicyPopupMinHeight = 500;
  const buttonMinHeight = 50;

  const showLeft =
    window.innerWidth - finalPosition.left < selectPolicyPopupMinWitdh;
  if (showLeft) {
    defaultStyle.right = `${window.innerWidth - finalPosition.right}px`;
    defaultStyle.left = 'unset';
  }

  const getFinalStyle = (minHeight: number) => {
    const overBottom =
      (wrapperReact
        ? wrapperReact.bottom - finalPosition.bottom < minHeight
        : false) ||
      (iframeRect
        ? iframeRect.height - selectedTextRect.bottom < minHeight
        : false) ||
      window.innerHeight - finalPosition.bottom < minHeight;

    const style = { ...defaultStyle };

    if (overBottom) {
      const newTop =
        Math.min(
          iframeRect && !wrapperReact ? iframeRect.bottom : Infinity,
          wrapperReact ? wrapperReact?.bottom : Infinity
        ) - minHeight;

      if (window.innerHeight - newTop < minHeight) {
        style.bottom = `0px`;
        style.top = 'unset';
      } else {
        style.top = `${Math.max(newTop, 0)}px`;
      }
    }

    return style;
  };

  return {
    button: getFinalStyle(buttonMinHeight),
    popup: getFinalStyle(selectPolicyPopupMinHeight)
  };
}

export function composePropertyObject(
  propertiesList: UserPropertyInPeople[],
  originalProperty: Property,
  res
): Property {
  const newProperty = propertiesList.find((item) => item.id === res.propertyId);
  const noProperty = {
    id: res.propertyId,
    isTemporary: true,
    agencyId: res.agencyId,
    companyId: res.companyId,
    ...Object.keys(originalProperty)
      .filter(
        (key) =>
          key !== 'id' &&
          key !== 'isTemporary' &&
          key !== 'agencyId' &&
          key !== 'companyId'
      )
      .reduce((obj, key) => {
        obj[key] = null;
        return obj;
      }, {})
  };

  return (newProperty || noProperty) as Property;
}

export function sortSuggestedProperties(data: {
  suggestedPropertyIds: string[];
  propertiesList: UserPropertyInPeople[];
}): UserPropertyInPeople[] {
  const { suggestedPropertyIds, propertiesList } = data;
  const suggestedProperties = [];
  const nonSuggestedProperties = [];
  propertiesList.forEach((item) => {
    if (suggestedPropertyIds.includes(item.id)) {
      suggestedProperties.push({ ...item, suggested: true });
    } else {
      nonSuggestedProperties.push(item);
    }
  });
  return suggestedProperties.concat(nonSuggestedProperties);
}
