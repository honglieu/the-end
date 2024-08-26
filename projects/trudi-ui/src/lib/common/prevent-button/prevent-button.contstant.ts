export enum EButtonType {
  STEP = 'step',
  ROUTER = 'router',
  TASK = 'task',
  COMMON = 'common',
  WIDGET = 'widget'
}

export enum EModalID {
  SelectRecipients,
  ViewTasks,
  SendMsg,
  BulkSendMsg
}

export enum EButtonCommonKey {
  COMMON_SEARCH_GLOBAL = 'common_search_global',
  NAVIGATE_NOTIFICATION_ITEM = 'navigate-notification-item',
  EMAIL_ACTIONS = 'email-actions',
  SWITCH_ACCOUNT = 'switch-account',
  CONTACT_PAGE_SMG = 'contact-page-smg'
}

export enum EButtonStepKey {
  //COMMUNICATION
  SEND_CALENDAR_EVENT = 'send-calendar-event',
  SEND_ATTACHMENT = 'send-attachment',
  SEND_BASIC_EMAIL = 'send-basic-email',
  ENTRY_REPORT_DEADLINE = 'entry-report-deadline',
  NOTICE_TO_LEAVE = 'notice-to-leave',
  ENTRY_NOTICE_ENTRY_DATE = 'entry-notice-entry-date',
  CUSTOM_EVENT = 'custom-event',
  BREACH_NOTICE_REMEDY_DATE = 'breach-notice-remedy-date',
  CAPTURE_LEASE_TERMS = 'capture-lease-terms',
  CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL = 'capture-conditions-for-request-approval',
  CAPTURE_PET_BOND = 'capture-pet-bond',
  CAPTURE_AMOUNT_OWING_TO_VACATE = 'capture-amount-owing-to-vacate',
  CAPTURE_INSPECTION_ACTION = 'capture-inspection-action',
  BOND_RETURN_SUMMARY = 'bond-return-summary',
  SCHEDULE_REMINDER = 'schedule-reminder',
  SEND_CONTACT_CARD = 'send-contact-card',
  SEND_CONVERSATION_FILES = 'send-conversation-files',
  CAPTURE_BREAK_LEASE_FEE = 'capture-break-lease-fee',
  LETTING_RECOMMENDATIONS = 'letting-recommendations',
  APPLICATION_SHORTLIST = 'application-shortlist',
  BOND_AMOUNT_DUE = 'bond-amount-due',
  DECISION = 'decision',
  CHECK_LIST = 'check-list',
  NEW_TASK = 'new-task',
  SEND_REQUEST = 'send-request',
  CALENDAR_EVENT = 'calendar-event',
  REI_FORM = 'rei-form',

  //PT
  NOTES = 'create-notes',
  UPDATE_NOTES = 'update-notes',
  TENANCY_INVOICE = 'tenancy-invoice',
  UPDATE_TENANCY_INVOICE = 'update-tenancy-invoice',
  CREDITOR_INVOICE = 'creditor-invoice',
  UPDATE_CREDITOR_INVOICE = 'update-creditor-invoice',
  MAINTENANCE_REQUEST = 'maintenance-request',
  UPDATE_MAINTENANCE_REQUEST = 'update-maintainance-request',
  MAINTENANCE_INVOICE = 'maintenance-invoice',
  UPDATE_MAINTENANCE_INVOICE = 'update-maintainance-invoice',
  ROUTINE_INSPECTION = 'routine-inspection',
  UPDATE_ROUTINE_INSPECTION = 'update-routine-inspection',
  INGOING_INSPECTION = 'ingoing-inspection',
  UPDATE_INGOING_INSPECTION = 'update-ingoing-inspection',
  OUTGOING_INSPECTION = 'outgoing-inspection',
  UPDATE_OUTGOING_INSPECTION = 'update-outgoing-inspection',
  LEASE_RENEWAL = 'lease-renewal',
  UPDATE_LEASE_RENEWAL = 'update-lease-renewal',
  VACATE_DETAILS = 'vacate-detail',
  UPDATE_VACATE_DETAILS = 'update-vacate-details',
  NEW_TENANCY = 'new-tenancy',
  UPDATE_NEW_TENANCY = 'update-new-tenancy',
  COMPLIANCE = 'create-compliance',
  UPDATE_COMPLIANCE = 'update-compliance'
}

export enum EButtonTask {
  TASK_CREATE_MESSAGE = 'task-create-message',
  TASK_CREATE_TASK = 'task-create-task',
  TASK_MARK_AS_RESOLVED = 'task-mark-as-resolved',
  TASK_ACTION_DELETE = 'task-action-delete',
  TASK_ACTION_REOPEN = 'task-action-reopen',
  TASK_UPDATE_STATUS_FOLDER = 'task-update-status-folder',

