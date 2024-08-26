import { EPropertyProfileTab } from '@shared/components/property-profile/enums/property-profile.enum';
import { ETypePage } from '@/app/user/utils/user.enum';
import { UserProperty } from '@shared/types/users-by-property.interface';

export interface IPropertyProfileTab {
  title: string;
  value: EPropertyProfileTab;
}

export enum EArrearsType {
  RENT = 'Rent',
  FEES = 'Fees/Invoices'
}

export interface IArrearsData {
  title: string;
  amount: 0;
}

export const DEFAULT_ARREARS_DATA: Record<
  EArrearsType | 'Total',
  IArrearsData
> = {
  [EArrearsType.FEES]: {
    title: 'Invoices / Fees',
    amount: 0
  },
  [EArrearsType.RENT]: {
    title: 'Rent',
    amount: 0
  },
  Total: {
    title: 'Total',
    amount: 0
  }
};

export type PayloadCalendarEventType = {
  pageIndex: number;
  pageSize: number;
  isPreviousEvent: boolean;
  propertyId: string | null;
  isIncludeCancelledAndCloseEvent: boolean;
};

export interface ITenantIdDispatcher {
  id: string;
  propertyId: string;
  userPropertyGroupId?: string;
}

export interface ICurrentPageData {
  openFrom: ETypePage;
  currentUserData: UserProperty;
}

export const PROPERTY_PROFILE_TABS: IPropertyProfileTab[] = [
  {
    title: 'Details',
    value: EPropertyProfileTab.DETAILS
  },
  {
    title: 'Notes',
    value: EPropertyProfileTab.NOTES
  },
  {
    title: 'Events',
    value: EPropertyProfileTab.EVENTS
  }
];
