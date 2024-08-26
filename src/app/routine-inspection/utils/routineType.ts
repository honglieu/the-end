import { ItemDropdown } from '@shared/components/button-with-dropdown-actions/button-with-dropdown-actions.component';
import { IFile } from '@shared/types/file.interface';
import { RoutineInspectionRequestTrudiVariableReceiver } from '@shared/types/routine-inspection.interface';

export enum ESendMsgAction {
  'Schedule' = 'Schedule for send',
  'Send' = 'Send',
  'SendAndResolve' = 'Send & resolve'
}

export interface ActionSendMsgDropdown extends ItemDropdown {
  action: ESendMsgAction;
  isDraft?: boolean;
  isAutoSaveDraft?: boolean;
}

export interface ISendMsgBody {
  message: string;
  categoryMessage: string;
  isResolveConversation: boolean;
  userId: string;
  listOfFiles: IFile[];
  users: RoutineInspectionRequestTrudiVariableReceiver[];
  selectedOption?: ActionSendMsgDropdown;
  conversationId?: string;
}

export enum ILabelInspection {
  TENANT_NOTES = 'Tenant Notes',
  FOLLOW_UP_ITEM = 'Follow Up Items',
  OWNER_NOTES = 'Landlord Notes',
  ACTION = 'Action Items'
}
