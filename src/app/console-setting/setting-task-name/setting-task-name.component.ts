import { TaskType } from './../../shared/enum/task.enum';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { UserService } from '@services/user.service';
import { LoaderService } from '@services/loader.service';
import { TaskService } from '@services/task.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TaskName } from '@shared/types/task.interface';

@Component({
  selector: 'app-setting-task-name',
  templateUrl: './setting-task-name.component.html',
  styleUrls: ['./setting-task-name.component.scss']
})
export class SettingTaskNameComponent implements OnInit {
  public popupModalPosition = ModalPopupPosition;
  public isShowModalDeleteTaskName = false;
  public addForm: FormGroup;
  public taskNameList: TaskName[];
  public isClickAdd = false;
  public rowAddingIndex: number;
  public isClickEdit = false;
  public rowEditingIndex: number;
  public itemEditingIndex: number;
  public taskDeletingId: string;
  public isAddOrEditDuplicate = false;
  private unsubscribe = new Subject<void>();
  public canEdit: boolean = false;

  constructor(
    private taskService: TaskService,
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private loadingService: LoadingService,
    private userService: UserService
  ) {
    this.addForm = this.fb.group({
      taskName: this.fb.control('', [Validators.required])
    });
  }

  ngOnInit(): void {
    this.userService.getUserInfo();
    this.getTaskNameList();
    this.checkIfUserCanEdit();
  }

  getTaskNameList() {
    this.taskService
      .getTaskNameList('', TaskType.TASK)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((tasks: TaskName[]) => {
        if (tasks) {
          this.setTaskNameList(tasks);
        }
      });
  }

  onClickAdd(rowId: number) {
    this.isAddOrEditDuplicate = false;
    this.isClickEdit = false;
    this.isClickAdd = true;
    this.rowAddingIndex = rowId;
    this.resetForm();
    setTimeout(() => {
      const input = document.getElementById(`add-task-input-${rowId}`);
      input?.focus();
      this.getTaskName.markAsTouched();
    }, 10);
  }

  onClickEdit(rowId: number, itemId: number) {
    this.resetForm();
    this.getTaskName.setValue(this.taskNameList[itemId]?.name);
    this.isAddOrEditDuplicate = false;
    this.isClickAdd = false;
    this.isClickEdit = true;
    this.rowEditingIndex = rowId;
    this.itemEditingIndex = itemId;
    setTimeout(() => {
      const input = document.getElementById(`edit-task-input-${rowId}`);
      input?.focus();
      this.getTaskName.markAsPristine();
      this.getTaskName.markAsTouched();
    }, 10);
  }

  onSaveAdd(topicId: number) {
    if (this.checkInvalidInput()) {
      return;
    }
    if (!this.getTaskName.value || !this.taskNameList[topicId].id) {
      return;
    }
    this.loadingService.onLoading();
    this.taskService
      .createTaskName(this.getTaskName.value, this.taskNameList[topicId].id)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() => this.taskService.getTaskNameList('', TaskType.TASK))
      )
      .subscribe({
        next: (tasks) => {
          if (tasks) {
            this.setTaskNameList(tasks);
            this.onCancel();
            this.loadingService.stopLoading();
          }
        },
        error: (err) => {
          this.isAddOrEditDuplicate = true;
          this.loadingService.stopLoading();
        }
      });
  }

  onSaveEdit(topicId: number, taskId: number) {
    if (this.checkInvalidInput()) {
      return;
    }
    this.loadingService.onLoading();
    this.taskService
      .editTaskTitle(this.taskNameList[taskId]?.id, this.getTaskName.value)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() => this.taskService.getTaskNameList('', TaskType.TASK))
      )
      .subscribe({
        next: (tasks) => {
          if (tasks) {
            this.setTaskNameList(tasks);
            this.onCancel();
            this.loadingService.stopLoading();
          }
        },
        error: (err) => {
          this.isAddOrEditDuplicate = true;
          this.loadingService.stopLoading();
        }
      });
  }

  setTaskNameList(taskList: TaskName[]) {
    this.taskNameList = taskList.filter(
      (task) => task.conversationCategoryId && task.conversationCategoryName
    );
  }

  onCancel() {
    this.isClickAdd = false;
    this.rowAddingIndex = null;
    this.isClickEdit = false;
    this.rowEditingIndex = null;
    this.itemEditingIndex = null;
    this.isAddOrEditDuplicate = false;
    this.resetForm();
  }

  onShowDeletePopup(rowId: number, itemId: number) {
    this.isClickAdd = false;
    this.isClickEdit = false;
    this.isShowModalDeleteTaskName = true;
    this.taskDeletingId = this.taskNameList[itemId].id;
  }

  onDeleteTaskName(status: boolean) {
    this.isShowModalDeleteTaskName = false;
    if (status) {
      this.getTaskNameList();
    }
  }

  onChangeInput(event) {
    this.isAddOrEditDuplicate = false;
  }

  resetForm() {
    this.getTaskName.setValue('');
    this.getTaskName.clearValidators();
    this.getTaskName.markAsUntouched();
  }

  checkInvalidInput() {
    return (
      this.getTaskName.touched &&
      (this.getTaskName.invalid || !this.getTaskName.value)
    );
  }

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.isClickAdd && !this.isClickEdit) {
      return;
    }
    const target = event.target;
    if (
      (target.tagName?.toLowerCase() === 'input' &&
        target.id?.includes('task-input')) ||
      (target.tagName?.toLowerCase() === 'img' &&
        target.className?.includes('edit-btn')) ||
      (target.tagName?.toLowerCase() === 'img' &&
        target.className?.includes('delete-btn'))
    ) {
      return;
    }
    if (
      target.tagName?.toLowerCase() === 'img' &&
      target.className === 'icon-cancel'
    ) {
      return this.onCancel();
    }

    if (this.isClickAdd) {
      return this.onSaveAdd(this.rowAddingIndex);
    }

    if (this.isClickEdit) {
      return this.onSaveEdit(this.rowEditingIndex, this.itemEditingIndex);
    }
  }

  get getTaskName() {
    return this.addForm.get('taskName');
  }

  identify(index, item) {
    return item.id;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  checkIfUserCanEdit() {
    const userInfo = this.userService.userInfo$.getValue();
    if (!userInfo) {
      this.userService.userInfo$
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((rs) => {
          if (rs) {
            this.canEdit = rs.isAdministrator;
          }
        });
    } else {
      this.canEdit = userInfo.isAdministrator;
    }
  }
}