  CONVERSATION_MARK_AS_RESOLVED = 'conversation-mark-as-resolved',
  CONVERSATION_ACTION_REPOPEN = 'conversation-action-reopen',
  CONVERSATION_ACTION_DELETE = 'conversation-action-delete',
  CONVERSATION_REPORT_SPAM = 'conversation-report-spam',
  CONVERSATION_FLAG_AS_URGENT = 'conversation-flag-as-urgent',
  CONVERSATION_ADD_TO_CONVERSATION = 'conversation-add-to-conversation',
  CONVERSATION_ADD_TO_EXISTING_CONVERSATION = 'conversation-add-to-existing-conversation',
  CONVERSATION_MOVE_TO_INBOX = 'conversation-move-to-inbox',
  CONVERSATION_MOVE_TO_EMAIL_FOLDER = 'conversation-move-to-email-folder',
  CONVERSATION_ADD_TO_TASK = 'conversation-add-to-task',
  CONVERSATION_ADD_TO_EXISTING_TASK = 'conversation-add-to-existing-task',
  CONVERSATION_REMOVE_FROM_TASK = 'conversation-remove-from-task',
  OPEN_EMAIL_CONVERSATION = 'open-email-conversation',
  OPEN_APP_CONVERSATION = 'open-app-conversation',
  NAVIGATE_CONVERSATION = 'navigate-conversation',

  VIEW_PROPERTY = 'view-property',
  REASSIGN_PROPERTY = 'reassign-property',

  REPLY_MESSAGE = 'reply-message',
  REPLY_ALL_MESSAGE = 'reply-all-message',
  FORWARD_MESSAGE = 'forward-message',

  CREATE_CONVERSATION = 'create-conversation',
  SEND_FILE = 'send-file',
  VIEW_FILE = 'view-file',

  BACK = 'back',
  SEND_MESSAGE = 'send-message',
  EXPORT_HISTORY_CONVERSATION = 'export-history-conversation',
  CALL = 'call',
  DELETE_CONTACT = 'delete-contact',

  SHARE_CALENDAR_EVENT = 'share-calendar-event',
  EDIT_CALENDAR = 'edit-calendar',

  VIEW_DETAIL_PAGE = 'view-detail-page',
  ADD_CONTACT = 'add-contact',
  SELECT_SUMMARY_ATTACHMENT = 'select-summary-attachment',
  ASSIGN_CONTACT = 'assign-contact',
  SAVE_TASK_TO_PT = 'save-task-to-pt',
  UPGRADE_AI = 'upgrade-ai',
  SCHEDULE_MSG_FOR_SEND = 'schedule-msg-for-send',
  ADD_FILE_FROM_CRM = 'add-file-from-crm',
  ADD_REI_FORM = 'add-rei-form',
  ADD_CONTACT_CARD = 'add-contact-card',
  CHANGE_STATUS_RESCHEDULE_REQUEST = 'change-status-reschedule-request',
  PERMANENTLY_DELETE_TASK = 'permanently-delete-task',
  NAVIGATE_TO_LINKED_EMAIL = 'navigate-to-linked-email',
  DELETE_SECONDARY_EMAIL = 'delete-secondary-email'
}

export enum EButtonWidget {
  PROPERTY_TREE = 'property-tree',
  CALENDAR = 'calendar',
  REI_FORM = 'rei-form',
  VIEW_CALENDAR = 'view-calendar'
}

export enum EButtonRouteKey {
  AGENCY_SETTING_TEAM = '/dashboard/agency-settings/team',
  AGENCY_SETTING_DETAIL = '/dashboard/agency-settings/agency-details',
  AGENCY_SETTING_BILLING = '/dashboard/agency-settings/billing',
  AGENCY_SETTING_EMAIL_SIGNATURE = '/dashboard/agency-settings/email-signature',
  AGENCY_SETTING_VOICE_EMAIL = '/dashboard/agency-settings/voicemail',
  AGENCY_SETTING_TASK_EDITOR = '/dashboard/agency-settings/task-editor',
  AGENCY_SETTING_POLICIES = '/dashboard/agency-settings/policies',
  AGENCY_SETTING_POLICIES_ALL_REPLIES = '/dashboard/agency-settings/policies/emergency-contacts',
  AGENCY_SETTING_INTERGRATIONS = '/dashboard/agency-settings/integrations',
  AGENCY_SETTING_TASK = '/dashboard/agency-settings/task-editor/list',
  AGENCY_SETTING_RESPONSE_TIME = '/dashboard/agency-settings/response-time',

