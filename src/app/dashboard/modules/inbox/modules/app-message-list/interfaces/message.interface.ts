import {
  EConversationType,
  EMessageComeFromType,
  EMessageProperty,
  EOptionType,
  EUserPropertyType
} from '@shared/enum';
import { IFile } from '@shared/types/file.interface';
import {
  EStatusTicket,
  IEmailMetadata,
  ITicketFile
} from '@shared/types/message.interface';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  LastUser,
  PreviewConversation
} from '@shared/types/conversation.interface';

export interface IMessageQueryParams {
  search: string;
  type: EMessageType;
  assignedTo: string[];
  propertyManagerId: string[];
  messageStatus: string[];
  taskDeliveryFailIds: string[];
  topicId: string;
  propertyId: string;
  excludeUnHappyPath: boolean;
  excludeConversation: boolean;
  limit: number;
  // same as limit
  // TODO: verify to remove either one
  pageLimit?: number;
  page: number;
  onlyTask: boolean;
  status: TaskStatusType;
  mailBoxId: string;
  currentTaskId?: string;
  isLoading?: boolean;
  labelId?: string;
  reminderType?: string;
  isShowIgnore?: boolean;
  reminderTime?: number;
  taskIds?: string[];
  showMessageInTask?: boolean;
}

export interface IAppMessageActionItem {
  ticket: ITicketItem;
  linkedConversations: any[];
}

export interface IReplyConversation {
  id: string;
  conversationId: string;
  taskId: string;
  ticketId: string;
  conversationType: EConversationType;
  invisibleInWeb: boolean;
  taskType: TaskType;
  taskStatus: TaskStatusType;
}

export interface IOptions {
  response: {
    type: EOptionType;
    text: string;
    payload: {
      ticket: ITicket;
    };
    function_call: {
      name: string;
      arguments: string;
    };
  };
  status: EStatusTicket;
}

export interface ITicketItem {
  id: string;
  message: string;
  options?: IOptions;
  propertyDocument?: unknown;
  ticketFiles?: ITicketFile[];
  replyConversationApp?: IReplyConversation;
  replyConversationEmail?: IReplyConversation;
  draftEmailMessage?: IDraftEmailMessage;
}

export interface ITicket {
  mediaUploadUI?: boolean;
  conversationTopic: string;
  categoryId: string;
  status: EStatusTicket;
  general_inquiry?: string;
  maintenance_object?: string;
  note?: string;
  reschedule_reason?: string;
  isUrgent?: boolean;
  conversationLogId: string;
  consoleTitle: string;
  isShowConsole: boolean;
  svg: string;
  color: string;
  colorType: string;
  titleOfTopic: string;
  landlord: boolean;
  tenant: boolean;
  topicId: string;
  message: string;
  createdFrom: EMessageComeFromType;
  createdAt: Date | string;
  updatedAt: Date | string;
  name: string;
  id: string;
  taskId: string;
  conversationId: string;
  ticketTrans?: string;
  ticketLanguageCode?: string;
}

export interface IDraftEmailMessage {
  id: string;
  createdUserId: string;
  conversationId: string;
  message: string;
  options?: {
    contacts: [
      {
        title: string;
        type: EUserPropertyType;
        address: string;
        firstName: string;
        lastName: string;
        mobileNumber: string;
        phoneNumber: string;
        email: string;
        landingPage: string;
      }
    ];
  };
  messageType: string;
  files?: Partial<IFile>[];
  recipients?: IEmailMetadata;
  sendOptions?: {
    time?: string;
    type: string;
  };
}

export interface IMarkAsUnreadResponse {
  id: string;
  isRead: boolean;
}

export interface IFlagUrgentMessageResponse {
  id: string;
  isUrgent: boolean;
}

export enum EMessageType {
  MY_MESSAGES = 'MY_MESSAGES',
  TEAM_MESSAGES = 'TEAM_MESSAGES',
  UNASSIGNED = 'UNASSIGNED'
}

export enum EMessageQueryType {
  INBOX_TYPE = 'inboxType',
  MESSAGE_STATUS = 'status',
  EXTERNAL_ID = 'externalId',
  MAILBOX_ID = 'mailBoxId',
  THREAD_ID = 'threadId',
  EMAIL_MESSAGE_ID = 'emailMessageId'
}
export enum EInboxFilterSelected {
  ASSIGNED_TO = 'assignedTo',
  PROPERTY_MANAGER_ID = 'propertyManagerId',
  SEARCH = 'search',
  AI_ASSISTANT_TYPE = 'aiAssistantType',
  CONVERSATION_LOG_ID = 'conversationLogId',
  CONVERSATION_ID = 'conversationId',
  MESSAGE_STATUS = 'messageStatus',
  TASK_ID = 'taskId',
  EXTERNAL_ID = 'externalId',
  TASK_EDITOR_ID = 'taskEditorId',
  SHOW_MESSAGE_IN_TASK = 'showMessageInTask'
}

