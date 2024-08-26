import { ItemDropdown } from '@shared/components/button-with-dropdown-actions/button-with-dropdown-actions.component';
import { IFile } from '@shared/types/file.interface';
import { ReiFormData } from '@shared/types/rei-form.interface';
import {
  BreachNoticeTrudiResponse,
  BreachNoticeTrudiVariableReceiver,
  TrudiButtonBase
} from '@shared/types/trudi.interface';
import {
  BreachNoticeRequestButtonAction,
  BreachNoticeStepIndex,
  ESendMsgAction
} from './breach-notice.enum';

export type ListDropDown = Array<ISelect>;

export interface ISelect {
  value?: string;
  text?: string;
  id?: string;
  label?: string;
}

export type NoteType = {
  agencyId?: string;
  id?: string;
  name: string;
  label?: string;
};

export interface BreachNoticeRequestButton extends TrudiButtonBase {
  TextDocUpload?: string;
  isCompleted?: boolean;
  index: number;
  isFrozen: boolean;
  textForward?: string;
  regionalFormName: {
    [key: string]: string;
  };
  regionalText: {
    [key: string]: string;
  };
  textForwards?: string[];
  isSavedEdit?: boolean;
  leaseStatus?: string;
  option?: {
    index: number;
    textForwards: string[];
    title: string;
    textForward: string;
  }[];
  reiFormInfo?: ReiFormData;
  dataE2e?: string;
  breachNoticeStepIndex: BreachNoticeStepIndex;
  attachedDocuments?: string;
  emailAttachmentMessage?: string;
  action: BreachNoticeRequestButtonAction;
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

export interface INoteSync {
  taskId?: string;
  noteId?: string;
  entityId?: string;
  entityType?: string;
  categoryId?: string;
  description?: string;
}

export interface INoteSyncJob {
  data: any;
  errorMessSync: string;
  lastTimeSync: string;
  syncDate: string;
  syncStatus: string;
}

export type INote = Pick<BreachNoticeTrudiResponse, 'notesSyncJob'>;

export type IArrear = Pick<BreachNoticeTrudiResponse, 'arrearCard'>;
