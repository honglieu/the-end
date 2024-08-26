export enum EInboxQueryParams {
  TASKS = 'tasks',
  MESSAGES = 'messages',
  TASK_STATUS = 'taskStatus',
  STATUS = 'status',
  SETTINGS = 'settings',
  EMAIL = 'mail',
  AI_ASSISTANT = 'ai-assistant',
  APP_MESSAGE = 'app-messages',
  VOICEMAIL_MESSAGES = 'voicemail-messages',
  MESSENGER = 'facebook-messages',
  WHATSAPP = 'whatsapp-messages',
  SMS_MESSAGES = 'sms-messages'
}

export enum EMailBoxPopUp {
  ENCOURAGE_USER = 'ENCOURAGE_USER',
  EMAIL_PROVIDER = 'EMAIL_PROVIDER',
  ASSIGN_TEAM = 'ASSIGN_TEAM',
  DROPDOWN_ACOUNT = 'DROPDOWN_ACOUNT',
  ASSIGN_DEFAULT = 'ASSIGN_DEFAULT',
  MAILBOX_TYPE = 'MAILBOX_TYPE',
  CONFIRM_EXISTING_COMPANY = 'CONFIRM_EXISTING_COMPANY',
  NOT_SHARED = 'NOT_SHARED',
  INTEGRATE_IMAP_SMTP_SERVER = 'INTEGRATE_IMAP_SMTP_SERVER',
  SHARED_MAILBOX = 'SHARED_MAILBOX',
  SAVE_CONVERSATION_TO_NOTE = 'SAVE_CONVERSATION_TO_NOTE',
  CONFIRM_AUTO_SYNC_CONVERSATIONS_TO_PT = 'CONFIRM_AUTO_SYNC_CONVERSATIONS_TO_PT',
  SAVE_MAILBOX_ACTIVITY_TO_PT = 'SAVE_MAILBOX_ACTIVITY_TO_PT'
}

export enum EMailBoxStatus {
  INACTIVE = 'INACTIVE',
  ARCHIVE = 'ARCHIVE',
  ACTIVE = 'ACTIVE',
  DISCONNECT = 'DISCONNECT',
  INPROGRESS = 'INPROGRESS',
  FAILED = 'FAILED',
  SYNCING = 'SYNCING',
  FAIL = 'FAIL',
  UNSYNC = 'UNSYNC'
}

export enum EMailBoxType {
  COMPANY = 'COMPANY',
  INDIVIDUAL = 'INDIVIDUAL'
}

export enum EmailProvider {
  GMAIL = 'GMAIL',
  OTHER = 'OTHER',
  SENDGRID = 'SENDGRID',
  GOOGLE = 'GOOGLE',
  OUTLOOK = 'OUTLOOK'
}

export enum FieldFormIntegrateImap {
  INBOX_SERVER = 'inboxServer',
  OUTBOX_SERVER = 'outboxServer',
  MAILBOX_ID = 'mailBoxId',
  EMAIL = 'email',
  NAME = 'name',
  PASSWORD = 'password',
  HOST = 'host',
  PORT = 'port',
  PROTECTION = 'protection',
  PICTURE = 'picture'
}

export enum ProtectionImapType {
  NONE = 'NONE',
  TLS = 'TLS',
  SSL = 'SSL'
}

export enum FolderType {
  TASK_FOLDER = 'TASK_FOLDER',
  EMAIL_FOLDER = 'EMAIL_FOLDER'
}

export enum SyncAttachmentType {
  PORTAL_FOLDER = 'PORTAL_FOLDER',
  MAIL_FOLDER = 'MAIL_FOLDER'
}

export interface disabledSaveToRM {
  isCheckSyncingStatus: boolean;
  isArchivedMailbox?: boolean;
  isRmEnvironment?: boolean;
  isPTEnvironment?: boolean;
}
