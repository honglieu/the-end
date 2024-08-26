import { Observable } from 'rxjs';
import { UserConversation } from '@shared/types/conversation.interface';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

export interface BadgeProp {
  text: string;
  type: string;
}

export interface FileUploadProp {
  lastModified?: number;
  lastModifiedDate?: string;
  name?: string;
  size?: number;
  type?: string;
  webkitRelativePath?: string;
  isReiForm?: boolean;
}

export interface Button {
  hint: string;
  pathUrl: string;
  data_e2e: string;
}

export type CallType = 'videoCall' | 'voiceCall';

export interface ConfirmToCall {
  event?: boolean;
  type: CallType;
  listConverInTask?: UserConversation[];
  phone?: string;
}

export type SendPopupLabel = 'Message' | 'File';

export interface AgencyInSidebar<T> {
  logo: string;
  id: string;
  name: string;
  unreadMessagesCount: number;
  agencySetting: {
    id: string;
    agencyId: string;
    agencyLogo: string;
    config: {
      options: any;
      templateWelcomeLandlord: string;
      templateWelcomeTenant: string;
      emailLogo: string;
      trudiLogo: string;
      agencyColor: string;
      splashIcon: string;
      cssVariables: T;
    };
  };
}

export interface UpdateStatusInterface {
  updateButtonStatus(
    taskId: string,
    action: string,
    status: TrudiButtonEnumStatus
  ): Observable<any>;
}

export interface IRouterSidebar {
  id?: string;
  title: string;
  link: string;
  icon?: string;
}

export interface CssConfigVariable {
  'ion-color-primary': string;
  'ion-color-secondary': string;
  'ion-color-danger': string;
  'ion-color-light': string;
  'ion-color-dark': string;
  'ion-color-white': string;
  'ion-color-trulet_header': string;
  'ion-color-home_header': string;
  'ion-color-grey': string;
  trulet_header: string;
  'primary-green': string;
  'primary-black': string;
  'primary-light-gray': string;
  'text-light-gray': string;
  'icon-light-gray': string;
  'primary-white': string;
  'light-gray-color': string;
  'subtitle-color': string;
  'image-bgray': string;
  'image-container-bgray': string;
  'secondary-yellow': string;
  'secondary-light-red': string;
  'secondary-red': string;
  'secondary-error-red': string;
  'input-error-color': string;
  'content-backgroud': string;
  'green-indicator': string;
  'dark-messages': string;
  'message-background': string;
  'gray-status': string;
  'base-padding': '8px';
  'rem-base': '10px';
  'app-background': string;
  'logo-part-color1': string;
  'logo-part-color2': string;
  'logo-part-color3': string;
  'loading-spin-color': string;
  'loading-indicator-color': string;
  'terms-and-conditions-icon-color': string;
  'mute-toggle-status-color': string;
  'checkbox-checked-bk-color': string;
  'payment-item-compliaint': string;
  'payment-item-pending': string;
  'payment-item-success': string;
  'category-primary-color': string;
  'category-secondary-color': string;
  'category-third-color': string;
  'header-text-color': string;
  'splash-color': string;
}

export type ConversionStatusType =
  | 'ALL'
  | 'OPEN'
  | 'ARCHIVE'
  | 'ACTIVE'
  | 'RESOLVED'
  | 'LOCKED'
  | 'AGENT_EXPECTATION'
  | 'REOPEN'
  | 'AGENT_JOIN';

export type TypeWithTForConversationMap<T, V> = Omit<
  T,
  'id' | 'action' | 'raiseBy' | 'conversationId'
> & { id: string; action?: V; raiseBy?: string; conversationId?: string };

export interface IDataE2ETrudiModal {
  backBtn?: string;
  cancelBtn?: string;
  okBtn?: string;
}
