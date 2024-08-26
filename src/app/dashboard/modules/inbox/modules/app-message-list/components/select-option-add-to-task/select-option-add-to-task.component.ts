import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'select-option-add-to-task',
  templateUrl: './select-option-add-to-task.component.html',
  styleUrls: ['./select-option-add-to-task.component.scss']
})
export class SelectOptionAddToTaskComponent {
  @Input() isVisible: boolean = false;
  @Input() disabled: boolean = false;
  @Output() closePopup: EventEmitter<void> = new EventEmitter();
  @Output() createNewTask: EventEmitter<void> = new EventEmitter();
  @Output() addToExistingTask: EventEmitter<void> = new EventEmitter();
  constructor() {}
}
