import {
  MaintenanceDecision,
  Regions,
  TrudiButton
} from '@shared/types/trudi.interface';
import { TenancyInvoiceSyncJob } from '@shared/types/tenancy-invoicing.interface';
import { EInspectionStatus } from './communication.enum';
import {
  ECalendarEvent,
  EContactCardType,
  EContactType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { PhotoType } from '@shared/types/task.interface';

export interface CommunicationData {
  decisionList: MaintenanceDecision[];
  buttonData: TrudiButton[];
  actionTitle: string;
  subTitle: string;
  decisionIndex: number;
  region?: Regions;
}

export interface CommunicationButton extends TrudiButton {
  movingHomeText?: string;
  fields?: {
    customControl?: ICustomControl;
    sendTo: string[];
    msgTitle: string;
    msgBody: string;
  };
}

export interface ICustomControl {
  isRequired?: boolean;
  event?: ECalendarEvent;
  reminderTime?: string;
  day?: number;
  timeline: string;
  contactCardType?: EContactCardType;
  contactData?: (string | EContactType)[];
  title?: string;
}

export interface ICommunicationForm {
  terminationDate?: string;
  noticeDate?: string;
  communicationDate?: string;
  chargeToDate?: string;
  description?: string;
  communicationType?: string;
  syncJob?: TenancyInvoiceSyncJob;
  statusOutGoingInspection?: string;
  syncPTOutGoingInspection?: IInspectionForm;
  tenancy?: string;
}

export enum EDecisionIndex {
  VACATE,
  BREAKLEASE,
  TERMINATION
}

export enum ESelectedReason {
  VACATE = 'communication',
  BREAKLEASE = 'breakLease',
  TERMINATION = 'termination'
}

export interface IInspectionForm {
  date?: string;
  startTime?: string;
  endTime?: string;
  statusOutGoingInspection?: EInspectionStatus;
}

export interface ISummaryContent {
  summaryNote: string;
  summaryPhotos: PhotoType[];
}

export interface IConfirmEssential extends IDefaultConfirmEssential {
  stepId?: string;
  hideBackBtn?: boolean;
  unactiveNextModal?: boolean;
  calendarEventBreachRemedy?: string;
}

export interface IDefaultConfirmEssential {
  tenancy?: string;
  tenancyInvoice?: string;
  creditorInvoice?: string;
  notes?: string;
  maintenanceInvoice?: string;
  routineInspections?: string;
  ingoingInspections?: string;
  outgoingInspections?: string;
  compliances?: string;
  calendarEventEntry?: string;
  rmIssues?: string;
  rmInspections?: string;
  calendarEventCustom?: string;
  leasing?: string;
  calendarEventBreachRemedy?: string;
}
