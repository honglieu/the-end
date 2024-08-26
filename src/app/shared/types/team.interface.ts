export interface Team {
  id: string;
  companyAgentId: string;
  isMeetTheTeam: boolean;
  inviteStatus: string;
  firstName: string;
  lastName: string;
  email: string;
  googleAvatar: string;
  lastActivity: Date;
  portfolios: portfolio[];
  isAgencyAdmin: boolean;
  title: string;
  role: string;
  selected?: boolean;
}

export interface portfolio {
  id: string;
  firstName: string;
  lastName: string;
  portfolioCount: number;
}
export interface TeamSentInvite {
  senderId: string;
  propertyManagerId: string;
}

export interface TeamsByProperty {
  list: Team[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface UpdatePublicFacingProfile {
  userId: string;
  isMeetTheTeam: boolean;
}

export interface UpdateRoleAgencyAdmin {
  userId: string;
}

export interface UpdateRole {
  userId: string;
  action: string;
}

export interface UpdateRoleAgency {
  action: string;
  userId: string;
}
