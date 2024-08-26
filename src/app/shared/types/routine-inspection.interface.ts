import {
  EInspectionStatus,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import {
  RoutineInspectionButtonAction,
  RoutineInspectionStatus
} from '@shared/enum/routine-inspection.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { TrudiButtonReminderTimeStatus } from '@shared/enum/trudiButton.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ReiFormData } from './rei-form.interface';
import { TrudiButtonBase } from './trudi.interface';
import { IMessage } from './message.interface';
import { InspectionDate } from './inspection.interface';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';

export interface RoutineInspectionHeader {}

export interface RoutineInspectionButton extends TrudiButtonBase {
  index: number;
  isFrozen: boolean;
  reiFormInfor?: ReiFormInfor;
  textForward?: string;
}

export interface ReminderTimeDetail {
  id: string;
  status: TrudiButtonReminderTimeStatus;
  time: string;
}

export interface ReiFormInfor extends ReiFormData {}

export interface InspectionStatus {
  text: string;
  button: RoutineInspectionButton[];
}
export interface RoutineInspectionBody {
  Tentative: InspectionStatus;
  Scheduled: InspectionStatus;
  Reschedule: InspectionStatus;
  Completed: InspectionStatus;
  Cancel: InspectionStatus;
}

export interface RoutineInspectionData {
  step: number;
  isCompleted: boolean;
  inspectionStatus: RoutineInspectionStatus;
  currentInspectionStatus: RoutineInspectionStatus;
  header: RoutineInspectionHeader;
  body: RoutineInspectionBody;
}

export interface RoutineInspectionVariable {
  region: {
    id: string;
    name: string;
  };
  endTime: string;
  receivers: RoutineInspectionRequestTrudiVariableReceiver[];
  startTime: string;
}

export interface RoutineInspectionRequestTrudiVariableReceiver {
  id: string;
  firstName: string;
  lastName: string;
  userPropertyType?: EUserPropertyType;
  conversationId?: string;
  action?: RoutineInspectionButtonAction;
  raiseBy?: string;
  type: EUserPropertyType;
  lastActivity: string;
  email?: string;
  iviteSent?: string;
  offBoardedDate?: string;
  propertyId?: string;
  isPrimary?: boolean;
}

export interface RoutineInspectionCard {
  title: string;
  inspectionDate: InspectionDate[];
}

export interface RoutineInspectionSetting {
  categoryId: string;
}

export interface RoutineInspectionResponseInterface {
  type: ETrudiType;
  data: RoutineInspectionData[];
  variable: RoutineInspectionVariable;
  routineInspectionCard: RoutineInspectionCard;
  setting: RoutineInspectionSetting;
  routineInspectionSync?: RoutineInspectionSync;
  rescheduleInspectionRequest?: {
    approved?: string;
    declined?: string;
  };
}

export interface RoutineInspectionSync {
  syncStatus: string;
  syncDates: string;
  errorMessSync: string;
  notes: RoutineInspectionNotes;
  rescheduled: RoutineInspectionRescheduled;
  isReadGeneralNotes: boolean;
}

export interface RoutineInspectionNotes {
  generalNotes?: string;
  ownerNotes?: string;
  ownerFollowupItems?: string;
  tenantNotes?: string;
  tenantActions?: string;
}

export interface RoutineInspectionRescheduled {
  isRescheduled?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface InspectionDataWithFormatTime {
  active: boolean;
  dateTime: string;
}

export interface RoutineInspectionData {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  propertyId: string;
  idUserPropertyGroup: string;
  status: EInspectionStatus;
  ptId: string;
  notes: {
    general: string | null;
    owner_notes: string | null;
    owner_followup_items: string | null;
    tenant_notes: string | null;
    tenant_actions: string | null;
  };
  message?: IMessage;
}

export interface TenancyIngoingInspectionData {
  id: string;
  name: string;
  originalLeaseStartDate: string;
}

export interface InspectionSyncData {
  id: string;
  taskId: string;
  propertyId: string;
  syncStatus: ESyncStatus;
  type: string;
  status: EInspectionStatus;
  syncDate: string | Date;
  errorMessSync: string;
  startTime: string | Date;
  endTime: string | Date;
  isRescheduled: boolean;
  ptId: string;
  isSuccessful?: boolean;
  createdAt?: Date;
  defaultChargeFee?: boolean;
  notes: {
    general: string;
    owner_notes: string;
    owner_followup_items: string;
    tenant_notes: string;
    tenant_actions: string;
  };
  userPropertyGroup: {
    id: string;
    idPropertyTree: string;
    name: string;
  };
  firstTimeSyncSuccess?: boolean;
  message?: IMessage;
  stepId?: string;
  dataType?: PTWidgetDataField;
}

export interface InspectionFormData {
  tenancyId: string;
  date: string | Date;
  startTime: number;
  endTime: number;
  tenantNotes?: string;
  action?: string;
  ownerNotes?: string;
  followUpItems?: string;
}
