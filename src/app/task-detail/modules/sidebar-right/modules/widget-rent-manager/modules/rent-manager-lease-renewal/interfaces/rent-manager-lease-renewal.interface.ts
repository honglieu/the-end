import { StatusSync } from '@/app/dashboard/shared/types/sidebar.interface';
import { FrequencyRental } from '@shared/types/trudi.interface';
import { IWidgetLease } from '@/app/task-detail/utils/functions';
import {
  EEntityType,
  ERentManagerType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { EFieldType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/enums/rent-manager-lease-renewal.enum';
import { ILinkedActions } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-linked/widget-linked.interface';

export enum EPTWidgetStatus {
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
  SCHEDULED = 'Scheduled',
  TENTATIVE = 'Tentative',
  RESCHEDULED = 'Rescheduled',
  CONDUCTED = 'Conducted',
  OPEN = 'Open'
}

export interface RMWidgetData {
  leaseRenewals: IWidgetLease[];
  tenantVacates: any[];
  leasing: any[];
  linkedActions: ILinkedActions[];
  noPTWidgetData: boolean;
}

export interface ERentManagerOption {
  type: ERentManagerType;
  option: {};
}

export interface ELeaseRenewalRM {
  id?: string;
  status?: StatusSync;
  startDate: string;
  endDate: string;
  rent?: number;
  tenancyId: string;
  leaseSign: string;
  frequency: FrequencyRental;
  leaseTerm: string | number;
  leaseTermLabel?: string;
  userPropertyGroup?: {
    name: string;
  };
  recurringCharges: ERecurringCharge[];
  rentDueDay?: number;
}
export interface ERecurringCharge {
  id: string;
  amount?: number;
  chargeTypeId: number;
  chargeType: EChargeType | string;
  comment?: string;
  fromDate?: string;
  toDate?: string;
  calculation?: string;
  entityType: EEntityType;
  frequency: number;
  createdAt?: string;
  isException?: boolean;
}

export interface EChargeType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface ELeaseTerm {
  id: number;
  name: string;
  isMTM: boolean;
  duration?: number;
  timeInterval?: string;
}

export interface IUserField {
  id?: string;
  name?: string;
  fieldType?: EFieldType;
  defaultValue?: string;
  value?: string;
  precisionValue?: string;
  comboList?: string;
  attachment?: IAttachment;
  parentType?: string;
  isRequired?: boolean;
  source?: source;
  createdAt?: string;
  updatedAt?: string;
  agencyId?: string;
  formIndex?: number;
  file: IFileS3[];
  maskPattern?: string;
}

export interface IAttachment {
  url: string;
  name: string;
  extension: string;
  description: string;
}

export interface IEncrypted {
  controlName: number;
  originValue: string;
}

export interface IFileS3 {
  title?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  mediaLink?: string;
  mediaType?: string;
  icon?: string;
  propertyId?: string;
  propertyIds?: string[];
}

export interface source {
  externalId: string;
  sourceKey: string;
}

export interface Ioption {
  label: string;
  value: string;
}

export interface IFileUserDefined {
  title?: string;
  mediaType?: string;
  fileName?: string;
  mediaLink?: string;
  fileType?: string;
  fileSize?: number;
  icon?: string;
  fileId?: string;
  propertyId?: string;
  propertyIds?: string[];
}
