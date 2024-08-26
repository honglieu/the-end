export enum SendMesagePopupOpenFrom {
  user = 'user',
  userIndex = 'user-index',
  file = 'file',
  appChat = 'appChat',
  conv = 'conversation',
  trudi = 'trudi',
  quit = 'quit'
}

export enum CheckBoxImgPath {
  ownershipCheck = '/assets/icon/ownership-check.svg',
  tenancyCheck = '/assets/icon/tenancy-check.svg',
  uncheck = '/assets/icon/select-people-uncheck.svg',
  blankUncheck = 'assets/icon/blank-uncheck.svg',
  userChecked = '/assets/icon/checkbox-checked.svg',
  userUncheck = '/assets/icon/checkbox-uncheck.svg',
  userIndeterminate = 'checkboxIndeterminate',
  radioChecked = '/assets/icon/radio-check.svg',
  radioUncheck = '/assets/icon/radio-uncheck.svg',
  deactivated = '/assets/icon/checkbox-deactived.svg'
}

export enum ImgPath {
  voiceCall = '/assets/icon/phone-no-wrap-active.svg',
  disableVoiceCall = '/assets/icon/phone-no-wrap-disabled.svg',
  videoCall = '/assets/icon/videocall-no-wrap-active.svg',
  disableVideoCall = '/assets/icon/videocall-no-wrap-disabled.svg',
  refresh = '/assets/icon/refresh.svg',
  refreshGreen = '/assets/icon/refresh_green.svg',
  sendREIForm = 'assets/images/send-rei-form.svg',
  addREIForm = 'assets/images/add-rei-form.svg',
  downloadGreen = '/assets/icon/icon_download_green.svg',
  chevronUp = 'assets/images/chevron-up.png',
  checkSuccess = '/assets/icon/check-success.svg',
  squareUploader = 'assets/images/icons/square-uploader.svg',
  replyTextEditor = 'assets/icon/reply-text-editor.svg',
  noteTextEditor = 'assets/icon/note-text-editor.svg',
  grayWarning = 'assets/icon/gray-warning.svg',
  sendArrow = 'assets/icon/send-arrow.svg',
  whiteChevronDown = 'assets/icon/white-chevron-down.svg',
  grayChevronDown = 'assets/icon/gray-chevron-down.svg',
  resolve = 'assets/icon/complete-icon-outline.svg',
  sendArrowBlank = 'assets/icon/send-arrow-blank.svg',
  verticalMore = 'assets/icon/vertical-more.svg',
  time = 'assets/icon/time.svg'
}

export enum CallTypeEnum {
  videoCall = 'videoCall',
  voiceCall = 'voiceCall'
}

export enum REIFormDocumentStatus {
  DRAFT = 'Draft',
  FINALIZED = 'Finalized',
  SIGNING = 'Signing',
  SIGNED = 'Signed'
}

export enum EInvoiceTaskType {
  INVOICE_SYNC = 'INVOICE SYNC',
  MAINTENANCE = 'MAINTENANCE',
  EMERGENCY = 'EMERGENCY',
  SMOKE_ALARM = 'SMOKE_ALARM',
  GENERAL_COMPLIANCE = 'GENERAL_COMPLIANCE',
  TENANT_VACATE = 'TENANT_VACATE',
  INGOING_INSPECTION = 'IN_GOING_INSPECTION',
  LEASE_START = 'LEASE_START',
  OUT_GOING_INSPECTION = 'OUT_GOING_INSPECTION',
  ARREAR = 'ARREAR',
  LEASE_RENEWAL = 'LEASE_RENEWAL'
}

export enum EEventTypes {
  ROUTINE_INSPECTION = 'Routine inspections',
  OUTGOING_INSPECTION = 'Outgoing inspections',
  INGOING_INSPECTION = 'Ingoing inspections',
  LEASE_START = 'Lease start',
  LEASE_END = 'Lease end',
  VACATE = 'Vacates',
  ARREAR = 'Number of days in arrears',
  COMPLIANCE_NEXT_SERVICE = 'Compliance next service',
  COMPLIANCE_EXPIRY = 'Compliance expiry',
  BREACH_REMEDY = 'Breach notices',
  CUSTOM_EVENT = 'Custom events',
  ENTRY_NOTICE = 'Entry notices',
  AUTHORITY_START = 'Authority start',
  AUTHORITY_END = 'Authority end',
  ALL_EVENT = 'All events',
  NEXT_RENT_REVIEW = 'Next rent review'
}

