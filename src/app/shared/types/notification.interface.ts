import { IInternalNote } from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import {
  NotificationStatusEnum,
  NotificationTypeEnum
} from '@shared/enum/notification.enum';
import { RegionId } from '@shared/enum/region.enum';
import { EInvoiceTaskType } from '@shared/enum/share.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { RegionInfo } from './agency.interface';
import { SocketNotificationData } from './socket.interface';
import { EConversationType } from '@shared/enum';
import { EPolicyType } from '@/app/dashboard/modules/agency-settings/enum/account-setting.enum';
import { IComment } from '@/app/task-detail/modules/steps/utils/comment.interface';

export interface Notification extends SocketNotificationData {
  id: string;
  notiType: NotificationTypeEnum;
  userId: string;
  conversationId?: string;
  options?: OptionProperty | IPolicyNotification;
  status: NotificationStatusEnum;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  taskName: string;
  taskStatus: TaskStatusType;
  propertyAddress?: string;
  agencyId: string;
  deepLink: string;
  userMessage: UserMessage;
  message?: string;
  messageId: string;
  conversationTitle?: string;
  taskType?: TaskType;
  taskTitle?: string;
  countTask?: number;
  eventDate?: string;
  eventId?: string;
  parentRegionId?: string;
  mailBox?: Mailbox;
  conversationType: EConversationType;
  parentConversation?: {
    id: string;
    isCompose: boolean;
    taskId: string;
  };
}

export interface Mailbox {
  id: string;
  name: string;
  emailAddress: string;
}

export interface NotificationByDate {
  date: string;
  notificationList: Notification[];
}

export interface NotificationCountApiResponse {
  isEnableRedDot: boolean;
  unreadCount: number;
}

export interface NotificationApiResponse extends NotificationCountApiResponse {
  currentPageCount: number;
  totalItems: number;
  list: Notification[];
  totalPages: number;
  currentPage: number;
}

export interface UserMessage {
  firstName?: string;
  lastName?: string;
  isPrimary: boolean;
  propertyId?: string;
  type: string;
  userProperty?: NotiUserProperty;
}

export interface NotiUserProperty {
  isPrimary: boolean;
  propertyId: string;
  type: EUserPropertyType;
}

export interface OptionProperty {
  messageTitle?: string;
  user: UserOptions;
  taskType: TaskType;
  userConversation: UserMessage;
  isNoPortfolio: boolean;
  inspectionVariables?: InspectionVariables;
  inspectionId?: string;
  complianceCategoryId?: string;
  categoryName?: string;
  inspectionType?: string;
  type?: string;
  complianceId?: string;
  eventId?: string;
  eventDate?: string;
  calendarId?: string;
  reminderType: string | EInvoiceTaskType;
  taskNameId: string;
  propertyId: string;
  propertyAddress?: string;
  headerTitle?: string;
  idUserPropertyGroup: string;
  userPropertyGroupId: string;
  region: RegionInfo;
  regionId: RegionId;
  arrearId: string;
  email?: string;
  owner?: UserOptions;
  mailBoxId?: string;
  mailBox?: Mailbox;
  note?: IComment;
  stepId?: string;
}

export interface InspectionVariables {
  startTime: string;
  endTime: string;
  notification: string;
}

export interface UserOptions {
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  isPrimary: boolean;
  type?: string;
  id?: string;
}

export interface QueryParams {
  startDate?: string;
  endDate?: string;
  date?: string;
  eventId?: string;
  search?: string;
  assignedTo?: string;
  propertyManagerId?: string;
  messageStatus?: string;
  clearFilter?: boolean;
}

export interface IPolicyNotification extends OptionProperty {
  actionType: EPolicyType;
  policyName: string;
  policyId?: string;
  firstName?: string;
  role: string;
  createdTime?: string;
  updatedTime?: string;
  deletedTime?: string;
  isPolicyDeleted?: boolean;
}
