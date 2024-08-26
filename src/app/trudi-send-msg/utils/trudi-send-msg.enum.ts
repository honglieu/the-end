export enum EReceiverType {
  INDIVIDUAL_CONTACT = 'INDIVIDUAL_CONTACT',
  CONTACT_TYPE = 'CONTACT_TYPE'
}

export enum ECreateMessageFrom {
  MULTI_TASKS = 'MULTI_TASKS',
  SCRATCH = 'SCRATCH',
  CALENDAR = 'CALENDAR',
  TASK_HEADER = 'TASK_HEADER',
  CONTACT = 'CONTACT',
  TASK_STEP = 'TASK_STEP',
  MULTI_MESSAGES = 'MULTI_MESSAGES', // Open from the toolbar's send message button in the message index page
  APP_MESSAGE = 'APP_MESSAGE',
  TASK_DETAIL = 'TASK_DETAIL',
  MESSENGER = 'MESSENGER',
  SMS_MESSAGES = 'SMS_MESSAGES',
  WHATSAPP = 'WHATSAPP'
}

export enum EBulkSendMethod {
  TRIGGER_STEP_FROM_TASK = 'trigger_step_from_task',
  COMPOSE_BULK_EMAIL = 'compose_bulk_email'
}

export enum EReceiverType {
  TO = 'TO',
  CC = 'CC',
  BCC = 'BCC'
}

export enum EContactStatus {
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export enum ECreateMessageType {
  MULTI_MESSAGES = 'MULTI_MESSAGES',
  SINGLE_MESSAGE = 'SINGLE_MESSAGE'
}

export enum EContactTitle {
  OTHER = 'OTHER',
  LEAD = 'LEAD',
  PRIMARY_OWNER = 'Primary owner',
  PRIMARY_TENANT = 'Primary tenant'
}

export enum EMutationChannel {
  EMAIL = 'EMAIL',
  OTHER = 'OTHER'
}
