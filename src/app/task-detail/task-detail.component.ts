import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { isEqual, omit } from 'lodash-es';
import {
  Observable,
  Subject,
  combineLatest,
  pipe,
  skip,
  takeUntil
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  pairwise,
  switchMap,
  take,
  tap
} from 'rxjs/operators';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import {
  selectTaskDetailData,
  taskDetailActions
} from '@core/store/task-detail';
import { EPopupMoveMessToTaskState } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import {
  ComposeEditorType,
  IAppTriggerSendMsgEvent
} from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import {
  EAppMessageCreateType,
  EDeleteInLineType
} from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ApiStatusService, EApiNames } from '@services/api-status.service';
import { CompanyService } from '@services/company.service';
import { ConversationService } from '@services/conversation.service';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { NavigatorService } from '@services/navigator.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { TrudiService } from '@services/trudi.service';
import {
  whiteListInMsgDetail,
  whiteListInTaskDetail
} from '@shared/constants/outside-white-list.constant';
import { EConversationType, ECreatedFrom } from '@shared/enum';
import { TaskNameId, TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ITaskSync, TaskItem } from '@shared/types/task.interface';
import { IMailBox } from '@shared/types/user.interface';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ETypePage } from '@/app/user/utils/user.enum';
import { RecursivePartial } from '@/app/core/types/type';
import { PropertiesService } from './../services/properties.service';
import { EViewDetailMode } from './enums/task-detail.enum';
import { IAddToTaskConfig } from './interfaces/task-detail.interface';
import { AISummaryApiService } from './modules/app-chat/components/ai-summary/apis/ai-summary-api.service';
import { CreditorInvoicingPropertyService } from './modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import { StepService } from './modules/steps/services/step.service';
import {
  ShowSidebarRightService,
  TaskDetailService,
  UserProfileDrawerService
} from './services/task-detail.service';
import { ESyncStatus } from './utils/functions';
import { UserConversation } from '@shared/types/conversation.interface';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';

