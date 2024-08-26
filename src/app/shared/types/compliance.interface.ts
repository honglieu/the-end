import { EManagedBy } from '@/app/smoke-alarm/utils/smokeAlarmType';
import { EComplianceType, ESmokeAlarmType } from '@shared/enum/compliance.enum';

export interface Compliance {
  id: string;
  idPropertyTree: string;
  propertyId: string;
  complianceCategoryId: string;
  creditorId: string;
  expiryDate: string;
  nextServiceDate: string;
  authorityForm: string;
  managedBy: EManagedBy;
  status: string;
  type: EComplianceType;
  smokeAlarmType: ESmokeAlarmType;
  deleted: boolean;
  taskId: string;
  reminderDate: string;
  reminderValue: number;
  reminderPeriod: string;
  frequencyValue: string;
  frequencyPeriod: string;
  lastServiceDate: string;
  complianceCategory: ComplianceCategory;
  previousNextServiceDate: string;
  previousExpiryDate: string;
  syncStatus?: string;
  syncDate?: string | Date;
  categoryId?: string;
  idUserPropertyGroup?: string;
  complianceSyncFail?: Compliance;
  lastTimeSync?: string;
  complianceTaskId?: string;
  firstTimeSyncSuccess?: boolean;
  isSuccessful: boolean;
}

export interface ComplianceCategory {
  id: string;
  idPropertyTree: string;
  agencyId: string;
  complianceCategoryId: string;
  name: string;
  type: EComplianceType;
  deleted: boolean;
}
