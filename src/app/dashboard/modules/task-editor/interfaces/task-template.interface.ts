import { PageOptions } from '@shared/types/trudi.interface';
import { IListTopic } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  IDecision,
  IDecisionTree,
  ISection
} from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ECRMId } from '@shared/enum/share.enum';

export interface ITaskTemplate {
  id: string;
  name: string;
  aiSummary: boolean;
  parentTemplateId: string;
  template: IDecisionTree;
  crmSystemId?: ECRMId;
  parentCrmSystemId?: string;
  agencyId?: string;
  status: ETaskTemplateStatus;
  crmSystem: string;
  topic: Partial<IListTopic>;
  taskTemplateRegions?: ITaskTemplateRegion[];
  createdAt: string;
  updatedAt: string;
  checked?: boolean;
  regionText?: string;
  crmSystemKey?: ECRMSystem;
}

export interface ITaskTemplateRegion {
  id: string;
  regionId: string;
  regionName: string;
  regionFullName: string;
}

export interface ITaskEditorTemplateRequest extends PageOptions {
  status: ETaskTemplateStatus;
  taskTemplateIds?: string[];
}

export interface TaskEditorTemplate {
  taskTemplates: ITaskTemplate[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface ICalendarEventType {
  label: string;
  value: string;
}

export interface IUpdateTaskTemplate {
  name?: string;
  regions?: string[];
  status?: string;
  topicId?: string;
  template?: IDecisionTree;
  templateId?: number;
  crmSystemId?: string;
}

export interface ToolbarTaskEditor {
  icon?: string;
  label?: string;
  action?: () => void;
  count?: number;
  disabled?: boolean;
}

export interface toolbarConfig {
  published: ToolbarTaskEditor[];
  draft: ToolbarTaskEditor[];
  archived: ToolbarTaskEditor[];
}

export interface TaskTemplateId {
  topicId?: string;
  id: string;
  isAIDynamicParamValid?: boolean;
}

export interface ICrmSystem {
  id: string;
  mediaLink: string;
  name: string;
  url: string;
}

export interface IListTaskTemplate {
  steps: ISection[];
  decisions: IDecision[];
}
