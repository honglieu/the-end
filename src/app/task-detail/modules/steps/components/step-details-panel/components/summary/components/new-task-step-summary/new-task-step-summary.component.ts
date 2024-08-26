import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@/app/core';
import { TaskStatusType, TrudiButtonEnumStatus } from '@/app/shared';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'new-task-step-summary',
  templateUrl: './new-task-step-summary.component.html',
  styleUrl: './new-task-step-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewTaskStepSummaryComponent {
  @Input() currentStep: TrudiStep & StepDetail;
  EStepStatus = TrudiButtonEnumStatus;
  TaskStatusType = TaskStatusType;

  constructor(private readonly router: Router) {}

  handleNavigateLinkedTask = () => {
    this.router.navigate(
      [stringFormat(AppRoute.TASK_DETAIL, this.currentStep?.nextTask?.id)],
      {
        replaceUrl: true,
        queryParams: {
          type: 'TASK',
          createFromCalendar: false
        }
      }
    );
  };
}
