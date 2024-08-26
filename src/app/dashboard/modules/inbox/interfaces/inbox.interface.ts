import { AppRouteName } from '@shared/enum';
import { Params } from '@angular/router';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { TaskRegion } from '@shared/types/task.interface';

export interface IGetListTopic {
  messagesTopics: IListTopic[];
  taskTopics: IListTopic[];
  unassignedTaskNames: IListTopic[];
}

export interface TopicTaskNameItem {
  id: string;
  order: number;
  taskName: {
    id: string;
    name: string;
    aiSummary?: boolean;
    parentTemplateId?: string;
  };
  taskNameRegions: TaskRegion[];
  taskNameId: string;
  topicId: string;
}

export interface IListTopic {
  id: string;
  name: string;
  order: number;
  type: TaskType;
  topicTaskNames: TopicTaskNameItem[];
}

export interface Toolbar {
  key?: string;
  icon?: string;
  label?: string;
  action?: (event?: MouseEvent) => void;
  count?: number;
  disabled?: boolean;
  tooltip?: string;
  dataE2e?: string;
  hideChildren?: boolean;
  routeName?: AppRouteName;
  children?: ToolbarChildren[];
}

export type ToolbarChildren = {
  grandchildren?: ToolbarItem[];
} & ToolbarItem;

export interface ToolbarItem {
  key?: string;
  icon?: string;
  label?: string;
  description?: string;
  hasSpecialStyle?: boolean;
  tooltip?: string;
  hideChildren?: boolean;
  action?: (item: ToolbarItem) => void;
  count?: number;
  disabled?: boolean;
  hideOption?: boolean;
  dataE2e?: string;
}

export interface ToolbarConfig {
  inprogress: Toolbar[];
  completed: Toolbar[];
  deleted: Toolbar[];
  spam?: Toolbar[];
  mailfolder?: Toolbar[];
}

export interface ResponseAuth {
  code?: string;
  scope?: string;
}

export interface ITaskFolder {
  id: string;
  icon: string;
  name: string;
  order: number;
  mailBoxId: string;
  taskCount?: number;
  unReadTaskCount?: number;
  taskGroups?: ITaskGroup[];
  canEditFolder?: boolean;
  queryParams?: Params;
  routerLink?: string;
  labelId?: string;
  agencyId?: string;
  unreadInternalNoteCount?: number;
  actionEditFolder?: boolean;
  createdAt?: string;
}

export type TaskFolderResponse = {
  taskFolders: ITaskFolder[];
  payload: {
    companyId: string;
  };
};

export interface ITaskGroup {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  taskFolderId: string;
  isCompletedGroup?: boolean;
}

export interface ITaskFolderRoute {
  id?: string;
  name: string;
  type: EFolderType;
  isOpen: boolean;
  icon: string;
  children: ITaskFolder[];
  folderType?: EFolderType;
  mailBoxName?: string;
  order?: number;
}

export enum EFolderType {
  TASKS = 'TASKS',
  MORE = 'MORE',
  MAIL = 'MAIL',
  GMAIL = 'GMAIL',
  APP_MESSAGES = 'APP_MESSAGES',
  EMAIL = 'EMAIL',
  VOICEMAIL_MESSAGES = 'VOICEMAIL_MESSAGES',
  MESSENGER = 'MESSENGER',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export interface IGetTaskByFolderPayload {
  search: string;
  taskFolderId: string;
  taskGroupIds?: string[];
  isFocusedView: boolean;
  assigneeIds: string[];
  propertyManagerIds: string[];
  events: {
    eventTypes: string[];
    startDate: string;
    endDate: string;
  };
  taskTypeIds: string[];
  page?: number;
  pageSize?: number;
}

export interface IGetTaskByFolder {
  taskGroup: ITaskGroup;
  data: ITaskRow[];
  meta: IPageMeta;
}

export interface IPageMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

export interface IGetTasksByGroupPayload extends IGetTaskByFolderPayload {
  status?: TaskStatusType;
  taskGroupId?: string;
  isDESC?: boolean;
}

export interface ICreateFolderPayload {
  companyId: string;
  icon: string;
  name: string;
  order?: number; // TODO: remove it
  labelId?: string;
}

export interface IUpdateFolder {
  id: string;
  name: string;
  order: number;
  icon: string;
  labelId?: string;
}

export interface ICreateFolderMailBoxPayload {
  mailBoxId: string;
  folderNestedId?: string;
  newFolderName: string;
}

export interface IUpdateFolderMailBoxPayload {
  folderId: string;
  folderNestedId?: string;
  newFolderName: string;
  mailBoxId?: string;
}

export interface ISharedMailboxForm {
  ownerMailBox: string;
  sharedMailbox: string;
}
export interface IEmailClientFolder {
  id: string;
  name: string;
  externalId: string;
  internalId?: string;
  mailBoxId: string;
  parentId: string;
  wellKnownName: string;
  updatedAt: string;
  createdAt: string;
  delimiter: any;
  externalName: any;
  syncInfo: any;
  mailBox: IMailBoxProvider;
  unReadMsgCount?: number;
}

export interface IMailBoxProvider {
  provider: string;
}

export interface IGetFolderUnreadMessagePayload {
  mailBoxId: string;
  labelId?: string;
}

export interface IExpandFolder {
  className?: string;
  folderType: EFolderType;
  isOpen?: boolean;
  subFolder?: string;
  folderMailBoxId?: string;
}

export interface FolderNode {
  name: string;
  children?: FolderNode[];
}

export interface IStatisticsEmail {
  status: TaskStatusType;
  count: number;
  unread: number;
}

export interface IGlobalStatisticTask {
  companyId: string;
  draft: number;
  myInbox: IStatisticTask;
  teamInbox: IStatisticTask;
}

export interface IStatisticTask {
  internalNote: {
    [key: string]: number;
  };
  task: {
    [key: string]: number;
  };
  totalTaskCount: {
    [key: string]: number;
  };
  totalCompletedTaskCount: {
    [key: string]: number;
  };
}

export interface IActionLinkedTaskHistory {
  id: string;
  taskId: string;
  messageId: string;
  userId: string;
  isLinked: boolean;
  typeLink: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  status: string;
  taskType: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
  };
}
