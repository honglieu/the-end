export interface EmergencyIdList {
  propertyIds: string[];
  agencyId: string;
}

export interface EmergencyBeHidden {
  id: string;
  isHideSupplier: boolean;
  postCode: string;
  state: string;
  status: string;
  streetline: string;
  userId: string;
}
