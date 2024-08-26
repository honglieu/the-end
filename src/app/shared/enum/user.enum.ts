export enum UserStatus {
  DEACTIVATED = 'DEACTIVATED',
  ACTIVATED = 'ACTIVATED',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  UNINVITED = 'UNINVITED'
}

export enum ERecognitionStatus {
  UNRECOGNIZED = 'UNRECOGNIZED',
  MULTIPLE_CONTACT = 'MULTIPLE_CONTACT'
}

export enum EUserPlatformType {
  EMAIL = 'EMAIL',
  APP = 'APP'
}

export enum EUserPropertyType {
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT',
  AGENT = 'AGENT',
  SUPPLIER = 'SUPPLIER',
  AI_ASSISTANT = 'AI_ASSISTANT',
  PROPERTY_MANAGER = 'PROPERTY MANAGER',
  UNIDENTIFIED = 'UNIDENTIFIED',
  OTHER = 'OTHER',
  ADMIN = 'ADMIN',
  LEAD = 'LEAD',
  EXTERNAL = 'EXTERNAL',
  USER = 'USER',
  OWNER = 'OWNER',
  TENANT_UNIT = 'TENANT_UNIT',
  TENANT_PROPERTY = 'TENANT_PROPERTY',
  TENANT_PROSPECT = 'TENANT_PROSPECT',
  OWNER_PROSPECT = 'OWNER_PROSPECT',
  LANDLORD_PROSPECT = 'LANDLORD_PROSPECT',
  TENANT_RM = 'TENANT_RM',
  TENANCY = 'TENANCY',
  OWNERSHIP = 'OWNERSHIP',
  MAILBOX = 'MAILBOX',
  CALENDAR_EVENT_BULK_CREATE_TASKS = 'CALENDAR_EVENT_BULK_CREATE_TASKS',
  UNRECOGNIZED = 'UNRECOGNIZED',
  BELONGS_TO_OTHER_PROPERTIES = 'BELONGS_TO_OTHER_PROPERTIES'
}

export enum EExcludedUserRole {
  BELONGS_TO_OTHER_PROPERTIES = 'Belongs to other properties',
  UNRECOGNIZED = 'Unrecognized',
  EMPTY = ''
}

export enum EParticipantType {
  UNIDENTIFIED_CONTACTS = 'UNIDENTIFIED CONTACTS',
  PROPERTY_CONTACTS = 'PROPERTY CONTACTS',
  IDENTIFIED_CONTACTS = 'IDENTIFIED CONTACTS'
}

export enum EUserPropertyTypeColor {
  LANDLORD = '#00AA9F',
  TENANT = '#F8B83A'
}

export enum GroupType {
  MY_TASK = 'MY_TASK',
  TEAM_TASK = 'TEAM_TASK',
  MY_TASK_AND_TEAM_TASK = 'MY_TASK_AND_TEAM_TASK'
}

export enum NotificationSettingType {
  messageTaskAssignedMe = 'messageTaskAssignedMe',
  newMessageTaskReply = 'newMessageTaskReply',
  mentionedInternalNote = 'mentionedInternalNote',
  changesToDatesOrStatuses = 'changeDataPT',
  newSharedMailBox = 'newSharedMailBox',
  companyPolicy = 'companyPolicy',
  newRequest = 'newRequest'
}

export enum NotificationSettingPlatform {
  EMAIL = 'email',
  DESKTOP = 'desktop'
}

export enum MarketingEmailSettingType {
  productUpdate = 'productUpdates',
  monthlyInsights = 'pmBusinessInsights',
  productMarketing = 'marketing'
}

export enum UserTypeEnum {
  AGENT = 'AGENT',
  USER = 'USER',
  LEAD = 'LEAD',
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  SUPPLIER = 'SUPPLIER',
  OTHER = 'OTHER',
  MAILBOX = 'MAILBOX'
}

export enum EUserDetailStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED'
}

export enum EActionRole {
  ASSIGN_OWNER = 'ASSIGN_OWNER',
  ASSIGN_ADMIN = 'ASSIGN_ADMIN',
  UNASSIGN_ADMIN = 'UNASSIGN_ADMIN'
}

export enum EFilterType {
  PORTFOLIO = 'portfolio',
  ROLES = 'roles',
  STATUS = 'status',
  CRM = 'crm',
  LAST_IMPORT = 'last-import',
  PROPERTY_STATUS = 'property-status',
  AGENCIES = 'agencies'
}

export enum EPropertyStatus {
  active = 'ACTIVE',
  archived = 'ARCHIVED',
  deleted = 'DELETED',
  inactive = 'INACTIVE'
}

export enum EPtCrmStatus {
  ACTIVE = 'ACTIVE',
  VACATING = 'VACATING',
  VACATED = 'VACATED',
  PROSPECT = 'PROSPECT'
}

export enum ERmCrmStatus {
  RMPast = 'RM_CRM_PAST',
  RMCurrent = 'RM_CRM_CURRENT',
  RMFuture = 'RM_CRM_FUTURE',
  RMDeleted = 'DELETED',
  RMLost = 'RM_CRM_LOST'
}

export enum EInviteStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  UNINVITED = 'UNINVITED',
  OFFBOARDED = 'OFFBOARDED',
  PENDING = 'PENDING'
}

export enum ERoleCRM {
  TenantUnit = 'TENANT_UNIT',
  TenantProperty = 'TENANT_PROPERTY',
  Landlord = 'LANDLORD'
}

export enum EParamsFilter {
  CRM_STATUS = 'crmStatus',
  PORTFOLIO_USER = 'portfolioUserId',
  TIME = 'time',
  ROLES = 'roleTypes',
  INVITE_STATUS = 'inviteStatus',
  PROPERTY_STATUS = 'propertyStatus'
}

export const confirmPropertyType = [
  EUserPropertyType.UNIDENTIFIED,
  EUserPropertyType.OTHER,
  EUserPropertyType.SUPPLIER,
  EUserPropertyType.OWNER_PROSPECT,
  EUserPropertyType.TENANT_PROSPECT,
  EUserPropertyType.EXTERNAL,
  EUserPropertyType.LANDLORD_PROSPECT
];

export enum EUndentifiedType {
  MULTIPLE_CONTACT = 'MULTIPLE_CONTACT',
  UNRECOGNIZED = 'UNRECOGNIZED'
}
