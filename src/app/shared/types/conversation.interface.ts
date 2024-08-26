import {
  ECreatedFrom,
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import {
  EExcludedUserRole,
  EPropertyStatus,
  ERecognitionStatus,
  EUserPropertyType,
  UserStatus,
  UserTypeEnum
} from '@shared/enum/user.enum';
import { TaskItem } from './task.interface';
import { TrudiResponse } from './trudi.interface';
import { UnhappyStatus } from './unhappy-path.interface';
import { ICurrentUser, IUserPropertyContactType } from './user.interface';
import { IMessage } from './message.interface';
import { EConversationType, TaskStatusType, TaskType } from '@shared/enum';
import { Property } from './property.interface';

export interface IUserConversationsWithType {
  value: UserConversation[];
  type: string;
}

export interface NavigateOutConversation {
  value: string;
  blockRedirect?: boolean;
}

export interface SearchAddressFromUsers {
  propertyAddress: string;
  propertyId: string;
}

export interface CategoryType {
  id: string;
  name: string;
  landlord: boolean;
  tenant: boolean;
  svg: string;
  message: string;
  color: string;
  consoleOnly: boolean;
  colorType: string;
  titleOfTopic: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  propertyId: string;
  unreadCount: number;
  type: UserTypeEnum;
  isTemporary?: boolean;
}

export interface UserConversation {
  userType: string;
  id: string;
  conversationType: EConversationType;
  draftMessageId: string;
  userId: string;
  createdFrom?: string;
  propertyId: string;
  lastMessage: string;
  currentPage: number;
  categoryId: string;
  contactType: string;
  contentMessage: string;
  type: EUserPropertyType | string;
  options?: any;
  isFrozen: boolean;
  status: string;
  statusTask: TaskStatusType;
  isSendViaEmail: boolean;
  isForwardEmail: boolean;
  messageOptions?: any;
  firstName: string;
  lastName: string;
  iviteSent: string;
  lastActivity: string;
  email?: string;
  offBoardedDate?: any;
  propertyType: EUserPropertyType | string;
  isPrimary: boolean;
  updatedAt: string;
  startMessageBy: EUserPropertyType | string;
  streetline: string;
  shortenStreetline: string;
  categoryName: string;
  titleOfTopic: string;
  message: string;
  crmStatus: string;
  messageOwner: string;
  messageDate: string;
  propertyDocumentId?: any;
  messageType: string;
  lastUser: LastUser;
  participants: IParticipant[];
  isRead: boolean;
  isSeen?: boolean;
  inviteStatus: UserStatus;
  trudiResponse?: TrudiResponse;
  isUnreadIndicator?: boolean;
  fullName?: string;
  isTemporary?: boolean;
  secondaryEmail?: string;
  secondaryEmailId?: string;
  taskId: string;
  mobileNumber: string;
  phoneNumber: string;
  conversationTitle?: string;
  taskType?: string;
  scheduleMessageCount?: number;
  notReCallTaskDetailApi?: boolean;
  ExternalType: string;
  invisibleInApp?: boolean;
  messageComeFrom?: EMessageComeFromType;
  secondaryPhoneNumbers: string[];
  endSessionConversationLog: string;
  syncStatus: string;
  createdSyncAt: string;
  updatedSyncAt: string;
  trudiUserId?: string | null;
  threadId?: string;
  isMultipleContact?: boolean;
  userNoPropertyId?: string;
  isAppUser?: boolean;
  unhappyStatus?: UnhappyStatus;
  isUnHappyPath?: boolean;
  isUnindentifiedProperty?: boolean;
  attachmentCount?: number;
  textContent?: string;
  isUrgent?: boolean;
  messageCount?: number;
  propertyStatus?: EPropertyStatus;
  isTemporaryProperty?: boolean;
  isLastMessageDraft?: boolean;
  isDraft?: boolean;
  isScratchDraft?: boolean;
  isScratchTicket?: boolean;
  timestamp?: string;
  conversationSyncDocumentAt?: string;
  conversationSyncDocumentStatus?: string;
  isAutomatedReply?: boolean;
  secondaryEmails?: {
    id?: string;
    email?: string;
    userId?: string;
  }[];
  linkedConversationAppLog?: ILinkedConversationLog[];
  isAppMessageLog?: boolean;
  linkedConversationVoicemailLog?: ILinkedConversationLog[];
  linkedConversationMessenger?: ILinkedConversationLog[];
  linkedConversationSms?: ILinkedConversationLog[];
  linkedConversationWhatsApp?: ILinkedConversationLog[];
  lastTimeMessage?: string;
  ticketId: string;
  ticketIds?: string[];
  summaryMessage: string;
  lastSummaryUpdatedAt?: string;
  isTabDraft?: boolean;
  lastMessageDraft?: {
    createdAt: Date | string;
    textContent: string;
    id: string;
    messageType: EMessageType;
    bulkMessageId?: string;
  };
  linkedTask?: {
    assignToAgents: [];
    conversation: any;
    id: string;
    indexTitle: string;
    status: string;
    taskGroupId: string;
    taskName: {
      id: string;
      name: string;
    };
    title: string;
    topicId: string;
    topicName: string;
    property: {
      id: string;
      shortenStreetline: string;
      agencyId: string;
      companyId: string;
      region: string;
      address: string;
    };
  };
  downloadingPDFFile?: boolean;
  sendOptions: {
    time?: string;
    type: string;
  };
  mailBoxAddress?: string;
  isCreatedFromVoiceMail?: boolean;
  name?: string;
  emailVerified?: string;
  isReadTicket?: boolean;
  channelUser?: {
    externalId: string;
  };
  isDetectedContact?: boolean;
  linkedConversationEmail?: ILinkedConversationLog[];
  isPmJoined?: boolean;
  fromPhoneNumber?: string;
  countUnreadTicket?: number;
  lastPmJoined?: ILastPmJoined;
}

export interface ILinkedConversationLog {
  messageId: string;
  conversationId: string;
  taskId: string;
  status: TaskStatusType;
  time: string;
  title: string;
  taskStatus: TaskStatusType;
  taskType: TaskType;
  isAssigned: boolean;
  conversationType?: EConversationType;
  channelId?: string;
  requestRaisedDate?: string;
}

export interface ILinkedConversationToDisplay
  extends Omit<ILinkedConversationLog, 'messageId' | 'time' | 'title'> {
  channelTitle: string;
}

export interface LastUser {
  firstName?: string;
  status?: string;
  isUserPropetyTree?: boolean;
  lastName?: string;
  avatar?: string;
  id?: string;
  type?: string;
}

export interface PhotoSendMain {
  mediaLink: string;
  thumbMediaLink: string;
}

export interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  propertyId: string;
  unreadCount: number;
}

