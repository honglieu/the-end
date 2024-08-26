import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { EMessageEmailStatusEnum } from '@shared/enum/mesageEmailStatus.enum';
import {
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { SendMesagePopupOpenFrom } from '@shared/enum/share.enum';
import { TaskType } from '@shared/enum/task.enum';
import { IFile, IFileType } from './file.interface';
import { SyncPropertyDocumentStatus } from './socket.interface';
import { TaskItemDropdown } from './task.interface';
import { IUserParticipant } from './user.interface';
import { EConversationType } from '@/app/shared/enum';
export interface IActionLink {
  messageId?: string;
  ticketCategoryId: string;
  text: string;
  status: string;
  mediaUploadUI: boolean;
  topicId?: string;
  conversationTopic: string;
  response: {
    payload?: {
      ticket?: ITicket;
    };
    type?: string;
    text?: string;
    function_call?: {
      name: string;
      arguments: string;
    };
  };
}

export interface IPropertyDocument {
  id: string;
  url: string;
  name: string;
  size: string;
  propertyId: string;
  fileTypeId: string;
  status: string;
  userId: string;
  showForLandlord?: any;
  showForTenant?: any;
  mediaLink: string;
  documentTypeId: string;
  tenantId?: any;
  isUserUpload: boolean;
  title?: any;
  createdAt: Date;
  fileType: IFileType;
  thumbMediaLink?: string;
  syncPTStatus?: SyncPropertyDocumentStatus;
}

export interface ITicketFile {
  id: string;
  fileId: string;
  messageId: string;
  propertyDocument: IPropertyDocument;
  isFileUnsupported?: boolean;
}

interface IDocumentType {
  name: string;
}

interface IUserPropertyFilePermission {
  userPropertyId: string;
}

export interface FileMessage {
  messageId?: string;
  conversationId: string;
  id: string;
  url: string;
  name: string;
  size: string;
  propertyId: string;
  fileTypeId: string;
  status: string;
  userId: string;
  thumbMediaLink: string;
  isShowFile: boolean;
  showForLandlord?: boolean;
  showForTenant?: boolean;
  mediaLink: string;
  documentTypeId: string;
  tenantId: string;
  isUserUpload: boolean;
  title: string;
  createdAt: Date;
  fileType: IFileType;
  documentType: IDocumentType;
  userPropertyFilePermissions: IUserPropertyFilePermission[];
  file: FileMessage;
  syncPTStatus?: SyncPropertyDocumentStatus;
  isForward?: boolean;
}

interface IMessageCallParticipiant {
  messageCallId: string;
  userId: string;
  joinedAt?: string;
}

interface IParticipiant {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  type: string;
  googleAvatar: string;
  messageCallParticipiant: IMessageCallParticipiant;
  joinedAt?: string;
}

interface IMessageCall {
  id: string;
  messageId: string;
  createUserId: string;
  endedAt: Date;
  createdAt: Date;
  participiants: IParticipiant[];
}

export interface MessageObject {
  type: string;
  value: string;
}

export interface FileObject {
  fileList: FileMessage[];
  mediaList: FileMessage[];
  unSupportedList: FileMessage[];
}

export interface IEmailMetadata {
  cc?: IUserParticipant[];
  to?: IUserParticipant[];
  bcc?: IUserParticipant[];
  from?: IUserParticipant[];
}

interface ICreator {
  id: string;
  firstName: string;
  email: string;
  lastName: string | null;
  title: string;
  type?: string;
  isTemporary?: boolean;
  facebookName?: string;
}

export interface IMessage {
  id: string;
  userId: string;
  conversationId: string;
  message?: string | MessageObject[];
  actionlinks?: IActionLink[];
  files?: FileObject;
  ticketFile: ITicketFile[];
  isRead: boolean;
  type: string;
  options?: IMessageOptions;
  bulkMessageId?: string;
  createdAt: string;
  categoryId: string;
  propertyId: string;
  userTitle?: string;
  status: string;
  firstName: string;
  lastName: string;
  userType: string;
  messageCall?: IMessageCall;
  file?: FileMessage;
  messageType: EMessageType;
  actionLink?: IActionLink;
  googleAvatar?: string;
  userPropertyType: string;
  agencyName: string;
  agencyOutgoingEmail: string;
  agencyPhoneNumber?: string;
  isShowFile: boolean;
  isSendFromEmail: boolean;
  isSendFromVoiceMail?: boolean;
  inviteStatus?: string;
  iviteSent?: string;
  lastActivity?: string;
  offBoardedDate?: string;
  isUserPropetyTree?: boolean;
  senderType?: string;
  color?: string;
  svg?: string;
  user?: userMessageData;
  ticketCategoryInfo?: any;
  callType?: string;
  conversationTitle?: string;
  agencyEmail?: string;
  isPrimary?: boolean;
  email?: string;
  emailStatus?: EMessageEmailStatusEnum;
  emailStatusChangeDate?: Date;
  idUserPropertyGroup?: string;
  isUrgent?: boolean;
  createdFrom?: EMessageComeFromType;
  isSending?: boolean;
  isError?: boolean;
  mailMessageId?: string;
  emailMetadata?: IEmailMetadata;
  voiceMailPhoneNumber?: string;
  crmStatus?: string;
  cloneConversationId?: string;
  textContent?: string;
  isLastReadMessage?: boolean;
  conversationLogId?: string;
  languageCode?: string;
  messagesTranslate?: string;
  isSyncedAttachment?: boolean;
  unhandledAttachmentCount?: number;
  messageComeFrom?: string;
  name?: string;
  isDraft?: boolean;
  replyToMessageId?: string;
  draftMsg?: IMessage;
  draftMessageId?: string;
  title?: string;
  taskId?: string;
  mailMessageRead?: boolean;
  isAutomatedReply?: boolean;
  fromPhoneNumber?: string;
  isMarkUnRead?: boolean;
  creator?: ICreator;
  messageDate?: string;
  sendOptions?: {
    time?: string;
    type: string;
  };
  messageReply?: IMessage;
  isFirstUnread?: boolean;
  userSendType?: string;
  replyConversationType?: EConversationType;
  classForMarker?: string;
  conversationType: EConversationType;
}

export interface IGroupedMessage {
  timestamp: string;
  messages: IMessage[];
  messageMap?: Map<string, IMessage>;
}

export interface IPeopleFromViaEmail {
  file: FileMessage;
  type: 'SEND_INVOICE' | 'SEND_LANDLORD';
}

export interface CreateNewTaskUnHappyResponse {
  conversationId: string;
  taskId: string;
}

export interface userMessageData {
  id: string;
  email?: string;
  firstName?: string;
  googleAvatar?: string;
  lastName?: string;
  title?: string;
  type?: string;
}

export interface sendMessageData {
  sender: string;
  title: string;
  task: TaskItemDropdown;
  messageText?: string;
  files: IFile[];
  users: any[];
  markAsResolved: boolean;
  openFrom: SendMesagePopupOpenFrom;
  forwardButton?: ForwardButtonAction;
}

export interface IMessageOptions {
  status?: EScheduledStatus;
  endTime?: string;
  reason?: string;
  startTime?: string;
  type?: EOptionType | string;
  contacts?: string;
  ticket?: {
    ticketCategoryId?: string;
  };
  ticketCategoryId?: string;
  inspectionId?: string;
  response?: ITicketResponse;
}

export enum EScheduledStatus {
  PENDING = 'PENDING',
  DECLINED = 'DECLINED',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED'
}

export enum EStatusTicket {
  SUBMIT = 'Submitted',
  CANCEL = 'Cancelled',
  PENDING = 'Pending'
}

export enum ECallTranscript {
  CALL_TRANSCRIPT = 'Call Transcript',
  CORRESPONDENCE_OWNER = 'Correspondence - Owner',
  CORRESPONDENCE_TENANT = 'Correspondence - Tenant',
  CALL_SCREENCAST = 'Call Screencast',
  CALL_VOICE_RECORD = 'Call Voice Record',
  CALL_SCREENSHOT = 'Call Screenshot'
}

export enum ETooltipQuoteMessage {
  SHOW_SIGNATURE = 'Show email signature',
  HIDE_SIGNATURE = 'Hide email signature',
  SHOW_QUOTE = 'Show message history',
  HIDE_QUOTE = 'Hide message history'
}

export interface ITicket {
  mediaUploadUI: boolean;
  conversationTopic: string;
  categoryId: string;
  status: EStatusTicket;
  updatedAt: string;
  consoleTitle: string;
  isShowConsole: boolean;
  svg: string;
  color: string;
  colorType: string;
  titleOfTopic: string;
  landlord: boolean;
  tenant: boolean;
  topicId: string | null;
  message: string;
  createdFrom: string;
  createdAt: string;
  name: string;
  isUrgent: boolean;
  ticketTrans: string;
  ticketLanguageCode: string;

  // Optional properties based on different request types
  general_inquiry?: string;
  maintenance_object?: string;
  move_out_date?: string;
  lease_end_date?: string;
  vacate_type?: Array<{ title: string; value: string }>;
  reschedule_reason?: string;
  availability?: string;
  date_availability?: string;
  time_availability?: string;
  note?: string;
  id?: string;
  key_request?: string;
  pet_request?: string;
  break_in_incident?: string;
  key_handover_request?: string;
  domestic_violence_support?: string;
  call_back_request?: string;
  change_tenant_request?: string;
  ask_property_manager?: string;
  request_inspection_reschedule?: string;
  submit_vacate_request?: string;
  log_maintenance_request?: string;
  pet_description?: string;
  key_request_reason?: string;
  incident_detail?: string;
  situation?: string;
  available_time?: string;
  available_date?: string;
  request_summary?: string;
  maintenance_issue?: string;
  safety_description?: string;
  call_back_reason?: string;
  need_human_follow_up?: string;
  noted_issues?: string;
  urgency?: string;
  change_tenancy_details?: string;
}

export interface ITicketResponse {
  type: string;
  text: string;
  payload: {
    ticket: ITicket;
  };
}

export interface IOptionTicket {
  response: ITicketResponse;
  status: EStatusTicket;
}

export interface IEmitNavigateTaskParams {
  taskId: string;
  status: string;
  ticket: any;
}
