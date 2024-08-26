import { EMessageComeFromType } from '@shared/enum';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  IParticipant,
  PreviewConversation
} from '@shared/types/conversation.interface';
import {
  AssignToAgent,
  ITaskWorkflow,
  PhotoType
} from '@shared/types/task.interface';
import { Personal } from '@shared/types/user.interface';
import { ICurrentViewNoteResponse } from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import { Property } from '@/app/shared/types';
import {
  EGroupAction,
  ESortTaskType,
  ETaskViewSettingsKey,
  ETaskViewSettingsLabel
} from '@/app/dashboard/modules/task-page/utils/enum';

export interface IGetInfoTasksForPrefillDynamicBody {
  tasks: ITaskInfoToGetDataPrefill[];
}

export interface ITaskInfoToGetDataPrefill {
  taskId: string;
  propertyId: string;
}

export interface ITasksForPrefillDynamicData {
  summary: {
    summaryContent?: string;
    propertyDocuments?: PhotoType[];
  }[];
  property: {
    id: string;
    streetLine: string;
    shortenStreetLine: string;
    regionName: string;
  };
  taskId: string;
  conversations: ITaskConversation[];
  ownerships: Personal;
  tenancies: Personal;
  taskName?: string;
  taskTitle?: string;
}

export interface ITaskConversation {
  id: string;
  userId: string;
  status?: string;
  scheduleMessageCount?: number;
  conversationType: EMessageComeFromType;
  mailBoxId?: string;
  participants: IConversationParticipant[];
}

export interface IConversationParticipant {
  conversationId: string;
  user: IParticipant;
  propertyId: string;
  userId?: string;
  email?: string;
  type?: string;
}

export interface ITaskRow {
  id: string;
  status: TaskStatusType;
  indexTitle: string;
  title: string;
  taskGroupId: string;
  type: TaskType;
  mailBoxId?: string;
  unreadConversations?: string[];
  isAutoReopen: boolean;
  isExistScheduledMessage?: boolean;
  isExistInternalNote?: boolean;
  isSeen?: boolean;
  isUrgent: boolean;
  property: Property;
  workflow?: ITaskWorkflow;
  assignToAgents: AssignToAgent[];
  conversations: PreviewConversation[];
  currentNoteViewed: ICurrentViewNoteResponse;
  calendarEvents?: Partial<ICalendarEvent>[];
  calendarEventPreview?: {
    id?: string;
    calendarEvent: ICalendarEvent;
  }[];
  createdAt: string;
  updatedAt: string;
  updatedAtOfTask: string;
  checked?: boolean;
  internalNoteUnreadCount: number;
  isDeleting?: boolean;
  isSelected?: boolean;
  propertyId?: string;
  conversationId?: string;
}

export interface ITaskPreviewPayload {
  taskId: string;
  taskStatus?: TaskStatusType;
  folderId?: string;
  isFocusedView?: boolean;
}

export interface IIcon {
  icon: string;
  src: string;
  name: string;
}

export interface IGroupAction {
  id: EGroupAction;
  label: string;
  icon?: string;
  color?: string;
  divider?: boolean;
  disabled?: boolean;
}

export interface ISortTaskType {
  id: ESortTaskType;
  label: string;
  icon: string;
}

export interface ITaskViewSettings {
  id: ETaskViewSettingsKey;
  label: ETaskViewSettingsLabel;
  isChecked: boolean;
}

export interface ITaskViewSettingsStatus {
  showProgress: boolean;
  showCalenderDates: boolean;
  showAssignee: boolean;
  showOpenedCompletedDates: boolean;
}
