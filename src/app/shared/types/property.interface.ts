import { IFile } from './file.interface';
import { portfolio } from './team.interface';
import { PropertyManager } from './user.interface';

export interface Property {
  id: string;
  streetline: string;
  unitNo: string;
  suburb: string;
  postCode: string;
  userId: string;
  currentPropertyAgreementId: string;
  status: string;
  address: string;
  country: string;
  deleted: boolean;
  archived: boolean;
  streetNumber: string;
  propertyType: string;
  managementType: string;
  maintenanceNote?: string;
  agencyId?: string;
  state: string;
  expenditureLimit: string;
  regionId: string;
  authorityStartDate: string;
  authorityEndDate: string;
  nextInspection: string;
  keyNumber: string;
  managerName: string;
  billingName1?: string;
  billingName2?: string;
  email?: string;
  portfolios?: portfolio[];
  shortenStreetline?: string;
  sourceProperty?: SourceProperty;
  propertyManager?: PropertyManager;
  isTemporary?: boolean;
  propertyName?: string;
  keyDescription?: string;
  nextInspectionDate?: string;
  nextInspectionStartTime?: string;
  nextInspectionEndTime?: string;
  companyId?: string;
  region: any;
  emailVerified?: string | null;
  isDetectedContact?: boolean;
}

export interface SourceProperty {
  type: string;
  propertyType: string;
  parentPropertyId: string;
  squareFootage: string;
  parentStreetline?: string;
  propertyName?: string;
}
export interface PropertyInHide {
  id: string;
  streetline: string;
  isHideSupplier: boolean;
}

export interface listCategoryInterface {
  id: string;
  name: string;
}

export interface listPropertyNoteInterface {
  id?: string;
  description?: string;
  categoryName?: string;
  lastModified?: string;
  categoryId?: string;
  syncStatus?: string;
  dataFailed?: Object;
  isNewNote?: boolean;
  ptId?: string;
  source?: { externalId?: string };
  updatedAt?: string;
  files?: IFile[];
}

export interface IPropertyNotePayload {
  propertyId: string;
  description: string;
  categoryId: string;
  taskId?: string;
  id?: string;
  crmId: string;
}

export type TypeConversationPropertyPayload = {
  conversationId: string;
  newPropertyId: string;
};

export type TypeChangeTaskPropertyPayload = {
  taskId: string;
  newPropertyId: string;
};
