import {
  EConversationType,
  EUserPropertyType,
  TaskStatusType,
  TaskType
} from '@shared/enum';

export interface IGlobalSearchPayload {
  mailBoxIds: string[];
  propertyManagerIds: string[];
  assigneeIds: string[];
  search: string;
  messageStatus: TaskStatusType[];
  pageSize?: number;
  page?: number;
  conversationType?: EConversationType;
}

export interface IGlobalSearchResponse {
  conversations: IGlobalSearchConversation[];
  currentPage: number;
  totalConversations: number;
  totalPage: number;
}
export interface IGlobalSearchConversation {
  taskId: string;
  conversationId: string;
  streetline: string;
  updatedAt: string | Date;
  taskType: TaskType;
  taskTitle: string;
  emailTitle?: string;
  conversationTitle: string;
  categoryName: string;
  conversationPhoneNumber: string;
  conversationStatus: EConversationType;
  conversationType: EConversationType;
  taskStatus: TaskStatusType;
  taskTypeId: string;
  lastMessage: {
    id: string;
    conversationId: string;
    createdAt: string | Date;
    userId: string;
    textContent: string;
    message: string;
    messageType: string;
    bulkMessageId: null;
    options: { contacts?: any[]; type?: any };
    isDraft: boolean;
  };
  fromName: string;
  from: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: EUserPropertyType;
    messageRecipientType: string[];
    secondaryEmail: string;
    phoneNumber: string;
    originalEmailName: string;
    mailBoxEmail: string;
    channelUserName: string;
    secondaryPhones: any[];
  };
  to: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: EUserPropertyType;
    messageRecipientType: string[];
    secondaryEmail: string;
    phoneNumber: string;
    originalEmailName: string;
    mailBoxEmail: string;
  }[];
  toFieldName: string;
  toField: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: EUserPropertyType;
    messageRecipientType: string[];
    secondaryEmail: string;
    phoneNumber: string;
    originalEmailName: string;
  };
  propertyDocuments: IPropertyDocuments[];
  totalActions: number;
  totalUnreadTicket: number;
  attachmentCount: number;
  mailBoxEmail: string;
  mailBoxId: string;
  companyName: string;
  channelId: string;
}

export interface IPropertyDocuments {
  id: string;
  url: string;
  size: string;
  name: string;
  mediaLink: string;
  thumbMediaLink: string;
  fileType: string;
  icon: string;
}
