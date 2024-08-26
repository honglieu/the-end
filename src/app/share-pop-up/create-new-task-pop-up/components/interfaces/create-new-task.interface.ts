import { TaskItemDropdown, TaskRegionItem } from '@shared/types/task.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { Observable } from 'rxjs';

export interface TaskAndPropertySelectionData {
  defaultTaskFolderMailBoxId: string;
  isRemember: boolean;
  taskNameId: string;
  aiSummary?: boolean;
  taskNameRegionId?: string;
  assignedUserIds: string[];
  propertyId: string;
  options?;
  taskNameTitle?: string;
  notificationId?: string;
  eventId?: string;
  indexTitle?: string;
  taskTitle?: string;
  successCallBack?: Observable<any>;
  mailBoxId?: string;
  taskFolderId: string;
  agencyId?: string;
}

export interface TaskSetting {
  response?: Record<string, any>;
  tasks?: TaskItemDropdown[];
  templates?: TaskRegionItem[];
}

export interface Property extends UserPropertyInPeople {}

export enum CreateTaskStep {
  TASK_STEP = 1,
  ASSIGNEE_STEP = 2,
  FOLDER_STEP = 3
}

export enum PropertyStatus {
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED'
}

export enum CreateTaskSource {
  MESSAGE = 'MESSAGE',
  TASK = 'TASK',
  CALENDAR = 'CALENDAR',
  CONVERT_TO_TASK = 'CONVERT_TO_TASK',
  TASK_DETAIL = 'TASK_DETAIL',
  CREATE_NEW_TASK = 'CREATE_NEW_TASK',
  CREATE_MULTIPLE_TASK = 'CREATE_MULTIPLE_TASK',
  CREATE_BULK_MULTIPLE_TASK = 'CREATE_BULK_MULTIPLE_TASK',
  EMERGENCY_MAINTENANCE_TASK = 'EMERGENCY_MAINTENANCE_TASK', // Open from 'EMERGENCY_MAINTENANCE_TASK' when Emergency maintenance downgrade to routine maintenance
  CALENDAR_EVENT_BULK_CREATE_TASKS = 'CALENDAR_EVENT_BULK_CREATE_TASKS',
  NOTIFICATION = 'NOTIFICATION'
}
