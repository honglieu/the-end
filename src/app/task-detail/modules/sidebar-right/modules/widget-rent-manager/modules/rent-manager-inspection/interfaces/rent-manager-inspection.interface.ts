import { ERmCrmStatus } from '@shared/enum/user.enum';
import { EUserPayloadType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

export interface ISyncRmInspection {
  taskId: string;
  agencyId?: string;
  propertyId: string;
  idUserPropertyGroup: string;
  inspectionTypeID: string;
  inspectionStatusID: string;
  inspectionDate: Date;
  scheduledDate: Date;
  description: string;
  notes: string;
  concurrencyId?: string;
  inspectionAreas?: IInspectionAreas[];
}

export interface IInspectionAreas {
  id: string;
  inspectionId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  externalId: string | number;
  inspectionAreaItems: IInspectionAreaItems[];
}

export interface IInspectionAreaItems {
  id: string;
  inspectionAreaId: string;
  name: string;
  status: string;
  isActionItem: boolean;
  isSevere: boolean;
  isReviewNeeded: boolean;
  note: string;
  files: IInspectionAreaItemFile[];
  externalId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInspectionAreaItemFile {
  fileName?: string;
  mediaLink?: string;
  fileType?: string;
  fileSize?: string;
  icon?: string;
  fileId?: string;
  inspectionAreaItemAttachmentId?: string;
  InspectionAreaItemID?: string;
}

export interface IInspectionResourcesRes {
  statuses: IStatus[];
  tenants: ITenancy[];
  types: IType[];
}

export interface ITenancy {
  id: string;
  isPrimary: boolean;
  type: EUserPayloadType;
  firstName: string;
  lastName: string;
  iviteSent: string;
  lastActivity: string;
  phoneNumber: string | number;
  mobileNumber: [];
  email: string;
  status: ERmCrmStatus;
  offBoardedDate: Date;
  contactType: string;
  landingPage: string;
  supplierType: string;
  isEmergencyContact: boolean;
  streetLine: string;
  propertyId: string;
  idUserPropertyGroup: string;
}

export interface IStatus {
  id: string;
  name: string;
}

export interface IType extends IStatus {}

export interface IRentManagerInspection {
  id: string;
  taskId: string;
  propertyId: string;
  userId: string;
  idUserPropertyGroup: string;
  syncStatus: ESyncStatus | ESyncStatus;
  syncDate: Date;
  syncState?: 'INIT' | 'UPDATE';
  stepId?: string;
  status: string;
  inspectionDate: Date;
  scheduledDate: Date;
  subTypeId: string;
  subStatusId: string;
  description: string;
  notes: string;
  userPropertyGroup: {
    id: string;
    name: string;
  };
  inspectionType: {
    id: string;
    name: string;
  };
  inspectionStatus: {
    id: string;
    name: string;
  };
  createdAt: Date;
  concurrencyId?: string;
  updatedAt: Date;
  errorMessSync: string;
  externalInspectionId?: string;
  inspectionAreas: IInspectionAreas[];
}

export interface IUpdateSyncInspection {
  syncStatus: ESyncStatus;
  syncDate: Date;
  syncState?: 'INIT' | 'UPDATE';
  stepId?: string;
  taskId: string;
  userPropertyGroup: {
    id: string;
    name: string;
  };
  inspectionType: {
    id: string;
    name: string;
  };
  inspectionStatus: {
    id: string;
    name: string;
  };
  errorMessSync: string;
}
