import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from './property-tree.enum';
import { ICustomControl } from './communicationType';
import {
  EContactType,
  EStepAction,
  EStepType,
  ETypeSend
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';
import { ReiFormData } from '@shared/types/rei-form.interface';
import { ERentManagerType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { IFile } from '@shared/types/file.interface';
import { IContactCard } from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskStatusType } from '@/app/shared';

export interface TrudiStep {
  id: string;
  name: string;
  reminderTimes: [];
  action: EStepAction | string;
  fields: TrudiStepField;
  status: TrudiButtonEnumStatus;
  stepType: string | EStepType;
  type: string;
  componentType:
    | EPropertyTreeButtonComponent
    | EPropertyTreeType
    | ERentManagerType;
  isRequired: boolean;
  reiFormInfor?: ReiFormData;
  disabled?: boolean;
  newTaskTemplateId: string;
  textForward?: string;
  files?: IFile[];
  cards?: IContactCard[];
  unreadComment?: boolean;
}
export interface TrudiStepField {
  sendTo: EContactType[];
  sendCc: ISelectedReceivers[];
  sendBcc: ISelectedReceivers[];
  isAIGenerated?: boolean;
  customControl?: ICustomControl;
  msgBody: string;
  msgTitle: string;
  eventType: string;
  files?: IFile[];
  cards?: IContactCard[];
  stepContent?: string;
  typeSend: ETypeSend;
}

export interface TrudiPopupStepData {
  type: TrudiPopupStep;
  options: {};
}

export interface IListFileFromDynamic {
  inspection: IFile[];
  newTenant: IFile[];
}

export enum TrudiPopupStep {
  CONFIRM_ESSENTIAL = 'CONFIRM_ESSENTIAL'
}

export interface IEssentialData {
  tenancyId?: string;
  noteId?: string;
  creditorInvoiceId?: string;
  tenancyInvoiceId?: string;
  maintenanceInvoiceId?: string;
  routineInspectionId?: string;
  ingoingInspectionId?: string;
  outgoingInspectionId?: string;
  complianceId?: string;
  calendarEventId?: string;
}

export interface StepDetail extends Omit<TrudiStep, 'reminderTimes'> {
  id: string;
  taskId: string;
  stepId: string;
  isIgnored: boolean;
  stepType: EStepType | string;
  reminderTimes: boolean | [];
  status: TrudiButtonEnumStatus;
  createdAt: string;
  updatedAt: string;
  lastActionUser?: LastActionUser;
  lastTimeAction?: string;
  widgetData?: any;
  calendarEvent?: any;
  conversationParticipants: IConversationParticipant[];
  nextTask?: {
    id: string;
    indexTitle: any;
    status: TaskStatusType;
    templateName: string;
    title: string;
  };
  isNextStepMarker?: boolean;
  action: EButtonAction;
  propertyId: string;
  unreadComment?: boolean;
}

export interface IConversationParticipant {
  conversationId: string;
  isLinked: boolean;
  participants: IParticipants;
  conversationPropertyId?: string;
  isTemporaryProperty?: boolean;
  taskPropertyId?: string;
  shortenStreetline?: string;
  streetline?: string;
}

export interface IParticipants {
  bcc: IParticipant[];
  cc: IParticipant[];
  to: IParticipant[];
}

interface IParticipant {
  contactType: null;
  crmStatus: string;
  email: string;
  firstName: string;
  isPrimary: boolean;
  isTemporary: boolean;
  lastName: string;
  propertyId: string;
  secondaryEmail: string;
  secondaryEmailId: string;
  userId: string;
  userPropertyType: string;
  userType: string;
  originalEmailName?: string;
}

export type IStepTypeIdPayload = Partial<{
  eventId: string;
  widgetId: string;
  nextTaskId: string;
}>;

interface UserProperty {
  id: string;
  type: string;
}

interface LastActionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
