import {
  IGroupAction,
  ISortTaskType,
  ITaskViewSettings
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import {
  EGroupAction,
  ESortTaskType,
  ETaskViewSettingsKey,
  ETaskViewSettingsLabel
} from './enum';

export const GROUP_ACTION: IGroupAction[] = [
  {
    id: EGroupAction.ADD_GROUP_ABOVE,
    label: 'Add new group above',
    icon: 'iconPlus2',
    divider: true
  },
  {
    id: EGroupAction.ADD_GROUP_BELOW,
    label: 'Add new group below',
    icon: 'iconPlus2',
    divider: true
  },
  {
    id: EGroupAction.COLLAPSE_ALL_GROUPS,
    label: 'Collapse all groups',
    icon: 'collapseGroup',
    divider: true
  },
  {
    id: EGroupAction.EXPAND_ALL_GROUPS,
    label: 'Expand all groups ',
    icon: 'expandGroup',
    divider: true
  },
  {
    id: EGroupAction.ASSIGN_AS_DEFAULT_GROUP,
    label: 'Assign as default group',
    icon: 'checkMarkOutline',
    divider: true
  },
  {
    id: EGroupAction.ADD_TASK,
    label: 'Add task',
    icon: 'plushCircle',
    divider: true
  },
  {
    id: EGroupAction.RENAME_GROUP,
    label: 'Rename group',
    icon: 'penGrayIcon',
    divider: true
  },
  {
    id: EGroupAction.CHANGE_GROUP_COLOR,
    label: 'Change group color',
    color: '#FA781A',
    divider: true
  },
  {
    id: EGroupAction.DELETE_GROUP,
    label: 'Delete',
    icon: 'trashBin2',
    disabled: false
  }
];

export const DEFAULT_TASK_GROUP = {
  taskGroup: {
    id: null,
    name: 'NEW GROUP',
    color: '#74737E',
    isDefault: false,
    isCompletedGroup: false
  },
  data: [],
  meta: {
    hasNextPage: false,
    hasPreviousPage: false,
    itemCount: 0,
    page: 1,
    pageCount: 1,
    pageSize: 50
  }
};

export const DELETE_TASK_GROUP_ERROR_MSG =
  'Delete group request failed. Remove all tasks and try again.';

export const BREAK_POINT_FOR_ASSIGNEE_COUNT = 1440;

export const LOCAL_STORAGE_KEY_FOR_VIEW_SETTINGS = 'taskViewSettings';

export const MAP_SORT_TASK_TYPE_TO_LABEL = {
  [ESortTaskType.NEWEST_TO_OLDEST]: 'Newest to oldest',
  [ESortTaskType.OLDEST_TO_NEWEST]: 'Oldest to newest'
};

export const LIST_SORT_TASK_TYPE: ISortTaskType[] = [
  {
    id: ESortTaskType.NEWEST_TO_OLDEST,
    label: 'Sort by newest to oldest',
    icon: 'sortAscending'
  },
  {
    id: ESortTaskType.OLDEST_TO_NEWEST,
    label: 'Sort by oldest to newest',
    icon: 'sortDescending'
  }
];
export const LIST_TASK_VIEW_SETTINGS: ITaskViewSettings[] = [
  {
    id: ETaskViewSettingsKey.SHOW_PROGRESS,
    label: ETaskViewSettingsLabel.SHOW_PROGRESS,
    isChecked: false
  },
  {
    id: ETaskViewSettingsKey.SHOW_CALENDAR_DATES,
    label: ETaskViewSettingsLabel.SHOW_CALENDAR_DATES,
    isChecked: false
  },
  {
    id: ETaskViewSettingsKey.SHOW_ASSIGNEE,
    label: ETaskViewSettingsLabel.SHOW_ASSIGNEE,
    isChecked: false
  },
  {
    id: ETaskViewSettingsKey.SHOW_OPENED_COMPLETED_DATES,
    label: ETaskViewSettingsLabel.SHOW_OPENED_COMPLETED_DATES,
    isChecked: false
  }
];
