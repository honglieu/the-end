import { ECreatePopupOptionType } from '@/app/task-detail/enums/task-detail.enum';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'option-create-task-multiple-modal',
  templateUrl: './option-create-task-multiple-modal.component.html',
  styleUrls: ['./option-create-task-multiple-modal.component.scss']
})
export class OptionCreateTaskMultipleModalComponent {
  public typeCreateTaskOption = ECreatePopupOptionType;
  public isDisabled: boolean = true;
  public titleModal: string = '';
  @Input() openModal: boolean = false;
  @Input() option: ECreatePopupOptionType;
  @Output() onBack = new EventEmitter();
  @Output() onQuitModal = new EventEmitter();
  @Output() onNext = new EventEmitter<ECreatePopupOptionType>();
  @Output() onChangeOption = new EventEmitter<ECreatePopupOptionType>();

  constructor() {}

  onCancel() {
    this.onQuitModal.emit();
    this.openModal = false;
  }

  handleNextOptionCreateTask() {
    this.onNext.emit(this.option);
    this.openModal = false;
  }

  handleChangeOption(value) {
    this.onChangeOption.emit(value);
  }

  handleBackOptionCreateTask() {
    this.onBack.emit();
  }
}