export interface ConversationItem {
  list: UserConversation[];
  totalPages: number;
  currentPage: number;
  currentPageCount: number;
  totalItems: number;
}

export interface ListSupplier {
  conversationId: string;
  userId: string;
}

export interface BodyPostSendQuoteSupplier {
  listSuppliers: ListSupplier[];
  conversationId: string;
}

export interface ConversationOptions {
  ticketCategoryId: string;
  text: string;
  status: string;
  mediaUploadUI: boolean;
  conversationTopic: string;
  userId: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  propertyType: string;
  isPrimary: boolean;
}

export interface SendBulkMessageResponse {
  categoryId: string;
  propertyId: string;
  status: string;
  userId: string;
  personUserId: string;
  categoryMessage: string;
  contentMessage: string;
  options: ConversationOptions;
  fileIds: string[];
  taskId: string;
  conversationId: string;
}

export interface KeywordItemType {
  id: string;
  key: string;
  keyword: string;
  name: string;
  taskName: string;
  score: number;
  topic: string;
}

export interface KeywordIntent {
  intents: KeywordItemType[];
  keyword: string;
}

export interface getListLandlordConversationByTaskResponse {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  status: string;
  inviteSent: string;
  lastActivity?: string;
  offBoardedDate?: string;
  propertyId: string;
  userPropertyId: string;
  isPrimary: boolean;
  conversationId: string;
}

