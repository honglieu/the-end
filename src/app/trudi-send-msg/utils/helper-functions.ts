import {
  EPropertyTreeContactType,
  ETypeSend
} from './../../dashboard/modules/task-editor/enums/task-editor.enums';
import { PhotoType } from '@shared/types/task.interface';
import {
  FrequencyRentalTime,
  TrudiResponseVariable
} from '@shared/types/trudi.interface';
import {
  NestedObject,
  ISelectedReceivers,
  TypeWithFields,
  ISendMsgTriggerEvent,
  ISendMsgType,
  MultiSendMsgResponse,
  ISendMsgResponse,
  IDataContactCardVariable,
  UserConversationOption,
  ISendMsgConfigs,
  IFromUserMailBox,
  IEmailMessage,
  IReceiver
} from './trudi-send-msg.interface';
import {
  EPtCrmStatus,
  ERmCrmStatus,
  EUserPropertyType,
  UserTypeEnum
} from '@shared/enum/user.enum';
import {
  IParticipant,
  Participant,
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import {
  CurrentUser,
  IMailBox,
  IPersonalInTab
} from '@shared/types/user.interface';
import {
  EContactType,
  ERentManagerContactType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import dayjs from 'dayjs';
import { uniqBy } from 'lodash-es';
import {
  isLandlordOrTenant,
  isSupplierOrOtherOrExternal
} from '@/app/user/utils/user.type';
import { USER_TYPE } from '@/app/dashboard/utils/constants';
import { EFallback } from './dynamic-parameter';
import { ITimezone } from '@core/time/timezone.helper';
import {
  HIDDEN_QUOTE_ID,
  THREE_DOTS_BUTTON_CLASS
} from '@shared/components/tiny-editor/utils/hiddenQuote';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { displayName } from '@shared/feature/function.feature';
import { trudiInfo } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  IConversationParticipant,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { EContactTypeUserProperty } from '@/app/user/list-property-contact-view/model/main';
import {
  EConversationType,
  EMailBoxStatus,
  EMailBoxType,
  EMessageComeFromType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { REGEX_PARAM_TASK_EDITOR } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';

enum EHighLightVariable {
  UNAVAILABLE = 'unavailable',
  SUPPLIER = 'supplier',
  UNKNOWN = 'unknown',
  NOT_APPLICABLE = 'N/A',
  UNKNOWN_DATE = 'unknown date',
  SOON = 'soon'
}

const highlightVariables = [
  EHighLightVariable.UNAVAILABLE,
  EHighLightVariable.SUPPLIER,
  EHighLightVariable.UNKNOWN,
  `$${EHighLightVariable.UNKNOWN}`,
  EHighLightVariable.UNKNOWN_DATE,
  EHighLightVariable.SOON,
  EHighLightVariable.NOT_APPLICABLE,
  `$${EHighLightVariable.NOT_APPLICABLE}`
] as const;

const DISABLED_DYNAMIC_PARAM_TOOLTIP_CONTENT =
  'To reference this data, please assign a property to this email.';

const DISABLED_DYNAMIC_PARAM_TOOLTIP_CONTENT_SMS =
  'To reference this data, please assign a property to this conversation.';

const DISABLED_DYNAMIC_RECIPIENTS_TOOLTIP_CONTENT =
  'Not available for group message.';

export function replaceVariables(
  variables: Record<string, string> | TrudiResponseVariable,
  rawMsg: string,
  fallBack?: Record<string, string>
) {
  if (variables && Object.keys(variables).length) {
    Object.keys(variables).forEach((variable) => {
      let value = variables[variable];
      if (!value && fallBack && fallBack[variable]) {
        value = fallBack[variable];
      }
      if (!variable) return;
      const reg = new RegExp(variable, 'g');
      rawMsg = rawMsg?.trim().replace(reg, (match) => {
        if (!value || highlightVariables.includes(value)) {
          return `<span class="highlight-variable">${getHighLightVariable(
            match,
            value
          )}</span>`;
        } else {
          return value;
        }
      });
    });
  }
  return rawMsg;
}

function getHighLightVariable(variable, value) {
  if (
    ['{amount}', '{maintenance expenditure limit}'].includes(variable) &&
    !value
  ) {
    return ' the agreed maintenance expenditure limit ';
  } else if (highlightVariables.includes(value)) {
    return `${value}`;
  } else if (
    ['{other fee}', '{advertising fee}', '{break lease fee}'].includes(variable)
  ) {
    return '0';
  } else {
    return '';
  }
}

export function updateConfigs<T extends Record<string, any>>(
  obj: any,
  updatedValues: NestedObject
): T {
  const newObj = { ...obj };

  Object.keys(updatedValues).forEach((key) => {
    const value = updatedValues[key];
    const keys = key.split('.');
    let nestedObj = newObj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in nestedObj)) {
        nestedObj[k] = {};
      }
      nestedObj = nestedObj[k];
    }

    nestedObj[keys[keys.length - 1]] = value;
  });

  return newObj;
}

