import { IPreviousStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import {
  EPropertyTreeButtonComponent,
  ERentManagerButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import {
  ConflictStepType,
  ECalendarEvent,
  ESelectStepType,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
export interface TreeNodeOptions {
  title: string;
  key: string;
  icon?: string;
  isLeaf?: boolean;
  checked?: boolean;
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  expanded?: boolean;
  typeLevel?: number;
  treeNodeLevel?: number;
  type?: ETypeElement;
  state?: ETreeNodeState;
  edit?: boolean;
  stepType?: EStepType | ESelectStepType;
  children?: TreeNodeOptions[];
  index?: number;
  error?: boolean;
  crmConflictErrors?: CrmConflictError[];
  decisionKey?: string;
  parentKey?: string;
  listPreviousSteps?: IPreviousStep[];
  componentType?: EPropertyTreeButtonComponent | ERentManagerButtonComponent;
  eventType?: ECalendarEvent;
  childDecisionKey?: string;
}

export enum ETreeNodeState {
  DRAFT,
  TEMPORARY,
  SAVED
}

export interface TreeStep {
  title: string;
  parentNode: TreeStep;
  children: TreeStep[];
}

export interface CrmConflictError {
  type?: ConflictStepType;
  message?: string;
  crmSystemId?: string;
}
