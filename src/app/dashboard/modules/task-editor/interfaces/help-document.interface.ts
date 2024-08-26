import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  ECalendarEvent,
  EComponentTypes,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

export interface IHelpDocument {
  groupStepsTitle?: string;
  steps: IHelpDocumentStep[];
}

export interface IHelpDocumentStep {
  id?: EStepAction | EComponentTypes | ECalendarEvent;
  title: string;
  description: string;
  alertText?: string;
  illustration: string;
  crmSystem?: ECRMSystem;
}
