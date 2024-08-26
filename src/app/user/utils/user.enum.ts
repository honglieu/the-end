export enum EActionUserType {
  PEOPLE = 'People',
  PROPERTY = 'Property',
  CRM_STATUS = 'CRM Status',
  ROLE = 'Role',
  EMAIL = 'Email',
  PHONE_NUMBER = 'Phone number',
  ADD_MAIL = 'Add mail',
  APP_INVITE = 'App Invite',
  SEND_MSG = 'Send Message',
  DELETE_PERSON = 'Delete Person',
  DELETE_SECONDARY_EMAIL = 'Delete Secondary Email',
  DELETE_SECONDARY_PHONE = 'Delete Secondary Phone',
  TRUDI_APP = 'Trudi app',
  ADD_NOTE = 'Add note',
  NUM_UNIT = 'Number Unit',
  EXPORT_HISTORY = 'Export history',
  PROPERTY_PROFILE = 'PROPERTY_PROFILE'
}

export enum ETypePage {
  TENANTS_LANLORDS = 'tenants lanlords',
  LANLORDS_PROSPECT = 'lanlords prospect',
  TENANTS_PROSPECT = 'tenants prospect',
  TASK_DETAIL = 'task detail',
  MESSENGER = 'messenger',
  SUPPLIER = 'supplier',
  OTHER = 'other',
  TENANTS_LANLORDS_PT = 'tenants lanlords pt',
  TENANTS_LANLORDS_RM = 'tenants lanlords rm'
}

export enum ECheckBoxIcon {
  USER_UNCHECK = 'userUnCheck',
  USER_CHECKED = 'userChecked'
}

export enum ERentPropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED'
}

export enum ECrmStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  PROSPECT = 'PROSPECT',
  DELETED = 'DELETED',
  RM_CRM_PAST = 'RM_CRM_PAST',
  RM_CRM_CURRENT = 'RM_CRM_CURRENT',
  RM_CRM_FUTURE = 'RM_CRM_FUTURE',
  RM_CRM_LOST = 'RM_CRM_LOST',
  RM_CRM_LOST_REJECTED = 'RM_CRM_LOST_REJECTED',
  RM_CRM_TENANT = 'RM_CRM_TENANT',
  RM_CRM_LANDLORD = 'RM_CRM_LANDLORD'
}

export enum EOptionSendMessage {
  SEND_IN_TASK = 'SEND_IN_TASK',
  SEND_IN_INBOX = 'SEND_IN_INBOX'
}