export interface PreviewConversation {
  id?: string;
  taskId?: string;
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
  messageOwner?: string;
  message?: string;
  messageDate?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  type?: EUserPropertyType | string;
  status?: string;
  propertyType?: EUserPropertyType | string;
  startMessageBy?: EUserPropertyType | string;
  lastUser?: LastUser;
  isRead?: boolean;
  isSeen?: boolean;
  isUrgent?: boolean;
  channelUserId?: string;
  isForwardEmail?: boolean;
  isHasTrudiResponse?: boolean;
  messageOptions?: string;
  timeAgo?: string;
  trudiResponse?: TrudiResponse;
  email?: string;
  phoneNumber?: string | number;
  participants?: Participant[] | IParticipant[] | IConversationParticipant[];
  summaryMessage?: string;
  contactType?: string;
  scheduleMessageCount?: number;
  isSendFromEmail?: boolean;
  invisibleInApp?: boolean;
  messageComeFrom?: EMessageComeFromType;
  attachmentCount?: number;
  messageType?: string | null | EMessageType;
  textContent?: string;
  propertyId?: string;
  streetline?: string;
  title?: string;
  inviteStatus?: UserStatus;
  categoryName?: string;
  syncStatus?: string;
  threadId?: string;
  isMultipleContact?: boolean;
  isSyncedAttachment?: boolean;
  lastMessageType?: EMessageType;
  lastMessageTypeToShow?: string;
  options?: string;
  lastMessage?: Partial<IMessage>;
  user?: Partial<ICurrentUser>;
  messageCount?: number;
  totalMessages?: number;
  property?: Property;
  isDraft?: boolean;
  isScratchDraft?: boolean;
  isLastMessageDraft?: boolean;
  conversationSyncDocumentStatus?: string;
  conversationSyncDocumentAt?: string;
  isAutomatedReply?: boolean;
  isAppMessageLog?: boolean;
  conversationType?: EConversationType;
  draftMessageId?: string;
  isScratchTicket?: boolean;
  endSession?: string;
  crmStatus?: string;
  offBoardedDate?: string;
  lastMessageDate?: string;
  createdFrom?: ECreatedFrom;
  linkedTask?: {
    assignToAgents: [];
    conversation: any;
    id: string;
    indexTitle: string;
    status: string;
    taskGroupId: string;
    taskName: {
      id: string;
      name: string;
    };
    title: string;
    topicId: string;
    topicName: string;
  };
  parentConversationId?: string;
  downloadingPDFFile?: boolean;
  propertyStatus?: EPropertyStatus;
  isTemporaryProperty?: boolean;
  emailVerified?: string | null;
  isDetectedContact?: boolean;
  page?: {
    id: string;
    name: string;
    avatar: string;
  };
  taskType?: string;
  secondaryEmail?: string;
  secondaryEmails?: {
    id?: string;
    email?: string;
    userId?: string;
  }[];
  isGenerateSummary?: boolean;
  countUnreadTicket?: number;
  lastSessionId?: string;
  channelUser?: {
    externalId?: string;
  };
  lastSummaryUpdatedAt?: string;
  channelId?: string;
  isPmJoined?: boolean;
  mailBoxAddress?: string;
  mailBoxId?: string;
  isHasTicketSession?: boolean;
  lastPmJoined?: ILastPmJoined;
  fromPhoneNumber?: string;
}

export interface ILastPmJoined {
  id: string;
  firstName: string;
  lastName: string;
  userType: UserTypeEnum;
}

export interface IConversationParticipant {
  id?: string;
  user?: Partial<ICurrentUser>;
  userId?: string;
  isTemporary?: boolean;
}

