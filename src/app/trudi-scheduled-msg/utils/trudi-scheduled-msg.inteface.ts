import { IFile } from '@shared/types/file.interface';
import {
  IReceiver,
  ISelectedReceivers
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

export interface ITrudiScheduledMsgInfo {
  time: string;
  status: string;
  id: string;
  updatedAt: string;
  taskId: string;
  createdAt: string;
  data: ITrudiScheduledMsgDataInfo;
  conversationId: string;
  hasEmailSignature?: boolean;
}

export interface ITrudiScheduledMsgDataInfo {
  conversationTitle: string;
  message: string;
  receiverIds: string[];
  sendFrom: string;
  userId: string;
  action: string;
  isFromInline: boolean;
  files: IFile[];
  options: {
    contacts: ISelectedReceivers[];
  };
  isFromTrudiButton: boolean;
  isSendFromEmail: boolean;
  propertyId?: string;
  messageContact?: string;
  recipients?: IReceiver[];
}

export enum EToolTipTrudiScheduledMsg {
  deleteMessage = 'Delete message',
  editMessage = 'Edit message',
  sendNow = 'Send now',
  rescheduleMessage = 'Reschedule message'
}

export enum EDefaultBtnDropdownOptions {
  'Schedule' = 0,
  'SendAndResolve' = 1,
  'Send' = 2
}
export interface ITrudiScheduledMsgResponse {
  scheduledMessageId: string;
}

export interface ITrudiEditScheduledMsgBody {
  reminderTime: string;
  message: string;
  conversationTitle: string;
}

export interface ITrudiScheduledMsgCount {
  count: number;
  conversationId: string;
}
