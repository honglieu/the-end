import { IMailBox } from '@/app/shared/types/user.interface';
import { IMessageRoute } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
export interface IWhatsappAccount {
  id: string;
  whatsappId: string;
  name: string;
  extraInfo: string;
  token?: string;
}

export type WhatsappPayloadIntegrateType = {
  pageId: string;
  name: string;
  avatar: string;
  accessToken: string;
  userId: string;
};

export interface SelectWhatsappPage {
  state: boolean;
  openFrom: WhatsappOpenFrom;
}

export enum WhatsappOpenFrom {
  'integration' = 'integration',
  'inbox' = 'inbox'
}

export interface WhatsappPageData {
  name: string;
  email?: string;
  picture?: {
    data: { url: string };
  };
  id: string;
  url: string;
  access_token: string;
}

export interface WhatsappPage {
  data: WhatsappPageData[];
  option?: { label: string; value: string }[];
  openFrom: WhatsappOpenFrom;
  userInfo: WhatsappUserInfoType;
}

export type WhatsappUserInfoType = {
  userId: string;
  accessToken: string;
};

export type WhatsappPageOptionType = {
  value: string;
  label: string;
};

export interface WhatsappSDK {
  init(options: WhatsappInitOptions): void;
  login(
    callback: (response: WhatsappLoginResponse) => void,
    options?: WhatsappLoginOptions
  ): void;
  logout(callback?: (response: WhatsappResponse) => void): void;
  api(
    path: string,
    params: WhatsappAPIParams,
    callback: (response: any) => void
  ): void;
  getAuthResponse(): WhatsappAuthResponse | null;
  getLoginStatus(
    callback: (response: WhatsappLoginStatusResponse) => void
  ): void;
}

interface WhatsappInitOptions {
  appId: string;
  autoLogAppEvents?: boolean;
  xfbml?: boolean;
  version: string;
  cookie?: boolean;
}

interface WhatsappLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: WhatsappAuthResponse;
}

export interface WhatsappLoginResponse {
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  };
  status: string;
}

export type PageWhatsAppType = {
  name: string;
  id: string;
  status: WhatsAppConnectStatus;
  companyId?: string;
  avatar?: string;
  type?: EPageMessengerConnectType;
  externalId?: string;
  mailBoxId?: string;
  mailboxData?: IMailBox;
  channelId?: string;
  whatsappInboxRoutedata?: IMessageRoute;
  isNew?: boolean;
};

export enum WhatsAppConnectStatus {
  ARCHIVED = 'ARCHIVED',
  ACTIVE = 'ACTIVE',
  DISCONNECTED = 'DISCONNECTED'
}

export enum EPageMessengerConnectType {
  MESSENGER = 'MESSENGER',
  SMS = 'SMS'
}

interface WhatsappLoginOptions {
  scope: string;
}

interface WhatsappResponse {
  status: string;
}

interface WhatsappAPIParams {
  fields?: string;
}

interface WhatsappAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
}
