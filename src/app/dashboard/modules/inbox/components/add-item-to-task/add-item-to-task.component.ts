import { TrudiUiModule } from '@trudi-ui';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';

import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { DropdownListTaskGroupComponent } from './components/dropdown-list-task-group/dropdown-list-task-group.component';
import { Subject, takeUntil } from 'rxjs';
import { SharedService } from '@/app/services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AddItemToTaskService } from './service/add-item-to-task.service';
import { AddItemToTaskApiService } from './service/add-item-to-task-api.service';
import { TaskItem, TaskType } from '@/app/shared';
import { stringFormat } from '@/app/core';
import { AppRoute } from '@/app/app.route';
import { Router } from '@angular/router';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { CREATE_TASK_SUCCESSFULLY } from '@/app/services/messages.constants';
import { NavigatorService } from '@/app/services/navigator.service';

export enum EStateModalAddToTask {
  addItemToTask = 1,
  createTask = 2,
  addToExistingTask = 3
}

@Component({
  selector: 'add-item-to-task',
  templateUrl: './add-item-to-task.component.html',
  styleUrls: ['./add-item-to-task.component.scss'],
  imports: [TrudiUiModule, CommonModule, DropdownListTaskGroupComponent],
  providers: [AddItemToTaskService, AddItemToTaskApiService],
  standalone: true
})
export class AddItemToTaskComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter();
  @Input() stateModal: EStateModalAddToTask = null;
  @Input() taskId: string;
  @Input() actionRequestId: string;
  @Input() actionName: string;
  @Input() propertyId: string;
  public isShowModalSelect: boolean = false;
  public stateModalAddToTask = EStateModalAddToTask;
  public selectedOption: EStateModalAddToTask = null;
  private destroy$ = new Subject<void>();
  public isDisconnectMailbox: boolean = false;
  public isConsole: boolean = false;
  public isArchiveMailbox: boolean = false;
  public selectedTask: TaskItem;

  constructor(
    private addItemToTaskService: AddItemToTaskService,
    private addItemToTaskApiService: AddItemToTaskApiService,
    private sharedService: SharedService,
    private showSidebarRightService: ShowSidebarRightService,
    private navigatorService: NavigatorService,
    private inboxService: InboxService,
    private router: Router,
    private toastCustomService: ToastCustomService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.isDisconnectMailbox = data;
      });
    this.isConsole = this.sharedService.isConsoleUsers();

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox: boolean) =>
          (this.isArchiveMailbox = isArchiveMailbox)
      );
  }

  handleCreateTask() {
    const ref = this.addItemToTaskService.handleCreateNewTask({
      openFrom: CreateTaskByCateOpenFrom.ADD_ITEM_TO_TASK,
      propertyId: this.propertyId,
      showBackBtn: true
    });

    ref.instance.onBack.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedOption = this.stateModal;
      this.stateModal = EStateModalAddToTask.addItemToTask;
      this.addItemToTaskService.overlayRef.dispose();
      ref.destroy();
      this.cdr.detectChanges();
    });
    ref.instance.onNext.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      const payload = {
        ...value,
        isLinked: true,
        actionName: this.actionName,
        actionRequestId: this.actionRequestId
      };
      this.addItemToTaskApiService
        .linkedActionToTask(payload, EStateModalAddToTask.createTask)
        .subscribe({
          next: (response) => {
            this.stateModal = null;
            this.toastCustomService.handleShowToastAddItemToTask(
              CREATE_TASK_SUCCESSFULLY,
              false
            );
            this.handleNavigateToTaskDetail(
              response,
              EStateModalAddToTask.createTask
            );
          },
          complete: () => {
            this.closeModal.emit();
            ref.destroy();
            this.addItemToTaskService.overlayRef.dispose();
          }
        });
    });

    ref.instance.stopProcessCreateNewTask
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value === false) {
          this.stateModal = null;
          this.closeModal.emit();
          ref.destroy();
          this.addItemToTaskService.overlayRef.dispose();
        }
      });
  }

  handleShowToastAddItemToTask(value) {
    if (value?.isExistActionLinked) {
      this.toastCustomService.handleShowToastAddItemToTask(
        'Task was recently linked with another item'
      );
    } else {
      this.handleNavigateToTaskDetail(
        value,
        EStateModalAddToTask.addToExistingTask
      );
      this.toastCustomService.handleShowToastAddItemToTask(
        'Item added to task',
        false
      );
    }
  }

  handleNavigateToTaskDetail(value, typeAction: EStateModalAddToTask) {
    this.showSidebarRightService.handleToggleSidebarRight(true);
    this.router.navigate([stringFormat(AppRoute.TASK_DETAIL, value.id)], {
      replaceUrl: true,
      queryParams: {
        type: TaskType.TASK,
        ...(typeAction === EStateModalAddToTask.addToExistingTask && {
          keepReturnUrl: true
        })
      }
    });
  }

  handleGetValueDropdown($event) {
    this.selectedTask = $event?.id ? $event : null;
  }

  handleConfirm() {
    switch (this.selectedOption) {
      case EStateModalAddToTask.createTask:
        this.stateModal = EStateModalAddToTask.createTask;
        this.selectedOption = null;
        this.handleCreateTask();
        break;
      case EStateModalAddToTask.addToExistingTask:
        if (!this.selectedTask?.id) return;
        this.stateModal = EStateModalAddToTask.addToExistingTask;
        this.selectedOption = null;
        this.navigatorService.setReturnUrl(this.router.url);
        this.toastCustomService.handleShowToastAddItemToTask(
          'Item adding to task',
          false,
          'assets/icon/syncing-v4.svg'
        );
        this.handleAddToExistingTask();
        this.closeModal.emit();
        break;
      default:
        break;
    }
  }

  handleAddToExistingTask() {
    const payload = {
      taskId: this.selectedTask.id,
      isLinked: true,
      actionName: this.actionName,
      actionRequestId: this.actionRequestId
    };

    this.addItemToTaskApiService
      .linkedActionToTask(payload, EStateModalAddToTask.addToExistingTask)
      .subscribe({
        next: (response) => {
          this.handleShowToastAddItemToTask(response);
        },
        error: () => {
          this.toastCustomService.handleShowToastAddItemToTask(
            'Failed to add item to task'
          );
        }
      });
  }

  handleCloseModal() {
    this.closeModal.emit();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