export function filterReceiversByTypes(
  receivers: ISelectedReceivers[],
  types: string[] = null,
  propertyId: string = null
): ISelectedReceivers[] {
  if (propertyId) {
    // handle action
    return receivers.filter((receiver) => {
      return receiver.propertyId == propertyId;
    });
  } else {
    if (!types) {
      return receivers;
    }
    return receivers.filter((receiver) => {
      return types.includes(receiver?.type);
    });
  }
}

export function filterReceiversByPId(
  peopleList: IPersonalInTab,
  receiverTypes: EContactType[],
  listConversationByTask: UserConversationOption[]
) {
  const tenantTypes = {
    [EPropertyTreeContactType.ALL_ACTIVE_TENANTS]: {
      type: 'tenancies',
      status: EPtCrmStatus.ACTIVE
    },
    [EPropertyTreeContactType.ALL_VACATING_TENANTS]: {
      type: 'tenancies',
      status: EPtCrmStatus.VACATING
    },
    [EPropertyTreeContactType.ALL_VACATED_TENANTS]: {
      type: 'tenancies',
      status: EPtCrmStatus.VACATED
    },
    [EPropertyTreeContactType.ALL_PROSPECTIVE_TENANTS]: {
      type: 'tenancies',
      status: EPtCrmStatus.PROSPECT
    },
    [ERentManagerContactType.ALL_CURRENT_TENANTS]: {
      type: 'tenancies',
      status: ERmCrmStatus.RMCurrent
    },
    [ERentManagerContactType.ALL_FUTURE_TENANTS]: {
      type: 'tenancies',
      status: ERmCrmStatus.RMFuture
    },
    [ERentManagerContactType.ALL_PAST_TENANTS]: {
      type: 'tenancies',
      status: ERmCrmStatus.RMPast
    }
  };

  const landLordTypes = {
    [EPropertyTreeContactType.ALL_ACTIVE_LANDLORDS]: {
      type: 'ownerships',
      status: EPtCrmStatus.ACTIVE
    },
    [ERentManagerContactType.ALL_CURRENT_LANDLORDS]: {
      type: 'ownerships',
      status: ERmCrmStatus.RMCurrent
    },
    [ERentManagerContactType.ALL_FUTURE_LANDLORDS]: {
      type: 'ownerships',
      status: ERmCrmStatus.RMFuture
    },
    [ERentManagerContactType.ALL_PAST_LANDLORDS]: {
      type: 'ownerships',
      status: ERmCrmStatus.RMPast
    }
  };

  const anyTypeLandlord = [EUserPropertyType.LANDLORD];
  const anyTypeTenant = [
    EUserPropertyType.TENANT_UNIT,
    EUserPropertyType.TENANT_PROPERTY,
    EUserPropertyType.TENANT
  ];

  const anyTypes = {
    [ERentManagerContactType.ANY_LANDLORD_IN_TASK]: {
      types: anyTypeLandlord
    },
    [ERentManagerContactType.ANY_TENANT_IN_TASK]: {
      types: anyTypeTenant
    },
    [ERentManagerContactType.ANY_SUPPLIER_IN_TASK]: {
      types: [EUserPropertyType.SUPPLIER]
    },
    [ERentManagerContactType.ANY_LANDLORD_PROSPECT_IN_TASK]: {
      types: [EUserPropertyType.LANDLORD_PROSPECT]
    },
    [ERentManagerContactType.ANY_TENANT_PROSPECT_IN_TASK]: {
      types: [EUserPropertyType.TENANT_PROSPECT]
    }
  };
  const tenantStatusList = receiverTypes
    .map((type) => tenantTypes[type]?.status)
    .filter(Boolean);
  const landLordStatusList = receiverTypes
    .map((type) => landLordTypes[type]?.status)
    .filter(Boolean);
  const anyTypeList = receiverTypes
    .map((type) => anyTypes[type]?.types)
    .filter(Boolean)
    .flat();

  const tenantUserIds =
    [...(peopleList?.tenancies ?? []), ...(peopleList?.parentTenancies ?? [])]
      .filter((item) => tenantStatusList.includes(item.status))
      .flatMap((item) =>
        item.userProperties
          .filter((item) =>
            !!item?.contactType?.type
              ? item.contactType.type?.includes(EContactTypeUserProperty.TENANT)
              : true
          )
          .map((user) => ({
            id: user.user.id,
            propertyId: user.propertyId
          }))
      ) || [];

  const landlordUserIds =
    peopleList?.ownerships
      .filter((item) => landLordStatusList.includes(item.status))
      .flatMap((item) =>
        item.userProperties
          .filter((item) =>
            !!item?.contactType?.type
              ? item.contactType.type?.includes(EContactTypeUserProperty.OWNER)
              : true
          )
          .map((user) => ({
            id: user.user.id,
            propertyId: user.propertyId
          }))
      ) || [];

  const listParticipants = listConversationByTask
    .flatMap((conversation) => conversation.participants)
    .filter((participant) => {
      if (!!participant?.userPropertyContactType?.type) {
        if (
          anyTypeTenant.includes(
            (participant.userPropertyType ||
              participant.type) as EUserPropertyType
          )
        ) {
          return participant?.userPropertyContactType.type.includes(
            EContactTypeUserProperty.TENANT
          );
        }
        if (
          anyTypeLandlord.includes(
            (participant.userPropertyType ||
              participant.type) as EUserPropertyType
          )
        ) {
          return participant?.userPropertyContactType.type.includes(
            EContactTypeUserProperty.OWNER
          );
        }
      }
      return true;
    });

  const anyUserIds = listParticipants
    .filter((participant) =>
      anyTypeList.includes(participant.userPropertyType || participant.type)
    )
    .map((participant) => ({
      id: participant.userId,
      propertyId: [
        EUserPropertyType.SUPPLIER,
        EUserPropertyType.OTHER,
        EUserPropertyType.LANDLORD_PROSPECT
      ].includes(participant.type as EUserPropertyType)
        ? null
        : participant.propertyId
    }));
  const userIds = [
    ...new Set([...tenantUserIds, ...landlordUserIds, ...anyUserIds])
  ];
  return uniqBy(userIds, (data) => JSON.stringify(data));
}
export function filterMediaFilesChecked(mediaFiles: PhotoType[]): PhotoType[] {
  return mediaFiles.filter((file) => file?.checked);
}

