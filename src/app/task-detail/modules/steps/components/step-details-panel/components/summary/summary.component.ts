import { EStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiButtonEnumStatus } from '@/app/shared';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { Component, Input } from '@angular/core';
import { ButtonKey } from '@trudi-ui';

@Component({
  selector: 'summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent {
  @Input() currentStep: TrudiStep & StepDetail;
  @Input() buttonKey: ButtonKey;
  EStepType = EStepType;
  EStepStatus = TrudiButtonEnumStatus;
}
