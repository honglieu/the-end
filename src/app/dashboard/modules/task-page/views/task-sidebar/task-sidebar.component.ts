import { EFolderAction } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/components/inbox-sidebar-item/inbox-sidebar-item.component';
import {
  IGlobalStatisticTask,
  ITaskFolder
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { TaskFolderInputComponent } from '@/app/dashboard/modules/task-page/components/task-folder-input/task-folder-input.component';
import { IIcon } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '@services/company.service';
import { SharedService } from '@services/shared.service';
import { TaskStatusType, GroupType } from '@shared/enum';
import { cloneDeep, isEqual } from 'lodash-es';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  takeUntil,
  tap
} from 'rxjs';

interface ICurrentQueryParam {
  taskTypeID?: string;
  aiAssistantType?: string;
  taskId?: string;
  conversationId?: string;
  threadId?: string;
  sortTaskType?: string;
  inboxType?: TaskStatusType;
}

@Component({
  selector: 'task-sidebar',
  standalone: false,
  templateUrl: './task-sidebar.component.html',
  styleUrl: './task-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskSidebarComponent implements OnInit, OnDestroy {
  @ViewChild('folderNameRef') folderNameRef: TaskFolderInputComponent;
  private destroy$ = new Subject<void>();
  private inboxSidebarService = inject(InboxSidebarService);
  private activeRouter = inject(ActivatedRoute);
  private router = inject(Router);
  private inboxFilterService = inject(InboxFilterService);
  private cdr = inject(ChangeDetectorRef);
  private statisticService = inject(StatisticService);
  private dashboardApiService = inject(DashboardApiService);
  private companyService = inject(CompanyService);
  private sharedService = inject(SharedService);

  private currentQueryParams: ICurrentQueryParam;
  private sortTaskType: string;
  public taskFolders: ITaskFolder[] = [];
  public companyId: string;
  public iconControl = new FormControl(null);
  public folderNameControl = new FormControl(null);
  public showFolderNameInput = false;
  public showDropdown = false;
  public isConsole = false;
  public selectedIcon: IIcon;
  private document = inject(DOCUMENT);

  ngOnInit(): void {
    this.getInboxFilter();
    this.handleQueryParams();
    this.getCompanyId();
    this.handleUnreadAndTotalTaskFolder();

    this.isConsole = this.sharedService.isConsoleUsers();
  }

  private handleQueryParams() {
    combineLatest([this.activeRouter.queryParams, this.invokeGetTaskFolders()])
      .pipe(
        takeUntil(this.destroy$),
        tap(([queryParams, taskFolders]) => {
          const { taskTypeID } = queryParams || {};
          this.handleNavigateFirstFolder(taskTypeID, taskFolders);
        }),
        distinctUntilChanged((prev, curr) => {
          const [prevQueryParam, prevTaskFolder] = prev;
          const [currQueryParam, currTaskFolder] = curr;
          return isEqual(prevTaskFolder, currTaskFolder);
        })
      )
      .subscribe(([queryParams, taskFolders]) => {
        this.currentQueryParams = queryParams;
        this.taskFolders = taskFolders;
        this.statisticService.setTriggerStatisticGlobalTask();
        this.cdr.markForCheck();
      });
  }

  handleNavigateFirstFolder = (taskTypeID, taskFolders: ITaskFolder[]) => {
    if (!taskTypeID && (this.taskFolders?.length || taskFolders?.length)) {
      // NOTE: Navigate first task folder when taskTypeID not exist
      const [firstTaskFolder] = taskFolders || [];
      setTimeout(() => {
        this.router.navigate([], {
          queryParams: {
            taskTypeID: firstTaskFolder?.id || '',
            aiAssistantType: null,
            taskId: null,
            conversationId: null,
            threadId: null,
            sortTaskType:
              this.currentQueryParams['sortTaskType'] || this.sortTaskType,
            inboxType:
              this.inboxFilterService.getSelectedInboxType() ||
              this.currentQueryParams['inboxType']
          }
        });
      });
    }
  };

  private invokeGetTaskFolders() {
    return this.inboxSidebarService.taskFolders$.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      map((taskFolders) => {
        if (taskFolders) {
          return taskFolders?.map((it) => ({
            ...it,
            taskCount: it?.taskCount ? it.taskCount : 0,
            canEditFolder: true,
            routerLink: [],
            queryParams: {
              taskTypeID: it?.id,
              aiAssistantType: null,
              taskId: null,
              conversationId: null,
              threadId: null,
              sortTaskType: null
            }
          })) as unknown as ITaskFolder[];
        }
        return [] as ITaskFolder[];
      })
    );
  }

  private getInboxFilter() {
    this.inboxFilterService
      .getSelectedSortTaskType()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.sortTaskType = res;
      });
  }

  private handleUnreadAndTotalTaskFolder() {
    const statistic$ = this.statisticService.statisticGlobalTask$;
    const inboxType$ = this.inboxFilterService.selectedInboxType$;

    combineLatest([statistic$, inboxType$])
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(([statistic, inboxType]) => {
        if (!statistic && !this.taskFolders?.length) return;
        const focusViewType = this.isConsole ? GroupType.TEAM_TASK : inboxType;
        this.handleShowUnreadAndTotalForTask(
          this.taskFolders,
          statistic,
          focusViewType === GroupType.MY_TASK
        );
      });
  }

  private handleShowUnreadAndTotalForTask(
    taskFolders: ITaskFolder[],
    statisticResponse: IGlobalStatisticTask,
    isMyTask: boolean
  ) {
    const { teamInbox, myInbox } = statisticResponse || {};
    const taskType = isMyTask ? myInbox : teamInbox;

    const cloneTaskFolders = cloneDeep(taskFolders);
    const updateTaskFolder = cloneTaskFolders.map((taskFolder) => {
      const taskFolderId = taskFolder.id;
      const allTaskCount =
        teamInbox?.totalTaskCount?.[taskFolderId] +
        teamInbox?.totalCompletedTaskCount?.[taskFolderId];
      return {
        ...taskFolder,
        taskCount: taskType?.totalTaskCount?.[taskFolderId],
        unReadTaskCount: taskType?.task?.[taskFolderId],
        unreadInternalNoteCount: taskType?.internalNote?.[taskFolderId],
        allTaskCount
      };
    });

    this.inboxSidebarService.setInboxTaskFolder(updateTaskFolder);
  }

  private getCompanyId() {
    this.companyService
      .getCurrentCompanyId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((companyId) => {
        this.companyId = companyId;
      });
  }

  public handleBlurFolderName() {
    if (this.showDropdown) {
      return;
    }
    if (this.folderNameControl.value) {
      const maxOrder = this.taskFolders.reduce(
        (maxOrder, item) => (item.order > maxOrder ? item.order : maxOrder),
        0
      );
      this.dashboardApiService
        .createTaskFolder({
          companyId: this.companyId,
          icon: this.selectedIcon.icon,
          name: this.folderNameControl.value,
          order: maxOrder + 1,
          labelId: null
        })
        .subscribe({
          next: (res) => {
            if (res) {
              this.inboxSidebarService.setInboxTaskFolder([
                ...this.taskFolders,
                {
                  ...res,
                  taskCount: 0
                }
              ]);
            }
          }
        });
    }
    this.folderNameControl.setValue(null, {
      emitEvent: false
    });
    this.showFolderNameInput = false;
  }

  public handleFolderDropdown() {
    this.showDropdown = !this.showDropdown;
    if (!this.showDropdown) {
      this.folderNameRef.onFocus();
    }
  }

  public handleFolderAction({
    taskFolder,
    action
  }: {
    taskFolder: ITaskFolder;
    action: EFolderAction;
  }) {
    if (action === EFolderAction.DELETE) {
      const taskFolders = [...this.taskFolders];
      const newTaskFolders = taskFolders.filter(
        (it) => it?.id !== taskFolder?.id
      );
      const currentIndex = taskFolders.indexOf(taskFolder);
      const lastIndex =
        currentIndex !== -1 && currentIndex === taskFolders?.length - 1;
      const { taskTypeID } = this.activeRouter.snapshot.queryParams;
      this.dashboardApiService
        .deleteTaskFolder(taskFolder?.id, this.companyId)
        .subscribe({
          next: (res) => {
            newTaskFolders &&
              this.inboxSidebarService.setInboxTaskFolder(newTaskFolders);

            const isDeletedFolderCurrent = taskFolder.id === taskTypeID;

            if (isDeletedFolderCurrent) {
              const hasRemainingFolders = taskFolders?.length > 1;

              if (hasRemainingFolders) {
                // If the deleted folder is not the last one, navigate to the folder below it; otherwise, navigate to the folder above it.
                const indexTaskFolder = lastIndex
                  ? currentIndex - 1
                  : currentIndex + 1;
                const nextTaskFolder = taskFolders?.[indexTaskFolder];
                this.router.navigate([], {
                  relativeTo: this.activeRouter,
                  queryParams: {
                    taskTypeID: nextTaskFolder?.id
                  },
                  queryParamsHandling: 'merge'
                });
              }
            }
          }
        });
      return;
    }
    if (action === EFolderAction.EDIT) {
      this.dashboardApiService
        .updateTaskFolder([taskFolder])
        .subscribe((res) => {
          const updateTaskFolders = [...this.taskFolders].map((it) => {
            if (it.id === taskFolder.id) {
              return {
                ...taskFolder
              };
            }
            return it;
          });
          this.inboxSidebarService.setInboxTaskFolder(updateTaskFolders);
        });
      return;
    }
  }

  public dropped(event: CdkDragDrop<ITaskFolder[]>) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    const newTaskFolders = event.container.data.map((it, index) => ({
      ...it,
      order: index + 1
    }));
    this.inboxSidebarService.setInboxTaskFolder(newTaskFolders);
    this.dashboardApiService.updateTaskFolder(newTaskFolders).subscribe();
  }

  public handleStartDragFolder() {
    this.document.body.click();
  }

  public onEnter() {
    this.handleBlurFolderName();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
