export enum EMessageType {
  solved = 'RESOLVED',
  open = 'OPEN',
  reopened = 'REOPEN',
  deleted = 'DELETED',
  agentExpectation = 'AGENT_EXPECTATION',
  actionLink = 'ACTIONLINK',
  file = 'FILE',
  call = 'CALL',
  agentJoin = 'AGENT_JOIN',
  agentStart = 'AGENT_START',
  ticket = 'TICKET',
  buttons = 'BUTTONS',
  navigationUrl = 'NAVIGATIONURL',
  url = 'URL',
  defaultText = 'TEXT',
  moveToTask = 'MOVE_TO_TASK',
  startSession = 'START_SESSION',
  endSession = 'END_SESSION',
  endSessionVoicemail = 'END_SESSION_VOICE_MAIL',
  viaGmail = 'VIA_GMAIL',
  changeProperty = 'CHANGE_PROPERTY',
  syncConversation = 'SYNC_CONVERSATION',
  moveOutOfTask = 'MOVE_OUT_OF_TASK',
  verifyChangeEmail = 'VERIFY_CHANGE_EMAIL'
}
export enum PeopleFromViaEmailType {
  SEND_INVOICE = 'SEND_INVOICE',
  SEND_LANDLORD = 'SEND_LANDLORD'
}
export enum EMessageComeFromType {
  EMAIL = 'EMAIL',
  APP = 'APP',
  CALL = 'CALL',
  MOBILE = 'MOBILE',
  VOICE_CALL = 'VOICE_CALL',
  VIDEO_CALL = 'VIDEO_CALL',
  VOICE_MAIL = 'VOICE_MAIL',
  SMS = 'SMS',
  MESSENGER = 'MESSENGER',
  WHATSAPP = 'WHATSAPP'
}

export enum ECreatedFrom {
  VOICE_MAIL = 'VOICE_MAIL',
  MESSENGER = 'MESSENGER',
  APP = 'APP',
  EMAIL = 'EMAIL',
  WEB = 'WEB',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export enum EConversationAction {
  MARK_AS_READ = 'MARK_AS_READ',
  MARK_AS_UNREAD = 'MARK_AS_UNREAD',
  UPDATE_FLAG_URGENT = 'UPDATE_FLAG_URGENT',
  MARK_AS_RESOLVED = 'MARK_AS_RESOLVED',
  DELETE_CONVERSATION = 'DELETE_CONVERSATION',
  SAVE_TO_PROPERTY_TREE = 'SAVE_TO_PROPERTY_TREE',
  DOWNLOAD_AS_PDF = 'DOWNLOAD_AS_PDF',
  MOVE_TO_INBOX = 'MOVE_TO_INBOX'
}

export enum EMessageProperty {
  IS_URGENT = 'isUrgent',
  IS_SEEN = 'isSeen'
}

export enum ECallTooltipType {
  VOICE_CALL_ADMIN = 'VOICE_CALL_ADMIN',
  VOICE_CALL_MENBER = 'VOICE_CALL_MENBER',
  VIDEO_CALL_ADMIN = 'VIDEO_CALL_ADMIN',
  VIDEO_CALL_MENBER = 'VIDEO_CALL_MENBER',
  CALLING = 'CALLING',
  DEFAULT = 'DEFAULT'
}
