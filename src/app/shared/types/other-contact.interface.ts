import { SecondaryEmail } from './users-by-property.interface';

export interface OtherContact {
  id: string;
  sendFrom: string;
  email: string;
  contactType: string;
  hasDelete: boolean;
  checked: boolean;
  secondaryEmails: SecondaryEmail[];
  type: string;
}

export interface OtherContactDropdownValue {
  id: string;
  name: string;
  email: string;
  contactType: string;
  type: string;
  typeLabel: string;
}

export interface OtherContactDropdown {
  id: string;
  label: string;
  value: OtherContactDropdownValue;
  group: string;
}
