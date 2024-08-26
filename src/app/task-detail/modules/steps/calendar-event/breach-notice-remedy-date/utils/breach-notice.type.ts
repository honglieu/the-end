import { ItemDropdown } from '@shared/components/button-with-dropdown-actions/button-with-dropdown-actions.component';
import { IFile } from '@shared/types/file.interface';
import { BreachNoticeTrudiVariableReceiver } from '@shared/types/trudi.interface';
import { ESendMsgAction } from './breach-notice.enum';

export type ListDropDown = Array<ISelect>;

export interface ISelect {
  value?: string;
  text?: string;
  id?: string;
  label?: string;
}

export interface ActionSendMsgDropdown extends ItemDropdown {
  action: ESendMsgAction;
}

export interface ISendMsgBody {
  message: string;
  categoryMessage: string;
  isResolveConversation: boolean;
  userId: string;
  listOfFiles: IFile[];
  users: BreachNoticeTrudiVariableReceiver[];
  selectedOption?: ActionSendMsgDropdown;
  conversationId?: string;
}
