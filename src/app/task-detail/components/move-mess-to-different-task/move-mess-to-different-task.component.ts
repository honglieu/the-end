import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import {
  distinctUntilChanged,
  Subject,
  takeUntil,
  debounceTime,
  switchMap,
  of,
  BehaviorSubject,
  forkJoin,
  tap,
  map
} from 'rxjs';
import { TaskService } from '@services/task.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_MOVED_TO_TASK } from '@services/messages.constants';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { UserConversation } from '@shared/types/conversation.interface';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import {
  SearchTask,
  TaskItem,
  TaskListMove
} from '@shared/types/task.interface';
import { stringFormat } from '@core/util';
import { AppRoute } from '@/app/app.route';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TIME_NOW, USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { SharedService } from '@services/shared.service';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { MoveMessToDifferentService } from '@/app/task-detail/components/move-mess-to-different-task/services/move-mess-to-different-task.service';
import { CompanyService } from '@services/company.service';
import { MessageMenuService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-menu.service';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import dayjs from 'dayjs';
import { EMessageComeFromType } from '@shared/enum';
import { DateCasePipe } from '@shared/pipes/date-pipe';
import { TaskDateCasePipe } from '@/app/dashboard/modules/task-page/modules/task-preview/pipe/task-date-case.pipe';

@Component({
  selector: 'app-move-mess-to-different-task-v2',
  templateUrl: './move-mess-to-different-task.component.html',
  styleUrls: ['./move-mess-to-different-task.component.scss'],
  providers: [TaskDateCasePipe, DateCasePipe]
})
export class MoveMessToDifferentTaskDetailComponent
  implements OnInit, OnDestroy
{
  @ViewChild('options') private options: ElementRef;
  @Input() show: boolean;
  @Input() isUnHappyPath: boolean;
  @Input() conversationId: string;
  @Input() isShowAddress: boolean = false;
  @Input() taskFolderId: string = '';
  @Input() isBackButtonVisible: boolean = false;
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Input() isSelectMultipleMsg: boolean = false;
  @Input() propertyIds: string[];
  @Input() taskIds: string[];
  @Input() titleModal = 'Move to task';
  @Input() subTitle = '';
  @Input() isFromTrudiApp = false;
  @Input() isFromVoiceMail = false;
  @Input() isCreateNewTaskOutSide = false;
  @Output() onNewPage = new EventEmitter<boolean>();
  @Output() onBack = new EventEmitter();
  @Output() onChangeSearchTask = new EventEmitter<SearchTask>();
  @Output() isQuitModal = new EventEmitter<boolean>();
  @Output() onMoveMsgToTask = new EventEmitter();
  @Output() onOpenCreateTaskOption = new EventEmitter();
  @Output() onCreateNewTaskOutSide = new EventEmitter();
  private unsubscribe = new Subject<void>();
  public currentConversation: UserConversation;
  public disabledMoveToTaskBtn: boolean = false;
  public currentMailboxId: string;
  public agencyId: string;
  public isConsole: boolean;
  public currentProperty: any = {};
  isMissingRequiredField: boolean = false;
  public propertyType = EUserPropertyType;
  public isShowInfoRm: boolean = false;
  public isShowPropertyAddressRm: boolean = true;
  public isRmEnvironment: boolean = false;
  public isDisconnectMailbox: boolean = false;
  public messageWarnAssignToTask: string;
  public isShowWarnAssignToTask: boolean = false;
  isArchiveMailbox: boolean;
  public currentTask: TaskItem = null;
  public searchTask: SearchTask = {
    term: '',
    onlyInprogress: true,
    onlyMyTasks: true,
    pageIndex: 0,
    taskFolderId: ''
  };
  public skeletonTask = [{ disabled: true }, { disabled: true }];
  public isLoading: boolean = false;
  public taskList;
  public taskTypeActicon: FormGroup;
  private taskCompleTedSubject$ = new BehaviorSubject<SearchTask>(null);
  private completedTasksTemp: TaskListMove[] = [];
  private statusScrolInfinite: boolean = false;
  public isSkeletonTask = false;
  public currentSearchText = '';
  public searchText$ = new Subject<string>();
  public readonly EViewDetailMode = EViewDetailMode;

  constructor(
    private formBuilder: FormBuilder,
    public propertiesService: PropertiesService,
    private inboxService: InboxService,
    private taskService: TaskService,
    private conversationService: ConversationService,
    private toastService: ToastrService,
    private router: Router,
    private dashboardAgencyService: DashboardAgencyService,
    private sharedService: SharedService,
    private moveMessToDifferentService: MoveMessToDifferentService,
    private sharedMessageViewService: SharedMessageViewService,
    private companyService: CompanyService,
    private readonly messageMenuService: MessageMenuService,
    public taskDetailService: TaskDetailService,
    private cdr: ChangeDetectorRef,
    private taskDateCasePipe: TaskDateCasePipe,
    private dateCasePipe: DateCasePipe
  ) {}
  ngOnInit(): void {
    this.searchText$
      .pipe(
        distinctUntilChanged((prev, current) => {
          if (!prev) return false;
          return prev.trim() === current.trim();
        }),
        debounceTime(300),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.handleChangeSearchTask({ term: rs });
      });
    this.taskCompleTedSubject$
      .pipe(
        debounceTime(300),
        tap(() => {
          this.isLoading = true;
        }),
        switchMap((payload) => {
          const dataPayload = {
            taskFolderId: this.taskFolderId,
            propertyIds:
              this.isFromVoiceMail || this.isFromTrudiApp
                ? this.propertyIds
                : [],
            taskIds: this.taskIds,
            conversationType: this.isFromVoiceMail
              ? EMessageComeFromType.VOICE_MAIL
              : this.isFromTrudiApp
              ? EMessageComeFromType.APP
              : null
          };

          let payloadListTask = {
            ...payload,
            ...dataPayload,
            onlyInprogress: true
          };

          let payloadListTaskcompleted = {
            ...payload,
            ...dataPayload,
            onlyInprogress: false
          };
          return forkJoin([
            this.moveMessToDifferentService.prepareMoveToTaskData(
              payloadListTask,
              this.currentMailboxId
            ),
            !this.searchTask.onlyInprogress
              ? this.moveMessToDifferentService.prepareMoveToTaskData(
                  payloadListTaskcompleted,
                  this.currentMailboxId
                )
              : of(null)
          ]);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([listTask, taskcompleted]) => {
        listTask = listTask?.filter((task) => task.tasks?.length);

        if (this.isFromTrudiApp) {
          const filterTasks = listTask.filter((topic) => {
            topic.tasks = this.sortTasks(
              topic?.tasks.filter((task) =>
                this.propertyIds.includes(task?.propertyId)
              )
            );
            return topic.tasks.length > 0;
          });

          this.taskList = this.mapToGetStatusBadge(filterTasks);
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }
        if (taskcompleted) {
          this.statusScrolInfinite = taskcompleted.length > 0 ? true : false;

          this.completedTasksTemp = [
            ...this.completedTasksTemp,
            ...taskcompleted
          ];

          this.taskList = [
            ...listTask,
            ...(taskcompleted.length === 0 && this.searchTask.pageIndex === 0
              ? []
              : [
                  {
                    topicName: 'COMPLETED TASKS',
                    tasks: [...this.completedTasksTemp]
                  }
                ])
          ];
          this.isLoading = false;
        } else {
          this.taskList = listTask;
          this.isLoading = false;
        }

        if (this.taskList?.length) {
          const listTaskSuggested = this.taskList?.flatMap((topic) =>
            topic?.tasks.filter((task) =>
              this.propertyIds.includes(task?.propertyId)
            )
          );
          const topicSuggested = {
            topicName: 'SUGGESTED',
            tasks: this.sortTasks(listTaskSuggested)
          };
          const listIdTaskSuggested = listTaskSuggested?.map(
            (item) => item?.propertyId
          );
          this.taskList = this.taskList.sort((a, b) => a.order - b.order);
          this.taskList = this.taskList.map((topic) => ({
            ...topic,
            tasks: this.sortTasks(
              topic.tasks.filter(
                (item) => !listIdTaskSuggested.includes(item.propertyId)
              )
            )
          }));
          listTaskSuggested.length && this.taskList.unshift(topicSuggested);
          this.taskList = this.mapToGetStatusBadge(this.taskList);
        }
        this.cdr.markForCheck();
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      }),
      (this.taskTypeActicon = this.formBuilder.group({
        selectedTask: [null, Validators.required],
        onlyMyTasks: [true],
        onlyInprogress: [true]
      }));
    this.taskTypeActicon.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.searchTask = {
          ...this.searchTask,
          pageIndex: 0,
          onlyInprogress: value.onlyInprogress,
          onlyMyTasks: value.onlyMyTasks
        };
        this.isLoading = true;
        this.completedTasksTemp = [];
        this.taskCompleTedSubject$.next(this.searchTask);
      });
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.isDisconnectMailbox = data;
      });
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox: boolean) =>
          (this.isArchiveMailbox = isArchiveMailbox)
      );
    if (this.taskDetailViewMode === EViewDetailMode.TASK) {
      this.conversationService.currentConversation
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((currentConversation) => {
          if (!currentConversation) return;
          this.setCurrentConversationInfo(currentConversation);
        });
      this.taskService.currentTask$
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((currentTask) => {
          if (!currentTask) return;
          this.currentTask = currentTask;
          this.currentProperty = currentTask.property;
        });
    } else if (this.taskDetailViewMode === EViewDetailMode.CONVERSATION) {
      this.conversationService.currentConversation
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((currentConversation) => {
          if (!currentConversation) return;
          this.currentConversation = currentConversation;
          this.setCurrentConversationInfo(currentConversation);
        });
      this.sharedMessageViewService.prefillCreateTaskData$
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((currentTask) => {
          if (!currentTask) return;
          this.currentTask = currentTask;
          this.currentProperty = currentTask.property;
        });
    } else {
      this.sharedMessageViewService.prefillCreateTaskData$
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((currentTask) => {
          if (!currentTask) return;
          this.currentTask = currentTask;
          this.currentProperty = currentTask.property;
          this.currentConversation = currentTask
            .conversations[0] as unknown as UserConversation;
          this.setCurrentConversationInfo(this.currentConversation);
        });
    }

    if (this.isRmEnvironment) {
      this.currentConversation.userType = this.handleConvertPropertyType(
        this.currentConversation.propertyType
      );
    }

    this.taskService.selectedTaskToMove
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.taskTypeActicon.get('selectedTask').setValue(res);
        }
      });
  }

  mapToGetStatusBadge(taskList) {
    return taskList
      ?.map((topic) =>
        topic?.tasks?.length
          ? {
              ...topic,
              tasks: topic?.tasks.map((task) => ({
                ...task,
                statusBadge: this.getStatusBadge(
                  task.status,
                  task.createdAt,
                  task.updatedAt
                )
              }))
            }
          : null
      )
      .filter(Boolean);
  }

  getStatusBadge(status: TaskStatusType, createdAt: string, updatedAt: string) {
    const taskDateCase =
      this.taskDateCasePipe.transform(status, createdAt, updatedAt) + ' ';
    switch (status) {
      case TaskStatusType.completed:
        return this.dateCasePipe
          .transform(updatedAt)
          .pipe(map((date) => taskDateCase + (date === TIME_NOW ? '' : date)));
      case TaskStatusType.inprogress:
      default:
        return this.dateCasePipe
          .transform(createdAt)
          .pipe(map((date) => taskDateCase + (date === TIME_NOW ? '' : date)));
    }
  }

  sortTasks(tasks) {
    return tasks.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        const timeDiff = dayjs(b.updatedAt).diff(dayjs(a.updatedAt));
        if (timeDiff !== 0) {
          return timeDiff;
        } else {
          return a.title.localeCompare(b.title);
        }
      }
      return 0;
    });
  }

  setCurrentConversationInfo(currentConversation: UserConversation) {
    this.currentConversation = currentConversation;
    const isOwnerNoProperty =
      !this.currentTask?.property?.streetline &&
      this.currentTask?.conversations[0]?.startMessageBy ===
        EUserPropertyType.LANDLORD;
    this.isShowInfoRm = [
      EUserPropertyType.TENANT_PROSPECT,
      EUserPropertyType.TENANT_UNIT,
      EUserPropertyType.TENANT_PROPERTY,
      EUserPropertyType.LANDLORD_PROSPECT
    ].includes(this.currentConversation?.propertyType as EUserPropertyType);
    this.isShowPropertyAddressRm = [
      EUserPropertyType.TENANT_UNIT,
      EUserPropertyType.TENANT_PROPERTY
    ].includes(this.currentConversation?.propertyType as EUserPropertyType);
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.dashboardAgencyService.isRentManagerCRM(company);
      });
  }

  handleOpenSelectListTask() {
    this.isLoading = true;
    this.searchTask = {
      ...this.searchTask,
      pageIndex: 0
    };
    this.completedTasksTemp = [];
    this.taskCompleTedSubject$.next(this.searchTask);
  }

  handleBlurSelectListTask() {
    this.searchTask = {
      ...this.searchTask,
      pageIndex: 0
    };
    this.completedTasksTemp = [];
    this.isSkeletonTask = false;
  }

  handleBack() {
    this.onBack.emit();
  }

  onSubmit() {
    if (this.isArchiveMailbox) return;
    if (this.taskTypeActicon.get('selectedTask').value) {
      this.disabledMoveToTaskBtn = true;
      this.isMissingRequiredField = false;
      if (this.isSelectMultipleMsg) {
        this.onMoveMsgToTask.emit();
      } else {
        this.taskService
          .moveMessToDifferentTask(
            this.currentTask.id,
            this.taskTypeActicon.get('selectedTask').value,
            this.conversationId || this.currentConversation.id,
            this.isUnHappyPath
          )
          .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
          .subscribe((res) => {
            // TODO: not check res because of api not return anything, need to check later
            this.disabledMoveToTaskBtn = false;
            this.taskService.updateTaskItems$.next({
              listTaskId: [
                this.currentTask.id,
                this.taskTypeActicon.get('selectedTask').value
              ]
            });
            this.router.navigate(
              [
                stringFormat(
                  AppRoute.TASK_DETAIL,
                  this.taskTypeActicon.get('selectedTask').value
                )
              ],
              {
                queryParams: {
                  conversationId:
                    this.conversationId || this.currentConversation?.id,
                  conversationType: this.currentConversation?.conversationType,
                  type: TaskType.TASK
                }
              }
            );
            this.toastService.success(MESSAGE_MOVED_TO_TASK);
            this.onQuitModal();
          });
      }
    } else {
      this.taskTypeActicon.markAllAsTouched();
      this.isMissingRequiredField = true;
    }
  }

  handleConvertPropertyType(propertyType: string) {
    switch (propertyType) {
      case EConfirmContactType.TENANT_UNIT:
        return USER_TYPE_IN_RM.TENANT_UNIT;
      case EConfirmContactType.TENANT_PROPERTY:
        return USER_TYPE_IN_RM.TENANT_PROPERTY;
      case EConfirmContactType.LANDLORD_PROSPECT:
        return USER_TYPE_IN_RM.LANDLORD_PROSPECT;
      default:
        return propertyType;
    }
  }
  onItemChange(event: TaskItem) {
    this.taskTypeActicon.get('selectedTask').setValue(event?.id);
    this.taskService.selectedTaskToMove.next(event?.id);
    this.handleShowWarningAssignedTask(event);
  }

  handleShowWarningAssignedTask(task: TaskItem) {
    this.isShowWarnAssignToTask = this.propertyIds.some(
      (item) => item !== task.propertyId && task?.streetline
    );
    const textMessage =
      this.propertyIds.length > 1
        ? 'All selected messages'
        : 'The selected message';
    this.messageWarnAssignToTask = `${textMessage} will be assigned to ${task?.shortenStreetline}`;
  }

  onQuitModal(e?: Event) {
    e?.stopPropagation();
    this.isQuitModal.emit();
    this.taskService.selectedTaskToMove.next(null);
  }

  getNextPage() {
    if (this.isLoading) return;
    this.searchTask = {
      ...this.searchTask,
      pageIndex: this.searchTask.pageIndex + 1
    };

    if (this.statusScrolInfinite) {
      this.taskCompleTedSubject$.next(this.searchTask);
    }
  }

  handleClearValue() {
    this.isLoading = true;
    this.searchTask.term = '';
    this.onChangeSearchTask.emit(this.searchTask);
    this.taskCompleTedSubject$.next(this.searchTask);
  }

  handleChangeSearchTask(search) {
    this.searchTask = {
      ...this.searchTask,
      term: search.term,
      pageIndex: 0
    };
    this.completedTasksTemp = [];
    this.taskCompleTedSubject$.next(this.searchTask);
  }

  handleCreateNewTask() {
    if (this.isCreateNewTaskOutSide) {
      this.onCreateNewTaskOutSide.emit();
      return;
    }

    if (this.isSelectMultipleMsg) {
      this.onOpenCreateTaskOption.emit();
    } else {
      this.taskService.triggerToggleMoveConversationSate.next({
        singleMessage: false,
        multipleMessages: false
      });
      this.taskDetailService.setAddToTaskConfig({
        isOpenMoveToExistingTask: false
      });
      const isTaskDetail =
        this.router.url.includes(ERouterLinkInbox.TASK_DETAIL) &&
        !this.router.url.includes(ERouterLinkInbox.INTERNAL_NOTE);
      if (isTaskDetail) {
        this.taskDetailService.setAddToTaskConfig({
          isOpenMoveToExistingTask: false
        });
      }
      this.messageMenuService.handleCreateNewTask(
        this.currentTask,
        true,
        isTaskDetail,
        this.isFromTrudiApp,
        this.isFromVoiceMail
      );
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
