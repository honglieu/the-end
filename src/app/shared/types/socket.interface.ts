import { UserStatus } from '@shared/enum/user.enum';
import {
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import {
  NotificationStatusEnum,
  NotificationTypeEnum
} from '@shared/enum/notification.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  AssignToAgent,
  StatusResultBulkCreateTask,
  TaskCreate,
  TaskItem
} from './task.interface';
import {
  IConversationParticipant,
  IParticipant,
  Participant,
  PreviewConversation
} from './conversation.interface';
import { EMessageEmailStatusEnum } from '@shared/enum/mesageEmailStatus.enum';
import { AgencyConsoleSetting } from './agency.interface';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { IMailBox, SpamFolder } from './user.interface';
import { EIntegrationsStatus } from '@/app/profile-setting/utils/integrations.interface';
import {
  ICurrentViewNoteResponse,
  IInternalNote
} from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import {
  IEmailClientFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { IEmailLabel } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { ISendIvitedUser } from '@/app/user/list-property-contact-view/model/main';
import { EConversationType } from '@shared/enum';
import {
  EPageMessengerConnectStatus,
  EPageMessengerConnectType
} from '@/app/dashboard/shared/types/facebook-account.interface';
import { StepDetail } from '@/app/task-detail/modules/steps/utils/stepType';
import { WhatsAppConnectStatus } from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { IOptionTicket, IPolicyNotification, OptionProperty } from '..';

export interface SocketNotifySendBulkMessageDoneData {
  type: string;
  messageSended: number;
  socketTrackId?: number;
  totalMessage: number;
  status: SyncPropertyDocumentStatus;
  isResolveConversation?: boolean;
  messages?: TaskItem[];
  mailBoxId?: string;
  taskType?: TaskType;
}

export interface SocketNotifySendManyEmailMessageDone {
  type: string;
  messageSended: number;
  socketTrackId?: number;
  totalMessage: number;
  status: SyncPropertyDocumentStatus;
  isResolveConversation?: boolean;
  messages?: TaskItem[];
}

export enum SyncPropertyDocumentStatus {
  NOT_SYNC = 'NOT_SYNC',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}
export interface SocketNotifySyncPropertyDocumentToPTData {
  type: string;
  propertyDocumentId: string;
  fileName?: string;
  status: SyncPropertyDocumentStatus;
  companyId: string;
}
export interface SocketSendData extends Partial<PreviewConversation> {
  id: string;
  conversationId: string;
  userId: string;
  type: string;
  taskId: string;
  messageType: string | null | EMessageType;
  propertyId: string;
  categoryId: string;
  message: string | null;
  messageDate?: string;
  senderName: string;
  senderType?: string;
  googleAvatar: string;
  userType: string;
  title?: string;
  agencyId: string;
  userPropertyType?: string;
  userPropertyId?: string;
  lastName: string;
  firstName: string;
  userTitle?: string;
  isSendFromEmail?: boolean;
  options?: any;
  messageCall?: MessageCallSocketSendData;
  ticket?: any;
  idRead?: boolean;
  callerAvatar?: string;
  callerFirstName?: string;
  callerLastName?: string;
  params?: any;
  callType?: string;
  inviteStatus: UserStatus;
  messageComeFrom?: EMessageComeFromType;
  isUrgent?: boolean;
  attachmentCount?: number;
  isResolveConversation?: boolean;
  bulkMessageId?: string;
  isSyncMail?: boolean;
  isReadFromSyncMail?: boolean;
  isDraft?: boolean;
  draftMessageId?: string;
  companyId: string;
  hasRemainingDraft?: boolean;
  mailBoxId?: string;
  conversationType?: EConversationType;
  assignToAgents?: AssignToAgent[];
}

export interface MessageCallSocketSendData {
  createdAt: string;
  endedAt: string | null;
  participiants: any[];
  callTime: string;
  callToPhoneNumber: string;
  hadRecord: boolean;
  messageId?: string;
}

export interface SocketCallData {
  id: string;
  pushMsgType?: any;
  callerAvatar: string | null;
  callerFirstName: string | null;
  callerLastName: string | null;
  agencyName: string | null;
  userToken: string;
  roomName: string;
  callLink: string;
  messageType?: string;
  messageCallId: string;
  conversationId: string;
  categoryId: string;
  propertyId: string;
  userId: string;
  userPropertyId?: string;
  userType?: string;
  title?: string;
  agencyId: string;
  callType?: string;
  messageCall: MessageCallSocketCallData;
  googleAvatar?: string;
  senderName?: string;
  senderType?: string;
  lastName?: string;
  isSendFromEmail?: boolean;
  socketTrackId: string;
  textContent?: string;
}

export interface SectionCount {
  completed: string;
  deleted: string;
  unassigned: string;
  inprogress: string;
}

export interface SocketUnreadCountData {
  taskCount: SectionCount;
  unreadCount: SectionCount;
  agencyId: string;
  type: string;
}

export interface SocketNotificationData {
  id: string;
  type: SocketType;
  taskId: string;
  taskStatus: TaskStatusType;
  agencyId: string;
  notiType: NotificationTypeEnum;
  conversationId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: NotificationStatusEnum;
  propertyAddress?: string;
  socketTrackId?: string;
  options?: OptionProperty | IPolicyNotification;
}

export interface MessageCallSocketCallData {
  hadRecord?: boolean;
  createdAt: string;
  endedAt: string | null;
  messageId?: string;
  participiants: {
    messageCallId: string;
    userId: string;
  };
}

export interface SyncInvoiceSocketData {
  type: string;
  syncStatus: string;
  lastTimeSync?: string;
  agencyId: string;
  status?: string;
  taskId: string;
}
export interface SocketUnreadTask {
  agencyId: string;
  companyId: string;
  type: string;
  mailBoxId?: string;
}

export interface SocketUpdateAgencyStatus {
  agencyId: string;
  type: string;
  env: string;
  isActive: boolean;
}
export interface SocketMessage extends Partial<TaskItem> {
  agencyId: string;
  type: SocketType;
  env: string;
  socketTrackId: string;
  taskIds?: string[];
  inboxType?: string;
  isResolveConversation?: boolean;
  id: string;
  mailBoxId?: string;
  companyId: string;
  fromUserId?: string;
  newStatus?: TaskStatusType;
  isDetectedContact?: boolean;
  isAutoReopenedByPM?: boolean;
}

export interface SocketJob {
  agencyId: string;
  jobId: string;
  taskId: string;
  type: SocketType;
  conversationId: string;
  action: string;
  reminderTime?: string;
  conversationIds?: string[];
  isFromCreateMessage?: boolean;
}

export interface SocketUpdateMessageViaEmailStatus {
  messageId: string;
  emailStatus: EMessageEmailStatusEnum;
  conversationId: string;
  emailStatusChangeDate: Date;
  type: SocketType;
}
export interface SocketAgencyTopics {
  agencyId: string;
  companyId: string;
}

export interface SocketWidgetCallData {
  type: SocketType;
  taskIds: string[];
  agencyId: string;
  conversationId?: string;
}

export interface SocketAgencyAction {
  type: SocketType;
  env: string;
  socketTrackId: string;
  data: AgencyConsoleSetting;
  companyId: string;
}

export interface ISocketData<T> {
  type: SocketType;
  data: T;
  env?: string;
  taskId?: string;
  agencyId?: string;
  fromUserId?: string;
  socketTrackId?: string;
  conversationId?: string;
  mailBoxId?: string;
  taskFolderId?: string;
  notes?: IInternalNote[];
  note?: IInternalNote;
  isAutoReopen?: boolean;
}

export interface ISocketMailBox {
  agencyId: string;
  companyId: string;
  mailBoxId: string;
  status: EMailBoxStatus;
  type: string;
  lastTimeSync?: string;
  spamFolder?: SpamFolder;
}

export interface ISocketChangeOwner {
  agencyId: string;
  type: string;
}

export interface ISocketMailboxMember {
  data: IMailBox;
  agencyId?: string;
  companyId?: string;
  type: string;
}

export interface ISocketBulkMail {
  companyId: string;
  sendInvitedUsers: Array<ISendIvitedUser>;
  message: string;
  type: string;
  socketTrackId: string;
}

export interface ISocketOutlookMailBox {
  agencyId: string;
  socketTrackId: string;
  status: EIntegrationsStatus;
  type: string;
}

export interface ISocketConvertMultipleTask {
  agencyId: string;
  current: number;
  fromUserId: string;
  socketTrackId: string;
  total: number;
  type: string;
  sessionId?: string;
}

export interface ISocketSyncMailboxProgress {
  agencyId: string;
  env: string;
  mailBoxId: string;
  socketTrackId: string;
  status: EMailBoxStatus;
  totalItemCount: number;
  totalMessageSynced: number;
  type: SocketType;
}

export interface ISocketSyncConversationToCRM {
  type?: string;
  status?: string;
  conversationIds: string[];
  companyAgentId?: string;
  timestamp?: string;
  conversationSyncDocumentAt?: string;
  conversationSyncDocumentStatus?: string;
  companyId?: string;
  userId?: string;
  conversationType?: string;
  downloadingPDFFile?: boolean;
}

export interface ISocketMoveConversations {
  agencyId: string;
  env?: string;
  fromUserId: string;
  isMoveMultiple?: boolean;
  mailBoxId: string;
  newTaskId: string;
  socketTrackId: string;
  status?: string;
  type: string;
  conversationIds?: string[];
}

export interface ISocketMoveConversation {
  agencyId: string;
  env?: string;
  fromUserId: string;
  isMoveMultiple?: boolean;
  mailBoxId: string;
  newTaskId: string;
  socketTrackId: string;
  status?: string;
  type: string;
  conversationId?: string;
}

export interface INewNoteMentionSocket {
  notes?: IInternalNote[];
  taskId: string;
  agencyId: string;
  type: SocketType;
}

export interface IEditNoteMentionSocket extends INewNoteMentionSocket {
  note?: IInternalNote;
}
export interface ICurrentNoteViewedSocket {
  agencyId: string;
  data: ICurrentViewNoteResponse;
  type: SocketType;
}

export interface SocketBulkCreateTask {
  agencyId: string;
  data: TaskCreate;
  sessionCreateTaskId: string;
  status: StatusResultBulkCreateTask;
  type: string;
}

export interface ISocketSeenConversation {
  agencyId: string;
  mailBoxId: string;
  conversationId?: string;
  taskId?: string;
  threadIds?: string[];
  externalId?: string;
  taskType: string;
  type: string;
  isSeen: boolean;
  env: string;
  socketTrackId: string;
  userId?: string;
  fromUserId: string;
  isBulkSeen?: boolean;
  conversations?: ISocketListConversation[];
}

export interface ISocketListConversation {
  conversationId?: string;
  taskId?: string;
  taskType?: string;
}

export interface ISocketSeenEmailFolder {
  type: string;
  timestamp: number;
  socketTrackId: string;
  env: string;
  mailBoxId: string;
  fromFunction: string;
  companyId: string;
  isSeen: boolean;
  emails: ISocketListEmail[];
}

export interface ISocketListEmail {
  externalId?: string;
  threadIds?: string[];
}

export interface ISocketMoveTaskToNewGroup {
  env?: string;
  taskId?: string;
  agencyId?: string;
  socketTrackId?: string;
  conversationId?: string;
  notes?: IInternalNote[];
  note?: IInternalNote;
  companyId: string;
  mailBoxId: string;
  type: string;
  taskFolderId: string;
  taskGroupId: string;
  isShowToast: boolean;
  pmName: string;
  isAutoReopen: boolean;
  fromFunction: string;
  fromUserId: string;
  firstName: string;
  lastName: string;
  googleAvatar: string;
  data: {
    metaData: unknown[];
    taskGroup: ITaskGroup;
    tasks: ITaskRow[];
  };
}

export interface ISocketPullNewArrear {
  type: string;
  tenancyId: string;
  arrears: ISocketArrear[];
}

export interface ISocketArrear {
  amount?: number;
  daysInArrears: number;
  type: string;
}

export interface ISocketMessageToTask {
  conversationId: string;
  type: SocketType.messageToTask;
  status: TaskStatusType;
  taskId: string;
  newTaskId?: string;
  mailBoxId: string;
  fromUserId?: string;
}

export interface ISocketMoveMessageToFolder {
  agencyId: string;
  conversationIds?: string[];
  currentLabel?: IEmailLabel;
  currentStatus?: string;
  newLabel?: IEmailLabel;
  newStatus?: string;
  env: string;
  fromUserId?: string;
  listFail: {
    status: boolean;
    conversationId: string;
    threadId: string;
    taskId?: string;
    removeLabels?: IEmailLabel[];
    addLabels?: IEmailLabel[];
    isTask?: boolean;
  }[];
  listSuccess: {
    status: boolean;
    conversationId: string;
    threadId: string;
    taskId?: string;
    removeLabels?: IEmailLabel[];
    addLabels?: IEmailLabel[];
    isTask?: boolean;
  }[];
  mailBoxId: string;
  socketTrackId: string;
  threadIds?: string[];
  type?: SocketType.moveMessageToFolder;
  typeMove?: string;
  taskId?: string;
  isRemoveFromTask?: boolean;
  conversationInTaskId?: string;
}

export interface ISocketNewMailBoxFolder {
  agencyId: string;
  type: string;
  mailBoxId: string;
}

export interface ISocketSyncAttachmentEmailClient {
  threadIds: string[];
  mailBoxId: string;
  type: SocketType.syncAttachmentEmailClient;
}

export interface IUserDataUpdate {
  firstName: string;
  lastName: string;
  title: string;
  phoneNumber?: string;
}

export interface ISocketUserProfileUpdate {
  type: string;
  userId: string;
  dataUpdate: IUserDataUpdate;
  env: string;
  socketTrackId: string;
}

export interface ISocketEmailClientFolder {
  type: SocketType.emailClientFolder;
  mailBoxId: string;
  action: 'create' | 'update' | 'delete';
  message: string;
  folder: IEmailClientFolder;
  data: {
    changes: ISocketEmailClientFolderChanges;
  };
  env: string;
  socketTrackId: string;
}

export interface ISocketEmailClientFolderChanges {
  creates: IEmailClientFolder[];
  updates: IEmailClientFolder[];
  deletes: string[];
}

export interface ISocketUpdateMsgFolder {
  type: string;
  mailBoxId: string;
  dataRemovedLabel: {
    labelId: string;
    threadIds: string[];
  }[];
  dataAddedLabel: {
    labelId: string;
    threadIds: string[];
  }[];
  env: string;
  socketTrackId: string;
  messagesAddedInbox?: string[];
  messagesDeletedInbox?: string[];
}

export interface ISocketEndSession {
  type: string;
  endSession: string;
  env: string;
  socketTrackId: string;
  conversationLogId: string;
}

export interface ISocketNewConversationLog {
  type: string;
  conversationId: string;
  env: string;
  socketTrackId: string;
  mailBoxId: string;
  conversationLogId: string;
}

export interface SocketUserMailBoxUnread {
  type: string;
  unreadCount: number;
}

export interface ISocketNewUnreadNoteData {
  type: string;
  taskId: string;
  unreadCount: number;
  mailBoxId?: string;
}

export interface ISocketReloadInternalNoteData {
  type: string;
  taskId: string;
}

export interface ISocketInternalNoteChangeSeen {
  type: string;
  taskId: string;
  mailBoxId?: string;
}

export interface ISocketAssignContact {
  participants: IParticipant[];
  conversationId: string;
  taskId: string;
  userId: string;
  newUserId?: string;
  type: string;
  isDetectedContact?: boolean;
}

export interface ISocketSecondaryContact {
  participants: Participant[] | IParticipant[] | IConversationParticipant[];
  conversationId: string;
  taskId: string;
  userId?: string;
  newUserId?: string;
  oldUserId?: string;
  sessionId?: string;
  type?: string;
  isDetectedContact?: boolean;
}

export interface ISocketUnreadCountConversationInTask {
  taskId: string;
  type: string;
  mailBoxId: string;
  unReadCount: {
    taskId: string;
    unreadConversationCount: string[];
  };
}

export interface ISocketDeleteDraft {
  companyId: string;
  taskId: string;
  type: string;
  mailBoxId: string;
}
export interface ISocketReminderResponse {
  type: string;
  timestamp: number;
  socketTrackId: string;
  env: string;
  mailBoxId: string;
  companyId: string;
  data: ISocketReminderData;
  isUnIgnoreForTime?: boolean;
  isResolveOrReopenMessage?: boolean;
}

export interface ISocketReminderData {
  type: string;
  messages: ISocketReminderMessage[];
  companyId: string;
  mailBoxId: string;
  messagesRemoved?: ISocketReminderMessage[];
}

export interface ISocketReminderMessage {
  id: string;
  createdUserId: string;
  userType: string;
  reminderTime: string;
  reminderType: string;
}

export interface ISocketNewMailMessage {
  attachments?: any[];
  bcc?: string;
  cc?: string;
  companyId?: string;
  conversationId?: any;
  createdAt?: string;
  env?: string;
  externalId?: string;
  htmlContent?: string;
  id?: string;
  isActive?: boolean;
  isFromMail?: boolean;
  isRead?: boolean;
  isSyncedAttachment?: boolean;
  labels?: any[];
  mailBoxId?: string;
  mailId?: string;
  messageType?: any;
  options?: any;
  recipient?: string;
  replyTo?: string;
  sender?: string;
  socketTrackId?: string;
  subject?: string;
  textContent?: string;
  threadId?: string;
  timestamp?: string;
  type?: string;
  unhandledAttachmentCount?: number;
  updatedAt?: string;
}

export interface ISocketChangeConversationProperty {
  userId: string;
  conversationId: string;
  propertyId: string;
  type: SocketType.changeConversationProperty;
  companyId: string;
  taskId: string;
  mailBoxId: string;
  messageType: EMessageType.changeProperty;
  env: string;
  socketTrackId: string;
  googleAvatar: string;
  pmName: string;
  isShowToast: boolean;
  pushToAssignedUserIds: string[];
  participants?: Participant[];
  messageDate?: string;
  message?: string;
}

export interface ISocketVersionUpdateRequest {
  type: SocketType.versionUpdateRequest;
  buildDate: string;
  commitHash: string;
  deleteDB: boolean;
}
export interface ISocketSyncTaskActivityToPT {
  status: ESyncStatus;
  taskIds: string[];
  timestamp: number;
  socketTrackId: string;
  companyId: string;
  userId: string;
}

export interface ISocketChangeStatusTask {
  type: SocketType;
  timestamp: number;
  socketTrackId: string;
  env: string;
  companyId: string;
  fromUserId: string;
  fromFunction: string;
  taskId: string;
  taskTitle: string;
  taskType: string;
  propertyId: string;
  propertyShortenStreetline: string;
  googleAvatar: string;
  firstName: string;
  lastName: string;
  email: string;
  conversationId: string;
  pushToAssignedUserIds: string[];
  newStatus: string;
  mailBoxId: string;
  isShowToast: boolean;
  pmName: string;
  isConvertedToTask: boolean;
}
export interface ISocketGenerateMessageSummary {
  companyId: string;
  conversationId: string;
  env: string;
  lastSummaryUpdatedAt: string;
  mailBoxId: string;
  socketTrackId: string;
  taskId: string;
  type: SocketType;
  status?: string;
}

export interface ISocketTranscriptCompleted {
  companyId: string;
  conversationId: string;
  env: string;
  socketTrackId: string;
  taskId: string;
  type: SocketType;
  propertyDocument: {
    id: string;
    mediaLink: string;
    size: string;
  };
}

export interface ISocketDeleteLinkedConversation {
  type: string;
  timestamp: number;
  socketTrackId: string;
  env: string;
  taskId: string;
  conversationId: string;
  mailBoxId: string;
}

export interface ISocketPageFacebookMessenger {
  name: string;
  id: string;
  status: EPageMessengerConnectStatus;
  companyId?: string;
  avatar?: string;
  type?: EPageMessengerConnectType;
  externalId?: string;
  mailBoxId?: string;
  isNew?: boolean;
}

export interface ISocketPageWhatsAppMessenger {
  name: string;
  id: string;
  status: WhatsAppConnectStatus;
  companyId?: string;
  avatar?: string;
  type?: EPageMessengerConnectType;
  externalId?: string;
  mailBoxId?: string;
  isNew?: boolean;
}

export interface ISocketNewTicket {
  conversationId: string;
  taskId: string;
  sessionId: string;
  conversationType: EConversationType;
  mailBoxId: string;
  type: string;
  isNewTicket?: boolean;
  relatedMessageId?: string;
  ticketId?: string;
}

export interface ISocketUpdateTaskStep {
  data: StepDetail[];
  taskId: string;
  type: string;
  fromUserId: string;
  env: string;
  companyId: string;
  timestamp: string;
}

export interface ISocketUpdateDecision {
  taskId: string;
  type: string;
  fromUserId: string;
  env: string;
  companyId: string;
  firstName: string;
  lastName: string;
}

export interface ISocketReadTicket {
  conversationId: string;
  taskId: string;
  sessionId: string;
  conversationType: EConversationType;
  mailBoxId: string;
  companyId: string;
  type: string;
  channelId: string;
  userId: string;
}

export interface ISocketTicketChange {
  options: IOptionTicket;
  conversationId: string;
  propertyId: string;
  messageId: string;
  type: string;
  pushToAssignedUserIds: string[];
  env: string;
  socketTrackId: string;
  fromUserId: string;
}

export interface ISocketPmJoinConversation {
  type: string;
  timestamp: number;
  socketTrackId: string;
  env: string;
  taskId: string;
  conversationId: string;
  isPmJoined: boolean;
  fromFunction: string;
  userId: string;
}
