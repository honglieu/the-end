import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'select-option-send-bulk-msg',
  templateUrl: './select-option-send-bulk-msg.component.html',
  styleUrls: ['./select-option-send-bulk-msg.component.scss']
})
export class SelectOptionSendBulkMsgComponent {
  @Input() isShowPopupSendBulkMsg = false;
  @Output() onCloseModal = new EventEmitter<boolean>();
  @Output() onNext = new EventEmitter();
  @Output() viewTasks: EventEmitter<void> = new EventEmitter();

  constructor() {}

  handleCancel() {
    this.onCloseModal.emit(false);
  }

  handleClickNext() {
    this.onCloseModal.emit();
    this.onNext.emit();
  }

  handleViewTasks() {
    this.viewTasks.emit();
  }
}
