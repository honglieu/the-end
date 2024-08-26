import { IInvoiceStatus } from '@shared/types/invoice.interface';
import { EWeekly } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/enums/rent-manager-lease-renewal.enum';

export enum EStepType {
  PROPERTY_TREE = 'PROPERTY_TREE',
  NEW_TASK = 'NEW_TASK'
}

export enum EButtonAction {
  PT_NEW_COMPONENT = 'pt_new_component',
  PT_UPDATE_COMPONENT = 'pt_update_component'
}

export enum ERentManagerAction {
  RM_NEW_COMPONENT = 'rm_new_component',
  RM_UPDATE_COMPONENT = 'rm_update_component'
}

export enum EPropertyTreeButtonComponent {
  NOTE = 'NOTE',
  CREDITOR_INVOICE = 'CREDITOR_INVOICE',
  TENANCY_INVOICE = 'TENANCY_INVOICE',
  MAINTENANCE_REQUEST = 'MAINTENANCE_REQUEST',
  MAINTENANCE_INVOICE = 'MAINTENANCE_INVOICE',
  ROUTINE_INSPECTION = 'ROUTINE_INSPECTION',
  INGOING_INSPECTION = 'INGOING_INSPECTION',
  OUTGOING_INSPECTION = 'OUTGOING_INSPECTION',
  LEASE_RENEWAL = 'LEASE_RENEWAL',
  VACATE_DETAIL = 'VACATE_DETAIL',
  NEW_TENANCY = 'NEW_TENANCY',
  COMPLIANCE = 'COMPLIANCE'
}

export enum ERentManagerButtonComponent {
  LEASE_RENEWAL = 'LEASE_RENEWAL',
  ISSUE = 'ISSUE',
  INSPECTION = 'INSPECTION',
  NOTES = 'NOTES',
  VACATE_DETAIL = 'VACATE_DETAIL',
  NEW_TENANT = 'NEW_TENANT'
}

export enum EPeriodType {
  Week = 1,
  Month = 2,
  Year = 3,
  UserDefined = 4
}

export const PeriodTypeString: Record<number, string> = {
  [EPeriodType.Week]: 'Weeks',
  [EPeriodType.Month]: 'Months',
  [EPeriodType.Year]: 'Years',
  [EPeriodType.UserDefined]: 'User defined'
};

export enum EPaymentType {
  daily = 1,
  weeks = 2,
  fortnightly = 3,
  monthly = 4,
  quarterly = 5,
  yearly = 6,
  weekly = 2
}

export enum EStatusInvoice {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  PARTPAID = 'PARTPAID',
  CANCEL = 'CANCEL'
}

export enum Efrequency {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  FORNIGHT = 'FORNIGHT',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export const FREQUENCY_CHECK = {
  [Efrequency.DAILY]: 'Daily',
  [Efrequency.MONTHLY]: 'Monthly',
  [Efrequency.WEEKLY]: 'Weekly',
  [Efrequency.FORNIGHT]: 'Fortnightly',
  [Efrequency.QUARTERLY]: 'Quarterly',
  [Efrequency.YEARLY]: 'Yearly'
};

export const WEEKLY_CHECK = {
  [EWeekly.MONDAY]: 'Monday',
  [EWeekly.TUESDAY]: 'Tuesday',
  [EWeekly.WEDNESDAY]: 'Wednesday',
  [EWeekly.THURSDAY]: 'Thursday',
  [EWeekly.FRIDAY]: 'Friday',
  [EWeekly.SATURDAY]: 'Saturday',
  [EWeekly.SUNDAY]: 'Sunday'
};

export const INVOICE_STATUS_CHECK: IInvoiceStatus = {
  [EStatusInvoice.PARTPAID]: 'Part-paid',
  [EStatusInvoice.PAID]: 'Paid',
  [EStatusInvoice.UNPAID]: 'Unpaid',
  [EStatusInvoice.CANCEL]: 'Cancelled'
};

export const TypeCompliance = [
  { value: 'NotReceived', text: 'Not Received' },
  { value: 'Received', text: 'Received' }
];
