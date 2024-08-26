export enum BreachReasonOption {
  NON_PAYMENT_OF_RENT = 'Arrears - non payment of rent',
  NON_PAYMENT_OF_INVOICE_FEES = 'Arrears - non payment of invoice/ fees',
  OTHER = 'Other'
}

export enum ButtonSyncAction {
  add = 'add',
  update = 'update'
}

export enum ErrorText {
  UNSELECTED = 'Please select an option',
  REQUIRED = 'Required field'
}

export enum TicketAction {
  AddDetailsOfBreachOfContract = 0,
  IssueTenantBreachNotice = 1,
  NotifyLandlordOfBreachNotice = 2,
  AddNote = 3,
  ScheduleTenantReminderRemedyDate = 4,
  ScheduleTenantReminderBreachNoticeExpired = 5,
  RequestLandlordApprovalToTerminateTenant = 6,
  ThankTenantForRectification = 7,
  NotifyLandlordOfRectification = 8
}

export enum BreachNoticeStepIndex {
  GENERAL_STEP = 0,
  BREACH_NOTICE = 1,
  BREACH_RECTIFIED = 2,
  NEXT_STEPS = 3
}

export enum BreachNoticeButtonError {
  DETAILS_EXISTED = 'Already added breach details'
}

export enum ArrearsType {
  RENT = 'Rent',
  FEES_INVOICES = 'Fees/Invoices'
}

export enum SaveTo {
  tenancyNote = 'Tenancy Note',
  ownershipNote = 'Ownership Note',
  propertyNote = 'Property Note'
}

export enum BreachNoticeRequestButtonAction {
  add_details_of_breach_of_contract = 'add_details_of_breach_of_contract',
  issue_tenant_breach_notice = 'issue_tenant_breach_notice',
  notify_landlord_of_breach_notice = 'notify_landlord_of_breach_notice',
  add_note = 'add_note',
  schedule_tenant_reminder_remedy_date = 'schedule_tenant_reminder_remedy_date',
  schedule_tenant_reminder_breach_notice_expired = 'schedule_tenant_reminder_breach_notice_expired',
  request_landlord_approval_to_terminate_tenant = 'request_landlord_approval_to_terminate_tenant',
  update_note_to_property_tree = 'update_note_to_property_tree',
  thank_tenant_for_rectification = 'thank_tenant_for_rectification',
  notify_landlord_of_rectification = 'notify_landlord_of_rectification',
  create_tenant_vacate_task = 'create_tenant_vacate_task'
}

export enum BreachNoticeSyncStatus {
  WAITING = '',
  COMPLETED = 'COMPLETED',
  INPROGRESS = 'INPROGRESS',
  FAILED = 'FAILED'
}

export enum BreachNoticeStepTitle {
  GENERAL_STEP = 'General step',
  BREACH_NOTICE = 'Breach Notice',
  BREACH_RECTIFIED = 'Breach Rectified',
  NEXT_STEPS = 'Next steps'
}

export enum ESendMsgAction {
  'Schedule' = 'Schedule for send',
  'Send' = 'Send',
  'SendAndResolve' = 'Send & resolve'
}

export const STRING_OFFSET = 3;

export const DEFAULT_DAYS_AFTER_BREACH_REMEDY_DATE = 1;
