import { LinkedTaskListDataType } from '@shared/types/calendar.interface';
import { EEventStatus, EEventType } from '@shared/enum/calendar.enum';
import { EEventTypes } from '@shared/enum/share.enum';
import { RegionInfo } from '@shared/types/agency.interface';
export interface ICalendarResponse {
  date: string;
  events: ICalendarEvent[];
}

export interface ICalendarEvent {
  id: string;
  date?: string;
  eventDate: string;
  eventType: EEventType;
  eventName: string;
  subEventId: string;
  isTriggedTask: boolean;
  taskId: string;
  startTime: string;
  endTime: string;
  streetline: string;
  index: string;
  taskCreatedAt: string | Date;
  taskName: string;
  propertyId: string;
  region?: RegionInfo;
  eventStatus: EEventStatus;
  totalLinkedTask: number;
  isSelected?: boolean;
  linkedTaskTitles: string[];
  isDuplicateCreateTask?: boolean;
  label?: string;
  linkedTasks?: LinkedTaskListDataType[];
  expired?: number | string;
  tenancyTenantName?: string;
  latestLinkedTask?: ILatestLinkedTask;
  defaultTime?: string;
  ptStatus?: string;
  inspectionStatus?: string;
}

export interface ILatestLinkedTask {
  taskId: string;
  task: ITask;
}

export interface ITask {
  id?: string;
  title: string;
  createdAt?: string;
}

export interface ICalendarEventParam {
  startDate: string | Date;
  endDate: string | Date;
  pageIndex?: string;
  pageSize?: string;
  search: string;
  filter: ICalendarFilter;
  date?: string;
  isFocusedView?: boolean;
  companyId?: string;
  isShowEventWithoutTasks: boolean;
}

export interface ICalendarFilter {
  eventTypes: string[];
  propertyManagerIds: string[];
  agencyIds: string[];
}

export interface IWeekTittle {
  key: string;
}

export interface IToolbar {
  key?: string;
  icon?: string;
  label?: string;
  dataE2E?: string;
  action?: () => void;
  count?: number;
  disabled?: boolean;
}

export enum PopUpBulkCreateTasks {
  CONFIRM_EVENT_TYPE = 'CONFIRM_EVENT_TYPE',
  CHECKING_FOR_DUPLICATES = 'CHECKING_FOR_DUPLICATES',
  CREATE_TASKS = 'CREATE_TASKS',
  BULK_TASKS_IS_CREATING = 'BULK_TASKS_IS_CREATING',
  FAILED_TO_CREATE_TASK = 'FAILED_TO_CREATE_TASK',
  SELECT_OPTION_FOR_SEND_MESSAGE = 'SELECT_OPTION_FOR_SEND_MESSAGE',
  SEND_MESSAGE = 'SEND_MESSAGE',
  VIEW_TASKS = 'VIEW_TASKS'
}

export interface CountEventType {
  type: string | EEventTypes;
  label: string;
  quantity: number;
}

export interface ICalendarEventFilter {
  label: string;
  value: string;
}

export enum RadioOptionSendMessage {
  TRIGGER_STEP_FROM_TASK = 'TRIGGER_STEP_FROM_TASK',
  SEND_CUSTOM_MESSAGE = 'SEND_CUSTOM_MESSAGE'
}
