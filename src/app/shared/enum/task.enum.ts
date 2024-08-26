export enum TaskStatusType {
  assigned = 'ASSIGNED',
  unassigned = 'UNASSIGNED',
  inprogress = 'INPROGRESS',
  completed = 'COMPLETED',
  resolved = 'RESOLVED',
  deleted = 'DELETED',
  mailfolder = 'MAILFOLDER',
  inprogressspace = 'IN PROGRESS',
  my_task = 'MY_TASK',
  my_task_space = 'MY TASKS',
  team_task = 'TEAM_TASK',
  team_task_space = 'TEAM TASKS',
  team_messages = 'TEAM_MESSAGES',
  my_messages = 'MY_MESSAGES',
  moved = 'MOVED',
  spam = 'SPAM',
  cancelled = 'CANCELLED',
  open = 'OPEN',
  deleteTaskSpam = 'DELETE_TASK_SPAM',
  deleteTaskSpamOutlook = 'DELETE_TASK_SPAM_OUTLOOK',
  draft = 'DRAFT',
  reopen = 'REOPEN'
}

export enum TaskType {
  MESSAGE = 'MESSAGE',
  TASK = 'TASK',
  EMAIL = 'EMAIL',
  SCHEDULE = 'SCHEDULE_MSG_FOR_SEND',
  DRAFT = 'DRAFT',
  TASK_DRAFT = 'TASK_DRAFT',
  VOICE_MAIL = 'VOICE_MAIL',
  SMS = 'SMS',
  SHARE_CALENDAR_INVITE = 'SHARE_CALENDAR_INVITE',
  SEND_FILES = 'SEND_FILES',
  INTERNAL_NOTE = 'INTERNAL_NOTE'
}

export enum TaskStatusTypeLC {
  myTask = 'my_task',
  teamTask = 'team_task',
  mymessages = 'my_messages',
  teammessages = 'team_messages',
  assigned = 'assigned',
  unassigned = 'unassigned',
  inprogress = 'inprogress',
  open = 'open',
  completed = 'completed',
  deleted = 'deleted',
  inprogressspace = 'inprogressspace',
  resolved = 'resolved',
  cancelled = 'cancelled'
}

export enum TaskNameId {
  routineMaintenance = '64e299b7-9330-47a0-b865-03bff23da137',
  emergencyMaintenance = '5f2b2f81-ef7b-4b02-85e1-5a08c4757e1b',
  petRequest = '05e5de0f-fd9e-4cac-b4ae-4a6e2d6c944d',
  leaseRenewal = '61339cb2-4fbd-41f6-b451-7745236a83d7',
  leasing = 'e1f0a855-11bc-4dcb-b5cd-d116691ed05e',
  routineInspection = '69b88877-b2ad-45f4-9cce-1e6f05fdd75b',
  routineInspection_QLD = '72ba5235-046c-4c91-b69f-d15148a6297c',
  routineInspection_WA = '46e86c05-3a00-4f8e-9a84-fd8752df5e2d',
  miscellaneous = '2ce76bfa-a1fa-4a92-b206-6dbd052cc2e9',
  requestTenant = '4f8e9489-a1c7-4614-b975-f6ec6113953b',
  requestLandlord = 'ca140ec7-3a50-443e-ac80-4fdab4aa77e2',
  invoicing = 'b0678a92-fd49-418a-aad3-ced49bee1430',
  invoiceTenant = '5a62e81a-0807-4d67-9e49-a9d3f7f286b6',
  smokeAlarms = '4ff2ac10-17c6-49db-ad7e-c090b5dcdfad',
  generalCompliance = 'e718b985-3b79-4fe8-bd1f-9cfb2d7d6996',
  tenantVacate = '635e6ff1-792b-452f-9f4c-7f9264a01544',
  tenantVacateQLD_SA_WA_ACT_RegionIds = 'ca96b113-b047-40a9-aabd-f5937d2f640e',
  breachNotice = 'cdcfe16c-4d48-4c86-8f9c-184001eb8553',
  blankTask = '',
  taskTemplate = 'taskTemplate'
}

export enum TaskNameRegionId {
  routineMaintenance = 'e769dc86-4a02-4dbb-8533-bfd3fdd19ad9',
  smokeAlarms = 'e9df9713-db16-4cf7-a76a-b2b6101d264a'
}

export enum TaskGroupId {
  miscellaneous = '11b50d23-fa45-48e8-8543-549b111e365a'
}

export enum TaskTypeNote {
  ingoingInspection = 'ingoingInspection',
  routineInspection = 'routineInspection',
  outgoingInspection = 'outgoingInspection',
  maintenance = 'maintenance'
}

export enum EntityTypeNote {
  inspection = 'inspection',
  property = 'property'
}

export enum InspectionTypes {
  ROUTINE_INSPECTION = 'Routine',
  OUTGOING_INSPECTION = 'Outgoing',
  INGOING_INSPECTION = 'Ingoing'
}

export enum ESyncTaskType {
  Activity = 'ACTIVITY'
}
