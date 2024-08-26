import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ISelectContacts } from '@/app/dashboard/modules/agency-settings/utils/interface';
import { Property } from '@shared/types/property.interface';

export interface ITypeOption {
  id: string;
  name: string;
  hasGroup?: boolean;
  disabled?: boolean;
  isShowDropdown?: boolean;
}

export interface IEmergencyContact {
  emergencyContactId: string;
  id: string;
  firstName: string | null;
  lastName: string;
  phoneNumber: string;
  email: string | null;
  landingPage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IResponseEmergencyContactsType {
  id?: string;
  name?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

//DEFAULT EMERGENCY CONTACTS

export interface IDefaultEmergencyContactFormGroup extends FormGroup {
  value: Partial<IDefaultEmergencyContact>;
  controls: {
    groupId: FormControl<string>;
    typeId: FormControl<string>;
    supplierIds: FormControl<string[]>;
  };
}

export interface IDefaultEmergencyContact {
  groupId?: string;
  typeId: string;
  supplierIds: string[];
  suppliers?: ISelectContacts[];
}

export interface IDefaultEmergencyContactResponse {
  companyId: string;
  groupId: string;
  typeId: string;
  users: IEmergencyContact[];
}

export type ExistedDefaultEmergencyContactsValue = Map<
  string,
  Partial<IDefaultEmergencyContact> & { addedNew?: boolean }
>;

// CUSTOM EMERGENCY CONTACTS

export interface IEmergencyContactFormType {
  groupTypeId?: string;
  typeId: string;
  supplierIds: string[];
  suppliers?: ISelectContacts[];
}

export interface ISaveCustomEmergencyContactsPayload {
  groupId?: string;
  contacts: IEmergencyContactFormType[] | ICustomEmergencyContact[];
  propertyIds?: string[];
  tagIds?: string[];
}

export interface IEmergencyContactsFormGroup extends FormGroup {
  value: IEmergencyContactFormType;
  controls: {
    groupTypeId: FormControl<string>;
    typeId: FormControl<string>;
    suppliers: FormControl<ISelectContacts[]>;
    supplierIds: FormControl<string[]>;
  };
}

export interface ICustomEmergencyContactFormGroup extends FormGroup {
  value: Partial<{
    groupId: string;
    properties: Property[];
    propertyIds: string[];
    emergencyContacts: IEmergencyContactFormType[];
  }>;
  controls: {
    groupId: FormControl<string>;
    properties: FormControl<Property[]>;
    propertyIds: FormControl<string>;
    emergencyContacts: FormArray<IEmergencyContactsFormGroup>;
  };
}

export interface ICustomEmergencyContact {
  groupTypeId: string;
  typeId: string;
  users: IEmergencyContact[];
}

export interface ICustomEmergencyContactResponse {
  companyId?: string;
  groupId: string;
  contacts: ICustomEmergencyContact[];
}

export interface IPTCustomEmergencyContactResponse
  extends ICustomEmergencyContactResponse {
  tagIds: string[];
}

export interface IRMCustomEmergencyContactResponse
  extends ICustomEmergencyContactResponse {
  propertyIds: string[];
}

export type ExistedCustomEmergencyContactsValue = Map<
  string,
  {
    addedNew: boolean;
    propertyIds: string[];
    emergencyContacts: {
      groupTypeId?: string;
      typeId: string;
      supplierIds: string[];
      addedNew: boolean;
    }[];
  }
>;
