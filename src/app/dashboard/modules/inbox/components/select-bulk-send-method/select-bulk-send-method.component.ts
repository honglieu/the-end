import { EBulkSendMethod } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'select-bulk-send-method',
  templateUrl: './select-bulk-send-method.component.html',
  styleUrls: ['./select-bulk-send-method.component.scss']
})
export class SelectBulkSendMethodComponent {
  @Input() visible = false;
  @Output() onClose = new EventEmitter<boolean>();
  @Output() onNext = new EventEmitter();
  public options = [
    {
      type: EBulkSendMethod.TRIGGER_STEP_FROM_TASK,
      text: 'Trigger step from task',
      icon: 'taskList'
    },
    {
      type: EBulkSendMethod.COMPOSE_BULK_EMAIL,
      text: 'Compose bulk email',
      icon: 'composeEmail'
    }
  ];
  constructor() {}

  handleCancel() {
    this.onClose.emit(true);
  }

  handleNext(option: EBulkSendMethod) {
    this.onClose.emit(false);
    this.onNext.emit(option);
  }
}
