import {
  EConversationType,
  EMessageComeFromType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import {
  EInboxAction,
  EmailStatusType
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { IEmailClientFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
export interface EmailItem {
  id?: string;
  threadId: string;
  status?: EmailStatusType;
  isRead: boolean;
  sender: string;
  recipient: string;
  cc: string;
  bcc: string;
  subject?: string;
  timestamp?: string;
  textContent?: string;
  htmlContent?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: FileMessage[];
  labels: {
    id: string;
    externalId: string;
  }[];
  lastSender?: string;
  firstMessageId: string;
  mailId?: string;
  conversationId: string;
  isFromMail: boolean;
  isSyncedAttachment?: boolean;
  attachmentCount: number;
  participants: IEmailParticipants[];
  totalMessages: string;
  isSelected?: boolean;
  taskType?: string;
}

export interface IEmailParticipants {
  firstName: string;
  email: string;
  originalEmailName?: string;
}

export interface IEmailMoveToAction {
  threadId: string;
  action: EInboxAction;
}

interface FileObject {
  fileList?: FileMessage[];
  mediaList?: FileMessage[];
  audioList?: FileMessage[];
  unSupportedList?: FileMessage[];
}

export interface FileMessage {
  files?: FileObject;
  id: string;
  content: string;
  fileName: string;
  size: number;
  fileType: any;
  fileIcon?: string;
  type: string;
  name: string;
  mediaLink?: string;
  thumbMediaLink?: string;
  isShowFile?: boolean;
  createdAt: string;
  extension?: string;
}

export interface IEmailQueryParams {
  search: string;
  type?: EMessageType;
  topicId?: string;
  limit: number;
  page: number;
  status?: EmailStatusType;
  agencyId?: string;
  mailBoxId: string;
  externalId?: string;
  currentMailMessageId?: string;
  isLoading?: boolean;
}

export interface IMessagesResponse {
  total?: string | number;
  messages: EmailItem[];
  currentPage: number;
}

export interface IMailFolder {
  id: string;
  externalId: string;
  internalId: string;
  parentId: string;
  wellKnownName: null | string;
  title: string;
  updatedAt: string;
  status: string;
  icon: string;
  unReadMsgCount: number;
  total: null;
  moveAble: boolean;
}

export enum EMailFolderMoveType {
  TASK_TO_FOLDER = 'TASK_TO_FOLDER',
  TASK_TO_INBOX = 'TASK_TO_INBOX'
}

export interface IMailFolderQueryParams {
  conversationIds?: string[];
  mailBoxId?: string;
  currentStatus?: string;
  newLabelId?: string;
  threadIds?: string[];
  newStatus?: string;
  currentLabelId?: string;
  typeMove?: EMailFolderMoveType;
  isValidateTask?: boolean;
}

export interface IReportSpamQueryParams {
  mailBoxId: string;
  threadIds?: string[];
  conversationIds?: string[];
  currentStatus?: string;
  currentLabelId?: string;
  isUndo?: boolean;
}

export interface IGetAllMessage {
  limit: number;
  page: number;
  search: string;
  mailBoxId: string;
  externalId: string;
  threads: string[];
}

export enum EScrollState {
  DOWN = 'down',
  UP = 'up'
}

export interface ICheckMoveMailFolderResponse {
  inbox: boolean;
  emailFolders: {
    id: string;
    externalId: string;
    parentId: string;
  }[];
  resolvedEnquiries: boolean;
  deletedEnquiries: boolean;
}

export interface IEmailLabel {
  externalId: string;
  externalName: string;
  id: string;
  name: string;
  createdAt?: string;
  delimiter?: string;
  mailBoxId?: string;
  parentId?: string;
  syncInfo?: string;
  updatedAt?: string;
  wellKnownName?: string;
}

export interface IEmailLabelResponse extends Response {
  items?: IEmailClientFolder[];
}
export interface IPortalConversation {
  createdFrom?: EMessageComeFromType;
  id: string;
  isSeen?: boolean;
  status: TaskStatusType;
  conversationStatus?: EConversationType;
  taskGroupName: string;
  taskId: string;
  threadId?: string;
  title: string;
  topicId: string;
  topicName: string;
  type: TaskType;
  isDraft?: boolean;
}

export interface IMoveMailFolder {
  id: string;
  threadId: string;
  taskId: string;
  status: string;
  type: string;
  isSeen: boolean;
  createdFrom: string;
  title: string;
  isDraft: boolean;
  isAgent: boolean;
  textContent: string;
  lastMessageTypeToShow: string;
  options: string;
  messageComeFrom: string;
  participants: IEmailParticipants[];
}

export interface IMessagesConfirm extends IMoveMailFolder {
  displayParticipants: string[];
  remainingParticipants: string[];
  message: string;
}

export interface IDataMailFolder {
  moveAble: string;
  internalId: string;
  wellKnownName: string;
}
