import {
  EMessageType,
  EOptionType,
  EUserPropertyType,
  GroupType,
  TaskStatusType
} from '@shared/enum';
import {
  EStatusTicket,
  ITicketResponse
} from '@shared/types/message.interface';
import dayjs from 'dayjs';
import { toBoolean } from 'ng-zorro-antd/core/util';
import {
  IFacebookQueryParams,
  FacebookQueryType,
  ERequestIcon,
  IRequestItemToDisplay,
  IFacebookMessage,
  LinkedUnion,
  ImageFileMetadata
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { isValidDate } from '@/app/shared/feature';
import { sortItemsByTime } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/utils/function';

export function buildFacebookQueryParams(
  ignoreParams: boolean = false,
  isConsoleUser: boolean = false,
  state
): IFacebookQueryParams {
  const type = isConsoleUser
    ? TaskStatusType.team_task
    : state.queryParams[FacebookQueryType.INBOX_TYPE];

  const status = state.queryParams[FacebookQueryType.MESSAGE_STATUS];

  const assignedTo =
    !ignoreParams && type === GroupType.TEAM_TASK
      ? state.selectedAgency ||
        state.queryParams[FacebookQueryType.ASSIGNED_TO] ||
        []
      : [];

  const queryMessageStatus =
    state?.selectedStatus?.length > 0
      ? state.selectedStatus
      : state.queryParams[FacebookQueryType.MESSAGES_STATUS];
  const messageStatus = Array.isArray(queryMessageStatus)
    ? queryMessageStatus
    : queryMessageStatus
    ? [queryMessageStatus]
    : [];

  const propertyManagerId =
    state?.selectedPortfolio ||
    state.queryParams[FacebookQueryType.PROPERTY_MANAGER_ID];

  const currentTaskId = isValidUUID(
    state.queryParams[FacebookQueryType.TASK_ID]
  )
    ? state.queryParams[FacebookQueryType.TASK_ID]
    : null;

  return {
    taskIds: state.queryParams[FacebookQueryType.TASKIDS] ?? null,
    type,
    status,
    page: 0,
    limit: 20,
    search: state.queryParams[FacebookQueryType.SEARCH] || '',
    currentTaskId,
    assignedTo,
    messageStatus,
    propertyManagerId,
    mailBoxId:
      state.queryParams[FacebookQueryType.MAILBOX_ID] ?? state?.mailboxId,
    isLoading: state?.forkLoading ? state?.isLoading : state?.isLoading || true,
    channelId: state?.pageMessenger?.id
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

export function mapTicketToDisplayItem(
  response: ITicketResponse,
  dateFormat: string,
  additionalData?: {
    checkStatus?: boolean;
    linkedConversations?: LinkedUnion[];
    replyConversationId?: string;
    ticketTrans?: string;
    ticketLanguageCode?: string;
    actionLinkedTaskHistory?: LinkedUnion[];
    ticketFiles?: ImageFileMetadata[];
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
    time_availability,
    move_out_date,
    vacate_type,
    note,
    key_request,
    pet_request,
    break_in_incident,
    key_handover_request,
    domestic_violence_support,
    call_back_request,
    change_tenant_request,
    ask_property_manager,
    request_inspection_reschedule,
    submit_vacate_request,
    log_maintenance_request,
    available_date,
    request_summary,
    available_time,
    pet_description,
    maintenance_issue,
    key_request_reason,
    incident_detail,
    situation,
    call_back_reason,
    need_human_follow_up,
    noted_issues,
    urgency,
    change_tenancy_details
  } = response?.payload?.ticket || {};

  const {
    linkedConversations = [],
    checkStatus,
    ticketTrans,
    ticketLanguageCode,
    actionLinkedTaskHistory = [],
    ticketFiles
  } = additionalData || {};

  const showTranslation =
    ticketTrans &&
    ticketLanguageCode &&
    ticketLanguageCode !== 'en' &&
    ticketLanguageCode !== 'und' &&
    (!checkStatus || status !== EStatusTicket.SUBMIT);

  const originalContent =
    request_summary ||
    maintenance_issue ||
    maintenance_object ||
    general_inquiry ||
    note ||
    reschedule_reason ||
    key_request ||
    pet_request ||
    break_in_incident ||
    key_handover_request ||
    domestic_violence_support ||
    call_back_request ||
    change_tenant_request ||
    ask_property_manager ||
    request_inspection_reschedule ||
    submit_vacate_request ||
    log_maintenance_request ||
    pet_description ||
    key_request_reason ||
    incident_detail ||
    situation ||
    call_back_reason ||
    need_human_follow_up ||
    noted_issues ||
    urgency ||
    change_tenancy_details;

  const translatedContent = showTranslation ? ticketTrans : null;

  const type = response.type;
  const icon = getRequestIcon(response.type);

  const combinedLinkedData = [
    ...linkedConversations,
    ...actionLinkedTaskHistory
  ];
  const displayItem: IRequestItemToDisplay = {
    title: conversationTopic,
    timestamp: updatedAt,
    icon,
    type,
    status,
    showTranslation,
    originalContent,
    translatedContent,
    ticketTrans,
    ticketLanguageCode,
    isUrgent,
    ticketFiles,
    linkedConversations: actionLinkedTaskHistory?.length
      ? sortItemsByTime(combinedLinkedData)
      : linkedConversations
  };
  const INVALID_DATE = 'Invalid date';

  switch (type) {
    case EOptionType.RESCHEDULE_INSPECTION_REQUEST:
      const suggestedDate =
        availability && availability !== INVALID_DATE
          ? availability
          : available_date;
      displayItem.rescheduleInfo = {
        suggestedDate: suggestedDate
          ? formatTime(suggestedDate, `dddd ${dateFormat}`)
          : '',
        suggestedTime: available_time || time_availability || null,
        reason: reschedule_reason
      };
      break;
    case EOptionType.VACATE_REQUEST:
      displayItem.vacateInfo = {
        type:
          move_out_date && vacate_type?.[0]?.value
            ? vacate_type?.[0]?.value
            : '',
        intendedDate:
          move_out_date && move_out_date !== INVALID_DATE
            ? dayjs(move_out_date, 'DD/MM/YYYY').format(dateFormat)
            : '',
        note: submit_vacate_request || note
      };
      break;
    case EOptionType.FINAL_INSPECTION:
      displayItem.finalInspectionRequest = {
        availableTime: available_time || null
      };
      break;
  }

  return displayItem;
}

function formatTime(date, format) {
  let time = dayjs(date, 'DD/MM/YYYY');

  if (!time.isValid()) {
    time = dayjs(date.split(' ')?.[0].substring(0, 19));
  }
  return time.format(format);
}

export function isValidMessageForMarkerNewForYou(
  message: IFacebookMessage
): boolean {
  return [EMessageType.defaultText, EMessageType.file].includes(
    message.messageType.toUpperCase() as EMessageType
  );
}
