import { FormControl, FormGroup } from '@angular/forms';
export interface IBaseOptionDto {
  optionId: string;
  value: Object | Array<Object>;
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
  isFavourite?: boolean;
}

export interface IUserContact extends ISelectContacts {
  agencyEmergencyId?: string;
}

export interface IRemoveOptionDto {
  optionIds: string[];
}

export interface IResponseOptionsDto {
  [id: string]: IBaseOptionDto;
}

export interface ICreateSupplierPolicy {
  tradeTypeId?: string;
  companyName?: string;
  contactName?: string;
  companyPhoneNumber?: string;
  email?: string;
  website?: string;
}
export interface IResponseCheckBox {
  [id: string]: FormData;
}

export interface IOptions {
  id: string;
  value: Object;
  isSelected: boolean;
}

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

export interface IInvalidFile {
  unSupportFile: boolean;
  overFileSize: boolean;
}

export interface ITag {
  id: string;
  name: string;
  entityType: string;
  properties: IPolicyTag[];
  tagGroup?: {
    id: string;
    name: string;
  };
  tagGroupId?: string;
}

export interface IPolicyTag {
  id: string;
  streetline: string;
  suburb: string;
  postCode: string;
}
