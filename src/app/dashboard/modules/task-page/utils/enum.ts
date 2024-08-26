export enum EGroupAction {
  COLLAPSE_ALL_GROUPS,
  EXPAND_ALL_GROUPS,
  ASSIGN_AS_DEFAULT_GROUP,
  ADD_GROUP,
  ADD_GROUP_ABOVE,
  ADD_GROUP_BELOW,
  RENAME_GROUP,
  CHANGE_GROUP_COLOR,
  DELETE_GROUP,
  ADD_TASK
}

export enum ESortTaskType {
  OLDEST_TO_NEWEST = 'Oldest to newest',
  NEWEST_TO_OLDEST = 'Newest to oldest'
}

export enum ETaskViewSettingsLabel {
  SHOW_PROGRESS = 'Show progress',
  SHOW_CALENDAR_DATES = 'Show calendar dates',
  SHOW_ASSIGNEE = 'Show assignees',
  SHOW_OPENED_COMPLETED_DATES = 'Show opened / completed dates'
}

export enum ETaskViewSettingsKey {
  SHOW_PROGRESS = 'showProgress',
  SHOW_CALENDAR_DATES = 'showCalenderDates',
  SHOW_ASSIGNEE = 'showAssignee',
  SHOW_OPENED_COMPLETED_DATES = 'showOpenedCompletedDates'
}

export enum ESortTaskTypeParam {
  OLDEST_TO_NEWEST = 'OLDEST_TO_NEWEST',
  NEWEST_TO_OLDEST = 'NEWEST_TO_OLDEST'
}
