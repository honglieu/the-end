export enum ReminderMessageType {
  UNANSWERED = 'UNANSWERED',
  FOLLOW_UP = 'FOLLOW_UP'
}

export enum StatusReminder {
  IGNORE = 'IGNORE',
  UN_IGNORE = 'UN_IGNORE'
}

export enum EReminderFilterParam {
  ASSIGNED_TO = 'assignedTo',
  PROPERTY_MANAGER_ID = 'propertyManagerId',
  SEARCH = 'search',
  INBOX_TYPE = 'inboxType',
  MESSAGE_STATUS = 'messageStatus',
  REMINDER_TYPE = 'reminderType'
}
