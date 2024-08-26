import { ActionSendMsgDropdown } from '@/app/routine-inspection/utils/routineType';
import { UserConversation } from '@shared/types/conversation.interface';

export interface IPopupState {
  addContactCardOutside: boolean;
  isEdit: boolean;
}

export enum EFooterButtonType {
  NORMAL = 'NORMAL',
  DROPDOWN = 'DROPDOWN'
}

export enum ISendType {
  BULK = 'send-bulk-message',
  BULK_EVENT = '/send-bulk-message-with-event',
  V3 = 'v3/message'
}

export interface IContactInfo {
  title: string;
  address: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  phoneNumber: string;
  email: string;
  landingPage: string;
}

export interface IConfigs {
  header: {
    icon: string;
    title: string;
    closeIcon: string;
    showDropdown?: boolean;
  };
  body: {
    tinyEditor: {
      attachBtn: IAttachBtnConfig;
    };
    prefillReceivers: boolean;
    prefillReceiversList: ISelectedReceivers[];
    prefillContactCard?: ISelectedReceivers[];
    receiverTypes: string[] | null;
    prefillMediaFiles: boolean;
    prefillTitle: string;
  };
  footer: {
    buttons: {
      nextButtonType: EFooterButtonType;
      backTitle: string;
      nextTitle: string;
      dropdownList?: ActionSendMsgDropdown[];
      showBackBtn: boolean;
      sendType: ISendType | '';
    };
  };
  otherConfigs: {
    isCreateMessageType: boolean;
  };
}

export interface ISelectedReceivers {
  id?: string; // receiver id
  conversationId?: string;
  isPrimary?: boolean;
  type: string;
  firstName?: string | null;
  lastName?: string | null;
  iviteSent?: string | null;
  lastActivity?: string | null;
  phoneNumber?: string | null;
  email?: string;
  offBoardedDate?: string | null;
  contactType?: string;
  streetLine?: string;
  isAppUser?: boolean;
  landingPage?: string;
  idUserPropertyGroup?: string;
  mobileNumber?: string | null;
  disabled?: boolean;
  propertyId?: string;
  isValid?: boolean;
  inviteSent?: string | null;
  trudiUserId?: string | null;
}

export type NestedObject = Record<string, any>;
export type UserConversationOption = Partial<UserConversation>;

export interface IAttachBtnConfig {
  disabled: boolean;
  attachOptions?: {
    disabledUpload: boolean;
    disabledCreateReiForm: boolean;
    disabledAddContact: boolean;
  };
}
