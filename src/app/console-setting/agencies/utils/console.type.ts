import {
  AgencyConsoleSetting,
  RegionInfo
} from '@shared/types/agency.interface';
import {
  AgencyConsoleSettingPopupAction,
  EAgencyPlan
} from './agencies-setting.enum';

export interface IItemConsoleFilter {
  key: string;
  value: string;
}

export interface NewEditData {
  action: AgencyConsoleSettingPopupAction;
  data: AgencyConsoleSetting;
}

export interface ConfigPlan {
  requestPlan?: EAgencyPlan;
  plan: EAgencyPlan;
  features: FeaturesConfigPlan;
  embeddableWidget?: boolean;
  insights?: boolean;
  isAISetting?: boolean;
  isActive?: boolean;
  languageTranslations?: boolean;
  outgoingCalls?: boolean;
  taskEditor?: boolean;
  voicemail?: boolean;
  totalCountConversationLogs?: Array<ITotalCountConversationLogs>;
}

export interface ITotalCountConversationLogs {
  mailBoxId?: string;
  mobile?: number;
  voiceCall?: number;
  sms?: number;
  messenger?: number;
  whatsapp?: number;
}

export interface IFeaturesConnectionStatus {
  [key: string]: boolean;
}
export interface FeaturesConfigPlan {
  [type: string]: {
    enable: boolean;
    state: boolean;
    name: string;
  };
}

export type IAllRegionsData = Record<string, RegionInfo[]>;
