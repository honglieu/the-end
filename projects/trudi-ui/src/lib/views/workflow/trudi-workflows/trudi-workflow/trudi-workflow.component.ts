import { Component, ContentChild, HostBinding, Input } from '@angular/core';
import uuid4 from 'uuid4';
import {
  TrudiWorkflowContentDirective,
  TrudiWorkflowCheckedDirective,
  TrudiWorkflowUncheckDirective
} from '../../directive';
@Component({
  selector: 'trudi-workflow',
  templateUrl: './trudi-workflow.component.html',
  styleUrls: ['./trudi-workflow.component.scss']
})
export class TrudiWorkflowComponent {
  @Input() finished: boolean = false;
  @Input() disabled: boolean = false;
  @Input() title: string;
  @Input() readonly: boolean = false;
  public lineDisabled: boolean = false;
  public isVertical: boolean = false;
  public lineHidden: boolean = false;
  public uuid = 'trudi-work-flow-' + uuid4();

  @ContentChild(TrudiWorkflowContentDirective)
  customContent!: TrudiWorkflowContentDirective;

  @ContentChild(TrudiWorkflowCheckedDirective)
  customChecked!: TrudiWorkflowCheckedDirective;

  @ContentChild(TrudiWorkflowUncheckDirective)
  customUnCheck!: TrudiWorkflowUncheckDirective;

  @HostBinding('class.trudi_workflow--disabled')
  get isDisabled() {
    return this.disabled;
  }

  @HostBinding('class.line_disabled')
  get isLineDisabled() {
    return this.lineDisabled;
  }

  @HostBinding('class.line_hidden')
  get isLineHidden() {
    return this.lineHidden;
  }

  @HostBinding('class.direction_vertical')
  get isVerticalDirection() {
    return this.isVertical;
  }

  constructor() {}
}
