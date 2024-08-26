import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EUserPropertyType } from '@shared/enum';

export interface IPoliciesRoute {
  id: string;
  name: string;
  link?: string;
}

export interface IMaintenanceAndCompliance {}

export interface IOptionConfig {
  id: string;
  text: string;
  isSubOption?: boolean;
  config?: IConfigInput;
  children?: IOptionConfig[];
  value?: string;
}

export interface IConfigInput {
  type: string;
  css: IConfigInputCSS;
  defaultValue: string;
  children?: IOptionConfig[];
  items?: [];
  bindValue?: string | number;
  bindLabel?: string;
}

export interface IConfigInputCSS {
  width: string;
  display: string;
}
interface FormData {
  optionId: string;
  value: {};
}

export interface IResponseCheckBox {
  [id: string]: FormData;
}
export interface ISelectContacts {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  landingPage: string;
  email: string;
  status: string;
  tradeTypeName?: string;
  isPrimary?: string;
  type?: string;
}

export interface ICreateSupplierPolicy {
  tradeTypeId?: string;
  companyName?: string;
  contactName?: string;
  companyPhoneNumber?: string;
  email?: string;
  website?: string;
}
export interface IDeleteEmergencyContacts {
  agencyEmergencyId?: string;
}

export interface IItemConfig {
  id: number;
  text: string;
}
export interface IConfigNgSelect {
  items: IItemConfig[];
  bindValue: string;
  bindLabel: string;
  defaultValue?: number | string;
}

export interface IBaseOptionDto {
  optionId: string;
  value: Object | Array<Object>;
}

export interface IUpdateExcludedPropertyPayload {
  userIds: string[];
  propertyId: string;
}

export interface IRemoveOptionDto {
  optionIds: string[];
}

export interface IResponseOptionsDto {
  [id: string]: IBaseOptionDto;
}

export interface IOptionLeasing {
  key: string;
  value?: IItemOptionLeasing;
}

export interface IItemOptionLeasing {
  id: string;
  title: string;
  subTitle: string;
  msgNotEdit?: string;
}

export interface IFilePolicies {
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mediaLink: string;
  mediaType?: string;
  icon?: string;
  propertyId?: string;
  propertyIds?: string[];
}

export interface IUploadFile {
  fileName: string;
  fileType: string;
  fileSize?: number;
  optionId?: string;
  fileUrl: string;
}
export interface IUserContact extends ISelectContacts {
  agencyEmergencyId?: string;
}

export interface IListDataAddedContact {
  agencyId?: string;
  type?: string;
  tradeTypeId?: string;
  tradeTypeKey?: string;
  tradeTypeName?: string;
  users?: IUserContact[];
}

export interface IExcludedData {
  id: string;
  agencyId: string;
  propertyId: string;
  streetline: string;
  users: IUser[];
}

interface IUser {
  propertyEmergencyId: string;
  firstName: string | null;
  lastName: string;
  userType: string;
  id: string;
  phoneNumber: string | null;
  email: string;
  status: string;
}

export interface IOptions {
  id: string;
  value: Object;
  isSelected: boolean;
}

export interface IGetListUserPayload {
  search: string;
  page?: number;
  limit?: number;
  size?: number;
  type?: EUserPropertyType;
  filterAll?: boolean;
  isShowArchivedStatus?: boolean;
  userDetails?: IPrefillUser[];
}

export interface IGetListUserResponse {
  currentPage?: number;
  totalPage?: number;
  totalUser?: number;
  users?: ISelectedReceivers[];
  userProperties?: ISelectedReceivers[];
}

export interface IPrefillUser {
  id: string;
  propertyId?: string;
}

export interface IPolicySelected {
  policySelectedId: string;
  customVersionSelected: string;
}
