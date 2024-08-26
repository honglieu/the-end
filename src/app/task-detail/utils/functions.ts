import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { FrequencyRental } from '@shared/types/trudi.interface';
import { ERecurringCharge } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';

export const example = () => {};

export function toStringFloat(value: string | number) {
  try {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }
    return value ? value.toFixed(2) : null;
  } catch {
    return null;
  }
}

export interface MenuItem {
  label: string;
  subMenu?: MenuItem[];
  type?: string;
}

export interface IWidgetLease {
  id?: string;
  status?: LeaseRenewalSyncStatus;
  startDate?: string;
  endDate?: string;
  rent?: number | string;
  effectiveDate?: string;
  currentLeaseExpires?: string;
  remainingDay?: string;
  frequency?: string;
  file?: any;
  errorSync?: string;
  userPropertyGroup?: UserPropertyGroup;
  tenancyId?: string;
  tenancyName?: string;
  rentAmount?: number;
  leaseStart?: string;
  leaseEnd?: string;
  lastTimeSync?: string;
  firstTimeSyncSuccess?: boolean;
  idPropertyTree?: string;
  isSuccessful?: boolean;
  leaseTerm?: number;
  leaseTermName?: string;
  leaseSign?: string;
  recurringCharges?: ERecurringCharge[];
  source?: {
    rentDueDay?: string | number;
  };
}

export interface IWidgetVacate {
  chargeToDate?: string;
  createdAt?: string;
  description?: string;
  invoiceDescription?: string;
  noticeDate?: string;
  previousVacateDate?: string;
  status?: string;
  taskId?: string;
  tenancy?: ITenancyWidgetVacate;
  tenancyId?: string;
  tenantVacateType?: string;
  terminationDate?: string;
  updatedAt?: string;
  vacateDate?: string;
  vacateType?: string;
}

export interface ITenancyWidgetVacate {
  name: string;
  id?: string;
}

export interface UserPropertyGroup {
  name: string;
}

export enum EPropertyTreeType {
  CREATE_NOTES = 'CREATE_NOTES',
  NOTES = 'NOTE',
  CREDITOR_INVOICE = 'CREDITOR_INVOICE',
  TENANCY_INVOICE = 'TENANCY_INVOICE',
  MAINTENANCE_REQUEST = 'MAINTENANCE_REQUEST',
  MAINTENANCE_INVOICE = 'MAINTENANCE_INVOICE',
  ROUTINE_INSPECTION = 'ROUTINE_INSPECTION',
  OUTGOING_INSPECTION = 'OUTGOING_INSPECTION',
  INGOING_INSPECTION = 'INGOING_INSPECTION',
  LEASE_RENEWAL = 'LEASE_RENEWAL',
  VACATE_DETAIL = 'VACATE_DETAIL',
  NEW_TENANCY = 'NEW_TENANCY',
  CREATE_COMPLIANCE = 'CREATE_COMPLIANCE',
  UPDATE_COMPLIANCE = 'UPDATE_COMPLIANCE',
  SYNC_COMPLIANCE = 'SYNC_COMPLIANCE',
  CLOSE_POPUP = 'CLOSE_POPUP',
  SYNC_PROPERTY_TREE = 'SYNC_PROPERTY_TREE',
  UPDATE_NOTES = 'UPDATE_NOTES',
  UPDATE_WIDGET = 'UPDATE_WIDGET',
  CREATE_ISSUE = 'CREATE_ISSUE',
  COMPLIANCE = 'COMPLIANCE',
  CREATE_INGOING_INSPECTION = 'CREATE_INGOING_INSPECTION',
  UPDATE_INGOING_INSPECTION = 'UPDATE_INGOING_INSPECTION',
  CREATE_OUTGOING_INSPECTION = 'CREATE_OUTGOING_INSPECTION',
  UPDATE_OUTGOING_INSPECTION = 'UPDATE_OUTGOING_INSPECTION',
  CREATE_ROUTINE_INSPECTION = 'CREATE_ROUTINE_INSPECTION',
  UPDATE_ROUTINE_INSPECTION = 'UPDATE_ROUTINE_INSPECTION',
  CREATE_CREDITOR_INVOICE = 'CREATE_CREDITOR_INVOICE',
  UPDATE_CREDITOR_INVOICE = 'UPDATE_CREDITOR_INVOICE'
}

export interface EPropertyTreeOption {
  type: EPropertyTreeType;
  option: {};
}

export enum EInspectionStatus {
  CANCELLED = 'Cancelled',
  SCHEDULED = 'Scheduled',
  TENTATIVE = 'Tentative',
  CONDUCTED = 'Conducted',
  CLOSED = 'Closed',
  PROPOSED = 'Proposed',
  CONFIRMED = 'Confirmed'
  // RESCHEDULED = 'Rescheduled',
  // COMPLETED = 'Completed',
}

export enum ESyncStatus {
  COMPLETED = 'COMPLETED',
  INPROGRESS = 'INPROGRESS',
  FAILED = 'FAILED',
  UN_SYNC = 'UNSYNC',
  NOT_SYNC = 'NOT_SYNC',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS'
}

export const LIST_TYPE_RENT = [
  {
    label: 'Per day',
    value: FrequencyRental.DAILY
  },
  {
    label: 'Per week',
    value: FrequencyRental.WEEKLY
  },
  {
    label: 'Per fortnight',
    value: FrequencyRental.FORTNIGHT
  },
  {
    label: 'Per month',
    value: FrequencyRental.MONTHLY
  },
  {
    label: 'Per quarter',
    value: FrequencyRental.QUARTERLY
  },
  {
    label: 'Per year',
    value: FrequencyRental.YEARLY
  }
];

export const FORMAT_ICON_SYNC = {
  '': {
    icon: 'stopSync',
    text: 'Not synced'
  },
  [SyncMaintenanceType.PENDING]: {
    icon: 'stopSync',
    text: 'Not synced'
  },
  [SyncMaintenanceType.INPROGRESS]: {
    icon: 'syncingV2',
    text: 'Syncing'
  },
  [SyncMaintenanceType.FAILED]: {
    icon: 'warningsync',
    text: 'Fail to sync'
  },
  [SyncMaintenanceType.COMPLETED]: {
    icon: 'checkedSync',
    text: 'Synced'
  },
  [SyncMaintenanceType.UN_SYNC]: {
    icon: 'notSynced',
    text: 'Unsynced changes'
  }
};

export const TypeVacate = [
  { value: 'vacate', text: 'Vacate' },
  { value: 'breakLease', text: 'Break lease' },
  { value: 'termination', text: 'Termination' }
];

export interface ITimeSyncLease {
  status: LeaseRenewalSyncStatus;
  lastTimeSync?: string;
}
