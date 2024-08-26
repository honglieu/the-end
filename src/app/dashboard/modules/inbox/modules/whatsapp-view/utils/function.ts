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
  IWhatsappQueryParams,
  WhatsappQueryType,
  ERequestIcon,
  IRequestItemToDisplay,
  ILinkedConversation,
  IWhatsappMessage
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';

export function buildWhatsappQueryParams(
  ignoreParams: boolean = false,
  isConsoleUser: boolean = false,
  state
): IWhatsappQueryParams {
  const type = isConsoleUser
    ? TaskStatusType.team_task
    : state.queryParams[WhatsappQueryType.INBOX_TYPE];

  const status = state.queryParams[WhatsappQueryType.MESSAGE_STATUS];

  const assignedTo =
    !ignoreParams && type === GroupType.TEAM_TASK
      ? state.selectedAgency ||
        state.queryParams[WhatsappQueryType.ASSIGNED_TO] ||
        []
      : [];

  const queryMessageStatus =
    state?.selectedStatus?.length > 0
      ? state.selectedStatus
      : state.queryParams[WhatsappQueryType.MESSAGES_STATUS];
  const messageStatus = Array.isArray(queryMessageStatus)
    ? queryMessageStatus
    : queryMessageStatus
    ? [queryMessageStatus]
    : [];

  const propertyManagerId =
    state?.selectedPortfolio ||
    state.queryParams[WhatsappQueryType.PROPERTY_MANAGER_ID];

  const currentTaskId = isValidUUID(
    state.queryParams[WhatsappQueryType.TASK_ID]
  )
    ? state.queryParams[WhatsappQueryType.TASK_ID]
    : null;

  return {
    type,
    status,
    page: 0,
    limit: 20,
    search: state.queryParams[WhatsappQueryType.SEARCH] || '',
    currentTaskId,
    assignedTo,
    messageStatus,
    propertyManagerId,
    mailBoxId:
      state.queryParams[WhatsappQueryType.MAILBOX_ID] ?? state?.mailboxId,
    isLoading: state?.forkLoading ? state?.isLoading : state?.isLoading || true,
    channelId: state?.pageWhatsApp?.id,
    taskIds: state.queryParams[WhatsappQueryType.TASK_IDS] ?? null
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
    linkedConversations?: ILinkedConversation[];
    replyConversationId?: string;
    ticketTrans?: string;
    ticketLanguageCode?: string;
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
    log_maintenance_request
  } = response?.payload?.ticket || {};

  const { linkedConversations, checkStatus, ticketTrans, ticketLanguageCode } =
    additionalData || {};
  const showTranslation =
    ticketTrans &&
    ticketLanguageCode &&
    ticketLanguageCode !== 'en' &&
    ticketLanguageCode !== 'und' &&
    (!checkStatus || status !== EStatusTicket.SUBMIT);

  const originalContent =
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
    log_maintenance_request;

  const translatedContent = showTranslation ? ticketTrans : null;

  const type = response.type;
  const icon = getRequestIcon(response.type);

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
    linkedConversations
  };

  switch (type) {
    case EOptionType.RESCHEDULE_INSPECTION_REQUEST:
      displayItem.rescheduleInfo = {
        suggestedDate: availability
          ? dayjs(availability.split(' ')?.[0].substring(0, 19)).format(
              `dddd ${dateFormat}`
            )
          : '',
        suggestedTime: time_availability,
        reason: reschedule_reason
      };
      break;
    case EOptionType.VACATE_REQUEST:
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

export function isValidMessageForMarkerNewForYou(
  message: IWhatsappMessage
): boolean {
  return [EMessageType.defaultText, EMessageType.file].includes(
    message.messageType.toUpperCase() as EMessageType
  );
}
