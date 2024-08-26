import {
  MailBoxTab,
  TheadTable
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import {
  EMailBoxTablink,
  ERecipient,
  ESignOfPhrase,
  EVariablesKey
} from './enum';

export const MAILBOX_TAB: MailBoxTab = [
  {
    title: 'Team permissions',
    link: EMailBoxTablink.TEAM_PERMISSIONS,
    icon: 'keyMailboxSetting'
  },
  {
    title: 'Greeting / Sign off',
    link: EMailBoxTablink.EMAIL_SIGNATURE,
    icon: 'signatureMailboxSetting'
  },
  {
    title: 'Account',
    link: EMailBoxTablink.ACCOUNT,
    icon: 'userMailboxSetting'
  },
  {
    title: 'Mailbox preferences',
    link: EMailBoxTablink.MAILBOX_PREFERENCES,
    icon: 'mailThin'
  },
  {
    title: 'Out of office',
    link: EMailBoxTablink.OUT_OF_OFFICE,
    icon: 'calendarMailboxSetting'
  }
];

export const THEAD_TABLE: TheadTable = [
  {
    label: 'Name',
    tooltip: null
  },
  {
    label: 'Collaborator',
    tooltip:
      'Collaborators will have access to this email account. Collaborators can send and receive emails.'
  },
  {
    label: 'Administrator',
    tooltip:
      'Administrators can edit mailbox settings and invite other team members.'
  },
  {
    label: 'Default assignee',
    tooltip:
      'Default assignees will be automatically assigned any emails that cannot be identified as belonging to a portfolio.'
  }
];

export const VARIABLES_KEY_MAPPING = {
  optionOther: EVariablesKey.SIGN_OFF_PHRASE,
  enableSignOffPhrase: EVariablesKey.SIGN_OFF_PHRASE,
  signOffPhrase: EVariablesKey.SIGN_OFF_PHRASE,
  teamName: EVariablesKey.TEAM_NAME,
  enableTeamName: EVariablesKey.TEAM_NAME,
  enableName: EVariablesKey.MEMBER_NAME,
  enableRole: EVariablesKey.MEMBER_ROLE,
  enableEmailAddress: EVariablesKey.MAILBOX_EMAIL_ADDRESS
};

export const DEFAULT_MAILNBOX_SETTING = {
  currPage: 0,
  sizePage: 25
};

export const EMAIL_SYNC_TYPE = {
  INTEGRATE_MAIL: 'INTEGRATE_MAIL',
  CONNECT_AGAIN: 'CONNECT_AGAIN',
  INTEGRATE_CALENDAR: 'INTEGRATE_CALENDAR',
  RECONNECT_CALENDAR: 'RECONNECT_CALENDAR'
};

export const SIGN_OFF_PHRASES = [
  {
    key: ESignOfPhrase.BEST_WISHES,
    label: 'Best wishes,'
  },
  {
    key: ESignOfPhrase.KIND_REGARDS,
    label: 'Kind regards,'
  },
  {
    key: ESignOfPhrase.YOUR_SINCERELY,
    label: 'Yours sincerely,'
  },
  {
    key: ESignOfPhrase.THANKS,
    label: 'Thanks,'
  },
  {
    key: ESignOfPhrase.OTHER,
    label: 'Other'
  }
];

export const LIST_GREETING = [
  {
    key: 'HI',
    label: 'Hi'
  },
  {
    key: 'DEAR',
    label: 'Dear'
  },
  {
    key: 'HELLO',
    label: 'Hello'
  }
];

export const RECIPIENT_FORMAT_OPTIONS = [
  {
    key: ERecipient.FIRST_NAME,
    label: 'Recipient first name'
  },
  {
    key: ERecipient.FULL_NAME,
    label: 'Recipient full name'
  }
];