export function isCheckedReceiversInList<T>(
  receiver: ISelectedReceivers,
  inputReceiver: TypeWithFields<Partial<T>>,
  field?: keyof TypeWithFields<Partial<T>>
): boolean {
  const isConditionPrefix =
    !(
      receiver.type === EUserPropertyType.TENANT ||
      receiver.type === EUserPropertyType.LANDLORD
    ) || receiver?.propertyId === inputReceiver?.propertyId;
  if (Object.prototype.hasOwnProperty.call(inputReceiver, field)) {
    return inputReceiver[field] === receiver.id && isConditionPrefix;
  }

  return isConditionPrefix;
}

export function checkScheduleMsgCount(
  list: (PreviewConversation | UserConversation)[]
) {
  return list?.some((one) => one.scheduleMessageCount);
}

export function checkScheduleConversationCount(
  conversation: PreviewConversation | UserConversation
) {
  return conversation?.scheduleMessageCount;
}

export function getConversationIdsFromEvent(
  event: ISendMsgTriggerEvent
): string[] {
  switch (event?.type) {
    case ISendMsgType.V3_AND_BULK:
      return Array.from(
        new Set<string>(
          (event?.data as MultiSendMsgResponse[])
            .flatMap((item) => item.data)
            .map((message) => message?.conversationId)
        )
      );
    case ISendMsgType.V3:
    case ISendMsgType.BULK:
      return Array.from(
        new Set<string>(
          (event?.data as ISendMsgResponse[])?.map(
            (message) => message?.conversationId
          )
        )
      );
    default:
      return [];
  }
}

