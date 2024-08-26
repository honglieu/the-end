export enum EInspectionStatus {
  Tentative = 'Tentative',
  Proposed = 'Proposed',
  Confirmed = 'Confirmed',
  Inprogress = 'Inprogress',
  Conducted = 'Conducted',
  Closed = 'Closed',
  Cancelled = 'Cancelled',
  Scheduled = 'Scheduled',
  Completed = 'Completed'
}

export enum EPopupState {
  TRUDI_SEND_MESSAGE_SCHEDULE = 'TRUDI_SEND_MESSAGE_SCHEDULE',
  SELECT_EVENT_SCHEDULE = 'SELECT_EVENT_SCHEDULE',
  SCHEDULE_MESSAGE = 'SCHEDULE_MESSAGE'
}

export const REGEX_VARIABLE =
  /<span style="color: var\(--fg-brand, #28ad99\);" contenteditable="false">(.*?)<\/span>/g;

export const REGEX_VARIABLE_OLD_CONFIG =
  /<span style="color: var\(--trudi-primary, #00aa9f\);" contenteditable="false">(.*?)<\/span>/g;
