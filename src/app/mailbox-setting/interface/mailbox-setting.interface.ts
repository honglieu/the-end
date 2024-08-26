import { TrudiTab } from '@trudi-ui';
import { EMailBoxStatus, EmailProvider } from '@shared/enum/inbox.enum';
import {
  EUserMailboxRole,
  EProviderEnum,
  EStatusEnum
} from '@/app/mailbox-setting/utils/enum';

export interface EventElement extends Event {
  target: HTMLInputElement;
}

export type MailBoxTab = TrudiTab<{
  title: string;
  link: string;
}>[];

export interface IMailboxSetting {
  agencyContent: string;
  id: string;
  mailBehavior: IMailboxBehaviours;
  mailBoxId: string;
  mailSignature: IEmailSignatureSetting;
  htmlStringSignature: string;
  teamMembers: number;
}

export interface ISaveMailboxSignatureResponse
  extends Omit<IMailboxSetting, 'mailBehavior'> {}

export interface ISaveMailboxBehavioursResponse {
  id: string;
  mailBehavior: IMailboxBehaviours;
  updatedAt: string;
}

export interface IUpdateMailboxNameResponse {
  id: string;
  name: string;
  emailAddress: string;
  updatedAt: string;
}

export interface IArchiveMailboxResponse {
  id: string;
  status: EMailBoxStatus;
}

export interface IMailboxBehaviours {
  resolved: string | null;
  deleted: string | null;
  autoSyncConversationNote?: boolean;
  autoSyncConversationsToPT?: boolean;
  autoSyncTaskActivityToPT?: boolean;
  syncDocumentType?: string;
  saveCategoryDocumentType?: string;
  provider?: EmailProvider;
}
// fix it

export interface IBehaviourFolder {
  id: string;
  name: string;
  externalName?: string;
  editAble: boolean;
  externalId: string;
  internalId?: string;
  mailbox: {
    provider: EmailProvider;
  };
  mailBoxId: string;
  moveAble: boolean;
  parentId: string;
  wellKnownName?: string;
  level?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IEmailSignatureSetting {
  optionOther: {
    isEnabled: boolean;
    value: string | null;
  };
  signOffPhrase: {
    isEnabled: boolean;
    value: string | null;
    key?: string;
  };
  memberName: {
    isEnabled: boolean;
    value: string;
  };
  memberRole: {
    isEnabled: boolean;
    value: string;
  };
  teamName: {
    isEnabled: boolean;
    value: string | null;
  };
  mailboxEmailAddress: {
    isEnabled: boolean;
    value: string;
  };
  phoneNumber: {
    isEnabled: boolean;
    value?: string;
  };
  enableSignature: boolean;
  greeting: string;
  recipient: string;
}

export interface IMailBoxUnreadCount {
  id: string;
  unreadCount: string;
}

export type TheadTable = Array<{ label: string; tooltip: string }>;

export type UserPermission = {
  companyAgentId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  googleAvatar: string;
  mailBoxId: string;
  name: string;
  emailAddress: string;
  credential: string;
  status: keyof typeof EStatusEnum;
  provider: keyof typeof EProviderEnum;
  mailPermissionId: string;
  role: Array<keyof typeof EUserMailboxRole>;
  isDefault: boolean;
};

export type UpdateUserPermission = Pick<
  UserPermission,
  'companyAgentId' | 'role' | 'isDefault' | 'userId'
>;

export type TeamPermission = Array<UserPermission>;

export type ResponsiveTeamPermisson = {
  currentPage: number;
  list: Array<UserPermission>;
  totalItems: number;
  totalPages: number;
};

export interface IAiReply {
  policy?: string;
  id?: string;
  mailBoxId?: string;
  chatGPTEnquiries?: IChatGPTEnquiry[];
  answer?: string;
  createdAt?: Date;
  updatedAt?: Date;
  enable?: boolean;
  selected?: boolean;
  answerId?: string;
  questionId?: string;
  question?: string;
  rawMessage?: string;
  rawAnswer?: string;
  rawQuestion?: string;
}

export interface IAiReplyMerge extends IAiReply {
  seeMore?: boolean;
  seeLess?: boolean;
  visibleReply?: string;
  value?: string;
}

export interface IChatGPTEnquiry {
  id?: string;
  question?: string;
  rawMessage?: string;
}

export interface IUpdateChatGPTDetailPayload {
  answerId: string;
  questionData: IChatGPTEnquiry[];
  enable: boolean;
}

export interface IUpdateAutomateReplyPayload {
  answerId: string;
  enable: boolean;
}

export interface IDeleteAnswer {
  answerIds: string[];
}
export interface IUpdateMergeEnquiresPayload {
  questionIds: string[];
  answerId: string;
  enable: boolean;
}

export interface IEnquiriesMergePayload {
  questionId: string;
  mailBoxId: string;
  page?: number;
  size?: number;
}

export interface ICategoryTaskActivity {
  name: string;
  id: string;
}

export interface ISaveMailboxTaskActivity {
  syncDocumentType: string;
  autoSyncTaskActivityToPT: boolean;
  saveCategoryDocumentType: string;
}

export interface AiSettingOption {
  value: string;
  label: string;
}

export interface IReorderMailBoxList {
  id: string;
  order: number;
  mailBoxId: string;
}