export function getValuesForContactCardVariables(
  data: IDataContactCardVariable[]
) {
  const fieldValues = {
    name: [],
    address: [],
    emailAddress: [],
    phoneNumber: []
  };

  const informationArray = [];

  data.forEach((item) => {
    fieldValues.name.push(item.name);
    fieldValues.address.push(item.address);
    fieldValues.emailAddress.push(item.emailAddress);
    fieldValues.phoneNumber.push(item.phoneNumber);
    informationArray.push(
      `${item.name} - ${item.address} - ${item.emailAddress} - ${item.phoneNumber}`
    );
  });

  return {
    name: fieldValues.name.join('; '),
    address: fieldValues.address.join('; '),
    emailAddress: fieldValues.emailAddress.join('; '),
    phoneNumber: fieldValues.phoneNumber.join('; '),
    information: informationArray.join('; ')
  };
}

export function mapWorkingHoursTimeLabel(
  regionWorkingHours,
  tz?: ITimezone
): string[] {
  if (!regionWorkingHours) return [];
  const _regionWorkingHours = regionWorkingHours.map((item) => {
    return {
      ...item,
      label: item.dayInWeek.slice(0, 3),
      startTime12: formatTime(item.startTime),
      endTime12: formatTime(item.endTime)
    };
  });

  const times = _regionWorkingHours
    .filter((item) => item.isEnable)
    .map((item) => ({
      dayInWeek: item.dayInWeek,
      time: mapTextTimeLabelWithAbbrev(
        item.startTime12 + ' - ' + item.endTime12,
        tz
      )
    }));

  const groups = times.reduce((groups, item) => {
    const group = groups[item.time] || [];
    group.push(item);
    groups[item.time] = group;
    return groups;
  }, {});

  const timeLabel = [];

  for (const key in groups) {
    let days = '';
    groups[key].forEach((element, index) => {
      if (index === groups[key] - 1) return;
      let space = '';
      if (groups[key].length - 1 > index) space = ' - ';
      const string = element?.dayInWeek?.slice(0, 3)?.toLocaleLowerCase();
      days += string?.charAt(0)?.toUpperCase() + string?.slice(1) + space;
    });

    timeLabel.push(days + ': ' + key + ';');
  }

  return timeLabel;
}

export function mapWorkingHoursLabel(
  regionWorkingHours,
  tz?: ITimezone
): string {
  const result = mapWorkingHoursTimeLabel(regionWorkingHours, tz);
  if (!result.length) return null;
  return result.join(' ').replace(/;$/, '');
}

export function mapTextTimeLabelWithAbbrev(
  text: string,
  tz: ITimezone
): string {
  return `${text} ${tz?.abbrev ? `(${tz.abbrev})` : ''}`;
}

export function formatTime(timeString) {
  const [hourString, minute] = timeString.split(':');
  const hour = +hourString % 24;
  return (hour % 12 || 12) + ':' + minute + (hour < 12 ? ' am' : ' pm');
}

export function roundToNearestInterval(userTime) {
  const inputTime = dayjs(userTime, 'h:mm a');
  const roundedMinute = Math.ceil(inputTime.minute() / 15) * 15;
  const roundedTime = inputTime.minute(roundedMinute).format('h:mm a');
  return roundedTime;
}

