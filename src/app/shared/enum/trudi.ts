export enum ETrudiType {
  ticket = 'ticket',
  q_a = 'q_and_a',
  super_happy_path = 'super_happy_path',
  unhappy_path = 'unhappy_path',
  pet_request = 'pet_request',
  lease_renewal = 'lease_renewal',
  leasing = 'leasing',
  routine_inspection = 'routine_inspection',
  routine_maintenance = 'routine_maintenance',
  landlord_request = 'landlord_request',
  tenant_request = 'tenant_request',
  suggestion = 'suggesstion',
  creditor_invoicing = 'creditor_invoicing',
  tenancy_invoicing = 'tenancy_invoicing',
  emergency_maintenance = 'emergency_maintenance',
  smoke_alarm = 'smoke_alarm',
  general_compliance = 'general_compliance',
  tenant_vacate = 'tenant_vacate',
  ingoing_inspection = 'ingoing_inspection',
  outgoing_inspection = 'outgoing_inspection',
  breach_notice = 'breach_notice',
  entry_notice = 'entry_notice'
}

export enum ETrudiRaiseByType {
  EMAIL = 'email',
  APP = 'app'
}

export enum EDirectionSort {
  ASC = 'ASC',
  DESC = 'DESC'
}

export enum EPlatform {
  MACOS = 'macos',
  WINDOWS = 'windows',
  LINUX = 'linux',
  IOS = 'ios',
  ANDROID = 'android'
}

export enum EPage {
  INDEX = 'INDEX',
  DETAILS = 'DETAILS'
}
