import { SubscriptionStatus } from 'aws-sdk/clients/sesv2';
import { Region } from '@shared/enum/region.enum';
import {
  EAddOn,
  ECRMSystem
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { TaskName } from './task.interface';

export interface Suppliers {
  checked?: boolean;
  agencyId?: string;
  companyName?: string;
  contactName?: string;
  createdAt?: string;
  emergencyPhoneNumber?: string;
  landingPage: string;
  phoneNumber?: string;
  id: string;
  type: string;
  title?: string;
  updatedAt?: string;
  website?: string;
  firstName: string;
  lastName: string;
  email: string;
  googleAvatar?: string;
  mobileNumber: string;
  idUserPropetyTree?: string;
}

export interface TopicTask {
  id: string;
  taskNameId: string;
  order: number;
  taskName: TaskName;
}

export interface Folder {
  id: string;
  name: string;
  order: number;
  type: string;
  topicTaskNames: TopicTask[];
}

export interface BindingValueSupplierItemDropdown {
  name?: string;
  email?: string;
  topicId: string;
}

export interface SupplierItemDropdown {
  label: string;
  value: BindingValueSupplierItemDropdown;
  group: string;
}

interface AgencySetting {
  websiteUrl: string;
  reiDomain?: string;
}

export interface AgentSettingInfo {
  address: string;
  companyEmail: string;
  createdAt: string;
  id: string;
  logo: string;
  name: string;
  agencySetting?: AgencySetting;
  phoneNumber: string;
  updatedAt: string;
  businessName?: string;
  timeZone?: string;
  websiteUrl?: string;
}

export interface AgencyDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  podIds: string[];
}
export interface CrudAgency {
  syncToken: string;
  primaryColor: string;
  secondaryColor: string;
  thirdColor: string;
  splashColor: string;
  companyName: string;
  splashUrl: string;
  trudiLogo: string;
  companyLogo: string;
}

export interface RegionInfo {
  id: string;
  name: Region;
  startTime: string;
  endTime: string;
  timezone: string;
  alias: string[];
  zone: string;
  label: string;
}

export interface HolidayItem {
  id?: string;
  name?: string;
  date?: string;
  regionId?: string;
  isActive?: boolean;
  isDefault?: boolean;
  typeRepeat?: string;
  checked?: boolean;
  holidayId?: string;
}

export interface Agency {
  address: string;
  addressLine: string;
  agencySetting: oldAgencySetting;
  incomingEmail: string | null;
  country: string;
  id: string;
  logo: string;
  name: string;
  phoneNumber: string;
  postCode: string;
  state: string;
  streetNumber: string;
  suburb: string;
  unreadMessagesCount: number;
  businessName: string;
  addOns: EAddOn[];
  //TODO: any type update later
  bankAccounts: any;
  regionWorking: any;
  hasOwner: boolean;
  CRM?: string;
  disabled?: boolean;
}

export interface oldAgencySetting {
  timeZone?: string;
  areaCode?: string;
  agencyId: string;
  agencyLogo: string;
  config: string;
  id: string;
  isAISetting: boolean;
  isActive: boolean;
  mailbox: string;
  websiteUrl: string;
  useDefaultLogo?: boolean;
  crmSystem?: ECRMSystem;
  CRM?: string;
  configPlans?: ConfigPlan;
}

export interface ResultAgenciesConsoleSetting {
  results: AgencyConsoleSetting[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface AgencyConsoleSetting {
  taskEditor?: boolean;
  voicemail?: boolean;
  mobileApp?: boolean;
  suggestedReplies?: boolean;
  id?: string;
  name?: string;
  incomingEmail?: string;
  outgoingEmail?: string;
  voiceMailPhoneNumber?: string;
  userSeats?: number;
  addOns?: EAddOn[];
  agencyLogo?: string;
  subscriptions?: StripeSubscriptions[];
  customer?: StripeCustomer;
  agencyURL?: string;
  companyCode?: string;
  country?: string;
  CRM?: string;
  CRMName?: string;
  countryName?: string;
  outgoingCalls?: boolean;
  subscription?: string[];
  configPlans?: ConfigPlan;
  areaCode?: string;
  insights?: boolean;
  translation?: boolean;
  tasks?: string[];
  taskNames?: ICompanyConsoleSettingTaskName[];
  CRMSubscription?: ICompanyConsoleSettingCRMSubscription[];
  agencies?: IAgencies[];
  companyName?: string;
  taskNameCompanies?: ITaskNameCompanies[];
}

interface ITaskNameCompanies {
  taskNameId: string;
}

interface ICompanyConsoleSettingTaskName {
  id: string;
  name: string;
  regions: string[];
}

interface ICompanyConsoleSettingCRMSubscription {
  id: string;
  name: string;
}

export interface CompanyPayload {
  companyId?: string;
  name: string;
  taskEditor: boolean;
  mobileApp: boolean;
  suggestedReplies: boolean;
  voicemail: boolean;
  voiceMailPhoneNumber: string;
  agencyLogo: string;
  CRM: string;
  country: string;
  customerId: string;
  subscriptionIds: string[];
  agencyURL?: string;
}

export interface AgencyAddon {
  title: string;
  controlName: string;
  comingSoon?: boolean;
}

export interface StripeCustomer {
  id: string;
  name: string;
  email: string;
}

export interface StripeSubscriptions {
  id: string;
  metadata: {
    Name: string;
  };
  deleted: boolean;
  displayName: string;
  status: SubscriptionStatus;
}

export interface IIntegrations {
  description: string;
  icon: IIntegrationsIcon;
  linkContent: string;
  helpCentreLink: string;
}

interface IIntegrationsIcon {
  name: string;
  styles?: {};
}

export interface IAgencies {
  ptAgencyName: string;
  countProperties: number;
  agencySetting: oldAgencySetting;
}

export interface ISettingTaskActivityLog {
  isAutoSync?: boolean;
  categoryName?: string;
}
export interface ISettingTaskActivityLogPayload {
  settingTaskActivityLog: ISettingTaskActivityLog;
}
export interface ISettingTaskActivityResponse {
  id: string;
  settingTaskActivityLog?: ISettingTaskActivityLog;
}
