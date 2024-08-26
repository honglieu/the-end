import { Compliance } from '@shared/types/compliance.interface';
import { IInvoice } from '@shared/types/invoice.interface';
import { IPropertyNoteForm } from '@/app/smoke-alarm/utils/smokeAlarmType';
import { ComplianceCategory } from '@shared/types/compliance.interface';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';

export interface IComplianceResponse {
  data: IComplianceData;
  errorMessSync: string;
  lastTimeSync: string;
  syncDate: string;
  syncStatus: string;
}

export interface ISyncPropertyNote {
  complianceDetail: IPropertyNoteForm;
  propertyId?: string;
  smokeAlarmType?: string;
  complianceItem?: string;
  taskId?: string;
  agencyId?: string;
  invoices?: IInvoice[];
  categoryId?: string;
  complianceId?: string;
}

export interface IComplianceData {
  complianceItem: string;
  smokeAlarmType?: string;
  managedBy: string;
  servicesBy: string;
  authorRecevied: string;
  expiredDate: string;
  lastServiceDate: string;
  nextServiceDate: string;
  note: string;
  authorityForm?: string;
  idUserPropertyGroup?: string;
}

export interface IDecisionCompliance {
  index: number;
  title?: string;
  reason?: string;
  decision: string;
  fullReasonDecision?: string;
  decisionIndex: number;
}

export interface PropertyNoteForm {
  complianceItem?: string;
  smokeAlarmType: string;
  managedBy: string;
  servicesBy?: string;
  authorReceived?: string;
  expiredDate: string;
  lastServiceDate: string;
  nextServiceDate: string;
  note: string;
  tenancy?: string;
  creditorId?: string;
  authorityForm?: string;
}

export interface ICategoryItem {
  id?: string;
  name?: string;
  type?: string;
  agencyId?: string;
  idPropertyTree?: string;
  compliance?: Compliance;
  complianceCategory?: ComplianceCategory;
}

export interface IDataPopupCompliance {
  selectedComplianceItem: ICategoryItem | Compliance;
  typePopup: EPropertyTreeType;
}
