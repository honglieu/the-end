import { MessageStatus } from '@services/conversation.service';
import { GroupType, TaskStatusType, TaskType } from '@shared/enum';
import {
  EStatusTicket,
  IEmailMetadata,
  IMessage,
  IOptionTicket
} from '@shared/types/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { Params } from '@angular/router';
import { IActionLinkedTaskHistory } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';

export interface IFlagUrgentMessageResponse {
  id: string;
  isUrgent: boolean;
}

export interface IMarkAsUnreadResponse {
  id: string;
  isSeen: boolean;
}

export enum EMessageMenuOption {
  CREATE_NEW_TASK = 'create_new_task',
  REOPEN = 're_open',
  FORWARD = 'forward',
  MOVE_TO_TASK = 'move_to_task',
  RESOLVE = 'resolve',
  FLAG = 'flag',
  UN_FLAG = 'un-flag',
  READ = 'read',
  UNREAD = 'unread',
  CONVERT_MULTIPLE_TO_TASK = 'convert_multiple_to_task',
  SEND_AND_RESOLVE = 'send_and_resolve',
  SAVE_TO_PROPERTY_TREE = 'Save to Property Tree'
}

export enum EConversationStatus {
  open = 'OPEN',
  reopen = 'REOPEN',
  resolved = 'RESOLVED',
  deleted = 'DELETED',
  schedule = 'SCHEDULE',
  draft = 'DRAFT'
}

export interface IVoiceMailQueryParams {
  type: VoiceMailType;
  search: string;
  assignedTo: string[];
  propertyManagerId: string[];
  messageStatus: string[];
  currentTaskId: string;
  limit: number;
  page: number;
  status: TaskStatusType;
  mailBoxId: string;
  taskIds?: string[];
  isLoading?: boolean;
}

export interface VoiceMailRetrieval {
  queryParams: Params;
  mailboxId: string;
  selectedInbox: GroupType;
  selectedPortfolio: string[];
  selectedAgency: string[];
  selectedStatus: string[];
  userDetail: CurrentUser;
}

export interface CurrentTab {
  tab: number;
  matches: boolean;
}

export interface FilterItem {
  name: string;
  queryParams: Params;
  notification: boolean;
  status: string;
}

export enum VoiceMailQueryType {
  INBOX_TYPE = 'inboxType',
  MESSAGE_STATUS = 'status',
  PROPERTY_MANAGER_ID = 'propertyManagerId',
  SEARCH = 'search',
  TASK_ID = 'taskId',
  TASKTYPEID = 'taskTypeId',
  ASSIGNED_TO = 'assignedTo',
  CONVERSATION_LOG_ID = 'conversationLogId',
  CONVERSATION_ID = 'conversationId',
  CURRENT_TASK_ID = 'currentTaskId',
  MESSAGES_STATUS = 'messageStatus',
  EXTERNAL_ID = 'externalId',
  MAILBOX_ID = 'mailBoxId',
  TASKIDS = 'taskIds'
}

export enum VoiceMailType {
  MY_MESSAGES = 'MY_MESSAGES',
  TEAM_MESSAGES = 'TEAM_MESSAGES'
}

export enum VoiceMailProperty {
  IS_URGENT = 'isUrgent',
  IS_SEEN = 'isSeen',
  PROPERTY = 'property',
  PROPERTY_STATUS = 'propertyStatus',
  PARTICIPANTS = 'participants'
}

export enum MenuOption {
  CREATE_NEW_TASK = 'create_new_task',
  BULK_CREATE_NEW_TASK = 'bulk_create_new_task',
  REOPEN = 're_open',
  FORWARD = 'forward',
  MOVE_TO_TASK = 'move_to_task',
  MOVE_TO_FOLDER = 'move_to_folder',
  MOVE_TO_INBOX = 'move_to_inbox',
  RESOLVE = 'resolve',
  REPORT_SPAM = 'report_spam',
  DELETE = 'delete',
  FLAG = 'flag',
  UN_FLAG = 'un-flag',
  READ = 'read',
  UNREAD = 'unread',
  SAVE_TO_RENT_MANAGER = 'Save to Rent Manager',
  SAVE_TO_PROPERTY_TREE = 'Save to Property Tree',
  CONVERT_MULTIPLE_TO_TASK = 'convert_multiple_to_task',
  SEND_AND_RESOLVE = 'send_and_resolve',
  ADD_TO_TASK = 'add_to_task',
  DOWNLOAD_AS_PDF = 'download_as_pdf',
  REMOVE_FROM_TASK = 'remove_from_task'
}

export interface VoiceMailMessage extends TaskItem {}

export type VoiceMailList = VoiceMailMessage[];

export enum EPopupConversionTask {
  SELECT_OPTION = 'SELECT_OPTION',
  CREATE_TASK = 'CREATE_TASK',
  MOVE_TASK = 'MOVE_TASK'
}
export interface IActionItem {
  conversationId: string;
  id: string;
  linkedConversations: LinkedUnion[];
  actionLinkedTaskHistory: LinkedUnion[];
  draftMessages?: IMessage;
  taskLinked: ITaskLinked;
  options: IOptionTicket;
  isAssigned: boolean;
  replyConversationId: string;
  replyConversationStatus: MessageStatus;
  replyConversationTaskId: string;
  replyConversationTaskStatus: TaskStatusType;
  replyConversationTaskType: TaskType;
}

export interface ITaskLinked extends IActionLinkedTaskHistory {}

export interface ILinkedConversation {
  emailMetaData: IEmailMetadata;
  createdAt: string;
  id: string;
  previewMessage: {
    id: string;
    isLastMessageDraft: boolean;
    isScratchDraft: boolean;
    lastMessageTypeToShow: string;
    messageDate: string;
    options: IOptionTicket;
    textContent: string;
    countAttachment: number;
  };
  title: string;
  ticketId: string;
  taskId: string;
  conversationId: string;
  taskStatus: TaskStatusType;
  taskType: TaskType;
  isAssigned: boolean;
  isUrgent: boolean;
  propertyId?: string;
}

export enum ERequestIcon {
  MAINTENANCE_REQUEST = 'maintenanceRequest',
  GENERAL_ENQUIRY = 'generalEnquiry',
  VACATE_REQUEST = 'vacateRequest',
  RESCHEDULE_INSPECTION = 'rescheduleInspection'
}

export type LinkedUnion = ILinkedConversation | IActionLinkedTaskHistory;

export interface IRequestItemToDisplayVoiceMail {
  icon: string;
  title: string;
  isUrgent: boolean;
  linkedConversations?: LinkedUnion[];
  status?: EStatusTicket;
  type?: string;
  replied?: boolean;
  timestamp?: string;
  originalContent: string;
  translatedContent: string;
  showTranslation: boolean;
  ticketTrans: string;
  ticketLanguageCode: string;
  vacateInfo?: {
    type: string;
    intendedDate: string;
    note: string;
  };
  rescheduleInfo?: {
    suggestedDate: string;
    suggestedTime: string;
    reason: string;
  };
}

export interface IGroupedVoicemailMessages {
  messages: IMessage[];
  timestamp: string;
}

export type ISocketQueue = Map<
  string,
  {
    field: string;
    value: any;
  }
>;

export interface IReadTicket {
  taskId: string;
  conversationId: string;
  isReadTicket?: boolean;
  countUnreadTicket?: number;
}

export interface IHistoryListResponse {
  list: IMessage[];
  pageSize: number;
}
