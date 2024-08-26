export enum EmailStatusType {
  spam = 'SPAM'
}

export enum ELabelEmail {
  UNREAD = 'UNREAD'
}

export enum EInboxAction {
  FORWARD = 'forward',
  CREATE_TASK = 'createTask',
  SEND_MESSAGE = 'SEND_MESSAGE',
  CREATE = 'createTask',
  MOVE = 'move',
  MOVE_TO_TASK = 'move_to_task',
  ADD_TO_TASK = 'add_to_task',
  RE_OPEN = 're_open',
  MOVE_TASK = 'move_task',
  REPORT_SPAM = 'report_spam',
  NOT_SPAM = 'not_spam',
  DELETE = 'delete',
  MOVE_MESSAGE = 'move_message',
  MOVE_MESSAGE_TO_TASK = 'move_to_task',
  MOVE_MESSAGE_TO_EMAIL = 'move_to_email_folder',
  MOVE_MESSAGE_TO_INBOX = 'move_to_inbox',
  MOVE_MESSAGE_TO_RESOLVED = 'move_to_resolved',
  MOVE_MESSAGE_TO_DELETED = 'move_to_deleted',
  INBOX = 'Inbox',
  JUNK_EMAIL = 'Junk Email',
  RESOLVE = 'resolve',
  MOVE_TO_FOLDER = 'move_to_folder',
  CREATE_NEW_TASK = 'create_new_task',
  BULK_CREATE_TASKS = 'bulk_create_tasks',
  SAVE_TO_PROPERTY_TREE = 'save_to_property_tree',
  SAVE_TO_RENT_MANAGER = 'save_to_rent_manager',
  EXPORT_TASK_ACTIVITY = 'export_task_activity',
  EXPORT_CONVERSATION_HISTORY = 'export_conversation_history',
  DOWNLOAD_AS_PDF = 'download_as_pdf',
  MARK_AS_STATUS = 'mark_as_status',
  MORE = 'more'
}

export enum EAiAssistantAction {
  MOBILE_APP = 'MOBILE_APP',
  VOICE_MAIL = 'VOICE_MAIL',
  MOBILE = 'MOBILE',
  SMS = 'SMS',
  MESSENGER = 'MESSENGER',
  WHATSAPP = 'WHATSAPP'
}

export enum EAiAssistantPlan {
  MOBILE = 'mobile',
  VOICE_CALL = 'voiceCall'
}

export enum EPopupMoveMessToTaskState {
  MOVE_MESSAGE_TO_TASK = 'moveMessageToTask',
  MOVE_MESSAGE_WARNING = 'moveMessageWarning',
  MOVE_MESSAGE_TO_EMAIL_FOLDER = 'moveMessageToEmailFolder',
  OPTION_MOVE_MESSAGE_TO_TASK = 'optionMoveMessageToTask'
}

export enum ESidebarItemType {
  MSG_DRAFTS = 'MSG_DRAFTS',
  MSG_INPROGRESS = 'MSG_INPROGRESS',
  MSG_COMPLETED = 'MSG_COMPLETED',
  MSG_DELETED = 'MSG_DELETED',
  TASK_INPROGRESS = 'TASK_INPROGRESS',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DELETED = 'TASK_DELETED'
}

export enum ERouterLinkInbox {
  MSG_INPROGRESS = 'messages',
  MSG_INPROGRESS_ALL = 'messages/all',
  MSG_DRAFT = 'messages/draft',
  MSG_COMPLETED = 'messages/resolved',
  MSG_DELETED = 'messages/deleted',
  TASK_INPROGRESS = 'tasks',
  TASK_COMPLETED = 'tasks/completed',
  TASK_DELETED = 'tasks/cancelled',
  OUT_LOOK_OR_GMAIL = 'inbox/mail',
  AI_ASSISTANT = 'ai-assistant',
  TASK_DETAIL = '/inbox/detail/',
  INTERNAL_NOTE = '/internal-note',
  APP_MESSAGES = 'app-messages',
  APP_MESSAGES_ALL = 'app-messages/all',
  APP_MESSAGES_RESOLVED = 'app-messages/resolved',
  APP_MESSAGES_DRAFT = 'app-messages/draft',
  VOICEMAIL_MESSAGES = 'voicemail-messages',
  MESSENGER = 'facebook-messages',
  SMS_MESSAGES = 'sms-messages',
  SMS_MESSAGES_ALL = 'sms-messages/all',
  SMS_MESSAGES_RESOLVED = 'sms-messages/resolved',
  WHATSAPP = 'whatsapp-messages'
}

export enum EEmailFolderPopup {
  EMAIL_FOLDER_STEP = 'EMAIL_FOLDER_STEP',
  TASK_FOLDER = 'TASK_FOLDER',
  RESOLVED_MESSAGE = 'RESOLVED_MESSAGE',
  DELETED_MESSAGE = 'DELETED_MESSAGE'
}
