export enum ETypeDataAccomplishments {
  TIME = 'time',
  EFFICIENCY = 'efficiency',
  TASK_ENQUIRES = 'task_enquires',
  COMPLETED_TASK = 'completed_tasks'
}

export enum EManyTypeDataAccomplishments {
  TIME = 'hours saved',
  EFFICIENCY = 'properties/team member',
  TASK = 'tasks completed',
  ENQUIRES = 'enquiries resolved'
}

export enum EPropertyByCountry {
  US_PROPERTY = 'properties (or units)',
  AU_PROPERTY = 'properties',
  US_PROPERTY_SINGULAR = 'property (or unit)',
  AU_PROPERTY_SINGULAR = 'property'
}

export enum ESingularTypeDataAccomplishment {
  TIME = 'hour saved',
  EFFICIENCY = 'property/team member',
  TASK = 'task completed',
  ENQUIRES = 'enquiry resolved'
}

export enum EAccomplishments {
  TIME_SAVED = 'TIME_SAVED',
  EFFICIENCY = 'EFFICIENCY',
  ENQUIRY = 'ENQUIRY',
  TASK = 'TASK'
}

export enum ECriteria {
  TIME_SAVED = 'TIME_SAVED',
  EFFICIENCY = 'EFFICIENCY',
  RESOLVED_ENQUIRIES = 'ENQUIRY',
  COMPLETED_TASK = 'TASK'
}

export enum ETimeSavedAnnotation {
  AI_GENERATED_REPLIES = 'aiReply',
  TRANSCRIBING_PHONE_CALLS = 'callTranscript',
  TRANSLATING_ENQUIRIES = 'aiTranslator',
  AI_ASSISTANT = 'aiAssistant'
}

export enum EEnquiriesType {
  ALL = 'ALL',
  EMAIL = 'EMAIL',
  APP = 'APP',
  VOICE_MAIL = 'VOICE_MAIL'
}

export enum ERangeDateType {
  SO_FAR_THIS_WEEK = 'SO_FAR_THIS_WEEK',
  SO_FAR_THIS_MONTH = 'SO_FAR_THIS_MONTH',
  SO_FAR_THIS_QUARTER = 'SO_FAR_THIS_QUARTER',
  SO_FAR_THIS_YEAR = 'SO_FAR_THIS_YEAR',
  LAST_WEEK = 'LAST_WEEK',
  LAST_MONTH = 'LAST_MONTH',
  LAST_QUARTER = 'LAST_QUARTER',
  LAST_YEAR = 'LAST_YEAR',
  ALL_TIME = 'ALL_TIME',
  CUSTOM = 'CUSTOM'
}

export enum ETaskCompletedType {
  All = 'All',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum ETrendType {
  UP = 'UP',
  DOWN = 'DOWN',
  EQUAL = 'EQUAL'
}

export enum PercentageType {
  COMPLETED = 'completedPercentage',
  IN_PROGRESS = 'inProgressPercentage'
}
export enum EExportType {
  PDF = 'pdf',
  CSV = 'csv',
  XLSX = 'xlsx'
}

export enum EBadgeSetting {
  ELITE = 'Elite',
  PRO = 'Pro'
}

export enum EBadgeSettingColor {
  ELITE = '#38dbd0',
  PRO = '#ffbf41'
}
