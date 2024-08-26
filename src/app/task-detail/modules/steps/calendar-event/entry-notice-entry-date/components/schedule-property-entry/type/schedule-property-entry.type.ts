export enum EOptionSelect {
  INSPECT_THE_PROPERTY = 'Inspect the property',
  CONDUCT_OR_INSPECTION_REPAIRS = 'Conduct or inspection repairs',
  INSTALL_CHECK_SMOKE_ALARMS_OR_SAFETY_SWITCHES = 'Install / check smoke alarms or safety switches',
  SHOW_THE_PROPERTY_TO_PROSPECTIVE_BUYER_OR_TENANT = 'Show the property to prospective buyer or tenant',
  CONDUCT_A_PROPERTY_VALUATION = 'Conduct a property valuation',
  CHECK_FOR_SUSPECTED_ABANDONMENT = 'Check for suspected abandonment',
  CHECK_IF_A_SIGNIFICANT_BREACH_HAS_BEEN_REMEDIED = 'Check if a significant breach has been remedied',
  OTHER = 'Other'
}

export interface EntryNoticePayload {
  reason: string;
  taskId: string;
  eventId: string;
  detailReason?: string;
  date: string;
}

export interface EventStatusPayload {
  eventId: string;
  taskId: string;
}

export interface reasonOption {
  label: string;
  value: EOptionSelect;
}

export enum EAction {
  ADD = 'add',
  EDIT = 'edit'
}

export interface ShowModal {
  isShow: boolean;
  action: EAction;
}
