import { IMailBox } from '@/app/shared/types/user.interface';
import { IMessageRoute } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
export interface IFacebookAccount {
  id: string;
  facebookId: string;
  name: string;
  extraInfo: string;
  token?: string;
}

export type FacebookPayloadIntegrateType = {
  pageId: string;
  name: string;
  avatar: string;
  accessToken: string;
  userId: string;
};

export interface SelectFacebookPage {
  state: boolean;
  openFrom: FacebookOpenFrom;
}

export enum FacebookOpenFrom {
  'integration' = 'integration',
  'inbox' = 'inbox'
}

export interface FacebookPageData {
  name: string;
  email?: string;
  picture?: {
    data: { url: string };
  };
  id: string;
  url: string;
  access_token: string;
}

export interface FacebookPage {
  data: FacebookPageData[];
  option?: { label: string; value: string }[];
  openFrom: FacebookOpenFrom;
  userInfo: FacebookUserInfoType;
}

export type FacebookUserInfoType = {
  userId: string;
  accessToken: string;
};

export type FacebookPageOptionType = {
  value: string;
  label: string;
};

export interface FacebookSDK {
  init(options: FacebookInitOptions): void;
  login(
    callback: (response: FacebookLoginResponse) => void,
    options?: FacebookLoginOptions
  ): void;
  logout(callback?: (response: FacebookResponse) => void): void;
  api(
    path: string,
    params: FacebookAPIParams,
    callback: (response: any) => void
  ): void;
  getAuthResponse(): FacebookAuthResponse | null;
  getLoginStatus(
    callback: (response: FacebookLoginStatusResponse) => void
  ): void;
}

interface FacebookInitOptions {
  appId: string;
  autoLogAppEvents?: boolean;
  xfbml?: boolean;
  version: string;
  cookie?: boolean;
}

interface FacebookLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: FacebookAuthResponse;
}

export interface FacebookLoginResponse {
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  };
  status: string;
}

export type PageFacebookMessengerType = {
  name: string;
  id: string;
  status: EPageMessengerConnectStatus;
  companyId?: string;
  avatar?: string;
  type?: EPageMessengerConnectType;
  externalId?: string;
  mailBoxId?: string;
  mailboxData?: IMailBox;
  channelId?: string;
  facebookInboxRoutedata?: IMessageRoute;
  isNew?: boolean;
};

export enum EPageMessengerConnectStatus {
  ARCHIVED = 'ARCHIVED',
  ACTIVE = 'ACTIVE',
  DISCONNECTED = 'DISCONNECTED'
}

export enum EPageMessengerConnectType {
  MESSENGER = 'MESSENGER',
  SMS = 'SMS'
}

interface FacebookLoginOptions {
  scope: string;
}

interface FacebookResponse {
  status: string;
}

interface FacebookAPIParams {
  fields?: string;
}

interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
}

export interface IIntegrateFacebookPageApiRes {
  dataValues: PageFacebookMessengerType;
  _previousDataValues: PageFacebookMessengerType;
  uniqno: number;
  _changed: any;
  _options: {
    isNewRecord: boolean;
    _schema: any;
    _schemaDelimiter: string;
  };
  isNewRecord: boolean;
}
