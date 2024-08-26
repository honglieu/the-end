export interface IUserProperty {
  id: string;
  streetline: string;
  unitNo?: string;
  isActiveUserPayer: boolean;
  type: string;
  currentPropertyAgreementId: string;
  longitude?: any;
  latitude?: any;
  status?: any;
  address: string;
  userPropertyStatus: string;
  isPrimary: boolean;
  vacatedAt?: any;
  count: number;
  propertyStatus: string;
  agencyLogo: string;
  inviteStatus: string;
  lastActivity?: any;
  email: string;
  unconfirmedChangeEmail?: any;
  firstName: string;
  lastName: string;
  phoneNumber?: any;
  agencyId: string;
  offBoardedDate?: string;
  mobileNumber?: any;
  userId?: string;
  iviteSent?: any;
}

export interface UserPropertyInPeople {
  address: string;
  country: string;
  createdAt: string;
  id: string;
  postCode: string;
  state: string;
  status: string;
  streetNumber: string;
  streetline: string;
  suburb: string;
  unitNo: string;
  unreadcount: string;
  updatedAt: string;
  region: {
    id: string;
    name: string;
  };
  shortenStreetline?: string;
  disabled?: boolean;
  isSuggested?: boolean;
}

export interface CurrentPeopleInConversation {
  address: string;
  archived: boolean;
  country: string;
  currentPropertyAgreementId: string;
  deleted: boolean;
  id: string;
  managementType: string;
  postCode: string;
  propertyType: string;
  state: string;
  status: string;
  streetNumber: string;
  streetline: string;
  suburb: string;
  unitNo: string;
  userId: string;
}