export function formatFrequencyName(name: string) {
  if (!name) return '';
  if (name === FrequencyRentalTime.FORNIGHT) return 'Fortnightly';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function formatTimes(time) {
  const timeToFormat = time;
  let startTime = timeToFormat.startTime;
  let endTime = timeToFormat.endTime;

  if (Number.isInteger(startTime)) {
    startTime = new Date(startTime * 1000).toISOString().substring(11, 16);
  } else {
    startTime = convertTime12to24(startTime);
  }
  if (Number.isInteger(endTime)) {
    endTime = new Date(endTime * 1000).toISOString().substring(11, 16);
  } else {
    endTime = convertTime12to24(endTime);
  }

  timeToFormat.startTime = startTime;
  timeToFormat.endTime = endTime;
  return timeToFormat;
}

export function convertTime12to24(time12h) {
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
}

export function convertTime24to12(value: string): string {
  if (!value) return '';

  const timeParts = value.split(':');
  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12 || 12;

  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Converts the user role based on the provided user type and, if applicable, contact type.
 *
 * If the user type is OTHER, the return value depends on the provided contact type.
 * If the user type is TENANT, LANDLORD, or SUPPLIER, the return value is based on the user type.
 *
 * @param userType - The type of user (e.g., TENANT, LANDLORD, OTHER).
 * @param contactType - Optional parameter for OTHER user type, specifying the contact type.
 * @returns The converted user role or a fallback value if the conversion is not possible.
 */
export function convertUserRole(
  userType: EUserPropertyType,
  contactType = null
) {
  if (!isLandlordOrTenant(userType) && !isSupplierOrOtherOrExternal(userType))
    return EFallback.UNKNOWN;
  if (userType === EUserPropertyType.OTHER) {
    return contactType
      ? capitalizeFirstLetter(contactType.replace('_', ' '))
      : EFallback.UNKNOWN;
  }
  return capitalizeFirstLetter(USER_TYPE[userType] || userType);
}

function capitalizeFirstLetter(value: string): string {
  if (value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
  return value;
}

export function handleDisabledDynamicParamsByProperty(
  listDynamicParams,
  propertyData,
  listSubscription,
  conversationType?
) {
  let commonDynamicOptions = ['Property', 'Tenant', 'Tenancy', 'Landlord'];
  let companyAccountOptions = [
    'company_account_name',
    'company_BSB',
    'company_account_number'
  ];

  const tooltipTitleByConversation =
    conversationType && conversationType === EConversationType.SMS
      ? DISABLED_DYNAMIC_PARAM_TOOLTIP_CONTENT_SMS
      : DISABLED_DYNAMIC_PARAM_TOOLTIP_CONTENT;

  listDynamicParams.forEach((item) => {
    if (commonDynamicOptions.includes(item.title)) {
      item['disabled'] = !propertyData;
      item['tooltip'] = item['disabled'] ? tooltipTitleByConversation : '';
    }
    if (item.title === 'Company') {
      item['menu'].forEach((element) => {
        if (
          companyAccountOptions.includes(element.param) &&
          listSubscription?.length > 1
        ) {
          element['disabled'] = !propertyData;
          element['tooltip'] = element['disabled']
            ? tooltipTitleByConversation
            : '';
        }
      });
    }
  });
  return listDynamicParams;
}

export function handleDisabledDynamicParamsByReceiver(
  listDynamicParams,
  receiversData,
  createMessageFrom: ECreateMessageFrom
) {
  const recipientParam = listDynamicParams.find((p) => p.title === 'Recipient');
  if (!recipientParam) return;
  switch (createMessageFrom) {
    case ECreateMessageFrom.MULTI_MESSAGES:
      const enableRecipientOption = receiversData.some(
        (receiver) => receiver.participants?.length === 1
      );
      recipientParam['disabled'] = !enableRecipientOption;
      recipientParam['tooltip'] = !enableRecipientOption
        ? DISABLED_DYNAMIC_RECIPIENTS_TOOLTIP_CONTENT
        : '';
      break;
    default:
  }
  return listDynamicParams;
}

export function checkExistConversation(
  configs: ISendMsgConfigs,
  listConversation: UserConversationOption[],
  receiver: ISelectedReceivers
) {
  const inputReceiver = configs?.body?.prefillReceiversList?.find((ir) =>
    isCheckedReceiversInList(receiver, ir, 'id')
  );
  const conversation = listConversation.find((c) =>
    isCheckedReceiversInList(receiver, c, 'userId')
  );
  return { inputReceiver, conversation };
}

export function getUniqReceiverData<T extends ISelectedReceivers>(
  receiverData: T[]
) {
  return uniqBy(receiverData, (item) => {
    return (
      (item?.id || item?.userId || '') +
      '_' +
      (item.propertyId || '') +
      '_' +
      (item.secondaryEmail?.id || item.secondaryEmailId || '')
    );
  });
}

export const extractQuoteAndMessage = (
  content: string = '',
  isFormatBody: boolean = false
): { msgContent: string; quote: string; button: string } => {
  try {
    const dom = document.createElement('div');
    dom.innerHTML = content;
    //Remove button threedots;
    const button = dom.querySelector(`.${THREE_DOTS_BUTTON_CLASS}`);
    //Remove display none for quote wrapper;
    const buttonContent = button?.outerHTML || '';
    button?.remove();
    const wrapper = dom.querySelector(`#${HIDDEN_QUOTE_ID}`) as HTMLElement;
    if (!!wrapper) {
      wrapper.style.display = '';
      if (isFormatBody) wrapper.classList.remove('quote-wrapper__hidden');
    }
    const quote = wrapper?.outerHTML || '';
    wrapper?.remove();
    const msgContent = dom.innerHTML || '';
    return { msgContent, quote, button: buttonContent };
  } catch (error) {
    console.error(error);
    return { msgContent: content, quote: '', button: '' };
  }
};

export const concatQuoteAndMessage = (content: string, quote: string) => {
  if (!quote || !quote?.length) return content;
  return `${content}<p></p>${quote}`;
};

export function getUserFromParticipants<T extends IParticipant | Participant>(
  participants: T[] = [],
  types: UserTypeEnum[] = [
    UserTypeEnum.LEAD,
    UserTypeEnum.AGENT,
    UserTypeEnum.MAILBOX
  ]
) {
  return participants.filter(
    (participant) => !types.includes(participant.type as UserTypeEnum)
  );
}

export function mapReceiverConversation(
  receivers: ISelectedReceivers[],
  conversations: UserConversationOption[]
): ISelectedReceivers[] {
  return receivers.map((receiver) => {
    const conversation = conversations.find(
      (c) =>
        isCheckedReceiversInList(receiver, c, 'userId') &&
        getUserFromParticipants(c.participants)?.length === 1
    );
    if (!conversation) return receiver;
    return {
      ...receiver,
      participants: getUserFromParticipants(conversation.participants)
    };
  });
}

export function getListSenderMailBox(
  configs: ISendMsgConfigs,
  userDetail: CurrentUser,
  listMailBox: IMailBox[] = [],
  currentMailBoxId?: string
): IFromUserMailBox[] {
  if (!listMailBox?.length) return [];
  const definedMailboxId = configs?.otherConfigs?.filterSenderForReply
    ? currentMailBoxId
    : null;
  const sendFromUsers = [
    {
      id: userDetail.id,
      name: displayName(userDetail.firstName, userDetail.lastName),
      firstName: userDetail.firstName,
      lastName: userDetail.lastName,
      avatar: userDetail.googleAvatar,
      title: userDetail.title
    },
    ...trudiInfo
  ];

  const senderList: IFromUserMailBox[] = listMailBox.reduce((prev, curr) => {
    //Filter for reply message in task
    if (
      configs?.otherConfigs?.filterSenderForReplyInTask &&
      configs?.otherConfigs?.replyMessageInTask?.length &&
      !configs?.otherConfigs?.replyMessageInTask?.includes(curr?.emailAddress)
    ) {
      return prev;
    }
    //Filter out other mailbox if not send scratch (to message or to task)
    if (curr.id !== definedMailboxId && !!definedMailboxId) return prev;
    const mapUser = sendFromUsers.map((user) => ({
      ...user,
      status: curr.status,
      mailBoxName: curr.name,
      mailBoxAddress: curr.emailAddress,
      type: curr.type,
      mailBoxId: curr.id
    }));
    const newList = [...prev, ...mapUser];
    return newList;
  }, []);
  return senderList;
}
function escapeDollarSigns(str: string) {
  return str.replace(/\$/g, '$$$$');
}
export const replaceMessageTitle = (
  string: string,
  currTask: ITasksForPrefillDynamicData
) =>
  string
    .replace(
      /\{task_name\}/g,
      escapeDollarSigns(currTask?.taskName || EFallback.UNKNOWN)
    )
    .replace(
      /\{task_title\}/g,
      escapeDollarSigns(currTask?.taskTitle || EFallback.UNKNOWN)
    )
    .replace(
      /\{short_property_address\}/g,
      currTask?.property?.shortenStreetLine || EFallback.UNKNOWN
    );

export function replaceDynamicEmailMessageTitle(
  emailMessage: IEmailMessage,
  selectedTasks: ITasksForPrefillDynamicData[]
): IEmailMessage {
  const currTask = selectedTasks.find(
    (one) => one.taskId === emailMessage.taskId
  );
  if (!currTask) return emailMessage;

  return {
    ...emailMessage,
    title: replaceMessageTitle(emailMessage.title, currTask)
  };
}

export function getCalendarEventFromSelectedTasks(
  selectedTasks: ITasksForPrefillDynamicData[]
) {
  return selectedTasks?.flatMap((task) => task?.['calendarEvents'])?.length
    ? selectedTasks?.flatMap((task) => task?.['calendarEvents'])
    : selectedTasks?.map((task) => ({
        ...task?.['componentType'],
        taskId: task?.taskId
      }));
}

export function getCalendarEventData(
  selectedTasks: ITasksForPrefillDynamicData[],
  taskId: string
) {
  const calendarEvent = getCalendarEventFromSelectedTasks(
    selectedTasks
  )?.filter((event) => Boolean(event));
  return (
    (taskId
      ? calendarEvent?.filter((event) => event?.['taskId'] === taskId)
      : calendarEvent) || []
  );
}

export function mapUserId<T extends Partial<IParticipant> | Partial<IReceiver>>(
  users: T[]
) {
  return (users || []).map((user) => ({ ...user, id: user.userId }));
}

export function getServiceDataFromConfig(configs: ISendMsgConfigs) {
  const { conversationService, taskService, trudiService } =
    configs?.serviceData || {};
  const currentTask = taskService?.currentTask;
  const propertyId = currentTask?.property?.isTemporary
    ? null
    : currentTask?.property?.id;
  const { id, agencyId } = taskService?.currentTask || {};
  const categoryId = trudiService?.trudiResponse?.setting?.categoryId;
  const propertyType = conversationService?.currentConversation?.propertyType;
  const taskType = taskService?.currentTask?.taskType;
  const conversationId = conversationService?.currentConversation?.id;
  return {
    propertyId,
    taskId: id,
    categoryId,
    agencyId,
    propertyType,
    taskType,
    conversationId
  };
}

export function removePTagTemplate(content) {
  if (
    !content?.startsWith(
      '<p style="white-space: pre-wrap; font-weight: 400; color: #3D3D3D; font-size: 14px; line-height: 20px;">'
    ) &&
    !content?.startsWith(
      "<p style='white-space: pre-wrap; font-weight: 400; color: #3D3D3D; font-size: 14px; line-height: 20px;'>"
    )
  ) {
    return content;
  }
  const dom = document.createElement('div');
  dom.innerHTML = content;
  const pTag = dom.querySelector(
    'p[style="white-space: pre-wrap; font-weight: 400; color: #3D3D3D; font-size: 14px; line-height: 20px;"]'
  );
  if (pTag) {
    pTag.outerHTML = pTag.innerHTML;
  }
  return pTag ? dom.innerHTML : content;
}

export function getListActiveMailBox(listMailBox: IMailBox[]) {
  if (!listMailBox) return [];
  return listMailBox.filter(
    (item) =>
      item.status !== EMailBoxStatus.ARCHIVE &&
      item.status !== EMailBoxStatus.DISCONNECT
  );
}

export function isMailboxCompany(mailbox) {
  return mailbox.type === EMailBoxType.COMPANY;
}

export function getDefaultTaskDetailMailBox(
  listMailBox: IFromUserMailBox[],
  configs: ISendMsgConfigs
) {
  const firstMailBox = listMailBox?.[0];
  const companyMailbox = listMailBox.find((mailbox) =>
    isMailboxCompany(mailbox)
  );
  if (configs?.body.prefillSender) {
    const replyMailBox = listMailBox.find(
      (sender) => sender.id === configs.body.prefillSender
    );
    return replyMailBox;
  }
  return companyMailbox || firstMailBox;
}

function generateInvalidDynamicRegex(dynamic: string) {
  const escapedString = dynamic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = `<span\\sstyle="color:\\svar\\(--danger-500, #fa3939\\);"[^\>]*>${escapedString}<\\/span>`;
  const regex = new RegExp(regexPattern, 'gim');
  return regex;
}

export function getDynamicParamListFromMsg(msgContent: string) {
  return (msgContent.match(REGEX_PARAM_TASK_EDITOR) || []).filter((dynamic) => {
    const invalidParamRegex = generateInvalidDynamicRegex(dynamic);
    const validParam = `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${dynamic}</span>`;
    return (
      !!msgContent.match(invalidParamRegex) || msgContent.includes(validParam)
    );
  });
}

export function findConversationLink({
  receiver,
  task,
  senderMailboxId,
  listConversations,
  createMessageFrom,
  propertyId
}: {
  receiver: ISelectedReceivers;
  task: ITasksForPrefillDynamicData;
  senderMailboxId: string;
  listConversations: UserConversation[] | PreviewConversation[];
  createMessageFrom: ECreateMessageFrom;
  propertyId: string;
}) {
  const mapSortStatusConversation = {
    [EConversationType.open]: 0,
    [EConversationType.resolved]: 1,
    [EConversationType.deleted]: 2
  };

  const comparator = (
    receiver: ISelectedReceivers,
    participant: IConversationParticipant
  ) => {
    const isUnidentified = receiver.type === EUserPropertyType.UNIDENTIFIED;
    const userId = participant?.user?.id || participant?.userId;
    const email = participant?.user?.email || participant?.email;
    const type = participant?.user?.type || participant?.type;
    const receiverPropertyId =
      receiver.actualPropertyId || receiver.propertyId || null;
    return isUnidentified
      ? email === receiver?.email && !type
      : userId === receiver.id && participant.propertyId === receiverPropertyId;
  };

  let conversationLink = (task?.conversations || listConversations)
    ?.filter((e) => e?.status !== TaskStatusType.draft)
    ?.sort(
      (a, b) =>
        mapSortStatusConversation?.[a?.status] -
        mapSortStatusConversation?.[b?.status]
    )
    ?.find((conversation) => {
      const conditionParticipant = conversation?.participants?.some(
        (participant) =>
          createMessageFrom === ECreateMessageFrom.MULTI_TASKS
            ? participant.user?.id === receiver.id &&
              participant.propertyId === receiver.propertyId
            : comparator(receiver, participant)
      );
      const conversationLength =
        conversation?.participants?.filter(
          (e: IConversationParticipant) =>
            (e?.user?.type || e.type) !== UserTypeEnum.MAILBOX &&
            (e?.user?.type || e.type) !== UserTypeEnum.LEAD
        ).length === 1;
      return (
        conditionParticipant &&
        conversation.conversationType === EMessageComeFromType.EMAIL &&
        conversation?.mailBoxId === senderMailboxId &&
        (!propertyId || conversation?.['propertyId'] === propertyId) &&
        conversationLength
      );
    });

  return conversationLink || null;
}

export function getPrefillMsgTitle(
  configs: ISendMsgConfigs,
  msgTitle: string = null
) {
  const prefillMsgTitle = msgTitle || configs?.body?.prefillTitle;
  const maxCharacter = configs?.body?.title?.maxCharacter;
  if (prefillMsgTitle?.length > maxCharacter) {
    return `${prefillMsgTitle.slice(0, maxCharacter - 3)}...`;
  } else {
    return prefillMsgTitle;
  }
}

export function getIsSendBulk(config) {
  const typeSend =
    (config?.trudiButton as TrudiStep)?.fields.typeSend ||
    config?.inputs?.prefillData?.fields?.typeSend;
  const bulkSendFlows = [
    ECreateMessageFrom.CALENDAR,
    ECreateMessageFrom.CONTACT,
    ECreateMessageFrom.MULTI_TASKS,
    ECreateMessageFrom.MULTI_MESSAGES
  ];
  const isTaskStepSingleEmailSendType = typeSend === ETypeSend.SINGLE_EMAIL;
  const isBulkSendFlows =
    bulkSendFlows.includes(
      config?.otherConfigs?.createMessageFrom as ECreateMessageFrom
    ) ||
    (config?.otherConfigs?.createMessageFrom === ECreateMessageFrom.TASK_STEP &&
      !isTaskStepSingleEmailSendType);
  return isBulkSendFlows;
}

export function isCreateMessageOutOfTask(config) {
  const taskFlows = [
    ECreateMessageFrom.TASK_HEADER,
    ECreateMessageFrom.TASK_STEP,
    ECreateMessageFrom.MULTI_TASKS
  ];
  const taskTypes = [TaskType.TASK];

  const createFrom = config.otherConfigs.createMessageFrom;
  const type = config?.serviceData?.taskService?.currentTask?.taskType;
  return !taskFlows.includes(createFrom) && !taskTypes.includes(type);
}
