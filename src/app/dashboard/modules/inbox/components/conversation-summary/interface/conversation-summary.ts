import { IActionLinkedTaskHistory } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { MessageStatus } from '@/app/services';
import {
  FileCarousel,
  IEmailMetadata,
  IFile,
  IMessage,
  IOptionTicket,
  TaskStatusType
} from '@/app/shared';

export interface IConversationSummary {
  lastSession: {
    sessionId: string;
    sessionCreatedAt: string;
    conversationId: string;
    summary: string;
    languageCode: string;
    messagesTranslate: string;
  };
  totalSession: number;
  summaries: IConversationSummaryItem[];
}

export interface IConversationSummaryItem {
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
  audioFile?: IFile | FileCarousel;
  countAttachments?: number;
  messageId?: string;
}

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
}

export interface ITaskLinked extends IActionLinkedTaskHistory {}

export type LinkedUnion = ILinkedConversation | IActionLinkedTaskHistory;
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
}

export interface ILoadFile {
  file: FileCarousel;
  selectedFileId: string;
  ignore?: boolean;
}

export interface IReadTicket {
  taskId: string;
  conversationId: string;
  isReadTicket?: boolean;
  countUnreadTicket?: number;
}

export interface IMessageSummary {
  attachments: IFile[] | FileCarousel[];
  createdAt: string;
  messageId: string;
  messageSummaryTimeLine: string;
  messageType: string;
}

export interface IlinkedEmailToDisplay {
  from: {
    fromTitle: string;
    fromRole: string;
  };
  to: {
    toTitle: string;
    toRole: string;
  }[];
  more: number;
  timestamp: string;
  emailTitle: string;
  emailContent: string;
  isUrgent: boolean;
  attachmentCount: number;
  isReply: boolean;
  isShowRole?: boolean;
}
