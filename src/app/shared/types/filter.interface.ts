interface KeyAgency {
  id: any;
  text: string;
}

interface CrmStatus {
  id: number;
  text: string;
}

export interface RoleType {
  id: number;
  text: string;
}

interface InviteStatus {
  id: number;
  text: string;
}

export interface IKeyUserIndex {
  keyAgencies: KeyAgency[];
  crmStatus: CrmStatus[];
  roleType: RoleType[];
  inviteStatus: InviteStatus[];
}

export interface FilterIndexPage {
  message: {
    arrTopicSelected: [];
    arrPortfolioSelected: [];
    arrAsigneeSelected: [];
    searchTerm?: string;
  };
  task: {
    arrTopicSelected: [];
    arrPortfolioSelected: [];
    arrAsigneeSelected: [];
    searchTerm?: string;
  };
}