export interface IInternalNote {
  id: string;
  userId: string;
  internalNoteId: string;
  internalNote: {
    id: string;
    friendlyId: number;
    text: string;
    createdAt: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface IParticipant {
  userId: string;
  conversationId: string;
  minCreatedAt: string;
  updatedAt: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  type: string;
  userPropertyType: string;
  contactType: string;
  isExpand?: boolean;
  isReAssign?: boolean;
  id?: string;
  propertyId?: string;
  iviteSent?: string;
  lastActivity?: string;
  offBoardedDate?: string;
  trudiUserId?: string;
  title?: string;
  isUnidentifiedContact?: boolean;
  emailMetadataType: string[];
  userProperties: { type: string }[];
  userPropertyId: string;
  isTemporary: boolean;
  originalEmailName: string;
  userPropertyContactType?: IUserPropertyContactType;
  isPrimary: boolean;
  recognitionStatus?: ERecognitionStatus;
  secondaryEmails?: {
    id?: string;
    email?: string;
    userId?: string;
  }[];
  showUserName?: boolean;
  isBelongToOtherProperties?: boolean;
  name?: string;
  lastRole?: string;
  createdAt?: string;
  externalId?: string;
  fullName?: string;
}

export interface IParticipantContact extends IParticipant {
  senderName?: string;
  senderRole?: EExcludedUserRole;
  pmName?: string;
  crmStatus?: string;
  userType?: string;
  userTitle?: string;
  name?: string;
}

export interface ReiFormOption {
  name: string;
  regionId: string;
  url: string;
  id?: string;
  isActive?: boolean;
  token?: string;
}

export interface GetReiFormOptionsResponse {
  reiFormDomain: ReiFormOption[];
}

export interface MarkReadMaintenanceNote {
  id: string;
  taskId: string;
  propertyId: string;
  userId: string;
  isRead: boolean;
  readedAt: number;
}

export interface MaintenanceNote extends TypeNote {
  maintenanceNote: string;
  readedAt?: string;
}

export interface TypeNote {
  type: string;
  note?: string;
  isRead?: boolean;
  expenditureLimit?: string;
  entityId?: string;
}

export interface IComplianceCategory {
  id: string;
  idPropertyTree: string;
  name: string;
  type: string;
  agencyId: string;
  deleted: boolean;
}

export interface IListConvertMultipleTask {
  listConversationMove: IListConversationConfirmProperties[];
  listConversationNotMove: IListConversationConfirmProperties[];
}

export interface IListConversationConfirmProperties {
  categoryId?: string;
  contactType?: string;
  id?: string;
  email?: string;
  firstName?: string;
  isUrgent?: boolean;
  isUnindentifiedProperty?: boolean;
  lastName?: string;
  propertyId?: string;
  propertyName?: string;
  propertyType?: EUserPropertyType;
  regionId?: string;
  regionName?: string;
  streetline?: string;
  shortenStreetline?: string;
  taskId?: string;
  type?: string;
  isChecked?: boolean;
  message?: string;
  textContent?: string;
  title?: string;
  scheduleMessageCount?: number;
  attachmentCount?: number;
  messageComeFrom?: EMessageComeFromType;
  phoneNumber?: string | number;
  options?: string;
  agencyId?: string;
  newPropertyId?: string;
  newTaskId?: string;
  isTemporaryProperty?: boolean;
  conversationType?: EConversationType;
  participants?: IParticipant[];
  channelUser?: {
    externalId?: string;
  };
  externalId?: string;
}
export interface MoveMessagesResponse {
  conversation: MoveConversation;
  isSuccess: boolean;
}

export interface MoveConversation {
  id: string;
  title: string;
  taskId: string;
  propertyId: string;
  property: Property;
  task?: TaskItem;
}

export interface MovableMessages {
  moveableMessages: MoveConversation[];
  immovableMessages: MoveConversation[];
}

export interface IConversationMove {
  currentConversation: UserConversation;
  currentMailBoxId: string;
  isAppMessage?: boolean;
}

export interface IRemoveAppMessagePayload {
  mailBoxId: string;
  conversationId: string;
  newStatus: string;
}

export interface ICreateNewConversationApp {
  taskId: string;
  conversationId: string;
  taskStatus?: string;
  createFromScratch?: boolean;
  callback?: (data: ICreateNewConversationApp) => void;
  tempConversationId?: string;
}
