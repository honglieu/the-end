import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { Agency } from './agency.interface';
import {
  EAddOn,
  ECRMSystem
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ERole } from '@/app/auth/auth.interface';
import { BankAccount } from './user.interface';

export interface ICompany {
  id: string;
  name: string;
  logo: string;
  defaultLogo: string;
  country: string;
  CRM: string;
  mailbox: string;
  outgoingEmail: string;
  voiceMailPhoneNumber: string;
  isAISetting: boolean;
  useDefaultLogo: boolean;
  isActive: boolean;
  taskEditor: boolean;
  voicemail: boolean;
  areaCode: string;
  insights: boolean;
  configPlans: ConfigPlan;
  isDeleted: boolean;
  phoneNumber: string;
  address: string;
  companyEmail: string;
  businessName: string;
  outgoingCalls: boolean;
  createdAt: string;
  updatedAt: string;
  agencies: Agency[];
  hasOwner?: boolean;
  addOns?: EAddOn[];
  timeZone: string;
  crmSystem: ECRMSystem;
  crmSystemName: string;
  role: ERole;
  websiteUrl?: string;
  bankAccounts?: BankAccount[];
  regionWorkingHours?: IRegionWorkingHours[];
}

export interface IRegionWorkingHours {
  id: string;
  regionId: string;
  agencyId: string;
  dayInWeek: string;
  isEnable: boolean;
  startTime: string;
  endTime: string;
  companyId: string;
}
