import {
  MaintenanceDecision,
  Regions,
  TrudiButton
} from '@shared/types/trudi.interface';
import { TenancyInvoiceSyncJob } from '@shared/types/tenancy-invoicing.interface';

import { EInspectionStatus } from './tenantVacate.enum';

export interface TenantVacateData {
  decisionList: MaintenanceDecision[];
  buttonData: TrudiButton[];
  actionTitle: string;
  subTitle: string;
  decisionIndex: number;
  region?: Regions;
}
export enum ETenantVacateButtonAction {
  requestTenantCompleteVacateFormEndOfLease = 'req_tenant_complete_vacate_form_end_of_lease',
  requestTenantCompleteVacateFormBreakLease = 'req_tenant_complete_vacate_form_break_lease',
  notifyLandlordThatTenantVacatingEndOfLease = 'notify_landlord_that_tenant_vacating_end_of_lease',
  notifyLandlordThatTenantVacatingBreakLease = 'notify_landlord_that_tenant_vacating_break_lease',
  sendTenantVacateInstructionsEndOfLease = 'send_tenant_vacate_instructions_end_of_lease',
  sendTenantVacateInstructionsBreakLease = 'send_tenant_vacate_instructions_break_lease',
  sendTenantVacateInstructionsNoticeToVacate = 'send_tenant_vacate_instructions_notice_to_vacate',
  sendTenantFinalAmountOwingEndOfLease = 'send_tenant_final_amount_owing_end_of_lease',
  sendTenantFinalAmountOwingBreakLease = 'send_tenant_final_amount_owing_break_lease',
  sendTenantFinalAmountOwingNoticeToVacate = 'send_tenant_final_amount_owing_notice_to_vacate',
  scheduleTenantReminderVacateInstructionsNoticeToVacate = 'schedule_tenant_reminder_vacate_instructions_notice_to_vacate',
  scheduleTenantReminderVacateInstructionsEndOfLease = 'schedule_tenant_reminder_vacate_instructions_end_of_lease',
  scheduleTenantReminderVacateInstructionsBreakLease = 'schedule_tenant_reminder_vacate_instructions_break_lease',
  confirmTenantLeaseBreakRequest = 'confirm_tenant_lease_break_request',
  sendBreakLeaseInvoicesToPropertyTree = 'send_break_lease_invoices_to_PT',
  issueTenantVacateNotice = 'issue_tenant_vacate_notice',
  sendInvoiceToPT = 'send_invoice_to_pt',
  notifyLandlordNoticeSent = 'notify_landlord_notice_sent',
  issueTenantWrittenNotice = 'issue_tenant_written_notice',
  // createVacantPropertyMaintenanceTask = 'create_vacant_property_maintenance_task',
  startRelettingTheProperty = 'start_reletting_the_property',
  notifyTenantOfFinalBondAmountAndRefundProcess = 'notify_tenant_of_final_bond_amount_and_refund_process',
  sendLandlordExitReport = 'send_landlord_exit_report',
  sendTenantExitReportAndRequestRemedyOfIssues = 'send_tenant_Exit_Report_and_request_remedy_of_issues',
  scheduleExitInspection = 'schedule_exit_inspection',
  sendVacateDetailToPT = 'send_vacate_property_tree'
}

export interface TenantVacateButton extends TrudiButton {
  movingHomeText?: string;
}

export interface ITenantVacateForm {
  tenantVacateType?: string;
  terminationDate?: string;
  noticeDate?: string;
  vacateDate?: string;
  chargeToDate?: string;
  description?: string;
  vacateType?: string;
  syncJob?: TenancyInvoiceSyncJob;
  statusOutGoingInspection?: string;
  syncPTOutGoingInspection?: IInspectionForm;
  tenancy?: string;
}

export interface ISyncPropertyVacate {
  taskId: string;
  propertyId: string;
  tenantVacateDetail: {
    terminationDate: string;
    noticeDate: string;
    vacateDate: string;
    chargeToDate: string;
    description: string;
    tenancyId?: string;
  };
  tenantVacateType: string;
  agencyId: string;
  outGoingInspectionDetail?: {
    date: string;
    startTime: string;
    endTime: string;
  };
}

export enum EDecisionVacateIndex {
  VACATE,
  BREAKLEASE,
  TERMINATION
}

export enum ESelectedReason {
  VACATE = 'vacate',
  BREAKLEASE = 'breakLease',
  TERMINATION = 'termination'
}

export interface IDataSyncVacate {
  chargeToDate: string;
  description: string;
  noticeDate: string;
  tenantVacateType: string;
  terminationDate: string;
  vacateDate: string;
}
export interface ITenantAmountVacate {
  firstField: number;
  secondField: number;
  thirdField: string;
  fourthField?: number;
}
export interface ILeaveNoticeDetail {
  notice: string;
  beforeDate: string;
}

export interface ITenantBreakLeaseVacate {
  breakLeaseFee?: number;
  advertisingFees?: number;
  otherFees?: number;
  feeName?: string;
}
export interface ReasonPopupLabels {
  firstLabel: string;
  secondLabel: string;
  thirdLabel: string;
}

export interface IInspectionForm {
  date?: string;
  startTime?: string;
  endTime?: string;
  statusOutGoingInspection?: EInspectionStatus;
}