@Component({
  selector: 'task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
@DestroyDecorator
export class TaskDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  // Indicates whether the current mailbox should be blocked for the Inbox page
  @Input() isBlockSetMailbox: boolean = false;
  public addToTaskConfig: IAddToTaskConfig;
  public currentProperty;
  public isExpanded = false;
  public currentTaskId: string = '';
  public taskType: string = '';
  public TaskTypeEnum = TaskType;
  public EViewDetailMode = EViewDetailMode;
  public isRmEnvironment: boolean = false;
  public isShowSidebarRight: boolean = false;
  public isUserProfileDrawerVisible: boolean = false;
  public currentDataUserProfile: UserProperty;
  private unsubscribe = new Subject<void>();
  public headerLeftHeight: number = 0;
  public hightLightCalendarEvent: boolean = false;
  public readonly whiteListTaskDetail = [...whiteListInTaskDetail];
  public readonly whiteListMsgDetail = [...whiteListInMsgDetail];
  public popupState: EPopupMoveMessToTaskState;
  public EPopupState = EPopupMoveMessToTaskState;
  public listMailBox: IMailBox[] = [];
  public taskSyncItem: ITaskSync;
  public readonly ESyncStatus = ESyncStatus;
  public taskSyncStatus = {
    [ESyncStatus.SUCCESS]: {
      message: 'Task activity synced to Property Tree',
      icon: 'syncSuccessCloud'
    },
    [ESyncStatus.FAILED]: {
      message: 'Activities fail to save to Property Tree',
      icon: 'syncFailCloud'
    }
  };
  public isShowSidebarFromEvent: boolean = false;
  readonly ETypePage = ETypePage;
  readonly ECreatedFrom = ECreatedFrom;
  readonly EConversationType = EConversationType;
  public conversationType: EConversationType;
  public isAppMsg: boolean = false;
  public isConversationTypeApp: boolean = false;
  public isAppMessageLog: boolean = false;
  private readonly afterLoadTaskDetail$ = new Subject<void>();
  public isInternalNote: boolean = false;
  readonly ComposeEditorType = ComposeEditorType;
  readonly EDeleteInLineType = EDeleteInLineType;
  public showConversationDetailSkeleton: boolean = false; // This skeleton is fake, it was created to make the interface better

  public createAppMessageConfigs: RecursivePartial<ISendMsgConfigs> = {
    inputs: {
      isAppMessage: true
    },
    otherConfigs: {
      createMessageFrom: ECreateMessageFrom.TASK_DETAIL,
      isCreateMessageType: true
    },
    body: {
      tinyEditor: {
        isShowDynamicFieldFunction: true
      }
    }
  };

  public activeMobileApp: boolean = false;
  public currentConversation: UserConversation;
  taskProperty$ = this.taskService.currentTask$.pipe(
    map((task) => {
      const property = task?.property;
      return !property || property.isTemporary ? null : property;
    }),
    distinctUntilChanged()
  );

  private appMessageCreateType: string = null;

  constructor(
    private sharedService: SharedService,
    private agencyService: AgencyService,
    private headerService: HeaderService,
    private conversationService: ConversationService,
    public tenancyInvoicingService: TenancyInvoicingService,
    public creditorInvoicingService: CreditorInvoicingService,
    public creditorInvoicingPropertyService: CreditorInvoicingPropertyService,
    private taskService: TaskService,
    private maintenanceService: MaintenanceRequestService,
    private trudiService: TrudiService,
    private route: ActivatedRoute,
    public router: Router,
    private navigatorService: NavigatorService,
    private propertyService: PropertiesService,
    private stepService: StepService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private apiStatusService: ApiStatusService,
    private inboxFilterService: InboxFilterService,
    private fileService: FilesService,
    public inboxService: InboxService,
    public taskDetailService: TaskDetailService,
    private aiSummaryApi: AISummaryApiService,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private showSidebarRightService: ShowSidebarRightService,
    private userProfileDrawerService: UserProfileDrawerService,
    private companyService: CompanyService,
    private sharedMessageViewService: SharedMessageViewService,
    private PreventButtonService: PreventButtonService,
    private readonly store: Store,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    const headerLeft = document.getElementById('header-left');
    this.taskService.setHeaderLeftHeight(headerLeft?.offsetHeight);
  }

  ngOnInit(): void {
    this.conversationService.currentConversation
      .pipe(
        takeUntil(this.unsubscribe),
        tap((conversation) => {
          if (
            conversation &&
            this.currentConversation &&
            this.currentConversation.id !== conversation.id &&
            conversation.conversationType === EConversationType.APP &&
            this.currentConversation.conversationType === EConversationType.APP
          ) {
            this.showConversationDetailSkeleton = true;
          }
          this.currentConversation = conversation;
        }),
        debounceTime(100)
      )
      .subscribe(() => {
        this.showConversationDetailSkeleton = false;
      });
    this.subscribeQueryParamMap();
    this.checkRouterToShow(this.router);
    this.getListMailBox();
    this.loadStoreData();
    this.agencyService.whenAgencyChange$
      .pipe(skip(1), takeUntil(this.unsubscribe))
      .subscribe((change) => {
        if (change) {
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: null
          });
        }
      });
    this.subscribeIsShowSidebarRight();
    this.subscribeIsShowDrawerViewUserProfile();

    this.prefillInboxFilterWhenReload();
    if (this.taskDetailViewMode === EViewDetailMode.TASK) {
      this.route.params
        .pipe(distinctUntilKeyChanged('taskId'), takeUntil(this.unsubscribe))
        .subscribe((params) => {
          this.PreventButtonService.clearProcess(EButtonType.STEP);
          this.setCurrentTaskId(params['taskId']);
        });
    }

    this.taskService.reloadTaskDetail
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const current =
          this.currentTaskId ?? this.taskService.currentTaskId$.value;
        if (res && current) {
          this.reloadCurrentTask(current);
        }
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe(() => {
        this.checkRouterToShow(this.router);
      });

    const navigationEnd$ = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.url)
    );

    const queryParamMap$ = this.route.queryParamMap.pipe(
      takeUntil(this.unsubscribe)
    );
    combineLatest([navigationEnd$, queryParamMap$])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([url, params]) => {
        this.isInternalNote = url.includes(EViewDetailMode.INTERNAL_NOTE);
        this.isUserProfileDrawerVisible = false;
        if (
          (url.includes('conversationId') &&
            url.includes(this.currentTaskId)) ||
          params.has('createFromCalendar') ||
          params.has('keepReturnUrl')
        ) {
          return;
        }
        this.navigatorService.setReturnUrl(null);
      });

    combineLatest([
      this.companyService.getCurrentCompany(),
      this.taskService.currentTask$,
      this.propertyService.peopleList$,
      this.conversationService.currentConversation
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([company, task, peopleList, currentConvo]) => {
        if (currentConvo?.id) {
          this.isAppMessageLog = currentConvo?.isAppMessageLog;
          this.conversationType = currentConvo?.conversationType;
          this.isConversationTypeApp =
            currentConvo?.conversationType === EConversationType.APP;
        } else {
          if (
            this.appMessageCreateType === EAppMessageCreateType.NewAppMessage ||
            this.appMessageCreateType ===
              EAppMessageCreateType.NewAppMessageDone
          ) {
            this.conversationType = EConversationType.APP;
            this.isConversationTypeApp = true;
          } else {
            this.conversationType = null;
            this.isConversationTypeApp = false;
          }
        }
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        if (!company || !task || !peopleList) return;
        this.trudiDynamicParameterService.setGlobalDynamicParameters({
          company,
          property: task.property,
          peopleList
        });
        this.taskSyncItem = task?.taskSyncs?.find(
          (taskSync) => taskSync?.taskId === this.currentTaskId
        );
      });

    this.taskService.currentTask$.subscribe((currentTask) => {
      this.createAppMessageConfigs = {
        ...this.createAppMessageConfigs,
        serviceData: {
          taskService: {
            currentTask
          }
        }
      };
    });

    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentProperty = res;
        } else {
          this.currentProperty = null;
        }
      });

    this.taskDetailService.addToTaskConfig$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.addToTaskConfig = res;
        }
      });

    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status: boolean) => {
        this.activeMobileApp = status;
      });

    //TODO: check attic
    // this.getSummaryWidgetAI();
  }

  checkRouterToShow(router) {
    this.isInternalNote = router?.url?.includes('internal-note');
  }

  getListMailBox() {
    combineLatest([
      this.inboxService.listMailBoxs$,
      this.inboxService.currentMailBox$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([listMailBox, currentMailBox]) => {
        if (!listMailBox) return;
        this.listMailBox = listMailBox;
        // handle case current mail box is null in task detail
        if (!currentMailBox) {
          const currentMailboxId = this.route.snapshot.queryParams['mailBoxId'];
          let mailBox = this.listMailBox.find(
            (lmb) => lmb.id === currentMailboxId
          );
          this.inboxService.setCurrentMailBox(mailBox);
        }
      });
  }

  handleResetPopup() {
    this.popupState = null;
    this.inboxService.setPopupMoveToTaskState(null);
    this.taskService.selectedTaskToMove.next(null);
  }

  stopProcessAddToTask() {
    this.addToTaskConfig = null;
    this.taskDetailService.setAddToTaskConfig(null);
    this.sharedMessageViewService.setPrefillCreateTaskData(null);
  }

  get viewMode(): Observable<EViewDetailMode> {
    return this.taskDetailService.viewMode;
  }

  subscribeIsShowSidebarRight() {
    combineLatest([this.showSidebarRightService.isShowSidebarRight$])
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe(([isShow]) => {
        this.isShowSidebarRight = isShow;
      });
  }

  subscribeQueryParamMap() {
    this.route.queryParamMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((param) => {
        const isOpenSideBar = param.has('openEventSideBar');
        if (!isOpenSideBar) return;
        this.removeOpenSideBarParam();
        this.isShowSidebarFromEvent = isOpenSideBar;
      });
  }

  removeOpenSideBarParam() {
    this.router.navigate([], {
      queryParams: {
        openEventSideBar: null
      },
      queryParamsHandling: 'merge'
    });
  }

  subscribeIsShowDrawerViewUserProfile() {
    combineLatest([
      this.userProfileDrawerService.isUserProfileDrawerVisible$,
      this.userProfileDrawerService.dataUser$
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        debounceTime(300)
      )
      .subscribe(([isShow, dataUser]) => {
        this.isUserProfileDrawerVisible = isShow;
        this.currentDataUserProfile = {
          ...dataUser,
          isAppUser: this.isConversationTypeApp
        };
      });
  }

  getSummaryWidgetAI() {
    this.taskService.currentTask$
      .pipe(
        filter(Boolean),
        distinctUntilKeyChanged('id'),
        switchMap((task) => this.aiSummaryApi.getSummary(task.id)),
        takeUntil(this.unsubscribe)
      )
      .subscribe((summary) => {
        // this.trudiDynamicParameterService.setDynamicParametersRequestSummary({
        //   summaryNote: summary?.[0]?.summaryContent,
        //   summaryPhotos: summary?.[0]?.propertyDocuments
        // });
      });
  }

  setCurrentTaskId(taskId: string, isDraftFolder = false) {
    if ((this.currentTaskId === taskId && !isDraftFolder) || !taskId) return;
    this.trudiDynamicParameterService.resetAllParameters();
    this.currentTaskId = taskId;
    this.reloadCurrentTask(this.currentTaskId, false);
  }

  loadStoreData() {
    this.store
      .select(selectTaskDetailData)
      .pipe(takeUntil(this.unsubscribe), pipe(pairwise()))
      .subscribe(([prevTask, currentTask]) => {
        console.debug(currentTask);
        if (!currentTask) return;
        const shouldReloadData = !isEqual(
          omit(prevTask, 'trudiResponse'),
          omit(currentTask, 'trudiResponse')
        );
        if (shouldReloadData) {
          this.updateRelatedServiceData(currentTask);
        }
        this.updateApiStatus();
        this.afterLoadTaskDetail$.next();
      });
  }

  //#region handle reload current task
  reloadCurrentTask(taskId: string, reloadConversationList: boolean = true) {
    this.beforeReloadCurrentTask();
    // start reload current task
    this.store.dispatch(taskDetailActions.setCurrentTaskId({ taskId }));
    this.afterLoadTaskDetail$
      .pipe(takeUntil(this.unsubscribe), take(1))
      .subscribe(() => {
        if (reloadConversationList) {
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }

  private updateApiStatus() {
    this.apiStatusService.setApiStatus(
      EApiNames.PutStepDecisionTaskDetail,
      true
    );
    this.apiStatusService.setApiStatus(EApiNames.GetTaskById, true);
  }

  private beforeReloadCurrentTask() {
    if (!this.stepService.eventStep$.getValue()) {
      this.apiStatusService.setApiStatus(EApiNames.GetTaskById, false);
    } else {
      this.stepService.setEventStep(false);
    }
  }

  private updateRelatedServiceData(taskDetail: TaskItem) {
    this.taskType = taskDetail.taskType;
    this.propertyService.currentPropertyId.next(taskDetail?.property?.id);
    this.propertyService.currentProperty.next(taskDetail?.property);
    this.taskService.currenTaskTrudiResponse$.next(taskDetail);
    this.taskService.currentTask$.next(taskDetail);
  }

  /**
   * @deprecated
   * @note
   * duplicate logic with handleUpdateTrudiResponseData on trudi.component.ts
   * we will keep this function for rollback code if needed
   */
  private handleTrudiResponse(trudiResponse: TaskItem['trudiResponse']) {
    // handle trudi response template
    if (!trudiResponse) return;
    if (trudiResponse?.['isTemplate']) {
      this.stepService.setTrudiResponse(trudiResponse);
      return;
    } else {
      this.stepService.setTrudiResponse(null);
    }
    //TODO: hot fix real-time file invoice
    switch (trudiResponse.setting?.taskNameId) {
      case TaskNameId.invoicing:
        this.creditorInvoicingService.creditorInvoicingResponse.next(
          trudiResponse as any
        );
        this.creditorInvoicingPropertyService.creditorInvoicingResponse.next(
          trudiResponse as any
        );
        break;
      case TaskNameId.invoiceTenant:
        this.tenancyInvoicingService.tenancyInvoicingResponse.next(
          trudiResponse as any
        );
        break;
      case TaskNameId.routineMaintenance:
        this.maintenanceService.maintenanceRequestResponse.next(
          trudiResponse as any
        );
        break;
      case TaskNameId.emergencyMaintenance:
      case TaskNameId.smokeAlarms:
      case TaskNameId.generalCompliance:
      case TaskNameId.tenantVacate:
        this.trudiService.updateTrudiResponse = trudiResponse as any;
        break;
    }
  }

  //#endregion
  private prefillInboxFilterWhenReload() {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((queryParams) => {
        const {
          messageStatus,
          search,
          inboxType,
          conversationType,
          appMessageCreateType,
          showMessageInTask
        } = queryParams || {};

        this.appMessageCreateType = appMessageCreateType;
        this.isAppMsg =
          appMessageCreateType === EAppMessageCreateType.NewAppMessage;
        if (this.isAppMsg) {
          this.conversationType = EConversationType.APP;
        }
        if (conversationType === EConversationType.VOICE_MAIL) {
          this.conversationType = conversationType;
        }
        if (inboxType) {
          this.inboxFilterService.setSelectedInboxType(inboxType);
        }
        if (messageStatus) {
          this.inboxFilterService.setSelectedStatus(messageStatus);
        }

        if (showMessageInTask) {
          this.inboxFilterService.setShowMessageInTask(
            showMessageInTask === 'true'
          );
        }

        if (search) {
          this.inboxFilterService.setSearchDashboard(search);
        }
        if (
          this.taskDetailViewMode === EViewDetailMode.MESSAGE ||
          this.taskDetailViewMode === EViewDetailMode.REMINDER
        ) {
          const isDraftFolder = queryParams['status'] === TaskStatusType.draft;
          if (
            queryParams['taskId'] &&
            this.currentTaskId &&
            this.currentTaskId === queryParams['taskId'] &&
            (isDraftFolder
              ? queryParams['conversationId'] ===
                this.conversationService.currentConversationId.getValue()
              : true)
          ) {
            this.messageTaskLoadingService.stopLoading();
          }
          this.setCurrentTaskId(queryParams['taskId'], isDraftFolder);
        }
      });
  }

  onCollapse() {
    this.isExpanded = !this.isExpanded;
    this.sharedService.rightSidebarCollapseState$.next(this.isExpanded);
  }

  handleClickOutside(): void {
    this.showSidebarRightService.handleToggleSidebarRight(false);
    this.isShowSidebarFromEvent = false;
  }

  handleClickOutsideUserProfileDrawer(): void {
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      false,
      null
    );
  }

  onHeaderUpdate(taskDetail: TaskItem): void {
    this.store.dispatch(
      taskDetailActions.updateTaskDetail({
        taskDetail
      })
    );
  }

  closeAppMessageDetail(event: IAppTriggerSendMsgEvent) {
    const currentTab = this.route.snapshot.queryParams['tab'];
    if (this.router.url.includes('app-messages')) {
      const { groupType, status, taskType, taskNameId } =
        this.taskService.currentTask$.getValue() || {};
      this.router.navigate(
        ['/dashboard', 'inbox', 'detail', this.currentTaskId],
        {
          queryParams: {
            inboxType: groupType,
            taskStatus: status,
            taskTypeID: taskNameId,
            type: taskType,
            conversationType: this.conversationType
          },
          queryParamsHandling: 'merge'
        }
      );
    } else {
      if (
        event?.type === ISendMsgType.SCHEDULE_MSG &&
        currentTab === EConversationStatus.draft
      ) {
        this.conversationService.setCurrentConversation(null);
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.headerService.resetHeaderState();
    this.conversationService.selectedCategoryId.next(null);
    this.trudiService.updateTrudiResponse = null;
    this.conversationService.setCurrentConversation(null);
    this.taskService.currentTask$.next(null);
    this.taskService.currentTaskId$.next(null);
    this.propertyService.peopleList.next(null);
    this.fileService.setAttachmentFilesDocument(null);
    const routerState = this.route.snapshot?.['_routerState'].url || '';
    if (!routerState.includes('inbox/messages')) {
      this.showSidebarRightService.handleToggleSidebarRight(false);
    }
    this.conversationService.resetTempConversations('TASK_DETAIL');
    this.PreventButtonService.clearProcess(EButtonType.STEP);
    this.trudiDynamicParameterService.setDynamicParametersRequestSummary(null);
    this.ngZone.run(() => {
      this.store.dispatch(taskDetailActions.exitTaskDetail());
    });
  }
}
