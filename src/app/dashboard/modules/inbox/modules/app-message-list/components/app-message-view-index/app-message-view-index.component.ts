import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { AppMessageApiService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-api.service';
import { AppMessageMenuService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-menu.service';
import { DeliveryFailedMessageStorageService } from '@services/deliveryFailedMessageStorage.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  skip,
  takeUntil
} from 'rxjs';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { LoadingService } from '@services/loading.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  EReminderFilterParam,
  ReminderMessageType
} from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { DEBOUNCE_SOCKET_TIME } from '@/app/dashboard/utils/constants';
import { StatisticMessageReminder } from '@/app/dashboard/shared/types/statistic.interface';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { EDataE2EInboxReminder } from '@shared/enum/E2E.enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EButtonCommonKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { TrudiTab } from '@trudi-ui';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { EAppMessageCreateType } from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
@Component({
  selector: 'app-message-view-index',
  templateUrl: './app-message-view-index.component.html',
  styleUrls: ['./app-message-view-index.component.scss'],
  providers: [
    AppMessageApiService,
    AppMessageMenuService,
    DeliveryFailedMessageStorageService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppMessageViewIndexComponent implements OnInit, OnDestroy {
  @Input() activeMobileApp: boolean;
  isSelecting = false;
  isLoading = true;
  isConsole = false;
  public readonly EDataE2EInboxReminder = EDataE2EInboxReminder;
  readonly EViewDetailMode = EViewDetailMode;
  private readonly destroy$ = new Subject<void>();
  public ReminderMessageType = ReminderMessageType;
  public currentReminderType = ReminderMessageType.UNANSWERED;
  params: Params;
  public isActive = true;
  public currentMailboxId: string;
  public paramsFilter;
  public statisticMessageReminder: StatisticMessageReminder = {
    followup: 0,
    unanswered: 0
  };
  readonly TaskStatusType = TaskStatusType;
  readonly EReminderFilterParam = EReminderFilterParam;
  public totalMessageByParam: { [key: string]: number } = {};

  createNewConversationConfigs = {
    'header.showDropdown': true,
    'header.title': null,
    'header.isPrefillProperty': false,
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'footer.buttons.sendType': ISendMsgType.BULK,
    'body.prefillReceivers': false,
    'otherConfigs.isCreateMessageType': true,
    'body.tinyEditor.attachBtn.disabled': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
    'inputs.openFrom': TaskType.MESSAGE
  };

  public messageTabs: TrudiTab<unknown>[] = [
    {
      title: 'OPEN',
      unread: false,
      link: '/dashboard/inbox/app-messages/all',
      queryParam: {
        status: TaskStatusType.inprogress,
        taskId: null,
        conversationId: null,
        appMessageCreateType: null,
        fromScratch: null
      }
    },
    {
      title: 'RESOLVED',
      unread: false,
      link: '/dashboard/inbox/app-messages/resolved',
      queryParam: {
        status: TaskStatusType.completed,
        taskId: null,
        conversationId: null,
        appMessageCreateType: null,
        fromScratch: null
      }
    }
  ];

  constructor(
    private inboxToolbarService: InboxToolbarService,
    public sharedMessageViewService: SharedMessageViewService,
    public loadingService: LoadingService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private inboxSidebarService: InboxSidebarService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private statisticService: StatisticService,
    public inboxFilterService: InboxFilterService,
    private reminderMessageService: ReminderMessageService,
    public dashboardApiService: DashboardApiService,
    private PreventButtonService: PreventButtonService,
    private toastCustomService: ToastCustomService,
    private appMessageListService: AppMessageListService,
    private cdr: ChangeDetectorRef,
    private conversationService: ConversationService,
    private taskService: TaskService,
    private propertyService: PropertiesService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.sharedMessageViewService.isSelectingMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isEditing) => {
        this.isSelecting = isEditing;
      });
    this.loadingService.isLoading$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.isLoading = value;
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.params = params;
        this.paramsFilter =
          params[EReminderFilterParam.SEARCH] ||
          params[EReminderFilterParam.PROPERTY_MANAGER_ID] ||
          params[EReminderFilterParam.ASSIGNED_TO] ||
          params[EReminderFilterParam.MESSAGE_STATUS];
        this.currentReminderType = params['reminderType'];
        if (!this.currentReminderType) {
          this.totalMessageByParam = {
            [ReminderMessageType.FOLLOW_UP]: null,
            [ReminderMessageType.UNANSWERED]: null
          };
        }
      });

    this.onCurrentMailboxIdChange();

    // TODO: remove unused code
    combineLatest([
      this.activatedRoute.queryParams,
      this.statisticService.getStatisticUnreadTask()
    ])
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged()
      )
      .subscribe(([queryParam, statisticUnreadTask]) => {
        if (statisticUnreadTask) {
          this.handleShowTotalReminderMessage(queryParam, statisticUnreadTask);
        }
      });

    // TODO: remove
    this.getTotalReminderByType();
    this.subscribeStatisticsAppMessage();
  }

  private onCurrentMailboxIdChange() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$), filter(Boolean), distinctUntilChanged())
      .subscribe((mailBoxId) => {
        this.currentMailboxId = mailBoxId;
        this.totalMessageByParam = {
          [ReminderMessageType.FOLLOW_UP]: null,
          [ReminderMessageType.UNANSWERED]: null
        };
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
      });
  }

  getTotalReminderByType() {
    this.reminderMessageService.totalMessageReminderByType
      .pipe(takeUntil(this.destroy$))
      .subscribe((total) => {
        this.totalMessageByParam = {
          ...this.totalMessageByParam,
          [this.params[EReminderFilterParam.REMINDER_TYPE]]: total
        };
      });
  }

  handleShowTotalReminderMessage(params, statisticUnreadTask) {
    if (!params[ETaskQueryParams.INBOXTYPE]) {
      params = {
        ...params,
        [ETaskQueryParams.INBOXTYPE]:
          this.inboxFilterService.getSelectedInboxType()
      };
    }

    // switch (
    //   this.isConsole
    //     ? TaskStatusType.team_task
    //     : params[ETaskQueryParams.INBOXTYPE]
    // ) {
    //   case TaskStatusType.my_task:
    //     this.statisticMessageReminder = {
    //       followup: statisticUnreadTask.myInbox.messageReminder.followup,
    //       unanswered: statisticUnreadTask.myInbox.messageReminder.unanswered
    //     };
    //     break;
    //   case TaskStatusType.team_task:
    //     this.statisticMessageReminder = {
    //       followup: statisticUnreadTask.teamInbox.messageReminder.followup,
    //       unanswered: statisticUnreadTask.teamInbox.messageReminder.unanswered
    //     };
    //     break;
    // }
  }

  handleRedirectRemider(type) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        reminderType: type,
        taskId: null,
        conversationId: null
      },
      queryParamsHandling: 'merge'
    });
  }

  setIsSelectingMode(isSelecting: boolean) {
    this.sharedMessageViewService.setIsSelectingMode(isSelecting);
    if (!isSelecting) {
      this.inboxToolbarService.setInboxItem([]);
      this.inboxToolbarService.setFilterInboxList(false);
    }
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonCommonKey.EMAIL_ACTIONS,
      EButtonType.COMMON
    );
  }

  handleClickOpenSendMessage() {
    if (
      !this.shouldHandleProcess() ||
      this.activatedRoute.snapshot.queryParams['appMessageCreateType'] ===
        EAppMessageCreateType.NewAppMessage
    )
      return;
    this.taskService.currentTaskId$.next(null);
    this.conversationService.listConversationByTask.next([]);
    this.conversationService.currentConversation.next({});
    this.appMessageListService.setPreFillCreateNewMessage(null);
    this.taskService.currentTask$.next(null);
    this.propertyService.newCurrentProperty.next(null);
    this.router.navigate(['dashboard/inbox/app-messages/all'], {
      queryParams: {
        appMessageCreateType: EAppMessageCreateType.NewAppMessage,
        status: TaskStatusType.inprogress,
        conversationId: null,
        taskId: null,
        fromScratch: null,
        mailBoxId: this.currentMailboxId
      }
    });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (!event.isDraft) {
          this.toastCustomService.handleShowToastMessSend(event);
        }
        break;
      default:
        break;
    }
  }

  subscribeStatisticsAppMessage() {
    this.inboxSidebarService.statisticsAppMessage$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((statistics) => {
        this.messageTabs = this.messageTabs.map((tab) => {
          const status =
            tab.queryParam['status'] === TaskStatusType.completed
              ? TaskStatusType.resolved
              : tab.queryParam['status'];
          const matchingStatistic = statistics.find(
            (stat) => stat.status === status
          );
          const unreadCount = Number(matchingStatistic?.unread || 0);
          return {
            ...tab,
            unread: unreadCount > 0,
            mailBoxId: this.currentMailboxId
          };
        });
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