export enum ERMEvents {
  MOVE_IN = 'Move in',
  MOVE_OUT = 'Move out',
  LEASE_START = 'Lease start',
  LEASE_END = 'Lease end',
  ISSUE = 'Issue open',
  INVOICE = 'Tenant invoice due',
  BREACH_REMEDY = 'Breach notices',
  CUSTOM_EVENT = 'Custom events',
  ENTRY_NOTICE = 'Entry notices',
  ALL_EVENT = 'All events'
}

export enum ECRMId {
  RENT_MANAGER = '59a6835d-70e8-4f98-9e2d-e6a3c997f9da',
  PROPERTY_TREE = '61330183-0a96-484d-8cf8-4b94ececb323',
  PROPERTY_ME = '35619e3b-37f2-4d85-aeae-ecc3cc6fdf11',
  CONSOLE_CLOUD = 'cc4fedff-9cfa-4b9d-bb44-4ac7c2601770',
  PMX = '0f8c7dc2-11bb-4645-9a8b-c864e1cef4ea'
}

export enum EActionShowMessageTooltip {
  ADD_NEW_TASKS = 'ADD_NEW_TASKS',
  PUBLISH_TASKS = 'PUBLISH_TASKS',
  EDIT_WORKFLOWS = 'EDIT_WORKFLOWS',
  EDIT_TASK_NAME = 'EDIT_TASK_NAME',
  EDIT_TASK_STATUS = 'EDIT_TASK_STATUS',
  ARCHIVE_TASKS = 'ARCHIVE_TASKS',
  MOVE_TASKS_TO_DRAFT = 'MOVE_TASKS_TO_DRAFT',
  AI_WRITE_REPLY = 'AI_WRITE_REPLY',
  GENERATE_YOUR_TASKS = 'GENERATE_YOUR_TASKS',
  EDIT_SETTINGS = 'EDIT_SETTINGS',
  AI_WRITE_TASK_TITLES = 'AI_WRITE_TASK_TITLES',
  AI_WRITE_TASK_TEMPLATE = 'AI_WRITE_TASK_TEMPLATE',
  AI_WRITE_TASK_MESSAGE = 'AI_WRITE_TASK_MESSAGE'
}

export enum ETinyEditorToolbarPosition {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

export enum EContactCardOpenFrom {
  INTERNAL_NOTE = 'INTERNAL_NOTE',
  CHECK_LIST = 'CHECK_LIST',
  MESSAGE = 'MESSAGE'
}

export enum EPropertyToUpdate {
  IS_URGENT = 'isUrgent',
  IS_SEEN = 'isSeen',
  PROPERTY = 'property',
  PROPERTY_STATUS = 'propertyStatus',
  PARTICIPANTS = 'participants',
  USER_ID = 'userId',
  IS_DETECTED_CONTACT = 'isDetectedContact'
}

export enum ERequestType {
  GENERAL_ENQUIRY = 'general_request',
  MAINTENANCE_REQUEST = 'maintenance_request',
  VACATE_REQUEST = 'vacate_request',
  RESCHEDULE_INSPECTION = 'reschedule_inspection_request',
  PET_REQUEST = 'pet_request',
  KEY_REQUEST = 'key_request',
  BREAK_IN_INCIDENT = 'break_in_incident',
  KEY_HANDOVER = 'key_handover_request',
  FINAL_INSPECTION = 'final_inspection_request',
  GET_DOCUMENT = 'get_document',
  CALLBACK_REQUEST = 'call_back_request',
  CHANGE_TENANT_REQUEST = 'change_tenant_request',
  DOMESTIC_VIOLENCE_SUPPORT = 'domestic_violence_support'
}

export enum ETriggeredBy {
  SCROLL_EVENT = 'SCROLL_EVENT',
  SOCKET_EVENT = 'SOCKET_EVENT',
  MANUAL_EVENT = 'MANUAL_EVENT'
}
