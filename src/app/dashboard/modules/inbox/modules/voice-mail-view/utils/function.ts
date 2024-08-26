import {
  ERequestIcon,
  IRequestItemToDisplayVoiceMail,
  IVoiceMailQueryParams,
  LinkedUnion,
  VoiceMailQueryType
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { EMessageType, GroupType, TaskStatusType } from '@shared/enum';
import {
  EStatusTicket,
  IMessage,
  ITicketResponse
} from '@shared/types/message.interface';
import { EUserPropertyType } from '@trudi-ui';
import dayjs from 'dayjs';
import { toBoolean } from 'ng-zorro-antd/core/util';

export function buildVoiceMailQueryParams(
  ignoreParams: boolean = false,
  isConsoleUser: boolean = false,
  state
): IVoiceMailQueryParams {
  const type = isConsoleUser
    ? TaskStatusType.team_task
    : state.queryParams[VoiceMailQueryType.INBOX_TYPE];

  const status = state.queryParams[VoiceMailQueryType.MESSAGE_STATUS];

  const assignedTo =
    !ignoreParams && type === GroupType.TEAM_TASK
      ? state.selectedAgency ||
        state.queryParams[VoiceMailQueryType.ASSIGNED_TO] ||
        []
      : [];

  const queryMessageStatus =
    state?.selectedStatus?.length > 0
      ? state.selectedStatus
      : state.queryParams[VoiceMailQueryType.MESSAGES_STATUS];
  const messageStatus = Array.isArray(queryMessageStatus)
    ? queryMessageStatus
    : queryMessageStatus
    ? [queryMessageStatus]
    : [];

  const propertyManagerId =
    state?.selectedPortfolio ||
    state.queryParams[VoiceMailQueryType.PROPERTY_MANAGER_ID];

  const currentTaskId = isValidUUID(
    state.queryParams[VoiceMailQueryType.TASK_ID]
  )
    ? state.queryParams[VoiceMailQueryType.TASK_ID]
    : null;

  return {
    type,
    status,
    page: 0,
    limit: 20,
    search: state.queryParams[VoiceMailQueryType.SEARCH] || '',
    currentTaskId,
    assignedTo,
    messageStatus,
    propertyManagerId,
    taskIds: state?.queryParams[VoiceMailQueryType.TASKIDS] || [],
    mailBoxId:
      state.queryParams[VoiceMailQueryType.MAILBOX_ID] ?? state?.mailboxId,
    isLoading: state?.forkLoading ? state?.isLoading : state?.isLoading || true
  };
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function getRequestIcon(type: string) {
  switch (true) {
    case type.toLowerCase().includes('general'):
      return ERequestIcon.GENERAL_ENQUIRY;
    case type.toLowerCase().includes('vacate'):
      return ERequestIcon.VACATE_REQUEST;
    case type.toLowerCase().includes('reschedule'):
      return ERequestIcon.RESCHEDULE_INSPECTION;
    default:
      return ERequestIcon.MAINTENANCE_REQUEST;
  }
}

export function sortItemsByTime(items) {
  return items.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function mapTicketToDisplayItemVoiceMail(
  response: ITicketResponse,
  dateFormat: string,
  additionalData?: {
    checkStatus?: boolean;
    linkedConversations?: LinkedUnion[];
    actionLinkedTaskHistory?: LinkedUnion[];
    replyConversationId?: string;
  }
) {
  const {
    conversationTopic,
    isUrgent,
    status,
    updatedAt,
    maintenance_object,
    general_inquiry,
    reschedule_reason,
    availability,
    available_date,
    time_availability,
    move_out_date,
    vacate_type,
    note,
    ticketTrans,
    ticketLanguageCode
  } = response.payload?.ticket || {};

  const {
    linkedConversations = [],
    replyConversationId,
    checkStatus,
    actionLinkedTaskHistory = []
  } = additionalData || {};

  const showTranslation =
    ticketTrans &&
    ticketLanguageCode &&
    ticketLanguageCode !== 'en' &&
    ticketLanguageCode !== 'und' &&
    (!checkStatus || status !== EStatusTicket.SUBMIT);

  const originalContent =
    maintenance_object || general_inquiry || note || reschedule_reason;

  const translatedContent = showTranslation ? ticketTrans : null;

  const icon = getRequestIcon(response.type);
  const type = response?.type;

  const combinedLinkedData = [
    ...linkedConversations,
    ...actionLinkedTaskHistory
  ];

  const displayItem: IRequestItemToDisplayVoiceMail = {
    title: conversationTopic,
    timestamp: updatedAt,
    replied: !!replyConversationId,
    icon,
    status,
    showTranslation,
    type,
    originalContent,
    translatedContent,
    ticketTrans,
    ticketLanguageCode,
    isUrgent,
    linkedConversations: actionLinkedTaskHistory?.length
      ? sortItemsByTime(combinedLinkedData)
      : linkedConversations
  };
  const INVALID_DATE = 'Invalid date';

  switch (icon) {
    case ERequestIcon.RESCHEDULE_INSPECTION:
      const suggestedDate =
        availability && availability !== INVALID_DATE
          ? availability
          : available_date;
      displayItem.rescheduleInfo = {
        suggestedDate: suggestedDate
          ? formatTime(suggestedDate, `dddd ${dateFormat}`)
          : '',
        suggestedTime: time_availability,
        reason: reschedule_reason
      };
      break;
    case ERequestIcon.VACATE_REQUEST:
      displayItem.vacateInfo = {
        type: vacate_type?.[0]?.value || '',
        intendedDate:
          move_out_date && move_out_date !== 'Invalid date'
            ? dayjs(move_out_date, 'DD/MM/YYYY').format(dateFormat)
            : '',
        note
      };
      break;
  }

  return displayItem;
}

export function isValidMessageForMarkerNewForYou(message: IMessage): boolean {
  return [EMessageType.defaultText, EMessageType.file].includes(
    message.messageType.toUpperCase() as EMessageType
  );
}

function formatTime(date, format) {
  let time = dayjs(date, 'DD/MM/YYYY');

  if (!time.isValid()) {
    time = dayjs(date.split(' ')?.[0].substring(0, 19));
  }
  return time.format(format);
}
