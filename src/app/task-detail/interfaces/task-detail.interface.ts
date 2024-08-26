import {
  CreateTaskByCateOpenFrom,
  InjectFrom
} from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { TaskItemDropdown } from '@shared/types/task.interface';
import { UserPropInSelectPeople } from '@shared/types/user.interface';

export interface example {
  example: string;
}

export enum EButtonAction {
  REPLY = 'reply',
  REPLY_ALL = 'replyAll',
  FORWARD = 'forward',
  MARK_AS_UNREAD = 'Mark as unread',
  MARK_AS_READ = 'Mark as read',
  REPLY_VIA_APP = 'Reply via app',
  REPLY_VIA_EMAIL = 'Reply via email',
  OPEN_APP_CONVERSATION = 'Open app conversation',
  OPEN_EMAIL_CONVERSATION = 'Open email conversation'
}

export interface IPayloadMapContactToSecondaryEmail {
  propertyId: string;
  secondaryEmail: string;
  secondaryEmailId: string;
}

export interface IAddToTaskConfig {
  isOpenCreateNewTask?: boolean;
  isOpenMoveToExistingTask?: boolean;
  propertyId?: string;
  conversationId?: string;
  taskNameList?: TaskItemDropdown[];
  openFrom?: CreateTaskByCateOpenFrom;
  currentPropertyId?: string;
  activeProperty?: UserPropInSelectPeople[];
  categoryID?: string;
  isShowBackBtn?: boolean;
  isUnHappyPath?: boolean;
  isShowAddress?: boolean;
  isFromVoiceMail?: boolean;
  isFromTrudiApp?: boolean;
  injectFrom?: InjectFrom;
}
