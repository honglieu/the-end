export interface EmailNotificationSetting {
  name: string;
  description: string;
  type: string;
}

export interface ListEmailNotificationSettings {
  groupName: string;
  values: EmailNotificationSetting[];
}

export interface PortalNotificationEmail {
  newMessageTaskReply: boolean;
  messageTaskAssignedMe: boolean;
  unassignedMessageTask: boolean;
  callTranscriptions: boolean;
  newSharedMailBox: boolean;
}

export interface EmailFromTeamTrudi {
  productUpdates: boolean;
  pmBusinessInsights: boolean;
  marketing: boolean;
}

export interface EmailNotificationSettingApiResponse {
  emailFromTeamTrudi: EmailFromTeamTrudi;
}