  PROFILE_SETTINGS_PUBLIC = '/dashboard/profile-settings/public-profile',
  PROFILE_SETTINGS_NOTIFICATION = '/dashboard/profile-settings/notification',

  INBOX_MESSAGES_LIST = '/dashboard/inbox/messages/all',

  CALENDAR_LIST_VIEW = '/dashboard/event/events',

  CONTACT_TENANTS_LANDLORDS = '/dashboard/contacts/tenants-landlords',

  INSIGHTS_VIEW = '/dashboard/insights',
  INSIGHTS_UP_SELL = '/dashboard/insights/up-sell',

  PROFILE_SETTINGS = '/dashboard/profile-settings/profile',
  CONSOLE_SETTING = '/dashboard/console-settings/agent-management',
  EMERGENCY_CONTACTS = '/dashboard/agency-settings/mobile-app/emergency-contacts'
}

export type ButtonKey =
  | EButtonStepKey
  | EButtonRouteKey
  | EButtonTask
  | EButtonCommonKey
  | EButtonWidget;

export const buttonCommons = new Set(Object.values(EButtonCommonKey));

export const buttonSteps = new Set(Object.values(EButtonStepKey));

export const buttonRouter = new Set(Object.values(EButtonRouteKey));

export const buttonTask = new Set(Object.values(EButtonTask));

export const buttonWidget = new Set(Object.values(EButtonWidget));

export const buttonMap: Record<EButtonType, Set<ButtonKey>> = {
  [EButtonType.STEP]: buttonSteps,
  [EButtonType.ROUTER]: buttonRouter,
  [EButtonType.TASK]: buttonTask,
  [EButtonType.COMMON]: buttonCommons,
  [EButtonType.WIDGET]: buttonWidget
};

export const StepKey = {
  propertyTree: {
    createCompliance: 'create-compliance',
    updateCompliance: 'update-compliance',
    ingoingInspection: 'ingoing-inspection',
    updateIngoingInspection: 'update-ingoing-inspection',
    outgoingInspection: 'outgoing-inspection',
    updateOutgoingInspection: 'update-outgoing-inspection',
    routineInspection: 'routine-inspection',
    updateRoutineInspection: 'update-routine-inspection',
    creditorInvoice: 'creditor-invoice',
    tenancyInvoice: 'tenancy-invoice',
    maintainaceInvoice: 'maintenance-invoice',
    maintainaceRequest: 'maintenance-request',
    leaseRenewal: 'lease-renewal',
    newTenancy: 'new-tenancy',
    vacateDetails: 'vacate-detail',
    notes: 'create-notes',
    updateNotes: 'update-notes',
    updatePT: 'update-pt',
    eventCalendar: 'event-calendar',
    propertyTree: 'property-tree'
  },
  communicationStep: {
    confirmEssential: 'confirm-essential',
    sendBulkMessage: 'send-bulk-message',
    sendRequest: 'send-request',
    sendContactCard: 'send-contact-card',
    sendAttachment: 'send-attachment',
    sendBasicEmail: 'send-basic-email',
    scheduleReminder: 'schedule-reminder',
    sendConversationFile: 'send-conversation-files',
    sendCalendarEvent: 'send-calendar-event',
    captureLeaseTerms: 'capture-lease-terms',
    captureConditionForRequestApproval:
      'capture-conditions-for-request-approval',
    capturePetBond: 'capture-pet-bond',
    captureAmountOwingToVacate: 'capture-amount-owing-to-vacate',
    captureInspectionAction: 'capture-inspection-action',
    bondReturnSummary: 'bond-return-summary',
    captureBreakLeaseFee: 'capture-break-lease-fee',
    lettingRecommendations: 'letting-recommendations',
    applicationShortList: 'application-shortlist',
    bondAmountDue: 'bond-amount-due',
    entryReportDeadline: 'entry-report-deadline',
    noticeToLeave: 'notice-to-leave',
    selectDocument: 'select-document',
    checkList: 'check-list',
    newTask: 'new-task',
    reiform: 'rei-form'
  },
  eventStep: {
    breadNoticeRemedyDate: 'breach-notice-remedy-date',
    entryNoticeEntryDate: 'entry-notice-entry-date',
    customEvent: 'custom-event',
    calendarEvent: 'calendar'
  }
};

export const isActionOpenOnceModal = [
  EButtonWidget.VIEW_CALENDAR,
  EButtonStepKey.DECISION,
  EButtonWidget.REI_FORM
];
