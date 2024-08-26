import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { NodeType } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/node-type.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { ITaskWorkflow, ITaskWorkflowItem } from '@shared/types/task.interface';
import {
  ESelectStepType,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'progress-preview',
  templateUrl: './progress-preview.component.html',
  styleUrls: ['./progress-preview.component.scss']
})
export class ProgressPreviewComponent implements OnChanges {
  @Input() inprogress: ITaskWorkflow;
  @Input() displayLabel: boolean = true;
  @Input() taskId: string = '';
  @Input() isNoPropertyTask = false;
  public flows: ITaskWorkflowItem[] = [];
  private steps: ITaskWorkflowItem[] = [];
  public latestSteps: ITaskWorkflowItem[] = [];
  public TrudiButtonEnumStatus = TrudiButtonEnumStatus;
  constructor(private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inprogress']?.currentValue) {
      this.steps = this.inprogress?.steps;
      this.steps = [];
      this.flows = [];
      // get steps from sections and steps on level 0
      if (this.inprogress.steps) {
        let { taskSteps, flows } = this.getTaskSteps(this.inprogress.steps);
        this.steps = taskSteps;
        this.flows = flows;
      }

      // get steps from decision on level 1
      if (this.inprogress.decision?.id) {
        this.flows.push({
          id: this.inprogress.decision.id,
          name: this.inprogress.decision.name,
          type: NodeType.DECISION
        });
        let { taskSteps, flows } = this.getTaskSteps(
          this.inprogress.decision.steps
        );
        this.steps = [...this.steps, ...taskSteps];
        this.flows = [...this.flows, ...flows];
      }

      // get steps from decision on level 1
      const decisionLevel2 = this.inprogress.decision?.decision;
      if (decisionLevel2?.id) {
        this.flows.push({
          id: decisionLevel2.id,
          name: decisionLevel2.name,
          type: NodeType.DECISION
        });
        let { taskSteps, flows } = this.getTaskSteps(decisionLevel2.steps);
        this.steps = [...this.steps, ...taskSteps];
        this.flows = [...this.flows, ...flows];
      }
      const newStepsWithouDisabled = this.getStepsWithouDisabled(this.steps);
      // get latest completed steps
      let latestCompletedStepIndex = newStepsWithouDisabled.length;
      for (let i = 0; i < newStepsWithouDisabled.length; i++) {
        const isCompleted = [
          TrudiButtonEnumStatus.COMPLETED,
          TrudiButtonEnumStatus.EXECUTED
        ].includes(newStepsWithouDisabled[i].status);
        if (isCompleted) {
          latestCompletedStepIndex = i;
        }
      }
      this.latestSteps = newStepsWithouDisabled.slice(
        latestCompletedStepIndex,
        latestCompletedStepIndex + 2
      );
    }
  }

  getStepsWithouDisabled(steps: ITaskWorkflowItem[]) {
    const stepsInTask = this.inprogress.stepsInTask.filter(
      (stepInTask) => !!steps.find((step) => stepInTask.id === step.id)
    );
    const firstRequiredStepIndex = stepsInTask.findIndex(
      (btn) => btn.isRequired && btn.status === TrudiButtonEnumStatus.PENDING
    );
    const firstRequiredStepNotFoundOrLatest =
      firstRequiredStepIndex === -1 ||
      firstRequiredStepIndex === stepsInTask.length - 1;
    const newSteps = [];
    stepsInTask.forEach((step, stepIndex: number) => {
      const isStepEnabledForNoPropertyTask =
        [ESelectStepType.CHECK_LIST, ESelectStepType.NEW_TASK].includes(
          step.stepType as ESelectStepType
        ) ||
        (step.stepType === ESelectStepType.COMMUNICATION_STEP &&
          [EStepAction.SEND_BASIC_EMAIL, EStepAction.SEND_REQUEST].includes(
            step.action
          ));

      const disabledByRequiredStep =
        !firstRequiredStepNotFoundOrLatest &&
        stepIndex > firstRequiredStepIndex;

      const showNoPropertyWarning =
        !isStepEnabledForNoPropertyTask &&
        !disabledByRequiredStep &&
        this.isNoPropertyTask;

      const disabled = !!disabledByRequiredStep || !!showNoPropertyWarning;
      if (!disabled) newSteps.push(step);
    });
    return newSteps;
  }

  getTaskSteps(steps: ITaskWorkflowItem[] = []) {
    let flows = [];
    let taskSteps = [];

    (steps || []).forEach((step) => {
      if (step?.type === NodeType.STEP) {
        flows.push(step);
        taskSteps.push(step);
      }

      if (step?.type === NodeType.SECTION) {
        flows.push({
          id: step.id,
          name: step.name,
          type: step.type
        });
        if (step?.buttons?.length) {
          taskSteps = [...taskSteps, ...step.buttons];
          flows = [...flows, ...step.buttons];
        }
      }
    });

    return { taskSteps, flows };
  }
  navigateToTaskDetail() {
    this.router.navigate(['dashboard', 'inbox', 'detail', this.taskId], {
      queryParams: {
        type: 'TASK'
      },
      queryParamsHandling: 'merge'
    });
  }
}
