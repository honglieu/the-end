import { EmailProvider } from '@shared/enum/inbox.enum';
import { IEvents } from '@/app/profile-setting/integrations/constants/constants';

export enum INTEGRATION_COMPONENT {
  REI_FORM = 'REI_FORM',
  BLUE_MOON = 'BLUE_MOON',
  GOOGLE_CALENDAR = 'GOOGLE_CALENDAR',
  OUTLOOK_CALENDAR = 'OUTLOOK_CALENDAR',
  CALENDAR = 'Calendar'
}
export interface IPopupState {
  showPopupChangeState: boolean;
  showPopupIntegration: boolean;
  showPopupSelectEvents: boolean;
}
export interface IIntegrationData {
  label: string;
  items: IIntegrationItemsData[];
}
export interface IIntegrationItemsData {
  component: INTEGRATION_COMPONENT;
  status: boolean;
  icon?: string;
  iconPopup?: string;
  description: string;
  data?: ICalenderSettingData;
}

export interface ICalenderSettingData {
  agencyId?: string;
  config?: IEvents;
  createdAt?: string;
  credential?: string;
  emailAddress?: string;
  userCalendarSettingId?: string;
  id?: string;
  lastCloseToast?: string;
  name?: string;
  provider?: EmailProvider;
  status?: EIntegrationsStatus;
  updateAt?: string;
  userId?: string;
}

export enum EIntegrationsLabel {
  FORM = 'Form management',
  CALENDAR = 'Calendar'
}

export interface ICredentialData {
  access_token: string;
  expiry_date: string;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export enum EIntegrationPopUp {
  CONNECT_CALENDAR = 'CONNECT_CALENDAR'
}

export enum EIntegrationsStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  FAILED = 'FAILED',
  SYNCING = 'SYNCING',
  ARCHIVE = 'ARCHIVE',
  UNSYNC = 'UNSYNC'
}
