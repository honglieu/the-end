import { EConfirmContactType } from '@shared/enum/contact-type';

export interface UnhappyStatus {
  isAssignNewTask: boolean;
  isConfirmProperty: boolean;
  confirmContactType: EConfirmContactType;
  isConfirmContactUser: boolean;
  isLandlordFutureWithNoProperty?: boolean;
}

export interface PropertyContact {
  propertyId: string;
  streetline: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  fullName?: string;
}
