import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { EUserType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';

export interface IBillDetailData {
  id: string;
  billId: string;
  jobId: string;
  accountType: EUserType;
  comment: string;
  amount: number;
  is1099: boolean;
  isBillable: boolean;
  postDate: Date;
  glAccountId: string;
  accountId: string;
  markup: number;
  createdAt: Date;
  source: {
    externalId: number;
    sourceKey?: string;
    concurrencyId: number;
  };
  serviceManagerJob: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    isActive: true;
  };
  serviceManagerGLAccount: {
    id: string;
    name: String;
    description: String;
    isActive: boolean;
    sortOrder: number;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    type: null;
    email: string;
    userProperties: {
      property: {
        id: string;
        streetline: string;
      };
    };
  };
}
export interface IRMIssueBillData {
  id: string;
  workOrderId: null;
  accountId: string;
  termId: string;
  accountType: EUserType;
  amount: number;
  comment: string;
  invoice: string;
  postDate: Date;
  billDate: Date;
  dueDate: Date;
  isUpdated: false;
  syncStatus: ESyncStatus;
  errorSync: string;
  syncDate: Date;
  source: {
    sourceKey: string;
    externalId: number;
    concurrencyId: number;
  };
  serviceManagerTerm: {
    id: string;
    name: string;
    netDays: number;
    netMonths: number;
    monthDay: number;
    isActive: boolean;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    type: EUserType;
    email: string;
  };
  billDetails: IBillDetailData[];
}
export interface IBillDetailPayload {
  billDetailId: string;
  amount: number;
  gLAccountId: string;
  jobId: string;
  is1099: boolean;
  markup: number;
  isBillable: boolean;
  isPrimaryOwner: boolean;
  comment: string;
  accountId: string;
  accountType: EUserType;
}

export interface IRMIssueBillPayload {
  data: {
    billId: string;
    accountId: string;
    comment: string;
    invoice: string;
    accountType: EUserType;
    termId: string;
    billDate: Date;
    postDate: Date;
    dueDate: Date;
    isUpdated: boolean;
    billDetails: IBillDetailPayload[];
  };
  propertyId: string;
}
