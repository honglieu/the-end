import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { NodeType } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/node-type.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { ITaskWorkflow, ITaskWorkflowItem } from '@shared/types/task.interface';

@Component({
  selector: 'workflow-step',
  templateUrl: './workflow-step.component.html',
  styleUrls: ['./workflow-step.component.scss']
})
export class WorkflowStepComponent implements OnInit {
  @Input() searchValue: string;
  @Input() workflow: ITaskWorkflow;
  public flows: ITaskWorkflowItem[]; // include decision, section, step
  private steps: ITaskWorkflowItem[]; // only step type
  public latestSteps: ITaskWorkflowItem[];
  public TrudiButtonEnumStatus = TrudiButtonEnumStatus;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['workflow']?.currentValue) {
      // flat workflow
      this.steps = [];
      this.flows = [];
      if (this.workflow.steps) {
        let { taskSteps, flows } = this.getTaskSteps(this.workflow.steps);
        this.steps = taskSteps;
        this.flows = flows;
      }

      if (this.workflow.decision?.id) {
        this.flows.push({
          id: this.workflow.decision.id,
          name: this.workflow.decision.name,
          type: NodeType.DECISION
        });
        let { taskSteps, flows } = this.getTaskSteps(
          this.workflow.decision.steps
        );
        this.steps = [...this.steps, ...taskSteps];
        this.flows = [...this.flows, ...flows];
      }

      // get latest completed steps
      this.latestSteps = [];
      let latestCompletedStepIndex = this.steps.length;
      for (let i = 0; i < this.steps.length; i++) {
        if (this.steps[i].status === TrudiButtonEnumStatus.COMPLETED) {
          latestCompletedStepIndex = i;
        }
      }
      this.latestSteps = this.steps.slice(
        latestCompletedStepIndex,
        latestCompletedStepIndex + 2
      );
    }
  }

  getTaskSteps(steps: ITaskWorkflowItem[] = []) {
    let flows = [];
    let taskSteps = [];

    (steps || []).forEach((step) => {
      if (step.type === NodeType.STEP) {
        flows.push(step);
        taskSteps.push(step);
      }

      if (step.type === NodeType.SECTION) {
        flows.push({
          id: step.id,
          name: step.name,
          type: step.type
        });
        if (step.buttons?.length) {
          taskSteps = [...taskSteps, ...step.buttons];
          flows = [...flows, ...step.buttons];
        }
      }
    });

    return { taskSteps, flows };
  }
}
