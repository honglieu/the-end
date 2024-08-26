import {
  selectAllTaskGroup,
  selectFetchingTaskGroup,
  selectIsFromCacheTaskGroup,
  selectTaskGroupError,
  taskGroupPageActions
} from '@core/store/task-group';
import { taskGroupActions } from '@core/store/task-group/actions/task-group.actions';
import { UserService } from '@/app/dashboard/services/user.service';
import { IPortfoliosGroups } from '@/app/profile-setting/portfolios/interfaces/portfolios.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { CdkDragDrop, CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ActivatedRoute,
  NavigationStart,
  Params,
  Router
} from '@angular/router';
import { Store } from '@ngrx/store';
import { cloneDeep, isArray, isEqual } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  map,
  of,
  takeUntil,
  tap,
  timeout,
  switchMap
} from 'rxjs';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import {
  EFolderType,
  IGetTaskByFolder,
  IGetTaskByFolderPayload,
  IGetTasksByGroupPayload,
  ITaskFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { DEBOUNCE_DASHBOARD_TIME } from '@/app/dashboard/utils/constants';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import {
  CALENDAR_WIDGET_EXPIRED_DAYS,
  CONVERSATION_STATUS,
  DEBOUNCE_SOCKET_TIME,
  ErrorMessages,
  POSITION_MAP
} from '@services/constants';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { GroupType } from '@shared/enum/user.enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import {
  getTaskViewSettingsStatus,
  isFilterTaskListChange
} from '@/app/dashboard/modules/task-page/utils/function';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { UtilsService } from '@/app/dashboard/services/utils.service';
import { EDataE2EInbox } from '@shared/enum/E2E.enum';
import { RxNotificationKind } from '@rx-angular/cdk/notifications';
import { checkScheduleMsgCount } from '@/app/trudi-send-msg/utils/helper-functions';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import dayjs from 'dayjs';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import {
  ListViewDraggableItem,
  TaskDragDropService
} from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import {
  ITaskGroupAction,
  TaskGroupComponent
} from '@/app/dashboard/modules/task-page/components/task-group/task-group.component';
import {
  EGroupAction,
  ESortTaskType,
  ESortTaskTypeParam
} from '@/app/dashboard/modules/task-page/utils/enum';
import {
  ISortTaskType,
  ITaskRow,
  ITaskViewSettings,
  ITaskViewSettingsStatus
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import {
  EUpdateMultipleTaskAction,
  IUpdateMultipleTask,
  IUpdateMultipleTaskPayload,
  InboxToolbarService,
  toolbarConfig
} from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TaskGroupService } from '@/app/dashboard/modules/task-page/services/task-group.service';
import { TaskFolderStoreService } from '@/app/dashboard/modules/inbox/services/task-folder-store.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { TaskItem } from '@shared/types/task.interface';
import { ECRMId, EEventType, EInboxQueryParams } from '@shared/enum';
import { EInboxAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { ETypeToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { InboxToolbarComponent } from '@/app/dashboard/modules/inbox/components/inbox-toolbar/inbox-toolbar.component';
import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TriggerMenuDirective } from '@shared/directives/trigger-menu.directive';
import { PreviewConversation } from '@shared/types/conversation.interface';
import { TrudiConfirmService } from '@trudi-ui';
import { HeaderService } from '@services/header.service';
import { ETaskMenuOption } from '@/app/dashboard/modules/task-page/enum/task.enum';
import { SyncTaskActivityService } from '@services/sync-task-activity.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ETypeMessage } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { SyncPropertyDocumentStatus } from '@shared/types/socket.interface';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ConversationService } from '@services/conversation.service';
import {
  DEFAULT_TASK_GROUP,
  DELETE_TASK_GROUP_ERROR_MSG,
  LIST_SORT_TASK_TYPE,
  LIST_TASK_VIEW_SETTINGS,
  LOCAL_STORAGE_KEY_FOR_VIEW_SETTINGS,
  MAP_SORT_TASK_TYPE_TO_LABEL
} from '@/app/dashboard/modules/task-page/utils/constants';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { TaskPreviewComponent } from '@/app/dashboard/modules/task-page/modules/task-preview/task-preview.component';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { FolderTaskListService } from '@/app/dashboard/modules/task-page/services/folder-task-list.service';

@Component({
  selector: 'folder-task-list',
  templateUrl: './folder-task-list.component.html',
  styleUrls: ['./folder-task-list.component.scss'],
  providers: [TaskApiService, TaskDragDropService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
@DestroyDecorator
export class FolderTaskListComponent implements OnInit, OnDestroy {
  private readonly _taskGroupRefs$ = new Subject<
    QueryList<TaskGroupComponent>
  >();
  @ViewChildren('taskGroupRef') set taskGroupRef(
    value: QueryList<TaskGroupComponent>
  ) {
    this._taskGroupRefs$.next(value);
  }
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  @ViewChild('taskGroupContainer') taskGroupContainer: ElementRef;
  @ViewChild('permanentlyDeleteConfirmModalContent')
  permanentlyDeleteConfirmModalContent: TemplateRef<HTMLElement>;
  @ViewChild('groupList') groupList: TemplateRef<HTMLElement>;
  @ViewChild('menu') triggerMenu: TriggerMenuDirective;
  @ViewChild('folderMenu')
  folderMenu: NzDropdownMenuComponent;
  @ViewChild('moveOptionMenu')
  moveToOptionMenu: NzDropdownMenuComponent;
  public readonly EInboxQueryParams = EInboxQueryParams;
  public listConversationSelected: PreviewConversation[];
  public menuPosition = [POSITION_MAP.topLeft];
  public visible = false;
  public isDisabledSyncActivity = false;
  public createNewConversationConfigs;
  private componentRefInboxToolbar: ComponentRef<InboxToolbarComponent>;
  private componentRefTaskPreview: ComponentRef<TaskPreviewComponent>;
  private overlayRefInboxToolbar: OverlayRef;
  private overlayRefTaskPreview: OverlayRef;
  private readonly defaultCreateNewConversationConfigs = {
    'header.title': 'Bulk send email',
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'body.receiver.isShowContactType': true,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'body.prefillReceivers': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
    'body.tinyEditor.attachBtn.disabled': false,
    'body.prefillReceiversList': [],
    'otherConfigs.isCreateMessageType': false,
    'header.icon': 'energy'
  };
  private toolbarConfigDefault: toolbarConfig = {
    inprogress: [
      {
        key: EInboxAction.MOVE_TASK,
        icon: 'iconMoveV3',
        label: 'Move',
        action: () => {}
      },
      {
        key: EInboxAction.SEND_MESSAGE,
        icon: 'mailThin',
        label: 'Send email',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-send-message',
        action: () => {
          this.handleSendMessage();
        }
      },
      {
        key: EInboxAction.RESOLVE,
        icon: 'iconCheckCircleV2',
        label: 'Mark as resolved',
        tooltip: 'Uncheck completed tasks to enable',
        dataE2e: 'tool-bar-mark-as-resolved',
        action: (event: MouseEvent) => {
          this.handleAction(TaskStatusType.completed, event);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.EXPORT_TASK_ACTIVITY,
        icon: 'conversationExport',
        label: 'Export task activity',

        action: () => {},
        children: [
          {
            key: EInboxAction.SAVE_TO_PROPERTY_TREE,
            icon: 'archive',
            disabled: this.isDisabledSyncActivity,

            label: 'Save to Property Tree ',
            action: () => {
              this.handleSyncTasksActivity();
            }
          },
          {
            key: EInboxAction.DOWNLOAD_AS_PDF,
            icon: 'iconDownload',
            label: 'Download as PDF',
            action: () => {
              this.handleSyncTasksActivity(true);
            }
          }
        ]
      },
      {
        icon: 'deleteIconOutline',
        label: 'Delete',
        key: EInboxAction.DELETE,
        dataE2e: 'tool-bar-delete',
        action: (event) => {
          this.handleConfirmDelete(event);
        }
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    completed: [
      {
        icon: 'iconRotateV2',
        label: 'Reopen',
        dataE2e: 'resolved-folder-float-popup-reopen-button',
        key: EInboxAction.RE_OPEN,
        action: () => {
          this.handleAction(TaskStatusType.inprogress);
          this.loadingAction = true;
        }
      },
      {
        key: EInboxAction.SAVE_TO_RENT_MANAGER,
        icon: 'archive',
        label: 'Save to Rent Manager',
        action: () => {
          this.handleSaveToCRM();
        }
      },
      {
        key: EInboxAction.MOVE_TASK,
        icon: 'iconMoveV3',
        label: 'Move',
        action: () => {}
      },
      {
        icon: 'deleteIconOutline',
        label: 'Delete',
        key: EInboxAction.DELETE,
        dataE2e: 'tool-bar-delete',
        action: (event?: MouseEvent) => {
          this.handleConfirmDelete(event);
        }
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    deleted: [
      {
        key: EInboxAction.MOVE_TASK,
        icon: 'iconMoveV3',
        label: 'Move',
        action: () => {}
      },
      {
        icon: 'iconRotateV2',
        label: 'Reopen',
        dataE2e: 'deleted-folder-float-popup-reopen-button',
        key: EInboxAction.RE_OPEN,
        action: () => {
          this.handleAction(TaskStatusType.inprogress);
          this.loadingAction = true;
        }
      },
      {
        key: ETypeToolbar.Close,
        icon: 'iconCloseV2',
        action: () => {
          this.handleClearSelected(true);
        }
      }
    ],
    spam: []
  };
  private toolbarConfig: toolbarConfig = cloneDeep(this.toolbarConfigDefault);
  private loadingAction = false;
  private isDisabledSaveToPT;
  private isDisabledSaveToRM;
  private inboxItems: TaskItem[] | ITaskRow[] = [];
  public activePath = EInboxQueryParams.TASKS;
  public subTitleMoveToTask = '';
  public isSameFolder = false;

  public readonly EDataE2EInbox = EDataE2EInbox;
  public readonly TaskType = TaskType;
  public taskStatusType = TaskStatusType;
  public pageIndex = 1;
  public agencyId: string = '';
  public currentQueryParams: Params;
  public popupModalPosition = ModalPopupPosition;
  public isLoading: boolean = true;
  private destroy$ = new Subject<void>();
  private currentMailboxId: string;
  private _taskGroups: IGetTaskByFolder[] = [];

  public taskFolderId = '';
  public hasFilter = false;
  public noResult = false;
  public showAnimationSidePanel: boolean = false;
  public createNewTaskConfigs: IConfigs = cloneDeep({
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: true
    }
  });
  public showCreateNewTask: boolean = false;
  public selectedTaskGroupId: string;
  public ETaskQueryParams = ETaskQueryParams;
  public currentSortTaskType: string;
  public ESortTaskType = ESortTaskType;
  public listSortTaskType: ISortTaskType[] = LIST_SORT_TASK_TYPE;
  public listTaskViewSettings: ITaskViewSettings[] = LIST_TASK_VIEW_SETTINGS;
  public taskViewSettings: ITaskViewSettingsStatus = null;
  public isFirstTimeUser: boolean = true;
  public isShowIntroduction: boolean = true;
  public isEditing: boolean = false;
  public isConsoleUser: boolean;
  public isShowMoveFolder: boolean = false;
  public isMovingToFolder: boolean = false;
  public moveToFolderFormGroup: FormGroup;
  public targetFolderId: string;
  public targetFolderName: string;
  public taskFolders = {};
  public taskFolderList = [];
  private movingTasks: ITaskRow[] = [];
  public completedGroupId = '';
  public fireworksTimeout: NodeJS.Timeout = null;
  public isLoadingMore: boolean = false;
  public isCompletedGroupLoading = true;
  public isAllCompletedTaskFetched = false;
  public completedGroup: IGetTaskByFolder;
  public queryParams: Params;
  public mailboxSetting;
  public currentUser: CurrentUser;
  public isSelectedMove: boolean;
  public disableDragging: boolean = false;
  public disableAddButton: boolean = false;
  public errorMessage: string = '';
  public isShowModalWarning: boolean = false;
  public timeZone = this.agencyDateFormatService.getCurrentTimezone();
  public isRMEnvironment: boolean = false;
  public innerWidth: number;
  public readonly MAP_SORT_TASK_TYPE_TO_LABEL = MAP_SORT_TASK_TYPE_TO_LABEL;
  public set taskGroups(value: IGetTaskByFolder[]) {
    this._taskGroups = value;
    this.store.dispatch(
      taskGroupActions.setAll({
        taskGroups: value
      })
    );
  }
  private isChangeSortTaskType: boolean = false;

  // getter for taskGroups
  get taskGroups() {
    return this._taskGroups;
  }

  private readonly _tasks$ = new BehaviorSubject<ITaskRow[]>([]);
  public readonly tasks$ = this._tasks$.asObservable();

  public readonly taskPreviewData$ = combineLatest([
    this.tasks$,
    this.store.select(selectFetchingTaskGroup)
  ]).pipe(map(([tasks, fetching]) => ({ tasks, fetching })));

  public readonly fetchingTaskGroup$ = this.store.select(
    selectFetchingTaskGroup
  );

  public readonly taskGroups$ = combineLatest({
    taskGroups: this.store.select(selectAllTaskGroup),
    isFromCache: this.store.select(selectIsFromCacheTaskGroup),
    fetching: this.fetchingTaskGroup$.pipe(distinctUntilChanged()),
    sortStrategy: this.activatedRoute.queryParams.pipe(
      map<Params, ESortTaskTypeParam>((param) => param?.['sortTaskType']),
      distinctUntilChanged(),
      tap((sortStrategy) => {
        const currentSortTaskType =
          sortStrategy === ESortTaskTypeParam.OLDEST_TO_NEWEST
            ? ESortTaskType.OLDEST_TO_NEWEST
            : ESortTaskType.NEWEST_TO_OLDEST;

        this.isChangeSortTaskType =
          this.currentSortTaskType &&
          this.currentSortTaskType !== currentSortTaskType;
        this.currentSortTaskType = currentSortTaskType;
      })
    ),
    error: this.store.select(selectTaskGroupError).pipe(distinctUntilChanged())
  }).pipe(
    tap(({ fetching, error }) => {
      // Handle loading state for task group list when fetching or change sort task type (in case change sort task type, loading is fake loading)
      if (fetching || this.isChangeSortTaskType) {
        this.contextTrigger$.next(RxNotificationKind.Suspense);
      } else if (error) {
        this.contextTrigger$.next(RxNotificationKind.Error);
      }
    }),
    debounceTime(this.isChangeSortTaskType ? DEBOUNCE_DASHBOARD_TIME : 0),
    filter(({ fetching, error }) => !fetching && !error),
    map(({ isFromCache, taskGroups, sortStrategy }) => {
      this.isCompletedGroupLoading = false;
      this.isLoadingMore = false;
      const composedTaskGroups = this.composeTaskGroups(
        taskGroups,
        sortStrategy
      );
      if (!isFromCache && taskGroups?.length) {
        if (this.taskGroupService.keepExpandState$.value) {
          this.taskGroupService.keepExpandState$.next(false);
        } else {
          this.handleExpandGroups(composedTaskGroups);
        }
      }

      this.contextTrigger$.next(RxNotificationKind.Complete);
      return composedTaskGroups;
    }),
    tap((taskGroups = []) => {
      this.isChangeSortTaskType = false;
      this._taskGroups = taskGroups ?? [];
      this._tasks$.next(taskGroups?.flatMap((group) => group?.['data']) ?? []);
      this.taskFolderStoreService.setTaskFolderStore(taskGroups);
      this.inboxService.setIsAllFiltersDisabled(false);
      this.updateResultState(taskGroups);
      this.handleScrollToTaskGroup();
    })
  );

  public readonly contextTrigger$ = new Subject<RxNotificationKind>();

  public readonly error$ = this.store
    .select(selectTaskGroupError)
    .pipe(filter(Boolean));

  public tasksForPreview: ITaskRow[] = [];
  private isShowTaskPreview: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public currentTaskId: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private taskApiService: TaskApiService,
    private dashboardApiService: DashboardApiService,
    private websocketService: RxWebsocketService,
    private inboxToolbarService: InboxToolbarService,
    private inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private mailboxSettingService: MailboxSettingService,
    private taskDragDropService: TaskDragDropService,
    private taskGroupService: TaskGroupService,
    private toastService: ToastrService,
    private sharedService: SharedService,
    private portfolioService: PortfolioService,
    private router: Router,
    private taskFolderStoreService: TaskFolderStoreService,
    private fb: FormBuilder,
    private taskService: TaskService,
    private toastCustomService: ToastCustomService,
    private inboxFilterService: InboxFilterService,
    private userService: UserService,
    private readonly store: Store,
    private changeDetectorRef: ChangeDetectorRef,
    private agencyDateFormatService: AgencyDateFormatService,
    private utilsService: UtilsService,
    public sharedMessageViewService: SharedMessageViewService,
    public conversationService: ConversationService,
    private nzContextMenuService: NzContextMenuService,
    private overlay: Overlay,
    private toatrService: ToastrService,
    private trudiConfirmService: TrudiConfirmService,
    private headerService: HeaderService,
    private syncTaskActivityService: SyncTaskActivityService,
    private messageFlowService: MessageFlowService,
    private companyService: CompanyService,
    private agencyDashboardService: AgencyService,
    private taskEditorApiService: TaskEditorApiService,
    private folderTaskListService: FolderTaskListService
  ) {}

  ngOnInit(): void {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.subscribeTaskPreviewData();
    this.subscribeTaskToolBar();
    this.getListMessageSelectedFromToolbar();
    this.initCurrentUser();
    this.initMoveToFolderForm();
    this.invokeGetTaskGroups();
    this.handleInboxSideBarChanges();
    this.handleDisableDragging();
    this.handleDisableAddButton();
    this.onEditTaskGroup();
    this.subscribeSocketTaskGroup();
    this.subscribeMoveTaskToGroupEvent();
    this.subscribeSocketConversationChange();
    this.subscribeToSocketNotifySendManyEmailMessageDone();
    this.subscribeArchivedMailAndCurrentCompany();
    this.subscribeShowModalWarningSchedule();
    this.handleUpsertLocalStorageViewSettings();
    this.handleUpdateViewSettingsStatus();
    this.handleOnboardingShowViewSettings();
    this.handleUpdateInnerWidth();
    this.getCalenderWidgetExpiredDays();
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((rs) => {
      if (rs instanceof NavigationStart) {
        this.isShowTaskPreview.next(false);
      }
    });
  }

  getCalenderWidgetExpiredDays() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.destroy$),
        map((company) => company?.CRM),
        filter(Boolean),
        distinctUntilChanged(),
        switchMap((crm) => {
          return combineLatest([
            this.taskEditorApiService.getCalendarEvent(crm),
            of(crm)
          ]);
        })
      )
      .subscribe(([events, crm]) => {
        let calenderWidgetExpiredDays: Record<EEventType, number>;
        switch (crm) {
          case ECRMId.PROPERTY_TREE:
            calenderWidgetExpiredDays = CALENDAR_WIDGET_EXPIRED_DAYS as Record<
              EEventType,
              number
            >;
            break;
          case ECRMId.RENT_MANAGER:
            const inspectionEvents = events?.reduce((obj, event) => {
              if (event?.label?.includes('inspection')) {
                return {
                  ...obj,
                  [event.value]: 3
                };
              }
              return obj;
            }, Object.create(null));
            calenderWidgetExpiredDays = {
              ...CALENDAR_WIDGET_EXPIRED_DAYS,
              ...inspectionEvents
            };
            break;
        }
        this.folderTaskListService.setCalenderWidgetExpiredDays(
          calenderWidgetExpiredDays
        );
      });
  }

  subscribeTaskPreviewData() {
    combineLatest([this.taskPreviewData$, this.activatedRoute.queryParams])
      .pipe(
        filter(
          ([{ tasks }, queryParam]) =>
            tasks?.length && queryParam[ETaskQueryParams.TASK_ID]
        ),
        switchMap(([{ tasks }, queryParam]) => {
          this.tasksForPreview = tasks;

          // handle open task preview on reload
          if (!this.componentRefTaskPreview) {
            this.currentTaskId = queryParam[ETaskQueryParams.TASK_ID];
            this.handleOpenTaskPreview();
          } else {
            this.componentRefTaskPreview.instance.listTaskRow = tasks;
          }
          return of(null);
        })
      )
      .subscribe();
  }

  public handleOpenTaskPreview(taskRow?: ITaskRow): void {
    if (taskRow?.id) {
      this.currentTaskId = taskRow?.id;
    }
    let isShow = true;
    if (taskRow?.id === this.currentTaskId) {
      if (!this.isShowTaskPreview.value) {
        this.attachComponentToBody();
      } else {
        isShow = false;
      }
    } else {
      setTimeout(() => {
        this.attachComponentToBody();
      });
    }
    this.isShowTaskPreview?.next(isShow);
  }

  private attachComponentToBody(): void {
    this.destroyComponent();
    if (!this.overlay) {
      console.error('Overlay is not initialized', this);
      return;
    }
    this.overlayRefTaskPreview = this.overlay.create();
    const componentPortal = new ComponentPortal(TaskPreviewComponent);
    this.componentRefTaskPreview =
      this.overlayRefTaskPreview.attach(componentPortal);
    this.componentRefTaskPreview.instance.isShowPreviewBS =
      this.isShowTaskPreview;
    this.componentRefTaskPreview.instance.listTaskRow = this.tasksForPreview;
    this.componentRefTaskPreview.instance.destroyRef = () => {
      if (this.overlayRefTaskPreview) {
        this.overlayRefTaskPreview.detach();
        this.componentRefTaskPreview = undefined;
      }
      this.isShowTaskPreview?.next(!this.isShowTaskPreview);
    };
  }

  public destroyComponent(): void {
    if (this.overlayRefTaskPreview) {
      this.overlayRefTaskPreview.detach();
      this.overlayRefTaskPreview.dispose();
      this.overlayRefTaskPreview = null;
    }
  }

  handleOnboardingShowViewSettings = () => {
    this.userService
      .getUserDetail()
      .pipe(
        filter((user) => !!user),
        switchMap((user) => {
          if (!user?.userOnboarding?.showViewSettings) {
            this.handleHideIntroductionPopup();
          }
          return user?.userOnboarding?.showViewSettings
            ? this.dashboardApiService.updateOnboardingDefaultData({
                showViewSettings: false
              })
            : of(null);
        })
      )
      .subscribe();
  };

  private handleDisableAddButton() {
    this.taskGroupService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLoading) => {
        if (this.disableAddButton !== isLoading) {
          this.disableAddButton = isLoading;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  handleScroll() {
    this.resetRightClickSelectedState();
  }

  private resetRightClickSelectedState() {
    const { isRightClickDropdownVisibleValue } = this.sharedMessageViewService;
    if (isRightClickDropdownVisibleValue) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }

  subscribeShowModalWarningSchedule() {
    this.conversationService.isShowModalWarrningSchedule
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: boolean) => {
        if (!data) return;
        this.errorMessage = ErrorMessages.RESOLVE_CONVERSATION;
        this.isShowModalWarning = data;
      });
  }

  subscribeArchivedMailAndCurrentCompany() {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchivedMailbox) => {
        this.handleDisableSaveToRm({
          isArchivedMailbox: isArchivedMailbox
        });
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        if (!company) return;
        this.isRMEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
        this.handleDisableSaveToRm({
          isRmEnvironment: this.isRMEnvironment
        });
      });
  }

  handleDisableSaveToRm(disabledStatus) {
    this.isDisabledSaveToRM = { ...this.isDisabledSaveToRM, ...disabledStatus };
  }

  private handleDisableDragging() {
    if (this.isConsoleUser) {
      this.disableDragging = true;
      return;
    }
    const isEditing$ = this.taskGroupService.isEditing$;
    const hasItem$ = this.inboxToolbarService.inboxItem$.pipe(
      map((item) => item?.length > 0)
    );
    const isLoading$ = this.taskGroupService.isLoading$;

    combineLatest([isEditing$, hasItem$, isLoading$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isEditing, hasItem, isLoading]) => {
        const newValue = isEditing || hasItem || isLoading;
        if (newValue !== this.disableDragging) {
          this.disableDragging = newValue;
        }
      });
  }

  private onEditTaskGroup() {
    this.taskGroupService.isEditing$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isEditing) => {
        this.isEditing = isEditing;
      });
  }

  private initCurrentUser() {
    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });
  }

  private initMoveToFolderForm() {
    this.moveToFolderFormGroup = this.fb.group({
      targetGroup: this.fb.control(null, [Validators.required])
    });
  }

  private handleInboxSideBarChanges() {
    this.inboxToolbarService.updateMultipleTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs) {
          this.updateListView(rs);
        }
      });

    this.inboxToolbarService.inboxItem$
      .pipe(map((item) => item?.length > 0))
      .subscribe((hasItem) => {
        this.isSelectedMove = hasItem;
      });
  }

  private invokeGetTaskGroups() {
    combineLatest([
      this.activatedRoute.queryParams.pipe(
        filter((queryParam) => {
          //isFolderChange without sort query params
          const isFolderChange = isFilterTaskListChange(
            this.currentQueryParams,
            queryParam
          );
          this.queryParams = queryParam;
          return isFolderChange;
        }),
        tap((queryParams) => {
          const isFilterChange = isFilterTaskListChange(
            { ...(this.currentQueryParams || {}), taskTypeID: null },
            { ...queryParams, taskTypeID: null }
          );
          const previousQueryParams = this.currentQueryParams;
          this.currentQueryParams = queryParams;

          // keep expand state when no filter
          this.hasFilter = this.checkFilter(queryParams);
          if (previousQueryParams && isFilterChange && this.hasFilter) {
            // Only reset expand group of current folder
            this.taskGroupService.resetExpandGroup();
          }
        })
      ),
      // Prevent call api when change mailbox
      // Note: Navigate to inbox tab when change mailbox
      this.inboxService.getCurrentMailBoxId(),
      this.portfolioService.getPortfolios$(),
      this.inboxSidebarService.taskFolders$.pipe(
        tap((folders) => {
          this.setTaskFolders(folders);
        }),
        filter((res) => !!res?.length)
      )
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([queryParam, mailBoxId, portfolios, taskFolders]) => {
          const completedGroup = taskFolders
            .find((folder) => folder.id === queryParam['taskTypeID'])
            ?.taskGroups.find((group) => group.isCompletedGroup);
          this.completedGroup = {
            ...this.completedGroup,
            taskGroup: completedGroup
          };
          return [queryParam, mailBoxId, portfolios, completedGroup?.id];
        }),
        distinctUntilChanged((pre, curr) => isEqual(pre, curr)),
        tap(
          ([queryParams, mailBoxId]: [
            Params,
            string,
            IPortfoliosGroups[],
            string
          ]) => {
            this.currentMailboxId = mailBoxId;
            const { taskTypeID } = queryParams ?? {};
            const isTaskFolderIdChanged = this.taskFolderId !== taskTypeID;
            if (isTaskFolderIdChanged) {
              this.taskGroupService.setEditMode(false);
            }
            this.taskFolderId = taskTypeID;
            this.isCompletedGroupLoading = true;
            this.inboxService.setIsAllFiltersDisabled(true);
          }
        )
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([queryParams, mailBoxId, portfolios, completedGroupId]) => {
          const {
            search,
            inboxType,
            taskTypeID,
            assignedTo,
            propertyManagerId,
            eventType,
            startDate,
            endDate,
            taskEditorId
          } = queryParams || {};
          this.completedGroupId = completedGroupId;
          this.taskFolderId = taskTypeID;
          const listPortfolio = portfolios
            .map((group) => group.portfolios)
            .flat();
          const followedPortfolios = listPortfolio?.filter(
            (r) => r?.isFollowed || !(inboxType === TaskStatusType.my_task)
          );

          const selectedPortfolioIds = propertyManagerId
            ? followedPortfolios
                ?.filter((item) =>
                  propertyManagerId.includes(item.agencyAgentId)
                )
                ?.map((item) => item.agencyAgentId)
            : [];
          const payloadProcess: IGetTaskByFolderPayload = {
            search,
            taskFolderId: taskTypeID,
            isFocusedView: this.isConsoleUser
              ? false
              : inboxType === TaskStatusType.my_task,
            assigneeIds: assignedTo,
            propertyManagerIds: selectedPortfolioIds,
            events: {
              eventTypes: eventType || [],
              startDate: startDate
                ? dayjs
                    .utc(startDate)
                    .add(-(this.timeZone?.offset || 0), 'h')
                    .toISOString()
                : null,
              endDate: endDate
                ? dayjs
                    .utc(endDate)
                    .add(1, 'd')
                    .subtract(1, 's')
                    .add(-(this.timeZone?.offset || 0), 'h')
                    .toISOString()
                : null
            },
            taskTypeIds: taskEditorId || []
          };

          const payloadCompleted: IGetTasksByGroupPayload = {
            ...payloadProcess,
            status: TaskStatusType.completed,
            taskGroupId: completedGroupId,
            page: 1,
            pageSize: 20,
            isDESC:
              this.queryParams?.[ETaskQueryParams.SORT_TASK_TYPE] ===
              ESortTaskTypeParam.NEWEST_TO_OLDEST
          };
          if (!!completedGroupId) {
            this.store.dispatch(
              taskGroupPageActions.payloadChange({
                payloadProcess,
                payloadCompleted
              })
            );
          }
        },
        error: (e) => {
          console.error(e);
        }
      });
  }

  private setTaskFolders(folders: ITaskFolder[]) {
    this.taskFolderList = folders;
    this.taskFolders =
      folders?.reduce((acc, folder) => {
        acc[folder.id] = {
          name: folder.name,
          groups: folder.taskGroups
        };
        return acc;
      }, {}) || {};
  }

  /**
   * order completed group to the last of list
   * order list task in folder by sort strategy
   * @param taskGroups
   * @returns
   */
  private composeTaskGroups(
    taskGroups: IGetTaskByFolder[],
    sortStrategy: ESortTaskTypeParam
  ) {
    if (!taskGroups?.length) {
      return [];
    }

    const [inprogressGroups, completedGroups] = taskGroups.reduce(
      (result, group) => {
        const [inprogress, completed] = result;
        if (group.taskGroup.isCompletedGroup) {
          const sortField = 'updatedAtOfTask';
          const newGroup = cloneDeep({
            ...group,
            data: this.handleSortTaskInFolder(
              group.data,
              sortStrategy,
              sortField
            )
          });
          completed.push(newGroup);
        } else {
          const sortField = 'createdAt';
          const newGroup = cloneDeep({
            ...group,
            data: this.handleSortTaskInFolder(
              group.data,
              sortStrategy,
              sortField
            )
          });
          inprogress.push(newGroup);
        }
        return result;
      },
      [new Array<IGetTaskByFolder>(), new Array<IGetTaskByFolder>()] as const
    );

    const compareByOrder = (
      group1: IGetTaskByFolder,
      group2: IGetTaskByFolder
    ) => {
      const fallback = null;
      return (
        Number(group1?.taskGroup?.order ?? fallback) -
        Number(group2?.taskGroup?.order ?? fallback)
      );
    };

    return [...inprogressGroups.sort(compareByOrder), ...completedGroups];
  }

  handleLoadingMore(pageIndex = 1) {
    this.isLoadingMore = true;
    this.pageIndex = pageIndex;
  }

  updateListView(updateTaskData: IUpdateMultipleTask): IGetTaskByFolder[] {
    const taskIds = updateTaskData.payload.tasks.map((item) => item.id);
    const { action, payload } = updateTaskData;
    //TODO: refactor
    switch (action) {
      case EUpdateMultipleTaskAction.DELETE:
        const currentQueryParam = this.activatedRoute.snapshot.queryParams;
        if (taskIds?.includes(currentQueryParam['taskId'])) {
          this.router.navigate([], {
            queryParams: {
              taskId: null
            },
            queryParamsHandling: 'merge'
          });
        }
        const newTaskGroupsAfterDeleteOrMoveOtherFolder = this.taskGroups?.map(
          (taskGroup) => {
            return this.processTaskGroup(taskGroup, payload, taskIds);
          }
        );
        this.taskGroups = newTaskGroupsAfterDeleteOrMoveOtherFolder;
        return newTaskGroupsAfterDeleteOrMoveOtherFolder;
      case EUpdateMultipleTaskAction.CHANGE_POSITION:
        const tasks = this._tasks$.getValue();
        const targetTaskGroup =
          this.taskGroups.find(
            (taskGroup) => taskGroup.taskGroup.id === payload.targetId
          )?.taskGroup || ({} as ITaskGroup);
        const updateTasks = [...payload.tasks].map((it) => {
          const existTaskInList = tasks.find((item) => item.id === it.id);
          let {
            unreadConversations,
            currentNoteViewed,
            internalNoteUnreadCount
          } = existTaskInList || {};

          if (payload.isCompletedGroup) {
            it.conversations = it.conversations.map((conversation) => {
              return conversation.status === CONVERSATION_STATUS.RESOLVED
                ? conversation
                : {
                    ...conversation,
                    isSeen: true,
                    status: CONVERSATION_STATUS.RESOLVED
                  };
            });
            unreadConversations = it.conversations
              .filter((conversation) => !conversation.isSeen)
              .map((conversation) => conversation.id);
          }
          return {
            ...it,
            taskGroupId: targetTaskGroup.id,
            taskGroup: {
              id: targetTaskGroup.id,
              topicId: targetTaskGroup.taskFolderId
            },
            isAutoReopen: payload.isCompletedGroup
              ? false
              : payload?.isAutoReopen || it.isAutoReopen,
            ...(existTaskInList
              ? {
                  unreadConversations,
                  currentNoteViewed,
                  internalNoteUnreadCount
                }
              : {})
          };
        });
        const newTaskGroupsAfterMoveToSameFolder = this.taskGroups?.map(
          (taskGroup) => {
            return this.processTaskGroup(
              taskGroup,
              payload,
              taskIds,
              updateTasks
            );
          }
        );
        this.taskGroups = newTaskGroupsAfterMoveToSameFolder;
        return newTaskGroupsAfterMoveToSameFolder;
      default:
        return this.taskGroups;
    }
  }

  processTaskGroup(
    taskGroup: IGetTaskByFolder,
    payload: IUpdateMultipleTaskPayload,
    taskIds: string[],
    updateTasks: ITaskRow[] = []
  ) {
    const cloneTaskGroup = { ...taskGroup };
    const currentLength = cloneTaskGroup.data.length;
    let newTaskList = cloneTaskGroup.data.filter(
      (task) => !taskIds.includes(task.id)
    );

    if (
      cloneTaskGroup.taskGroup.id === payload.targetId &&
      updateTasks.length > 0
    ) {
      newTaskList = [...updateTasks, ...newTaskList].map((task) => {
        const isMoveToCompletedGroup =
          this.completedGroupId === payload.targetId;

        return {
          ...task,
          status: isMoveToCompletedGroup
            ? TaskStatusType.completed
            : TaskStatusType.inprogress,
          updatedAt: updateTasks.map((task) => task.id).includes(task.id)
            ? isMoveToCompletedGroup
              ? new Date().toISOString()
              : task.updatedAt
            : task.updatedAt,
          updatedAtOfTask: updateTasks.map((task) => task.id).includes(task.id)
            ? isMoveToCompletedGroup
              ? new Date().toISOString()
              : task.updatedAtOfTask
            : task.updatedAtOfTask
        };
      });
    }

    const newLength = newTaskList.length;
    const margin = newLength - currentLength;

    cloneTaskGroup.meta = {
      ...cloneTaskGroup.meta,
      itemCount: cloneTaskGroup.meta.itemCount + margin
    };

    return {
      ...cloneTaskGroup,
      data: newTaskList
    };
  }

  handleExpandGroups(groups: IGetTaskByFolder[]) {
    if (this.taskGroupService.isEditing) {
      return;
    }
    // Keep manual expand/collapse
    const taskFolderId = groups?.[0]?.taskGroup?.taskFolderId;
    const openedFolders = this.taskGroupService.openedFolders$.value;
    if (openedFolders.includes(taskFolderId)) return;
    this.taskGroupService.openedFolders$.next([
      ...new Set([...openedFolders, taskFolderId])
    ]);
    if (this.hasFilter) {
      this.handleExpandAfterFilter(groups);
    } else {
      this.handleExpandFirstGroup(groups);
      this.handleExpandCompleteGroup(groups);
    }
  }

  private handleExpandFirstGroup(groups: IGetTaskByFolder[]) {
    const defaultGroupId = groups?.[0]?.taskGroup?.id;

    if (!defaultGroupId) return;

    const hasExpanded = this.taskGroupService.isExpandGroup(defaultGroupId);

    if (!hasExpanded) {
      this.taskGroupService.handleAddValueExpandGroup(defaultGroupId);
    }
  }

  private handleExpandCompleteGroup(groups: IGetTaskByFolder[]) {
    const completeGroup = groups?.[groups?.length - 1];
    const completeGroupId = completeGroup?.taskGroup?.id;
    if (!completeGroupId) return;
    if (!!completeGroup?.data?.length) return;
    const hasExpanded = this.taskGroupService.isExpandGroup(completeGroupId);
    if (!hasExpanded) {
      this.taskGroupService.handleAddValueExpandGroup(completeGroupId);
    }
  }

  private handleExpandAfterFilter(groups: IGetTaskByFolder[]) {
    const updateExpandGroup = groups.reduce((ids, group) => {
      ids[group.taskGroup.id] = group.meta.itemCount > 0;
      return ids;
    }, {});
    this.taskGroupService.updateExpandGroup(updateExpandGroup);
  }

  subscribeSocketTaskGroup() {
    this.websocketService.onSocketTaskGroup
      .pipe(
        takeUntil(this.destroy$),
        filter((data) =>
          Boolean(data && data.type && data.mailBoxId === this.currentMailboxId)
        ),
        debounceTime(DEBOUNCE_DASHBOARD_TIME)
      )
      .subscribe((data) => {
        switch (data.type) {
          case SocketType.createdTaskGroup:
            this.handleCreatedGroupRealtime(data);
            break;
          case SocketType.updatedTaskGroup:
            this.handleUpdatedGroupRealtime(data);
            break;
          case SocketType.deletedTaskGroup:
            this.handleDeletedGroupRealtime(data);
            break;
        }
      });
    this.updateTaskGroupStore();
  }

  subscribeSocketConversationChange() {
    this.websocketService.onSocketSend
      .pipe(
        distinctUntilChanged(),
        filter((res) => {
          const taskUpdated = this.taskGroups.find((group) =>
            group.data.some((item) => item.id === res?.taskId)
          );
          return !!res && !!taskUpdated;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        const newTaskGroups = this.taskGroups.map((group) => ({
          ...group,
          data: [
            ...this.sortTaskByTime(
              group.data.map((item) => {
                if (item.id === res.taskId) {
                  return { ...item, updatedAt: res.messageDate };
                }
                return item;
              })
            )
          ]
        }));

        this.taskGroups = newTaskGroups;
      });
  }

  handleCreatedGroupRealtime(data) {
    if (
      this.currentQueryParams[ETaskQueryParams.TASKTYPEID] ===
        data.taskFolderId &&
      !this.taskGroups.some((item) => item.taskGroup.id === data.data.id)
    ) {
      const newTaskGroups = [
        ...this.taskGroups,
        {
          data: [],
          meta: {
            hasNextPage: false,
            hasPreviousPage: false,
            itemCount: 0,
            page: 0,
            pageCount: 0,
            pageSize: 0
          },
          taskGroup: data.data
        }
      ];

      this.taskGroups = newTaskGroups;
    }
    const newTaskGroups: ITaskGroup[] = [
      ...this.taskFolders?.[data.taskFolderId]?.groups,
      data.data
    ];
    this.inboxSidebarService.updateTaskGroupInFolder(
      newTaskGroups,
      data.taskFolderId
    );
    this.changeDetectorRef.markForCheck();
  }

  handleUpdatedGroupRealtime(data) {
    const groupSocketData = data.data.map((newGroup) => {
      const oldGroup = this.taskFolders[data.taskFolderId].groups.find(
        (item) => item.id === newGroup.id
      );
      return {
        ...oldGroup,
        ...newGroup
      };
    });

    let folderGroups = this.taskFolders[data.taskFolderId].groups;

    // updated group detail
    if (data.data.length === 1) {
      folderGroups = folderGroups.map((group) => {
        if (group.id === groupSocketData[0]?.id) {
          return { ...group, ...groupSocketData[0] };
        }
        return group;
      });

      const updatedTaskGroup = data.data[0];
      const newTaskGroups = this.taskGroups.map((item) => {
        if (item.taskGroup.id === updatedTaskGroup.id) {
          return {
            ...item,
            taskGroup: updatedTaskGroup
          };
        }
        if (updatedTaskGroup.isDefault) {
          item.taskGroup.isDefault = false;
          return {
            ...item
          };
        }

        return item;
      });
      if (
        this.currentQueryParams[ETaskQueryParams.TASKTYPEID] ===
        data.taskFolderId
      ) {
        this.taskGroups = newTaskGroups;
      }
    } else {
      // Updated group order
      const newOrderedGroups = groupSocketData;
      // Create a map to store order values for each groupId
      const orderMap = groupSocketData.reduce((map, group) => {
        map[group.id] = group.order;
        return map;
      }, {});

      folderGroups = groupSocketData.map((group) => {
        return { ...group, order: orderMap[group.id] };
      });

      // Check if the newOrderedGroups have the same length and every item is present in this.taskGroups
      const isSameLengthAndContainsAll =
        newOrderedGroups.length === this.taskGroups.length &&
        newOrderedGroups.every((item) =>
          this.taskGroups.some((group) => group.taskGroup.id === item.id)
        );

      if (
        isSameLengthAndContainsAll &&
        this.currentQueryParams[ETaskQueryParams.TASKTYPEID] ===
          data.taskFolderId
      ) {
        const newTaskGroups = this.sortGroupByOrder(
          this.taskGroups.map((item) => ({
            ...item,
            taskGroup: {
              ...item.taskGroup,
              order: orderMap[item.taskGroup.id]
            }
          }))
        );
        this.taskGroups = newTaskGroups;
      }
    }
    this.inboxSidebarService.updateTaskGroupInFolder(
      folderGroups,
      data.taskFolderId
    );
    this.changeDetectorRef.markForCheck();
  }

  handleDeletedGroupRealtime(data) {
    if (
      this.currentQueryParams[ETaskQueryParams.TASKTYPEID] === data.taskFolderId
    ) {
      const newTaskGroups = this.taskGroups.filter((item) => {
        return item.taskGroup.id !== data.data.id;
      });
      this.taskGroups = newTaskGroups;
    }

    let folderGroups = this.taskFolders[data.taskFolderId].groups.filter(
      (item) => {
        return item.id !== data.data.id;
      }
    );

    this.inboxSidebarService.updateTaskGroupInFolder(
      folderGroups,
      data.taskFolderId
    );
  }

  subscribeMoveTaskToGroupEvent() {
    this.websocketService.onSocketMoTaskToGroup
      .pipe(debounceTime(DEBOUNCE_SOCKET_TIME), takeUntil(this.destroy$))
      .subscribe((rs) => {
        const { taskGroup, tasks } = (rs.data as any)?.data || rs.data || {};
        const tasksData = this.isFocusView
          ? tasks.filter((task) => {
              return task.assignToAgents.some(
                (assign) => assign.id === this.currentUser.id
              );
            })
          : tasks;
        if (!tasksData?.length) return;
        this.updateListView({
          action: EUpdateMultipleTaskAction.CHANGE_POSITION,
          payload: {
            tasks: tasksData,
            targetId: taskGroup.id,
            isAutoReopen: rs?.isAutoReopen || (rs.data as any)?.isAutoReopen,
            isCompletedGroup: taskGroup.isCompletedGroup
          }
        });
      });
  }

  handleTaskGroupDropped(event: CdkDragDrop<IGetTaskByFolder>) {
    document.body.style.cursor = 'default';
    this.taskDragDropService
      .handleDropGroup(event, this.taskGroups)
      .subscribe((rs) => {
        if (rs) {
          const newTaskGroups = this.sortGroupByOrder(rs);
          this.taskGroups = newTaskGroups;
          this.updateTaskFolder();
        }
        this.showAnimationSidePanel = false;
        this.changeDetectorRef.markForCheck();
      });
  }

  trackTaskGroup(_, item: IGetTaskByFolder) {
    return item.taskGroup?.id;
  }

  handleTaskDropped(event: CdkDragDrop<ITaskRow>) {
    this.showAnimationSidePanel = false;
    if (this.isSelectedMove) {
      let elmDrop = this.taskDragDropService.getRootElement(
        event.dropPoint,
        'drop_task--folder'
      );
      if (!elmDrop) return;

      const folderType = elmDrop?.getAttribute('folder-type');
      if (folderType === EFolderType.TASKS) {
        this.movingTasks = event.item.data;
        this.targetFolderId = elmDrop?.getAttribute('folder-uid');
        this.targetFolderName = this.taskFolders[this.targetFolderId].name;

        if (
          this.movingTasks.some(
            (task) => task.status === TaskStatusType.inprogress
          )
        ) {
          this.isShowMoveFolder = true;
        } else {
          this.handleMoveToFolder(true);
        }
      }
    } else {
      this.taskDragDropService.handleDropTask(event).subscribe((rs) => {
        if (rs) {
          const { newGroupId, errorMessages } = rs;
          if (errorMessages) {
            this.errorMessage = errorMessages;
            this.isShowModalWarning = true;
            return;
          }
          if (newGroupId) {
            const updatedTaskGroups = this.updateListView({
              action: EUpdateMultipleTaskAction.CHANGE_POSITION,
              payload: {
                tasks: [event.item.data],
                targetId: newGroupId,
                isCompletedGroup: newGroupId === this.completedGroupId
              }
            });

            if (newGroupId === this.completedGroupId) {
              const dataForToast = {
                taskId: event.item.data.id,
                isShowToast: true,
                type: SocketType.changeStatusTask,
                mailBoxId: this.currentMailboxId,
                taskType: TaskType.TASK,
                status: TaskStatusType.completed,
                pushToAssignedUserIds: []
              };
              this.toastCustomService.openToastCustom(
                dataForToast,
                true,
                EToastCustomType.SUCCESS_WITH_VIEW_BTN
              );
              this.fireworksTimeout =
                this.utilsService.openFireworksByQuerySelector(
                  '#completedGroupDataRef .task-group-title',
                  3000,
                  () => {},
                  {
                    src: 'assets/images/firework.gif',
                    width: '150px',
                    height: '325px'
                  }
                );
            }
            this.inboxToolbarService.setInboxItem([]);
            this.updateTaskGroupStore(updatedTaskGroups);
            this.taskGroupService.handleAddValueExpandGroup(newGroupId);
          }
        }
        this.showAnimationSidePanel = false;
      });
    }
  }

  handleMoveToFolder(isCompletedTasks: boolean = false) {
    if (!isCompletedTasks && this.moveToFolderFormGroup.invalid) {
      this.moveToFolderFormGroup.markAllAsTouched();
      return;
    }
    this.isMovingToFolder = true;

    const targetGroup = isCompletedTasks
      ? this.taskFolders[this.targetFolderId].groups.find(
          (group) => group.isCompletedGroup
        )
      : this.taskFolders[this.targetFolderId].groups.find(
          (group) =>
            group.id === this.moveToFolderFormGroup.get('targetGroup').value
        );
    const taskIds = this.movingTasks.map((task) => task.id);
    const taskGroupId = targetGroup.id;
    const status = targetGroup.isCompletedGroup
      ? TaskStatusType.completed
      : TaskStatusType.inprogress;

    const listConversation = this.movingTasks.flatMap((e) => e.conversations);
    if (
      this.shouldHandleSchedule(
        { conversations: listConversation } as ITaskRow,
        status
      )
    ) {
      this.afterMoveToFolder();
      return;
    }

    this.taskService
      .updateTask({
        taskIds,
        mailBoxId: this.currentMailboxId,
        taskGroupId,
        status
      })
      .subscribe({
        next: (res) => {
          if (!res) return;
          const isSameFolder = this.taskFolderId === this.targetFolderId;
          this.inboxToolbarService.updateTasks({
            action: isSameFolder
              ? EUpdateMultipleTaskAction.CHANGE_POSITION
              : EUpdateMultipleTaskAction.DELETE,
            payload: {
              tasks: this.movingTasks,
              targetId: taskGroupId
            }
          });

          if (isSameFolder) {
            if (status === TaskStatusType.completed) {
              if (taskIds.length === 1) {
                const dataForToast = {
                  taskId: taskIds[0],
                  isShowToast: true,
                  type: SocketType.changeStatusTask,
                  mailBoxId: this.currentMailboxId,
                  taskType: TaskType.TASK,
                  status: TaskStatusType.completed,
                  pushToAssignedUserIds: []
                };
                this.toastCustomService.openToastCustom(
                  dataForToast,
                  true,
                  EToastCustomType.SUCCESS_WITH_VIEW_BTN
                );
              } else {
                this.toastService.success(`Task ${status.toLocaleLowerCase()}`);
              }
            }
            return;
          }
          if (taskIds.length > 1) {
            this.toastService.success(
              `${taskIds.length} tasks moved to ${this.targetFolderName} folder`
            );
          } else {
            const dataForToast = {
              taskId: taskIds[0],
              isShowToast: true,
              type: SocketType.moveTaskToNewTaskGroup,
              targetFolderName: this.targetFolderName,
              targetFolderId: this.targetFolderId,
              mailBoxId: this.currentMailboxId,
              taskType: TaskType.TASK,
              status,
              pushToAssignedUserIds: []
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
          }
          this.updateTaskGroupStore();
        }
      })
      .add(() => this.afterMoveToFolder());
  }

  shouldHandleSchedule(task: ITaskRow, status: TaskStatusType) {
    if (
      [TaskStatusType.completed, TaskStatusType.deleted].includes(status) &&
      checkScheduleMsgCount(task.conversations)
    ) {
      this.errorMessage =
        status === TaskStatusType.completed
          ? ErrorMessages.RESOLVE_TASK
          : ErrorMessages.DELETE_TASK;
      this.isShowModalWarning = true;
      return true;
    }
    return false;
  }

  afterMoveToFolder() {
    this.inboxToolbarService.setInboxItem([]);
    this.updateTaskGroupStore();
    this.moveToFolderFormGroup.reset();
    this.isShowMoveFolder = false;
    this.showAnimationSidePanel = false;
    this.isMovingToFolder = false;
  }

  handleCancelMoveToFolder() {
    this.moveToFolderFormGroup.reset();
    this.isShowMoveFolder = false;
    this.showAnimationSidePanel = false;
    this.isMovingToFolder = false;
  }

  handleTaskDragStart() {
    this.showAnimationSidePanel = true;
  }

  taskGroupMoved(event: CdkDragMove<unknown>) {
    this.taskDragDropService.setDragInfo(
      event,
      ListViewDraggableItem.TASK_GROUP
    );
  }

  dragStarted(event: CdkDragStart<unknown>) {
    this.showAnimationSidePanel = true;
    const collapseIds = this.taskGroups.reduce((res, item) => {
      return {
        ...res,
        [item.taskGroup.id]: false
      };
    }, {});
    this.taskGroupService.updateExpandGroup(collapseIds);
  }

  updateTaskGroup(type: EGroupAction, taskGroup: ITaskGroup) {
    if (!taskGroup?.id) {
      this.taskGroupService.setLoading(true);
      this.taskApiService
        .createTaskGroup({
          taskFolderId: this.taskFolderId,
          color: taskGroup.color,
          name: taskGroup.name,
          order: taskGroup.order
        })
        .subscribe({
          next: (res) => {
            const newTaskGroups = this.taskGroups.map((t) => {
              if (!t.taskGroup.id) {
                return { ...t, taskGroup: res };
              }
              return t;
            });
            this.taskGroups = newTaskGroups;
            this.updateTaskFolder();
          },
          error: () => {
            const newTaskGroups = this.taskGroups.filter(
              (t) => !!t.taskGroup.id
            );
            this.taskGroups = newTaskGroups;
            this.taskGroupService.setLoading(false);
          },
          complete: () => {
            this.taskGroupService.setEditMode(false);
            this.taskGroupService.setLoading(false);
          }
        });
      return;
    }

    if (type === EGroupAction.ASSIGN_AS_DEFAULT_GROUP) {
      this.taskApiService
        .assignDefaultGroup({
          taskFolderId: taskGroup.taskFolderId,
          taskGroupId: taskGroup.id
        })
        .subscribe(() => {
          const newTaskGroups = this.taskGroups.map((group) => ({
            ...group,
            taskGroup: {
              ...group.taskGroup,
              isDefault: group.taskGroup.id === taskGroup.id
            }
          }));
          this.taskGroupService.setLoading(false);
          this.taskGroups = newTaskGroups;
          this.updateTaskFolder();
        });
    } else {
      this.taskApiService.updateTaskGroup([taskGroup]).subscribe(() => {
        const newTaskGroups = this.taskGroups.map((group) => {
          if (group.taskGroup.id === taskGroup.id) {
            return { ...group, taskGroup };
          }
          return group;
        });
        this.taskGroupService.setLoading(false);
        this.taskGroups = newTaskGroups;
        this.updateTaskFolder();
      });
    }
  }

  changeSortTaskType(sortType: string) {
    const sortTaskType =
      sortType === ESortTaskType.OLDEST_TO_NEWEST
        ? ESortTaskTypeParam.OLDEST_TO_NEWEST
        : ESortTaskTypeParam.NEWEST_TO_OLDEST;
    if (sortTaskType === this.queryParams[ETaskQueryParams.SORT_TASK_TYPE])
      return;
    this.currentSortTaskType = sortTaskType;
    this.inboxFilterService.setSelectedSortTaskType(sortTaskType);
    this.updateQueryParam(sortTaskType);

    this.store.dispatch(
      taskGroupPageActions.sortCompletedTaskChange({
        sortTaskType: this.currentSortTaskType
      })
    );

    this.isCompletedGroupLoading = true;
    this.pageIndex = 1;
  }

  private updateQueryParam(sortTaskType: ESortTaskTypeParam) {
    this.router.navigate([], {
      queryParams: {
        sortTaskType
      },
      queryParamsHandling: 'merge',
      relativeTo: this.activatedRoute
    });
  }

  handleAddGroup() {
    console.debug('handleAddGroup', this.isEditing);
    if (this.isEditing) return;
    this.addNewGroup();
  }

  addNewGroup(newPos?: number) {
    this.taskGroupService.setEditMode(true);
    const orders = this.taskGroups.map((t) => t.taskGroup.order);
    const maxOrder = Math.max(...orders);

    const updatedIndexGroups = newPos
      ? this.taskGroups.map((group) => {
          if (group.taskGroup.order >= newPos) {
            return {
              ...group,
              taskGroup: {
                ...group.taskGroup,
                order: group.taskGroup.order + 1
              }
            };
          } else {
            return group;
          }
        })
      : this.taskGroups;

    const newTaskGroups = [
      ...updatedIndexGroups,
      {
        ...DEFAULT_TASK_GROUP,
        taskGroup: {
          ...DEFAULT_TASK_GROUP.taskGroup,
          order: newPos || maxOrder + 1,
          taskFolderId: this.taskFolderId
        }
      }
    ];
    this.taskGroups = newTaskGroups;

    this._taskGroupRefs$
      .pipe(
        first(Boolean),
        timeout(3000),
        catchError(() => of(null))
      )
      .subscribe((taskGroupRefs) => {
        if (!taskGroupRefs?.length) return;
        const newGroup = this.taskGroups.findIndex(
          (group) => group.taskGroup.order === newPos
        );
        if (newPos) {
          taskGroupRefs.get(newGroup).handleFocusAfterAddNewGroup();
        } else {
          taskGroupRefs.last.handleFocusAfterAddNewGroup();
        }
      });
  }

  updateTaskFolder() {
    this.inboxSidebarService.updateTaskGroupInFolder(
      this.taskGroups.map((t) => t.taskGroup),
      this.taskFolderId
    );
  }

  changeCurrentTitleTask(value) {
    const newTaskGroups = this.taskGroups.map((group) => {
      return {
        ...group,
        data: group.data.map((task) => {
          if (task.id === value.taskId) {
            return {
              ...task,
              title: value?.title,
              indexTitle: value?.title
            };
          }
          return task;
        })
      };
    });
    this.taskGroups = newTaskGroups;
    this.changeDetectorRef.detectChanges();
  }

  handleTaskGroupAction(value: ITaskGroupAction) {
    switch (value?.type) {
      case EGroupAction.EXPAND_ALL_GROUPS:
        const expandIds = this.taskGroups.reduce((res, item) => {
          return {
            ...res,
            [item.taskGroup.id]: true
          };
        }, {});
        this.taskGroupService.updateExpandGroup(expandIds);
        break;
      case EGroupAction.COLLAPSE_ALL_GROUPS:
        const collapseIds = this.taskGroups.reduce((res, item) => {
          return {
            ...res,
            [item.taskGroup.id]: false
          };
        }, {});
        this.taskGroupService.updateExpandGroup(collapseIds);
        break;
      case EGroupAction.ADD_GROUP:
        this.addNewGroup();
        break;
      case EGroupAction.ADD_GROUP_ABOVE:
        this.addNewGroup(value?.taskGroupData?.taskGroup?.order);
        break;
      case EGroupAction.ADD_GROUP_BELOW:
        this.addNewGroup(value?.taskGroupData?.taskGroup?.order + 1);
        break;
      case EGroupAction.ASSIGN_AS_DEFAULT_GROUP:
      case EGroupAction.RENAME_GROUP:
      case EGroupAction.CHANGE_GROUP_COLOR:
        this.updateTaskGroup(value.type, value.taskGroupData.taskGroup);
        break;
      case EGroupAction.DELETE_GROUP:
        const { id } = value.taskGroupData.taskGroup;
        this.taskApiService.deleteTaskGroup(id).subscribe({
          next: () => {
            const taskGroups = this.taskGroups.filter(
              (group) => group.taskGroup.id !== id
            );
            this.updateTaskFolder();
            this.updateTaskGroupStore(taskGroups);
          },
          error: () => {
            this.toastService.error(DELETE_TASK_GROUP_ERROR_MSG);
            const newTaskGroups = this.taskGroups.map((item) => {
              if (item.taskGroup.id === id) {
                return {
                  ...item,
                  disableDelete: true
                };
              }
              return item;
            });
            this.taskGroups = newTaskGroups;
          }
        });
        break;
      default:
        break;
    }
  }

  handleSortTaskInFolder(
    listTask: ITaskRow[] = [],
    sortTaskType: string = ESortTaskTypeParam.NEWEST_TO_OLDEST,
    timeField: string
  ) {
    return listTask?.sort((a, b) =>
      sortTaskType === ESortTaskTypeParam.NEWEST_TO_OLDEST
        ? new Date(b?.[timeField]).getTime() -
          new Date(a?.[timeField]).getTime()
        : new Date(a?.[timeField]).getTime() -
          new Date(b?.[timeField]).getTime()
    );
  }

  sortGroupByOrder(taskGroups: IGetTaskByFolder[]) {
    if (!taskGroups) return [];
    return taskGroups.sort((a, b) => {
      if (a.taskGroup.isCompletedGroup && !b.taskGroup.isCompletedGroup)
        return 1;
      if (!a.taskGroup.isCompletedGroup && b.taskGroup.isCompletedGroup)
        return -1;
      return a.taskGroup.order > b.taskGroup.order ? 1 : -1;
    });
  }

  sortTaskByTime(taskList: ITaskRow[]) {
    return taskList.sort(
      (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt))
    );
  }

  public checkFilter(queryParams: Params) {
    const params = cloneDeep(queryParams || {});
    //Ignore params for task folder
    delete params[ETaskQueryParams.INBOXTYPE];
    delete params[ETaskQueryParams.TASKTYPEID];
    delete params[ETaskQueryParams.STATUS];
    delete params[ETaskQueryParams.SORT_TASK_TYPE];
    delete params[ETaskQueryParams.TASK_ID];
    const taskListParams = {};
    const tasksListParamEnums = Object.values(ETaskQueryParams) as string[];
    for (const key in params) {
      if (
        tasksListParamEnums.includes(key) &&
        ((!!params[key] && !isArray(params[key])) ||
          (isArray(params[key]) && params[key].length))
      ) {
        taskListParams[key] = params[key];
      }
    }
    const values = this.isFocusView || Object.keys(taskListParams).length > 0;
    return values;
  }

  public get isFocusView(): boolean {
    return (
      this.currentQueryParams?.[ETaskQueryParams.INBOXTYPE] ===
      GroupType.MY_TASK
    );
  }

  private hasTaskFilter(): boolean {
    return (
      this.queryParams[ETaskQueryParams.SEARCH] ||
      this.queryParams[ETaskQueryParams.CALENDAR_EVENT]?.length > 0 ||
      (this.queryParams[ETaskQueryParams.INBOXTYPE] === GroupType.TEAM_TASK &&
        this.queryParams[ETaskQueryParams.ASSIGNED_TO]?.length > 0) ||
      this.queryParams[ETaskQueryParams.END_DATE] ||
      this.queryParams[ETaskQueryParams.START_DATE] ||
      this.queryParams[ETaskQueryParams.TASK_EDITOR_ID]?.length > 0 ||
      this.queryParams[ETaskQueryParams.PROPERTY_MANAGER_ID]?.length > 0
    );
  }

  private updateResultState(taskGroups: IGetTaskByFolder[]) {
    this.noResult =
      this.hasTaskFilter() &&
      taskGroups?.every((group) => group?.meta?.itemCount === 0);
  }

  openCreateNewTask(taskGroupId: string) {
    this.selectedTaskGroupId = taskGroupId;
    this.showCreateNewTask = true;
  }

  handleScrollToTaskGroup() {
    setTimeout(() => {
      document
        .querySelector('.task-select')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  updateTaskGroupStore(newValue: IGetTaskByFolder[] = null) {
    this.store.dispatch(
      taskGroupActions.setTaskGroup({
        taskGroups: newValue || this.taskGroups
      })
    );
  }

  private subscribeTaskToolBar() {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs: TaskItem[]) => {
        if (this.activePath === EInboxQueryParams.TASKS) {
          this.toolbarConfig = cloneDeep(this.toolbarConfigDefault);
          this.toolbarConfig = {
            ...this.toolbarConfig,
            inprogress: [
              ...this.toolbarConfig.inprogress
                .filter(
                  (item) => item.key !== EInboxAction.SAVE_TO_PROPERTY_TREE
                )
                .map((value) => {
                  return {
                    ...value,
                    actionType: value.key === EInboxAction.DELETE && 'danger',
                    disabled:
                      (value.key === EInboxAction.SEND_MESSAGE ||
                        value.key === EInboxAction.RESOLVE) &&
                      !!(rs as TaskItem[]).some(
                        (item) =>
                          item.status === TaskStatusType.completed ||
                          item.status === TaskStatusType.deleted
                      )
                  };
                })
            ]
          };
        }
        this.inboxItems = rs;
        this.updateToolbarVisibility();
        if (rs?.length > 0) {
          const taskStatus = this.activePath
            ? TaskStatusType.inprogress?.toLowerCase()
            : (
                this.queryParams[EInboxQueryParams.STATUS] as string
              )?.toLowerCase();
          const moveTaskAction = this.toolbarConfig[taskStatus]?.find(
            (x) => x.key === EInboxAction.MOVE_TASK
          );
          if (moveTaskAction) moveTaskAction['customTemplate'] = this.groupList;
          this.inboxToolbarService.setValueActivePath(this.activePath);
          this.inboxToolbarService.getListToolbar(
            this.toolbarConfig,
            this.isDisabledSaveToRM,
            this.isDisabledSaveToPT
          );
          this.handleOpen();
        } else {
          this.handleClose();
        }
      });
  }
  private handleClearSelected(resetSelectMode: boolean = false) {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
    resetSelectMode && this.sharedMessageViewService.setIsSelectingMode(false);
  }
  private handleSaveToCRM() {}
  private handleAction(status: TaskStatusType, event?: MouseEvent) {
    if (
      checkScheduleMsgCount(this.listConversationSelected) &&
      [TaskStatusType.completed, TaskStatusType.deleted].includes(status)
    ) {
      const isMessage = this.activePath === EInboxQueryParams.MESSAGES;
      const errorMsg =
        status === TaskStatusType.completed
          ? !!isMessage
            ? ErrorMessages.RESOLVE_CONVERSATION
            : ErrorMessages.RESOLVE_TASK
          : !!isMessage
          ? ErrorMessages.DELETE_CONVERSATION
          : ErrorMessages.DELETE_TASK;
      this.handleShowWarningMsg(errorMsg);
      return;
    }
    if (this.loadingAction) return;
    const taskIds = this.inboxItems.map((item) => item.id);

    if (status === TaskStatusType.deleted) {
      const confirmModalConfig = {
        title: `Are you sure you wish to delete ${
          this.inboxItems?.length > 1 ? 'these tasks' : 'this task'
        }?`,
        okText: 'Yes, delete',
        cancelText: 'No, keep it',
        subtitle: '',
        content: this.permanentlyDeleteConfirmModalContent,
        colorBtn: 'danger',
        iconName: 'warning',
        closable: false,
        className: 'permanently-delete-modal',
        modelWidth: 510,
        checkboxLabel: '',
        allowCheckbox: false,
        hiddenCancelBtn: false
      };

      this.trudiConfirmService.confirm(confirmModalConfig, (res) => {
        if (!!res.result) {
          this.headerService.setConversationAction({
            option: ETaskMenuOption.DELETE,
            taskId: null,
            isTriggeredFromRightPanel: false,
            isTriggeredFromToolbar: true,
            messageIds: taskIds
          });
          this.handleConfirmPermanentlyDelete();
        }
      });
      return;
    }
    //if mark as resolve, pass taskGroupId of completed group in current folder
    const currentFolderId = this.queryParams[ETaskQueryParams.TASKTYPEID];
    const completedGroupId =
      this.taskFolderStoreService.getCurrentCompletedGroup()?.taskGroup?.id;
    this.updateTasksMultiple(
      taskIds,
      completedGroupId,
      status,
      currentFolderId,
      null,
      () => {
        this.fireworksTimeout = this.utilsService.openFireworksByMouseEvent(
          event,
          1000,
          () => {
            this.inboxToolbarService.setInboxItem([]);
          }
        );
      }
    );
  }
  private handleConfirmPermanentlyDelete() {
    const taskIds = this.inboxItems.map((item) => item.id) as string[];
    this.inboxToolbarService.setInboxItem([]);
    this.taskGroupService.setEditMode(false);
    this.triggerMenu.close();
    this.loadingAction = false;
    this.taskApiService.permanentlyDeleteTasks(taskIds).subscribe({
      next: () => {
        const currentFolder = this.taskFolderList.find((folder) =>
          folder.taskGroups.some(
            (group) =>
              group.id === (this.inboxItems[0] as ITaskRow)?.taskGroupId
          )
        );
        this.updateTaskList(
          this.inboxItems as ITaskRow[],
          currentFolder?.id,
          null
        );
        const taskSelectedMess = `${taskIds.length} ${
          taskIds.length > 1 ? 'tasks' : 'task'
        }`;
        this.toatrService.success(`${taskSelectedMess} deleted`);
        this.router.navigate([], {
          queryParams: {
            taskId: null
          },
          queryParamsHandling: 'merge'
        });
      },
      error: () => {
        this.toatrService.error(`Deleted failed`);
      },
      complete: () => {}
    });
  }
  private handleClose() {
    if (this.componentRefInboxToolbar) {
      this.componentRefInboxToolbar.instance.isDropdownVisible = false;
      this.componentRefInboxToolbar.instance.visible = false;
    }
  }
  private handleOpen() {
    if (!this.componentRefInboxToolbar) {
      this.attachToolbarInbox();
    }
  }
  private updateToolbarVisibility() {
    const shouldHideSingleTaskOptions = this.inboxItems?.length <= 1;

    this.updateBulkCreateTasksVisibility(
      'inprogress',
      shouldHideSingleTaskOptions
    );
    this.updateBulkCreateTasksVisibility(
      'completed',
      shouldHideSingleTaskOptions
    );
  }
  private updateBulkCreateTasksVisibility(
    status: 'inprogress' | 'completed',
    hide: boolean
  ) {
    const option = this.toolbarConfig[status]?.[0]?.children?.find(
      (item) => item.key === EInboxAction.BULK_CREATE_TASKS
    );

    if (option) {
      option.hideOption = hide;
    }
  }
  private handleConfirmDelete(event?: MouseEvent) {
    this.handleAction(TaskStatusType.deleted, event);
  }
  private handleSendMessage() {
    this.createNewConversationConfigs = {
      ...this.defaultCreateNewConversationConfigs,
      'header.isChangeHeaderText': true,
      'body.receiver.isShowContactType': true,
      'footer.buttons.showBackBtn': false,
      'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
      'body.prefillReceiversList': [],
      'otherConfigs.isCreateMessageType': false,
      'header.viewRecipients': true,
      'inputs.typeMessage': ETypeMessage.SCRATCH,
      'inputs.openFrom': TaskType.MESSAGE,
      'inputs.selectedTasksForPrefill': this.inboxItems?.map((item) => ({
        taskId: item.id,
        propertyId: item.property?.id
      })),
      'inputs.rawMsg': ''
    };
    this.handleOpenSendMsg(this.createNewConversationConfigs);
  }
  private handleOpenSendMsg(config) {
    this.messageFlowService
      .openSendMsgModal(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            break;
          case ESendMessageModalOutput.BackFromSelectRecipients:
            break;
          case ESendMessageModalOutput.MessageSent:
            this.handleClosePopOverAfterSend();
            break;
          case ESendMessageModalOutput.Quit:
            break;
        }
      });
  }

  private handleClosePopOverAfterSend() {
    this.handleClose();
    this.handleClearSelected();
  }
  private handleSyncTasksActivity(downloadPDFFile: boolean = false) {
    this.syncTaskActivityService.setListTasksActivity(
      (this.inboxItems as ITaskRow[]) || [],
      downloadPDFFile
    );
  }
  private attachToolbarInbox() {
    this.destroyToolbarInbox();
    this.overlayRefInboxToolbar = this.overlay.create();
    const componentPortal = new ComponentPortal(InboxToolbarComponent);
    this.componentRefInboxToolbar =
      this.overlayRefInboxToolbar.attach(componentPortal);
  }

  private destroyToolbarInbox(): void {
    if (this.overlayRefInboxToolbar) {
      this.overlayRefInboxToolbar.detach();
    }
  }

  public openMenu(event: MouseEvent) {
    if (this.triggerMenu.menuTrigger) {
      this.triggerMenu.close();
    }
    if (this.activePath === EInboxQueryParams.TASKS) {
      this.triggerMenu.menuTrigger = this.folderMenu.templateRef;
    }
    if (this.activePath === EInboxQueryParams.MESSAGES) {
      this.triggerMenu.menuTrigger =
        this.triggerMenu.menuTrigger === this.moveToOptionMenu.templateRef
          ? this.folderMenu.templateRef
          : this.moveToOptionMenu.templateRef;
    }
    this.triggerMenu.dClicked(event);
  }

  public handleMoveTasksToGroup(
    taskFolder: ITaskFolder,
    taskGroup: ITaskGroup
  ): void {
    const { id: taskGroupId, isCompletedGroup } = taskGroup;
    const { id: taskFolderId, name: taskFolderName } = taskFolder;

    const taskIds = (this.inboxItems as ITaskRow[])
      .filter((item) => item.taskGroupId !== taskGroup.id)
      .map((item) => item.id);

    if (!taskIds?.length) {
      this.triggerMenu.close();
      return;
    }

    if (
      checkScheduleMsgCount(this.listConversationSelected) &&
      [TaskStatusType.completed, TaskStatusType.deleted].includes(
        taskGroup.name as TaskStatusType
      )
    ) {
      const errorMsg =
        taskGroup.name === TaskStatusType.completed
          ? ErrorMessages.RESOLVE_TASK
          : ErrorMessages.DELETE_TASK;
      this.handleShowWarningMsg(errorMsg);
      return;
    }

    this.loadingAction = true;
    this.updateTasksMultiple(
      taskIds,
      taskGroupId,
      isCompletedGroup ? TaskStatusType.completed : TaskStatusType.inprogress,
      taskFolderId,
      taskFolderName,
      () => {
        if (isCompletedGroup) {
          this.fireworksTimeout =
            this.utilsService.openFireworksByQuerySelector(
              '#move-to-option',
              1000,
              () => {
                this.inboxToolbarService.setInboxItem([]);
              }
            );
        } else {
          this.inboxToolbarService.setInboxItem([]);
        }
      }
    );
  }

  private updateTasksMultiple(
    taskIds: string[],
    taskGroupId?: string,
    status?: TaskStatusType,
    taskFolderId?: string,
    taskFolderName?: string,
    callBackAfterSuccess?: () => void
  ) {
    this.taskService
      .updateTask({
        taskIds: taskIds,
        mailBoxId: this.currentMailboxId,
        taskGroupId: taskGroupId,
        status: status
      })
      .pipe(
        map((data) => {
          if (Object.keys(data).includes('isSuccessful')) return false;
          return data;
        })
      )
      .subscribe({
        next: (rs) => {
          if (rs) {
            this.updateTaskList(
              (this.inboxItems as ITaskRow[])
                .filter((task) => task.taskGroupId !== taskGroupId)
                .map((item) => ({ ...item, taskGroupId })),
              taskFolderId,
              taskGroupId
            );
            const taskSelectedMess = `${taskIds.length} ${
              taskIds.length > 1 ? 'tasks' : 'task'
            }`;
            if (status === TaskStatusType.inprogress) {
              if (!this.isSameFolder) {
                this.toatrService.success(
                  `${taskSelectedMess} moved to ${taskFolderName}`
                );
              }
              return;
            }
            if (taskIds.length === 1) {
              const dataForToast = {
                taskId: taskIds[0],
                isShowToast: true,
                type: SocketType.changeStatusTask,
                mailBoxId: this.currentMailboxId,
                taskType: TaskType.TASK,
                status: status,
                pushToAssignedUserIds: []
              };
              this.toastCustomService.openToastCustom(
                dataForToast,
                true,
                EToastCustomType.SUCCESS_WITH_VIEW_BTN
              );
              return;
            }
            this.toatrService.success(
              `${taskSelectedMess} ${status.toLocaleLowerCase()}`
            );
            return;
          }
        },
        error: () => {
          if (status === TaskStatusType.inprogress) {
            this.toatrService.error(`Move to failed`);
            return;
          }
          this.toatrService.error(
            `${status.toLowerCase().replace(/\b[a-z]/g, function (letter) {
              return letter.toUpperCase();
            })} failed`
          );
        },
        complete: () => {
          this.triggerMenu.close();
          this.loadingAction = false;
        }
      })
      .add(() => {
        if (callBackAfterSuccess) {
          callBackAfterSuccess();
        } else {
          this.inboxToolbarService.setInboxItem([]);
        }
      });
  }

  private updateTaskList(
    tasks: ITaskRow[],
    taskFolderId: string,
    taskGroupId: string
  ) {
    this.isSameFolder =
      this.queryParams[ETaskQueryParams.TASKTYPEID] &&
      taskFolderId &&
      this.queryParams[ETaskQueryParams.TASKTYPEID] === taskFolderId;
    this.inboxToolbarService.updateTasks({
      action: this.isSameFolder
        ? EUpdateMultipleTaskAction.CHANGE_POSITION
        : EUpdateMultipleTaskAction.DELETE,
      payload: {
        tasks: tasks,

        targetId: taskGroupId,
        isCompletedGroup: this.inboxSidebarService.isCompletedGroup(
          taskFolderId,
          taskGroupId
        )
      }
    });
  }

  private handleShowWarningMsg(text: string) {
    this.errorMessage = text;
    this.isShowModalWarning = true;
    return;
  }

  private getListMessageSelectedFromToolbar() {
    this.inboxToolbarService.inboxItem$.subscribe(
      (listMessageSelected: TaskItem[]) => {
        if (listMessageSelected?.length) {
          this.listConversationSelected =
            this.handleGetListConversation(listMessageSelected);
          this.inboxToolbarService.getListToolbar(
            this.toolbarConfig,
            this.isDisabledSaveToRM,
            this.isDisabledSaveToPT
          );
        }
      }
    );
  }

  private handleGetListConversation(listMessageResolve: TaskItem[]) {
    let listConverSation;
    if (!listMessageResolve) return;
    if (this.activePath === EInboxQueryParams.TASKS) {
      listConverSation =
        this.addPropertyInfoToConversations(listMessageResolve);
    }
    return listConverSation;
  }

  private addPropertyInfoToConversations(listMessageResolve: TaskItem[]) {
    if (!listMessageResolve) return [];
    return listMessageResolve
      .filter((item) => item?.conversations && item?.conversations?.length > 0)
      .map((item) => {
        if (!item.conversations.length) return [];
        return item?.conversations?.map((conversation) => ({
          ...conversation,
          propertyId: item?.property?.id,
          streetline: item?.property?.streetline,
          title: item?.indexTitle || '',
          textContent: 'Resolved'
        }));
      })
      .flat();
  }

  public sortTaskGroupByOrder(a: ITaskGroup, b: ITaskGroup) {
    if (a.isCompletedGroup && !b.isCompletedGroup) return 1;
    if (!a.isCompletedGroup && b.isCompletedGroup) return -1;
    return a.order > b.order ? 1 : -1;
  }

  public subscribeToSocketNotifySendManyEmailMessageDone() {
    this.websocketService.onSocketNotifySendBulkMessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((rs) => {
        this.getMessageContentWhenSendMessageDone(rs);
      });
  }

  public getMessageContentWhenSendMessageDone(data) {
    if (data?.messages?.[0]?.isDraft) {
      return;
    }
    let messageLabel = '';
    if (data.status === SyncPropertyDocumentStatus.SUCCESS) {
      if (data.messageSended === 1) {
        const dataForToast = {
          conversationId: data.messages[0].conversationId,
          taskId: data.messages[0].taskId,
          isShowToast: true,
          type: data.type,
          mailBoxId: this.currentMailboxId,
          taskType: data.taskType || TaskType.MESSAGE,
          pushToAssignedUserIds: [],
          status: data.messages[0].status || TaskStatusType.inprogress
        };
        this.toastCustomService.openToastCustom(
          dataForToast,
          true,
          EToastCustomType.SUCCESS_WITH_VIEW_BTN
        );
      } else {
        messageLabel = `${data.messageSended} messages sent`;
        this.toastService.success(messageLabel);
      }
    } else {
      let messageFailed = data.totalMessage - data.messageSended;
      messageLabel = `${messageFailed} ${
        messageFailed === 1 ? 'message' : 'messages'
      }`;
      this.toastService.error(
        `${data.totalMessage - data.messageSended} failed to send`
      );
    }
  }

  handleUpsertLocalStorageViewSettings = (
    updateViewSettings: boolean = false
  ) => {
    if (
      localStorage.getItem(LOCAL_STORAGE_KEY_FOR_VIEW_SETTINGS) === null ||
      updateViewSettings
    ) {
      const data = this.handleGenerateObjViewSettingsStatus();
      this.taskViewSettings = data;
      localStorage.setItem(
        LOCAL_STORAGE_KEY_FOR_VIEW_SETTINGS,
        JSON.stringify(data)
      );
    }
  };

  handleUpdateViewSettingsStatus = () => {
    const taskViewSettings = getTaskViewSettingsStatus();
    this.listTaskViewSettings.forEach((setting) => {
      setting.isChecked = taskViewSettings[setting.id];
    });
    const data = this.handleGenerateObjViewSettingsStatus();
    this.taskViewSettings = data;
  };

  handleGenerateObjViewSettingsStatus = () => {
    return Object.fromEntries(
      this.listTaskViewSettings.map((item) => [[item.id], item.isChecked])
    );
  };

  onChangeToggleViewSetting(status: boolean, toggle: ITaskViewSettings): void {
    this.listTaskViewSettings.find((item) => item.id === toggle.id).isChecked =
      status;
    this.handleUpsertLocalStorageViewSettings(true);
  }

  handleHideIntroductionPopup = () => {
    this.isFirstTimeUser = false;
    this.isShowIntroduction = false;
    this.changeDetectorRef.detectChanges();
  };

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.handleUpdateInnerWidth();
  }

  handleUpdateInnerWidth = () => {
    this.innerWidth = window.innerWidth;
  };

  handleAnimationEnd() {
    if (!this.visible) {
      this.visible = false;
    }
  }

  onCloseDrawer(): void {
    this.visible = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.handleClearSelected();
    this.destroyToolbarInbox();
    this.taskService.currentTask$.next(null);
    this.sharedMessageViewService.setIsSelectingMode(false);
    clearTimeout(this.fireworksTimeout);
    this.taskGroupService.handleClearValue();
    this.store.dispatch(taskGroupPageActions.exitPage());
    this.destroyComponent();
  }
}
