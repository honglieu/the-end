import {
  EButtonAction,
  EPropertyTreeButtonComponent,
  ERentManagerAction,
  ERentManagerButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { EReminderDateValue, EReminderTimelineValue } from '@trudi-ui';
import {
  ECalendarEvent,
  ESelectStepType,
  EStatusStep,
  EStepAction,
  ETypeSend,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { RegionInfo } from '@shared/types/agency.interface';
import {
  CrmConflictError,
  TreeNodeOptions
} from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { IFile } from '@shared/types/file.interface';

export interface ICalendarEvent {
  event: string;
  isRequired: boolean;
}

export interface IBounceEvent {
  preScreen: {
    preScreenIsRequired: boolean;
    title: string;
    amount: number;
  };
  attachment: {
    attachmentIsRequired: boolean;
    attachmentName: string;
  };
}

export interface IEntryReport {
  preScreen: {
    preScreenIsRequired: boolean;
    title: string;
    time: Date;
  };
  attachment: {
    attachmentIsRequired: boolean;
    attachmentName: string;
  };
}

export interface ICapturePetBond {
  preScreen: {
    preScreenIsRequired: boolean;
    title: string;
    amount: Date;
  };
}

export interface ICaptureAmountOwingVacate {
  preScreen: {
    preScreenIsRequired: boolean;
    tenancy: string;
    title: string;
    rentOwing: number;
    invoiceFees: number;
    notes: string;
  };
}

export interface ICaptureCondition {
  title: string;
  isRequired: boolean;
}

export interface IReminderTime {
  reminderTime: string;
  day: EReminderDateValue;
  timeline: EReminderTimelineValue;
  event: ECalendarEvent;
}

export interface IApplicationShortlist {
  preScreenIsRequired: boolean;
  title: string;
  applicationName1: string;
  applicationSummary1: string;
  applicationName2: string;
  applicationSummary2: string;
  applicationName3: string;
  applicationSummary3: string;
}
export interface ICaptureLeaseTerms {
  preScreen: {
    preScreenIsRequired: boolean;
    title: string;
    amount: Date;
  };
  leaseDuration: {
    leasePeriod: string;
    periodType: string;
  };
  rentalAmount: {
    rentedAt: string;
    rentAmount: string;
    frequency: string;
  };
  bond: {
    bondAt: string;
    bondAmount: string;
  };
  bondIncreaseAmount: string;
}

export interface IBreakLeaseFee {
  preScreen: {
    preScreenIsRequired: boolean;
    title: string;
    breakLeaseFee: number;
    advertisingFee: number;
    otherFee: {
      name: string;
      fee: number;
    };
  };
  attachment: {
    attachmentIsRequired: boolean;
    attachmentName: string;
  };
}

export interface IInspectionAction {
  preScreen: {
    preScreenIsRequired: boolean;
    title: string;
    tenantNote: string;
    tenantAction: string;
    landlordNote: string;
    landlordFollowUp: string;
  };
  attachment: {
    attachmentIsRequired: boolean;
    attachmentName: string;
  };
}

export interface INoticeToLeave {
  preScreen: {
    preScreenIsRequired: boolean;
    title: string;
    notice: string;
    beforeDate: Date;
  };
  attachment: {
    attachmentIsRequired: boolean;
    attachmentName: string;
  };
}

export interface ICommunicationStep {
  id?: string;
  key: string;
  title: string;
  name?: string;
  type: ETypeElement.STEP;
  stepType: EStepType.COMMUNICATE;
  action: EStepAction;
  status: EStatusStep;
  reminderTimes: [];
  isInvalidDynamicParam?: boolean;
  listPreviousSteps?: IPreviousStep[];
  fields: {
    customControl:
      | ICalendarEvent
      | IReminderTime
      | IBounceEvent
      | IEntryReport
      | ICapturePetBond
      | ICaptureCondition
      | ICaptureLeaseTerms
      | IBreakLeaseFee
      | IInspectionAction
      | any;
    typeSend: ETypeSend;
    sendTo: string[];
    sendCc: string[];
    sendBcc: string[];
    msgTitle: string;
    msgBody: string;
    files: { icon: string; '0': IFile[] }[] | IFile[];
  };
  crmConflictErrors?: CrmConflictError[];
  dynamicFieldActions?: string[];
}

export interface IPreviousStep {
  stepType: ESelectStepType;
  componentType: EPropertyTreeButtonComponent;
  eventType: ECalendarEvent;
}

interface ICRMStep {
  key: string;
  title: string;
  type: ETypeElement.STEP;
  status: EStatusStep;
  isRequired: boolean;
}

export interface IPropertyTreeStep extends ICRMStep {
  stepType: EStepType.PROPERTY_TREE;
  action: EButtonAction;
  componentType: EPropertyTreeButtonComponent;
  crmConflictErrors?: CrmConflictError[];
  crmSystemId?: string;
}

export interface IRentManagerStep extends ICRMStep {
  stepType: EStepType.RENT_MANAGER;
  action: ERentManagerAction;
  componentType: ERentManagerButtonComponent;
  crmConflictErrors?: CrmConflictError[];
  crmSystemId?: string;
}

export interface ICalendarEventStep {
  key: string;
  title: string;
  type: ETypeElement.STEP;
  isRequired: boolean;
  fields: ICalendarEventStepForm;
  crmConflictErrors?: CrmConflictError[];
}

export interface ICalendarEventStepForm {
  stepName: string;
  eventType: ECalendarEvent;
  isRequired: boolean;
}

export interface ICheckListStep extends TreeNodeOptions {
  fields: {
    stepContent: string;
  };
}

export interface INewTaskStep {
  key: string;
  title: string;
  type: ETypeElement.STEP;
  newTaskTemplateId: string;
  stepType: EStepType.NEW_TASK;
}

export interface ISection {
  key: string;
  title: string;
  type: ETypeElement.SECTION;
  children:
    | ICommunicationStep[]
    | IPropertyTreeStep[]
    | ICalendarEventStep[]
    | INewTaskStep[];
}

export interface IDecision {
  key: string;
  title: string;
  type: ETypeElement.DECISION;
  index: number;
  isDefault: boolean;
  children:
    | ISection[]
    | ICommunicationStep[]
    | IPropertyTreeStep[]
    | ICalendarEventStep[]
    | INewTaskStep[];
}

export interface IDecisionTree {
  isTemplate: boolean;
  hasAISummary: boolean;
  data: {
    steps: ISection[];
    decisions: IDecision[];
  };
  decisionIndex: number;
  setting: {
    categoryId: string;
    taskNameId: string;
  };
  isAIDynamicParamValid?: boolean;
  isTemplateValid?: boolean;
  hasCreateFirstCommunicationStep?: boolean;
}

export interface CRMRegion {
  [crmSystemId: string]: RegionInfo[];
}
