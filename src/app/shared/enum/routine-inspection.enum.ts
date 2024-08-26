export enum RoutineInspectionButtonAction {
  NOTIFY_TENANT_LANDLORD_OF_CANCELLATION = 'notify_tenant_landlord_of_cancellation',
  SEND_LANDLORD_INSPECTION_REPORT = 'send_landlord_inspection_report',
  SEND_TENANT_INSPECTION_REPORT = 'send_tenant_inspection_report',
  CREATE_OR_LINK_INSPECTION = 'create_or_link_inspection',
  SEND_ENTRY_NOTICE_TO_TENANT_SCHEDULED = 'send_entry_notice_to_tenant_scheduled',
  NOTIFY_LANDLORD_OF_UPCOMING_INSPECTION_SCHEDULED = 'notify_landlord_of_upcoming_inspection_scheduled',
  SEND_A_REMINDER_TO_TENANT_SCHEDULED = 'send_a_reminder_to_tenant_scheduled',
  SEND_ENTRY_NOTICE_TO_TENANT_RESCHEDULED = 'send_entry_notice_to_tenant_rescheduled',
  NOTIFY_LANDLORD_OF_UPCOMING_INSPECTION_RESCHEDULED = 'notify_landlord_of_upcoming_inspection_rescheduled',
  SEND_A_REMINDER_TO_TENANT_RESCHEDULED = 'send_a_reminder_to_tenant_rescheduled',
  CONFIRM_INSPECTION = 'confirm_inspection',
  START_MAINTENANCE_TASK = 'start_maintenance_task'
}

export enum RoutineInspectionStatus {
  CANCEL = 'Cancel',
  COMPLETED = 'Completed',
  SCHEDULED = 'Scheduled',
  TENTATIVE = 'Tentative',
  RESCHEDULED = 'Rescheduled'
}

export enum RoutineInspectionSyncStatus {
  WAITING = '',
  COMPLETED = 'COMPLETED',
  INPROGRESS = 'INPROGRESS',
  FAILED = 'FAILED'
}
