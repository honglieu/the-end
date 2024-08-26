export enum EVariablesKey {
  OPTION_OTHER = 'optionOther',
  ENABLE_SIGN_OFF_PHRASE = 'enableSignOffPhrase',
  SIGN_OFF_PHRASE = 'signOffPhrase',
  MEMBER_NAME = 'memberName',
  MEMBER_ROLE = 'memberRole',
  TEAM_NAME = 'teamName',
  PHONE_NUMBER = 'phoneNumber',
  MAILBOX_EMAIL_ADDRESS = 'mailboxEmailAddress'
}

export enum EEmailSignatureFormControlName {
  OPTION_OTHER = 'optionOther',
  ENABLE_SIGN_OFF_PHRASE = 'enableSignOffPhrase',
  SIGN_OFF_PHRASE = 'signOffPhrase',
  ENABLE_NAME = 'enableName',
  ENABLE_ROLE = 'enableRole',
  ENABLE_TEAM_NAME = 'enableTeamName',
  TEAM_NAME = 'teamName',
  ENABLE_EMAIL_ADDRESS = 'enableEmailAddress'
}

export enum EStatusEnum {
  ACTIVE = 'ACTIVE'
}

export enum EProviderEnum {
  OTHER = 'OTHER'
}

export enum EUserMailboxRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR'
}

export enum EMailboxSettingTab {
  TEAM_PERMISSIONS = 'TEAM_PERMISSIONS',
  EMAIL_SIGNATURE = 'EMAIL_SIGNATURE',
  MAILBOX_PREFERENCES = 'MAILBOX_PREFERENCES',
  ACCOUNT = 'ACCOUNT'
}

export enum EMailBoxTablink {
  TEAM_PERMISSIONS = 'team-permission',
  EMAIL_SIGNATURE = 'greeting-sign-off',
  ACCOUNT = 'account',
  MAILBOX_PREFERENCES = 'mailbox-preferences',
  OUT_OF_OFFICE = 'out-of-office',
  AI_REPLIES = 'ai-replies'
}

export enum ESignOfPhrase {
  BEST_WISHES = 'Best wishes',
  KIND_REGARDS = 'Kind regards',
  YOUR_SINCERELY = 'Yours sincerely',
  THANKS = 'Thanks',
  OTHER = 'Other'
}

export enum EGreeting {
  HI = 'Hi',
  HELLO = 'Hello',
  DEAR = 'Dear'
}

export enum ERecipient {
  FULL_NAME = 'FULL_NAME',
  FIRST_NAME = 'FIRST_NAME'
}
