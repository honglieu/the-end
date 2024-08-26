import { MessageObject } from '@shared/types/message.interface';
import { AssignToAgent } from '@shared/types/task.interface';
import { IUserParticipant } from '@shared/types/user.interface';
import { IProperty } from '@/app/user/utils/user.type';
import { ReminderMessageType } from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskStatusType } from '@shared/enum/task.enum';
import { FileMessage } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';

export interface IMessageReminder {
  id: string;
  taskId: string;
  updatedAt: string;
  createdAt: string;
  topicId: string | null;
  status: string;
  title: string;
  messagePreview: string;
  propertyStatus: string | null;
  taskType: string;
  propertyType: string | null;
  conversationId: string;
  messageId: string;
  textContent: string;
  isIgnoreMessage: boolean;
  property: IProperty;
  assignToAgents: AssignToAgent[];
  emailMetaData: {
    from: IUserParticipant[];
    to: IUserParticipant[];
    cc: IUserParticipant[];
    bcc: IUserParticipant[];
  };
  message?: MessageObject[];
  files?: any;
  mailMessageId?: string;
  isSendFromVoiceMail?: boolean;
  taskName: {
    name: string;
    taskNameId: string;
  };
  taskTitle?: string;
  propertyDocuments: FileMessage[];
  options?: {
    type: string;
    contacts: any[];
  };
  group_data_index?: number;
  sort_time?: string;
  isRemove?: boolean;
  isHidden?: boolean;
  ignoreDate?: string;
  ignoreTime?: number;
  hasDraftMessage?: boolean;
}

export interface IReminderFilterParam {
  mailBoxId: string;
  search: string;
  type: EMessageType;
  assignedTo: string[];
  propertyManagerId: string[];
  messageStatus: string[];
  taskDeliveryFailIds: string[];
  limit: number;
  page: number;
  status: TaskStatusType | '';
  reminderType: ReminderMessageType;
  isShowIgnore: boolean;
  reminderTime: number;
}

export interface IIgnoreMessageReminder {
  messageItem: IMessageReminder;
  undoMessage?: boolean;
  isIgnore?: boolean;
  indexMessage?: number;
  ignoreTime?: number;
  ignoreDate?: string;
}