export enum EMessageMenuOption {
  ADD_TO_TASK = 'add_to_task',
  CREATE_NEW_TASK = 'create_new_task',
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
  DOWNLOAD_AS_PDF = 'download_as_pdf',
  REMOVE_FROM_TASK = 'remove_from_task'
}

export enum EScrollState {
  DOWN = 'down',
  UP = 'up'
}

export interface IChangeConversation {
  actionLinkId: null | string;
  agencyId: string;
  agentOnly: boolean;
  bulkMessageId: null | string;
  callType: null | string;
  categoryId: string;
  conversation: PreviewConversation;
  conversationId: string;
  createdAt: string;
  firstName: string;
  googleAvatar: string;
  id: string;
  isRead: boolean;
  isSendFromEmail: boolean;
  lastName: string;
  message: string;
  messageType: string;
  options: string;
  propertyDocumentId: null | string;
  propertyId: string;
  signature: null;
  status: string;
  taskId: string;
  title: string;
  type: string;
  updatedAt: string;
  user: LastUser;
  userId: string;
  userPropertyId: string;
  userPropertyType: string;
  userTitle: string;
  userType: string;
}

export interface IPayloadForwardMailBox {
  taskIds: string[];
  mailBoxId: string;
  newMailBoxId: string;
}

export interface IMarkAsUnreadResponse {
  id: string;
  isSeen: boolean;
}

export interface IFlagUrgentMessageResponse {
  id: string;
  isUrgent: boolean;
}

export interface IChangeConversation {
  actionLinkId: null | string;
  agencyId: string;
  agentOnly: boolean;
  bulkMessageId: null | string;
  callType: null | string;
  categoryId: string;
  conversation: PreviewConversation;
  conversationId: string;
  createdAt: string;
  firstName: string;
  googleAvatar: string;
  id: string;
  isRead: boolean;
  isSendFromEmail: boolean;
  lastName: string;
  message: string;
  messageType: string;
  options: string;
  propertyDocumentId: null | string;
  propertyId: string;
  signature: null;
  status: string;
  taskId: string;
  title: string;
  type: string;
  updatedAt: string;
  user: LastUser;
  userId: string;
  userPropertyId: string;
  userPropertyType: string;
  userTitle: string;
  userType: string;
}

export interface IListMessageResolve {
  propertyId: string;
  conversationId: string;
}

export interface IMessageResolveSyncStatus {
  conversationId: string;
  status: string;
}

export enum IconsSync {
  SYNCING = 'syncingV2',
  SYNC_FAIL = 'iconSyncFail',
  SYNC_SUCCESS = 'iconSyncSuccess'
}

export interface IConversationsConfirmProperties {
  listConversationMove: PreviewConversation[];
  listConversationNotMove: PreviewConversation[];
}

export enum EActionSyncResolveMessage {
  SAVE_TO_RM_DROPDOWN_MENU = 'SAVE_TO_RM_DROPDOWN_MENU',
  COMPLETED_AND_TASK_DETAIL = ' COMPLETED_AND_TASK_DETAIL',
  SEND_MESSAGE_RESOLVE = 'SEND_MESSAGE_RESOLVE',
  SAVE_TO_PT_DROPDOWN_MENU = 'SAVE_TO_PT_DROPDOWN_MENU'
}

export enum ETypeDisplaySyncNote {
  RESOLVE_FROM_FLOAT_POPUP = 'RESOLVE_FROM_FLOAT_POPUP',
  RESOLVE_FROM_DROPDOWN_MENU = 'RESOLVE_FROM_DROPDOWN_MENU',
  RESOLVE_COMPLETED = 'RESOLVE_COMPLETED',
  RESOLVE_CANCEL = 'RESOLVE_CANCEL',
  COMPLETED_AND_TASK_DETAIL = 'COMPLETED_AND_TASK_DETAIL',
  SEND_MESSAGE_RESOLVE = 'SEND_MESSAGE_RESOLVE',
  RESET_POPUP_SYNC_NOTE = 'RESET_POPUP_SYNC_NOTE',
  SEND_MESSAGE_RESOLVE_TINY_EDITOR = 'SEND_MESSAGE_RESOLVE_TINY_EDITOR'
}

export interface IConversationAction {
  taskId: string;
  propertyToUpdate: EMessageProperty;
  propertyValue: boolean;
  conversationId?: string;
}
