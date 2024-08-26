import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { LeasingWidgetRequestTrudiResponse } from '@shared/types/trudi.interface';
import { Compliance } from '@shared/types/compliance.interface';
import {
  EPropertyTreeType,
  IWidgetLease,
  IWidgetVacate
} from '@/app/task-detail/utils/functions';
import { InvoiceDataReq } from '@shared/types/tenancy-invoicing.interface';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { EntryNoticeData } from '@shared/types/entry-notice.interface';
import { ERentManagerType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { EButtonStepKey } from '@trudi-ui';
import { ILinkedActions } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-linked/widget-linked.interface';
import { ELinkedTask } from '@/app/shared/types/task.interface';

export interface PTWidgetData {
  routineInspections: InspectionSyncData[];
  outgoingInspections: InspectionSyncData[];
  ingoingInspections: InspectionSyncData[];
  notes: PtNote[];
  leasing: LeasingWidgetRequestTrudiResponse[];
  compliances: Compliance[];
  leaseRenewals: IWidgetLease[];
  tenantVacates: IWidgetVacate[];
  maintenanceRequest: IMaintenanceRequest[];
  maintenanceInvoice: IMaintenanceInvoice[];
  linkedActions: ILinkedActions[];
  invoices: InvoiceDataReq[];
  noPTWidgetData: boolean;
  entryNotices: EntryNoticeData[];
  linkedTasks?: ELinkedTask[];
}
export enum PTWidgetDataField {
  ROUTINE_INSPECTION = 'routineInspections',
  INGOING_INSPECTION = 'ingoingInspections',
  OUTGOING_INSPECTION = 'outgoingInspections',
  NOTES = 'notes',
  LEASING = 'leasing',
  COMPLIANCES = 'compliances',
  LEASE_RENEWAL = 'leaseRenewals',
  TENANT_VACATES = 'tenantVacates',
  TENANCY_INVOICES = 'tenancyInvoices',
  CREDITOR_INVOICES = 'creditorInvoices',
  MAINTENANCE_REQUEST = 'maintenanceRequest',
  MAINTENANCE_INVOICE = 'maintenanceInvoice',
  ENTRY_NOTICES = 'entryNotices',
  LINKED_ACTIONS = 'linkedActions'
}

export enum EPTWidgetStatus {
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
  SCHEDULED = 'Scheduled',
  TENTATIVE = 'Tentative',
  RESCHEDULED = 'Rescheduled',
  CONDUCTED = 'Conducted',
  OPEN = 'Open'
}

export interface ITenanciesMapped {
  id: string;
  idUserPropertyGroup?: string;
  startDate?: string;
  endDate?: string;
  vacateDate: string;
  originalLeaseStartDate?: string;
  rentAmount?: number;
  frequency?: string;
  dayRemaining?: number;
}

export enum WidgetDataTitle {
  ROUTINE_INSPECTION = 'routine inspection',
  INGOING_INSPECTION = 'ingoing inspection',
  OUTGOING_INSPECTION = 'outgoing inspection',
  TENANCY_INVOICE = 'tenancy invoice',
  CREDITOR_INVOICE = 'creditor invoice',
  MAINTENANCE_REQUEST = 'maintenance request',
  MAINTENANCE_INVOICE = 'maintenance invoice',
  VACATE_DETAILS = 'vacate details',
  LEASE_RENEWAL = 'lease renewal',
  NEW_TENANCY = 'new tenancy',
  NOTE = 'note',
  COMPLIANCE = 'compliance item',

  //RM
  ISSUE = 'issue',
  RM_NOTE = 'note',
  RM_INSPECTION = 'inspection',
  RM_NEW_TENANT = 'tenant'
}

export const mapComponentToTitle = {
  [EPropertyTreeType.CREDITOR_INVOICE]: WidgetDataTitle.CREDITOR_INVOICE,
  [EPropertyTreeType.TENANCY_INVOICE]: WidgetDataTitle.TENANCY_INVOICE,
  [EPropertyTreeType.MAINTENANCE_INVOICE]: WidgetDataTitle.MAINTENANCE_INVOICE,
  [EPropertyTreeType.MAINTENANCE_REQUEST]: WidgetDataTitle.MAINTENANCE_REQUEST,
  [EPropertyTreeType.VACATE_DETAIL]: WidgetDataTitle.VACATE_DETAILS,
  [EPropertyTreeType.LEASE_RENEWAL]: WidgetDataTitle.LEASE_RENEWAL,
  [EPropertyTreeType.NEW_TENANCY]: WidgetDataTitle.NEW_TENANCY,
  [EPropertyTreeType.ROUTINE_INSPECTION]: WidgetDataTitle.ROUTINE_INSPECTION,
  [EPropertyTreeType.OUTGOING_INSPECTION]: WidgetDataTitle.OUTGOING_INSPECTION,
  [EPropertyTreeType.INGOING_INSPECTION]: WidgetDataTitle.INGOING_INSPECTION,
  [EPropertyTreeType.COMPLIANCE]: WidgetDataTitle.COMPLIANCE,
  [ERentManagerType.ISSUE]: WidgetDataTitle.ISSUE,
  [ERentManagerType.INSPECTION]: WidgetDataTitle.RM_INSPECTION,
  [EPropertyTreeType.NOTES]: WidgetDataTitle.RM_NOTE,
  [ERentManagerType.NEW_TENANT]: WidgetDataTitle.RM_NEW_TENANT
};

export const mapComponentToTitleKey = {
  [EPropertyTreeType.NOTES]: EButtonStepKey.NOTES,
  [EPropertyTreeType.CREDITOR_INVOICE]: EButtonStepKey.CREDITOR_INVOICE,
  [EPropertyTreeType.TENANCY_INVOICE]: EButtonStepKey.TENANCY_INVOICE,
  [EPropertyTreeType.MAINTENANCE_REQUEST]: EButtonStepKey.MAINTENANCE_REQUEST,
  [EPropertyTreeType.MAINTENANCE_INVOICE]: EButtonStepKey.MAINTENANCE_INVOICE,
  [EPropertyTreeType.ROUTINE_INSPECTION]: EButtonStepKey.ROUTINE_INSPECTION,
  [EPropertyTreeType.OUTGOING_INSPECTION]: EButtonStepKey.OUTGOING_INSPECTION,
  [EPropertyTreeType.INGOING_INSPECTION]: EButtonStepKey.INGOING_INSPECTION,
  [EPropertyTreeType.LEASE_RENEWAL]: EButtonStepKey.LEASE_RENEWAL,
  [EPropertyTreeType.VACATE_DETAIL]: EButtonStepKey.VACATE_DETAILS,
  [EPropertyTreeType.NEW_TENANCY]: EButtonStepKey.NEW_TENANCY,
  [EPropertyTreeType.COMPLIANCE]: EButtonStepKey.COMPLIANCE
};
