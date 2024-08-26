import { CONVERSATION_STATUS } from '@services/constants';
import { EPlatform } from '@shared/enum/trudi';
import { Agency } from '@shared/types/agency.interface';
import dayjs from 'dayjs';
import {
  GroupItemByDatePeriod,
  ItemWithOriginIndex
} from '@shared/types/groupItemByDatePeriod';
import { convertUTCToLocalDateTime } from '@core/time/timezone.helper';
import { get } from 'lodash-es';

export enum EBehaviorScroll {
  SMOOTH = 'smooth',
  AUTO = 'auto'
}

export enum EScrollBlock {
  START = 'start',
  CENTER = 'center',
  END = 'end'
}

export const sortSelectOptionsBySelected = (
  options: any[],
  selectedOptions: string[]
) => {
  return options.sort(function (a, b) {
    if (selectedOptions.includes(a.id)) {
      return -1;
    } else if (selectedOptions.includes(b.id)) {
      return 1;
    }
    return 1;
  });
};

export const scrollSelectedIntoView = (position?: EScrollBlock) => {
  const dropdown = document.querySelector('.custom-dropdown-scroll-to-view');
  if (dropdown) {
    const selectedOption = dropdown.querySelector('.ng-option-marked');
    if (dropdown && selectedOption) {
      selectedOption.scrollIntoView({
        behavior: EBehaviorScroll.AUTO,
        block: position || EScrollBlock.START
      });
    }
  } else {
    const selectedOption =
      document.querySelector('.ng-option-marked') ||
      document.querySelector('.ng-selected');
    if (selectedOption) {
      selectedOption.scrollIntoView({
        behavior: EBehaviorScroll.AUTO,
        block: position || EScrollBlock.START
      });
    }
  }
};

export function formatConversationsSendMessage(data) {
  const uniqueKeys: Record<string, boolean> = {};
  if (!data.length) return;
  return data
    .map((item) => {
      if (
        typeof item?.['conversation'] === 'object' &&
        Object.keys(item?.['conversation']).length > 0 &&
        item?.messageType == CONVERSATION_STATUS.RESOLVED
      ) {
        const conversation = item['conversation'];
        const key = `${conversation?.id}_${conversation?.propertyId}`;
        if (!uniqueKeys[key]) {
          uniqueKeys[key] = true;
          return {
            ...item,
            conversations: {
              ...item['conversation'],
              textContent: item.textContent,
              lastName: item.conversation?.userConversation?.lastName,
              firstName: item.conversation?.userConversation?.firstName,
              email: item.conversation?.userConversation?.email,
              contactType: item.conversation?.userConversation?.contactType,
              phoneNumber: item.conversation?.userConversation?.phoneNumber,
              propertyType: item.conversation.startMessageBy
            }
          };
        }
      }
      if (
        typeof item?.['conversations'] === 'object' &&
        Object.keys(item?.['conversations']).length > 0 &&
        item?.messageType == CONVERSATION_STATUS.RESOLVED
      ) {
        const conversation = item['conversations'];
        const key = `${conversation?.id}_${conversation?.propertyId}`;
        if (!uniqueKeys[key]) {
          uniqueKeys[key] = true;
          return {
            ...item,
            conversations: {
              ...item['conversations'],
              textContent: item.textContent,
              lastName: item.conversations?.userConversation?.lastName,
              firstName: item.conversations?.userConversation?.firstName,
              email: item.conversations?.userConversation?.email,
              contactType: item.conversations?.userConversation?.contactType,
              phoneNumber: item.conversations?.userConversation?.phoneNumber,
              propertyType: item.conversations.startMessageBy
            }
          };
        }
      }
      return null;
    })
    .filter(Boolean);
}

export function getOS(): EPlatform {
  const userAgent = window.navigator.userAgent.toLowerCase(),
    macosPlatforms = /(macintosh|macintel|macppc|mac68k|macos)/i,
    windowsPlatforms = /(win32|win64|windows|wince)/i,
    iosPlatforms = /(iphone|ipad|ipod)/i;
  let os: EPlatform = null;
  if (macosPlatforms.test(userAgent)) {
    os = EPlatform.MACOS;
  } else if (iosPlatforms.test(userAgent)) {
    os = EPlatform.IOS;
  } else if (windowsPlatforms.test(userAgent)) {
    os = EPlatform.WINDOWS;
  } else if (/android/.test(userAgent)) {
    os = EPlatform.ANDROID;
  } else if (!os && /linux/.test(userAgent)) {
    os = EPlatform.LINUX;
  }

  return os;
}

