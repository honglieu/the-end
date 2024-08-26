import { EAgencyPlan } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CallTypeEnum, ECreatedFrom, EMessageComeFromType } from '@shared/enum';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import { EOptionSendMessage } from '@/app/user/utils/user.enum';

export interface IExportConversation {
  state?: boolean;
  userPropertyId?: string;
}

export interface ISendMsg {
  state?: boolean;
  id?: string;
  modal?: unknown;
  typeSend?: EOptionSendMessage;
}

export interface ICallRequest {
  state?: boolean;
  typeCall?: CallTypeEnum;
  user?: IUserPropertyV2;
  callTo?: string;
  listMobileNumber?: string[];
  featurePhone?: boolean;
  featureVideo?: boolean;
}

export interface IUpgradePlan {
  state?: boolean;
  stateRequestSend?: boolean;
  plan?: EAgencyPlan;
}

export interface IUserContact extends UserProperty {
  targetIndex: number;
  createdFrom?: ECreatedFrom | EMessageComeFromType;
  fromPhoneNumber?: string;
  pmName?: string;
  pmUserId?: string;
  isSender?: boolean;
  conversationId?: string;
  pmNameClick?: boolean;
  isBlockNumber?: boolean;
  currentPMJoined?: boolean;
}
