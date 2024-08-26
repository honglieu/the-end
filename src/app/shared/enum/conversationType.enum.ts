export enum EConversationType {
  open = 'OPEN',
  resolved = 'RESOLVED',
  deleted = 'DELETED',
  reopened = 'REOPEN',
  nonApp = 'NON_APP',
  locked = 'LOCKED',
  agent_expectation = 'AGENT_EXPECTATION',
  schedule = 'SCHEDULE',
  EMAIL = 'EMAIL',
  APP = 'APP',
  VOICE_MAIL = 'VOICE_MAIL',
  SMS = 'SMS',
  MESSENGER = 'MESSENGER',
  WHATSAPP = 'WHATSAPP'
}

export enum ESyncToRmStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  INPROGRESS = 'INPROGRESS'
}