export function sortAgenciesFn(a: Agency, b: Agency): number {
  if (a.name > b.name) {
    return 1;
  } else if (a.name < b.name) {
    return -1;
  }
  return 0;
}

/**
 * Calculates the rough size of an object in bytes.
 * @param object - The object to calculate the size of.
 * @returns The rough size of the object in bytes.
 */
export function roughSizeOfObject(object: unknown) {
  const objectList = [];
  const stack = [object];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    switch (typeof value) {
      case 'boolean':
        bytes += 4;
        break;
      case 'string':
        bytes += value.length * 2;
        break;
      case 'number':
        bytes += 8;
        break;
      case 'object':
        if (!objectList.includes(value)) {
          objectList.push(value);
          for (const prop in value) {
            if (value.hasOwnProperty(prop)) {
              stack.push(value[prop]);
            }
          }
        }
        break;
    }
  }

  return bytes;
}

/**
 *
 * @param listItems List items want to group
 * @param groupField Field name want to group list items by
 * @param totalItems The total number of items to identify whether the list is full or not. To allow toggle expand/collapse for the last group.
 * @param timeZone The agency time zone to convert date to keep the consistent
 * @returns
 */
export function groupListItemsByDatePeriod<T>(
  listItems: T[],
  groupField: keyof T,
  totalItems: number,
  timeZone: string
): GroupItemByDatePeriod<T>[] {
  if (!listItems?.length && !totalItems) return [];
  const today = dayjs(convertUTCToLocalDateTime(new Date(), timeZone));
  const yesterday = today.clone().subtract(1, 'day');
  const prevMonth = today.clone().subtract(1, 'month');
  const beforePrevMonth = today.clone().subtract(2, 'month');
  const groupBy: Record<string, ItemWithOriginIndex<T>[]> = {
    Today: [],
    Yesterday: [],
    'Earlier this week': [],
    'Earlier this month': []
  };
  let groupLabel = '';
  listItems.forEach((item, index) => {
    const dateField = get(item, groupField, '');
    if (dateField) {
      let dateByItem = dayjs(dateField);
      if (dateByItem.isSame(today, 'day')) {
        groupLabel = 'Today';
      } else if (dateByItem.isSame(yesterday, 'day')) {
        groupLabel = 'Yesterday';
      } else if (dateByItem.isSame(today, 'week')) {
        groupLabel = 'Earlier this week';
      } else if (dateByItem.isSame(today, 'month')) {
        groupLabel = 'Earlier this month';
      } else if (dateByItem.isSame(prevMonth, 'month')) {
        groupLabel = prevMonth.format('MMMM');
      } else if (dateByItem.isSame(beforePrevMonth, 'month')) {
        groupLabel = beforePrevMonth.format('MMMM');
      } else {
        groupLabel = 'Older';
      }

      if (groupBy[groupLabel]) {
        groupBy[groupLabel].push({ ...item, originIndex: index });
      } else {
        groupBy[groupLabel] = [{ ...item, originIndex: index }];
      }
    }
  });

  //Return to array items instead of Record object to easy use in the UI
  const result: GroupItemByDatePeriod<T>[] = [];
  const objKeys = Object.keys(groupBy).filter((key) => groupBy[key].length > 0);
  objKeys.forEach((key, i) => {
    result.push({
      groupName: key,
      items: groupBy[key],
      allowCollapse:
        i !== objKeys.length - 1 ||
        (i === objKeys.length - 1 && listItems.length >= totalItems)
    });
  });

  return result;
}

export function isScrolledIntoView(
  el: HTMLElement,
  additionHeight: number = 0
) {
  const rect = el?.getBoundingClientRect();
  if (!rect) return false;
  return (
    rect.top - additionHeight >= el.clientHeight &&
    rect.bottom <= window.innerHeight
  );
}

export function truncateSentence(sentence: string, maxLength: number) {
  if (sentence.length <= maxLength) {
    return sentence;
  }

  const truncated = sentence.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex === -1) {
    return truncated;
  }

  return truncated.slice(0, lastSpaceIndex);
}
