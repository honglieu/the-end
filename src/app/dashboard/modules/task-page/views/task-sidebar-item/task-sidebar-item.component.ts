import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import {
  EFolderType,
  ITaskFolder
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EFolderAction } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/components/inbox-sidebar-item/inbox-sidebar-item.component';
import { TaskFolderService } from '@/app/dashboard/services/task-folder.service';
import { FormControl } from '@angular/forms';
import { IIcon } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskFolderInputComponent } from '@/app/dashboard/modules/task-page/components/task-folder-input/task-folder-input.component';

@Component({
  selector: 'task-sidebar-item',
  standalone: false,
  templateUrl: './task-sidebar-item.component.html',
  styleUrl: './task-sidebar-item.component.scss'
})
export class TaskSidebarItemComponent implements OnInit, OnDestroy {
  @ViewChild('folderNameRef') folderNameRef: TaskFolderInputComponent;
  @Input() taskFolder: ITaskFolder;
  @Output() onClickFolderAction = new EventEmitter<{
    taskFolder: ITaskFolder;
    action: EFolderAction;
  }>();

  // Injectable
  private activeRouter = inject(ActivatedRoute);
  private taskFolderService = inject(TaskFolderService);
  private destroy$ = new Subject<void>();

  // State
  public currentQueryParam: Params;
  public currentTaskFolderId: string;
  public isEditFolder = false;
  public showDropdown = false;
  public folderNameControl = new FormControl(null);
  public selectedIcon: IIcon;
  public readonly EFolderType = EFolderType;
  public readonly EFolderAction = EFolderAction;

  ngOnInit() {
    this.activeRouter.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParams) => {
        this.currentQueryParam = queryParams;
      });
  }

  public folderMenu(event: boolean, id: string = null) {
    if (!event && this.currentTaskFolderId === id) {
      this.currentTaskFolderId = null;
    }
  }

  public getMergedQueryParams(param) {
    return {
      ...param,
      externalId: null,
      reminderType: null,
      status: param.taskTypeID ? null : param.status
    };
  }

  public handleFolderAction(taskFolder: ITaskFolder, type: EFolderAction) {
    switch (type) {
      case EFolderAction.EDIT:
        this.isEditFolder = true;
        this.currentTaskFolderId = null;
        this.taskFolderService.setSelectedTaskFolder({
          actionEditFolder: true,
          ...taskFolder
        });
        this.folderNameControl.setValue(taskFolder?.name, {
          emitEvent: false
        });
        break;
      case EFolderAction.DELETE:
        this.onClickFolderAction.emit({
          taskFolder: taskFolder,
          action: EFolderAction.DELETE
        });
        break;
      default:
        break;
    }
  }

  public handleBlurFolderName() {
    if (this.showDropdown) {
      return;
    }
    this.taskFolder = {
      ...this.taskFolder,
      icon: this.selectedIcon.icon
    };
    const updatedTaskFolder = {
      ...this.taskFolder,
      icon: this.selectedIcon.icon,
      name: this.folderNameControl.value?.trim(),
      labelId: null
    };

    this.onClickFolderAction.emit({
      taskFolder: updatedTaskFolder,
      action: EFolderAction.EDIT
    });

    this.folderNameControl.setValue(null, {
      emitEvent: false
    });
    this.isEditFolder = false;
  }

  public handleFolderDropdown() {
    this.showDropdown = !this.showDropdown;
    if (!this.showDropdown) {
      this.folderNameRef.onFocus();
    }
  }

  public onEnter() {
    this.handleBlurFolderName();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
