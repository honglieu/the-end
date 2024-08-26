import { MessageStatus } from '@services/conversation.service';
import { GroupType, TaskStatusType, TaskType } from '@shared/enum';
import {
  EStatusTicket,
  FileMessage,
  IEmailMetadata,
  IMessage,
  IMessageOptions,
  IOptionTicket
} from '@shared/types/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { Params } from '@angular/router';
import {
  FileCarousel,
  FileObject,
  IFile,
  IUserParticipant
} from '@/app/shared';
import { PageFacebookMessengerType } from '@/app/dashboard/shared/types/facebook-account.interface';
import { IActionLinkedTaskHistory } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { EReactionStatus } from './facebook.enum';

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

export interface IFacebookQueryParams {
  type: FacebookType;
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
  channelId?: string;
}

export interface FacebookRetrieval {
  queryParams: Params;
  mailboxId: string;
  selectedInbox: GroupType;
  selectedPortfolio: string[];
  selectedAgency: string[];
  selectedStatus: string[];
  userDetail: CurrentUser;
  pageMessenger: PageFacebookMessengerType;
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

export enum FacebookQueryType {
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
  CHANNELID = 'channelId',
  TASKIDS = 'taskIds'
}

export enum FacebookType {
  MY_MESSAGES = 'MY_MESSAGES',
  TEAM_MESSAGES = 'TEAM_MESSAGES'
}

export enum FacebookProperty {
  IS_URGENT = 'isUrgent',
  IS_SEEN = 'isSeen',
  PROPERTY = 'property',
  PROPERTY_STATUS = 'propertyStatus',
  PARTICIPANTS = 'participants',
  IS_PM_JOINED = 'isPmJoined'
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

export interface FacebookMessage extends TaskItem {}

export type FacebookList = FacebookMessage[];

export enum EPopupConversionTask {
  SELECT_OPTION = 'SELECT_OPTION',
  CREATE_TASK = 'CREATE_TASK',
  MOVE_TASK = 'MOVE_TASK'
}

export interface ITaskLinked extends IActionLinkedTaskHistory {}

export type LinkedUnion = ILinkedConversation | IActionLinkedTaskHistory;

export interface IActionItem {
  conversationId: string;
  id: string;
  linkedConversations: LinkedUnion[];
  draftMessages?: IMessage;
  options: IOptionTicket;
  isAssigned: boolean;
  replyConversationId: string;
  replyConversationStatus: MessageStatus;
  replyConversationTaskId: string;
  replyConversationTaskStatus: TaskStatusType;
  replyConversationTaskType: TaskType;
  messageId?: string;
  messagesTranslate?: string;
  languageCode?: string;
  textTranslatedContent?: string;
  taskLinked: ITaskLinked;
  actionLinkedTaskHistory: LinkedUnion[];
  ticketFiles?: ImageFileMetadata[];
}

interface FileType {
  id: string;
  name: string;
  icon: string;
}

export interface ImageFileMetadata {
  id: string;
  name: string;
  propertyId: string;
  size: number;
  mediaLink: string;
  thumbMediaLink: string | null;
  createdAt: string;
  fileType: FileType;
}

export interface ILinkedConversation {
  emailMetaData: IEmailMetadata;
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
  replyConversationId?: string;
  propertyId?: string;
}

export enum ERequestIcon {
  MAINTENANCE_REQUEST = 'maintenanceRequest',
  GENERAL_ENQUIRY = 'generalEnquiry',
  VACATE_REQUEST = 'vacateRequest',
  RESCHEDULE_INSPECTION = 'rescheduleInspection'
}

export interface IRequestItemToDisplay {
  icon?: string;
  type?: string;
  title: string;
  isUrgent: boolean;
  linkedConversations?: LinkedUnion[];
  status?: EStatusTicket;
  replied?: boolean;
  timestamp?: string;
  originalContent: string;
  translatedContent: string;
  showTranslation: boolean;
  ticketTrans?: string;
  ticketLanguageCode?: string;
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
  finalInspectionRequest?: {
    availableTime: string;
  };
  ticketFiles?: ImageFileMetadata[];
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
    taskId: string;
    conversationId: string;
  }
>;

export interface ICreator {
  id: string;
  firstName: string;
  email: string;
  lastName: string | null;
  title: string;
  type?: string;
  isTemporary?: boolean;
  facebookName?: string;
  phoneNumber?: string;
  externalId?: string;
}

export interface IFacebookMessage {
  id: string;
  userSendType: string;
  firstName: string;
  userId: string;
  avatar: string;
  message: string;
  propertyType?: string;
  conversationId?: string;
  isDraft: boolean;
  replyToMessageId: string | null;
  isRead: boolean | null;
  type: string | null;
  files?: FileObject;
  options: IMessageOptions | null;
  createdAt: string;
  lastName: string | null;
  secondaryEmail: string | null;
  userType: string | null;
  recognitionStatus: string | null;
  contactType: string | null;
  landingPage: string | null;
  userTitle: string | null;
  file: FileMessage | null;
  messageType: string;
  userPropertyType: string | null;
  idUserPropertyGroup: string | null;
  isPrimary: boolean | null;
  agencyOutgoingEmail: string;
  isShowFile: boolean;
  isSendFromEmail: boolean;
  isSendFromVoiceMail: boolean;
  bulkMessageId: string | null;
  crmStatus: string | null;
  iviteSent: string | null;
  lastActivity: string | null;
  offBoardedDate: string | null;
  userPropertyContactType: string | null;
  rawMessageId: string;
  textContent: string;
  channelUserId: string;
  isLastReadMessage: boolean;
  languageCode: string | null;
  messagesTranslate: string | null;
  messagesTranslateText: string;
  unhandledAttachmentCount: number;
  isSyncedAttachment: boolean;
  oldPropertyId: string | null;
  newPropertyId: string | null;
  title: string | null;
  creator: ICreator;
  userPropertyId: string | null;
  isAutomatedReply: boolean | null;
  isMarkUnRead: boolean;
  lastSeen: string | null;
  seenDate: string | null;
  sendOptions: {
    time?: string;
    type: string;
  };
  messageReply: IFacebookMessage | null;
  draftMessageId: string | null;
  isFirstUnread?: boolean;
  isSending?: boolean;
  isError?: boolean;
  email?: string;
  channelUserName?: string;
  isOldestMessage?: boolean;
  conversationTitle?: string;
  reaction?: IFacebookMessageReaction;
}

export interface IFacebookMessageReaction {
  action?: EReactionStatus;
  emoji?: string;
  mid?: string;
  reaction?: string;
  timestamp?: number;
  conversationId?: string;
  messageId?: string;
}
export interface IHistoryListResponse {
  list: IFacebookMessage[];
  pageSize: number;
}

export interface IConversationSummary {
  sessionId: string;
  attachments: IFile[] | FileCarousel[];
  sessionCreatedAt: string;
  messageRequest: IActionItem[];
  summary: string;
  summaryStatus: string;
  displayName: string;
  isOpen?: boolean;
  conversationId?: string;
  messagesTranslate?: string;
  languageCode?: string;
  property?: IPropertySection;
  countAttachments?: number;
  attachents?: any;
  user?: IUserParticipant;
}

export interface IPropertySection {
  address: string;
  agencyId: string;
  expenditureLimit: number;
  id: string;
  isTemporary: boolean;
  keyDescription: string;
  keyNumber: string;
  propertyType: string;
  shortenStreetline: string;
  status: string;
  streetline: string;
  unitNo: string;
}

export interface ISelectedRequestSummary {
  id: string;
  messageId: string;
}

export interface IHeaderContact {
  title: string;
  role: string;
}
