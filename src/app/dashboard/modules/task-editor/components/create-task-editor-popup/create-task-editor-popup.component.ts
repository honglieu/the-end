import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ECreatePopupType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';

@Component({
  selector: 'create-task-editor-popup',
  templateUrl: './create-task-editor-popup.component.html',
  styleUrls: ['./create-task-editor-popup.component.scss']
})
export class CreateTaskEditorPopupComponent implements OnInit {
  public typeCreateTaskEditor = ECreatePopupType;
  public popupState: ECreatePopupType = ECreatePopupType.CREATE_TASK_EDITOR;
  public active: ECreatePopupType = ECreatePopupType.CREATE_FROM_TEMPLATE;
  public isDisabled: boolean = true;
  public titleModal: string = '';
  @Output() onBack = new EventEmitter<boolean>();

  constructor(public taskEditorService: TaskEditorService) {}

  ngOnInit(): void {
    this.titleModal = this.taskEditorService.isConsoleSettings
      ? 'Create task template'
      : 'Create new task';
  }

  onCancel() {
    this.taskEditorService.setPopupTaskEditorState(null);
  }
  handleNextCreateTaskEditor() {
    this.popupState = this.active;
  }

  handleActive(value) {
    this.active = value;
  }
  handleBack() {
    this.popupState = ECreatePopupType.CREATE_TASK_EDITOR;
  }

  handleBackCreateTaskEditor() {
    this.onBack.emit();
  }
}
