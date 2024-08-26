import { TrudiButtonEnumStatus } from '@/app/shared';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'checklist-step-summary',
  templateUrl: './checklist-step-summary.component.html',
  styleUrl: './checklist-step-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistStepSummaryComponent {
  EStepStatus = TrudiButtonEnumStatus;
  @Input() currentStep: Omit<TrudiStep, 'reminderTimes'> & StepDetail;
}
