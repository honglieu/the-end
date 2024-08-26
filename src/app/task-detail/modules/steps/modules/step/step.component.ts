import { Component, Input, OnInit } from '@angular/core';
import {
  EStepAction,
  EStepType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss']
})
export class StepComponent {
  @Input() button: { action: EStepAction; stepType: EStepType; id: string };
  @Input() classContainer: string = 'none-section';
  public EStepAction = EStepAction;
  public EStepType = EStepType;

  constructor() {}
}
