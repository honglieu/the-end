import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageApiService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-api.service';
import { MessageMenuService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-menu.service';
import { DeliveryFailedMessageStorageService } from '@services/deliveryFailedMessageStorage.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  skip,
  switchMap,
  takeUntil
} from 'rxjs';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
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
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
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
import { ConversationService } from '@services/conversation.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { EMailBoxStatus } from '@/app/shared';
@Component({
  selector: 'message-view-index',
  templateUrl: './message-view-index.component.html',
  styleUrls: ['./message-view-index.component.scss'],
  providers: [
    MessageApiService,
    MessageMenuService,
    DeliveryFailedMessageStorageService
  ]
})
export class MessageViewIndexComponent implements OnInit, OnDestroy {
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
  public hiddenTotal: boolean = false;
  public emailSubTabs: TrudiTab<unknown>[] = [
    {
      title: 'OPEN',
      link: '/dashboard/inbox/messages/all',
      unread: false,
      queryParam: {
        status: TaskStatusType.inprogress,
        taskId: null,
        conversationId: null
      }
    },
    {
      title: 'RESOLVED',
      link: '/dashboard/inbox/messages/resolved',
      unread: false,
      queryParam: {
        status: TaskStatusType.completed,
        taskId: null,
        conversationId: null
      }
    },
    {
      title: 'DELETED',
      link: '/dashboard/inbox/messages/deleted',
      unread: false,
      queryParam: {
        status: TaskStatusType.deleted,
        taskId: null,
        conversationId: null
      }
    },
    {
      title: 'DRAFT',
      link: '/dashboard/inbox/messages/draft',
      unread: false,
      queryParam: {
        status: TaskStatusType.draft,
        taskId: null,
        conversationId: null
      }
    }
  ];
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

  constructor(
    private inboxToolbarService: InboxToolbarService,
    public sharedMessageViewService: SharedMessageViewService,
    public loadingService: LoadingService,
    public messageIdSetService: MessageIdSetService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private inboxSidebarService: InboxSidebarService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private statisticService: StatisticService,
    public inboxFilterService: InboxFilterService,
    private reminderMessageService: ReminderMessageService,
    public dashboardApiService: DashboardApiService,
    private messageFlowService: MessageFlowService,
    private PreventButtonService: PreventButtonService,
    private toastCustomService: ToastCustomService,
    private websocketService: RxWebsocketService,
    private conversationService: ConversationService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getStatisticUnreadTask();
    this.subscribeSocketStatisticAndUnreadMailbox();
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

    combineLatest([
      this.activatedRoute.queryParams,
      this.statisticService.getStatisticTaskReminder()
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
    this.getTotalReminderByType();
    this.subscribeStatisticsEmail();
    this.inboxService
      .getSyncMailBoxStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hiddenTotal = res === EMailBoxStatus.SYNCING;
      });
  }

  handleChangeTab() {
    this.sharedMessageViewService.setIsSelectingMode(false);
  }

  subscribeStatisticsEmail() {
    this.inboxSidebarService.statisticsEmail$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((statistics) => {
        this.emailSubTabs = this.emailSubTabs.map((tab) => {
          const status =
            tab.queryParam['status'] === TaskStatusType.completed
              ? TaskStatusType.resolved
              : tab.queryParam['status'];
          const matchingStatistic = statistics.find(
            (stat) =>
              stat.status === status && stat.status !== TaskStatusType.draft
          );
          const unreadCount = Number(matchingStatistic?.unread || 0);
          return {
            ...tab,
            unread: unreadCount > 0
          };
        });
      });
  }

  getStatisticUnreadTask() {
    combineLatest([
      this.inboxService.refreshedListMailBoxs$.pipe(filter(Boolean)),
      this.inboxService.getCurrentMailBoxId()
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([_, mailBoxId]) => {
          if (!mailBoxId) return of(null);
          this.currentMailboxId = mailBoxId;
          return this.dashboardApiService.getStatisticTaskReminder(mailBoxId);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.statisticService.setStatisticTaskReminder(res);
        }
      });
  }

  subscribeSocketStatisticAndUnreadMailbox() {
    this.websocketService.onSocketRemider
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        takeUntil(this.destroy$),
        switchMap((data) => {
          return this.dashboardApiService.getStatisticTaskReminder(
            this.currentMailboxId
          );
        })
      )
      .subscribe((res) => {
        if (res) this.statisticService.setStatisticTaskReminder(res);
      });
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
      .pipe(
        takeUntil(this.destroy$),
        switchMap((total) => {
          this.totalMessageByParam = {
            ...this.totalMessageByParam,
            [this.params[EReminderFilterParam.REMINDER_TYPE]]: total
          };
          return this.dashboardApiService.getStatisticTaskReminder(
            this.currentMailboxId
          );
        })
      )
      .subscribe((data) => {
        this.statisticService.setStatisticTaskReminder(data);
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

    switch (
      this.isConsole
        ? TaskStatusType.team_task
        : params[ETaskQueryParams.INBOXTYPE]
    ) {
      case TaskStatusType.my_task:
        this.statisticMessageReminder = {
          followup: statisticUnreadTask.myInbox.messageReminder?.followup,
          unanswered: statisticUnreadTask.myInbox.messageReminder?.unanswered
        };
        break;
      case TaskStatusType.team_task:
        this.statisticMessageReminder = {
          followup: statisticUnreadTask.teamInbox.messageReminder?.followup,
          unanswered: statisticUnreadTask.teamInbox.messageReminder?.unanswered
        };
        break;
    }
  }

  handleRedirectRemider(type) {
    this.conversationService.currentConversation.next(null);
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
    if (!this.shouldHandleProcess()) return;
    this.messageFlowService
      .startWorkFlow(this.createNewConversationConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.onSendMsg(rs);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
