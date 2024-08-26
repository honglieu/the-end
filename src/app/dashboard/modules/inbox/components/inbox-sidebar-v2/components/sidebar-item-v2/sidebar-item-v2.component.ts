import {
  EAddOnType,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  FeaturesConfigPlan,
  IFeaturesConnectionStatus,
  ITotalCountConversationLogs
} from '@/app/console-setting/agencies/utils/console.type';
import { IMessageRoute } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import {
  EAiAssistantAction,
  EAiAssistantPlan
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { IStatisticsEmail } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import {
  EPageMessengerConnectStatus,
  PageFacebookMessengerType
} from '@/app/dashboard/shared/types/facebook-account.interface';
import {
  DEBOUNCE_DASHBOARD_TIME,
  DEBOUNCE_SOCKET_TIME
} from '@/app/dashboard/utils/constants';
import {
  APP_MESSAGE_ROUTE_DATA,
  FACEBOOK_INBOX_ROUTE_DATA,
  MESSAGE_INBOX_ROUTE_DATA,
  SMS_ROUTE_DATA,
  VOICE_MAIL_INBOX_ROUTE_DATA,
  WHATSAPP_INBOX_ROUTE_DATA
} from '@/app/dashboard/utils/inbox-sidebar-router-data';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { SharedMessageViewService } from '@/app/services/shared-message-view.service';
import { SharedService } from '@/app/services/shared.service';
import { TaskService } from '@/app/services/task.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { selectFetchingTaskFolder } from '@core/store/taskFolder';
import { Store } from '@ngrx/store';
import { EInboxQueryParams, EMailBoxStatus, EMailBoxType } from '@shared/enum';
import { TaskStatusType } from '@shared/enum/task.enum';
import { IMailBox } from '@shared/types/user.interface';
import { cloneDeep, isEqual } from 'lodash-es';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { WhatsappAccountService } from '@/app/dashboard/services/whatsapp-account.service';
import { PageWhatsAppType } from '@/app/dashboard/shared/types/whatsapp-account.interface';
export enum ETaskQueryParams {
  INBOXTYPE = 'inboxType',
  TASKSTATUS = 'taskStatus',
  TASKTYPEID = 'taskTypeID',
  STATUS = 'status',
  CALENDAR_EVENT = 'eventType',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  TASK_EDITOR_ID = 'taskEditorId',
  ASSIGNED_TO = 'assignedTo',
  PROPERTY_MANAGER_ID = 'propertyManagerId',
  SEARCH = 'search',
  TASK_ID = 'taskId',
  MESSAGE_STATUS = 'messageStatus',
  SORT_TASK_TYPE = 'sortTaskType',
  CALENDAR_FOCUS = 'calendarFocus',
  CHANNEL_ID = 'channelId'
}

@Component({
  selector: 'sidebar-item-v2',
  templateUrl: './sidebar-item-v2.component.html',
  styleUrl: './sidebar-item-v2.component.scss'
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarItemV2Component implements OnInit, OnDestroy {
  @Input() item: IMailBox;
  @Output() selectMailbox = new EventEmitter<string>();
  private destroy$ = new Subject<void>();
  public isTaskFolderLoading: boolean = false;
  public isAiAssistantFilter: boolean = false;
  public isConsole: boolean;
  public statusParam: TaskStatusType;
  public currentParams: Params;
  public messageInboxRoute: IMessageRoute = MESSAGE_INBOX_ROUTE_DATA;
  public appMessageRoute: IMessageRoute = APP_MESSAGE_ROUTE_DATA;
  public voiceMailInboxRoute: IMessageRoute = VOICE_MAIL_INBOX_ROUTE_DATA;
  public facebookInboxRoute: IMessageRoute = FACEBOOK_INBOX_ROUTE_DATA;
  public smsMessageRoute: IMessageRoute = SMS_ROUTE_DATA;
  public whatsappInboxRoute: IMessageRoute = WHATSAPP_INBOX_ROUTE_DATA;

  public currentMailboxId: string;
  public isMailboxCompany: boolean = false;
  public isShowAppMessageSection: boolean = false;
  public isShowVoiceMailSection: boolean = false;
  public isShowFacebookSection: boolean = false;
  public isShowSmsMessageSection: boolean = false;
  public isShowWhatsappSection: boolean = false;

  public features: FeaturesConfigPlan;
  public featuresConnectionStatus: IFeaturesConnectionStatus = {
    [EAddOnType.MESSENGER]: true
  };

  public searchText: string;
  readonly TaskStatusType = TaskStatusType;
  readonly EUserMailboxRole = EUserMailboxRole;
  readonly EMailBoxStatus = EMailBoxStatus;
  constructor(
    private activatedRoute: ActivatedRoute,
    private statisticService: StatisticService,
    private agencyService: AgencyService,
    public mailboxSettingService: MailboxSettingService,
    public folderService: FolderService,
    private router: Router,
    private inboxSidebarService: InboxSidebarService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    public inboxFilterService: InboxFilterService,
    private cdRef: ChangeDetectorRef,
    public webSocketService: RxWebsocketService,
    private store: Store,
    private sharedMessageViewService: SharedMessageViewService,
    private taskService: TaskService,
    private inboxToolbarService: InboxToolbarService,
    public readonly facebookAccountService: FacebookAccountService,
    public readonly whatsappAccountService: WhatsappAccountService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    if ([EInboxQueryParams.SETTINGS].some((e) => this.router.url.includes(e))) {
      this.isTaskFolderLoading = false;
      // this.isMailFolderLoading = false;
    }
    const taskFolderFetching$ = this.store.select(selectFetchingTaskFolder);

    combineLatest([this.folderService.emailFoldersLoaded, taskFolderFetching$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([listEmailFolderStatus, taskFolderFetching]) => {
        this.isTaskFolderLoading =
          taskFolderFetching && this.item.id === this.currentMailboxId;
        // this.isMailFolderLoading = !listEmailFolderStatus;
      });

    combineLatest([
      this.activatedRoute.queryParams,
      this.statisticService.getStatisticUnreadTask()
    ])
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(([params, statisticUnreadTask]) => {
        this.updateQueryParamsWithInboxType(params);

        // handle show unread count and total count
        if (statisticUnreadTask) {
          this.handleShowBadgeUnread(
            params,
            statisticUnreadTask,
            this.currentParams['showMessageInTask'] === 'true'
          );
        }
      });

    // handle check plan AI-ASSISTANT
    combineLatest([
      this.inboxService.currentMailBox$,
      this.agencyService.currentPlan$
    ])
      .pipe(
        distinctUntilChanged((pre, curr) => isEqual(pre, curr)),
        filter(([mailbox, plan]) => {
          return !!(mailbox && plan);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(
        ([mailbox, { plan, features, totalCountConversationLogs }]) => {
          const mailboxPlan = totalCountConversationLogs?.find(
            (i) => i.mailBoxId === this.item?.id
          );
          // this.nameEmailFolder = this.mapNameEmailFolder(mailbox.provider);
          // this.emailFolder.name = this.nameEmailFolder;
          this.isMailboxCompany =
            EMailBoxType.COMPANY === this.item.type &&
            this.item.status !== EMailBoxStatus.ARCHIVE;
          this.currentMailboxId = mailbox?.id;
          if (this.isMailboxCompany) {
            this.handleGuardAiAssistant(mailbox, features, plan, mailboxPlan);
          }
          this.features = features;
        }
      );
    // this.subscribeMailboxSettings();
    this.checkHasAiAssistantFilter();
    this.getSelectedFilter();
    this.subscribeSearch();
  }

  updateQueryParamsWithInboxType(params: Record<string, any>): void {
    if (this.checkQueryParams(params)) {
      this.statisticService.setStatisticTotalTask(null);

      const inboxType = params?.[ETaskQueryParams.INBOXTYPE];
      if (!inboxType) {
        this.router.navigate([], {
          relativeTo: this.activatedRoute,
          queryParams: {
            ...params,
            [ETaskQueryParams.INBOXTYPE]:
              this.inboxFilterService.getSelectedInboxType()
          }
        });
      }
    }
    this.currentParams = params;
  }

  getSelectedFilter() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const { status, taskStatus } = params;
        this.statusParam = taskStatus || status;
        this.cdRef.markForCheck();
      });
  }

  subscribeSearch() {
    this.inboxFilterService.searchDashboard$
      .pipe(
        distinctUntilChanged(),
        debounceTime(DEBOUNCE_DASHBOARD_TIME),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.searchText = res;
      });
  }
  handleSelectAccount(item) {
    if (this.sharedMessageViewService.isShowSelectValue) {
      this.sharedMessageViewService.setIsShowSelect(false);
    }
    this.inboxService.setCurrentMailBoxId(this.item.id);
    this.inboxService.setCurrentMailBox(this.item);
    this.selectMailbox.emit(this.item.id);
    this.inboxService.setIsDisconnectedMailbox(
      this.item.status === EMailBoxStatus.DISCONNECT
    );
    this.inboxService.setIsArchiveMailbox(
      this.item.status === EMailBoxStatus.ARCHIVE
    );
    this.mailboxSettingService.setMailBoxId(this.item.id);
    this.mailboxSettingService.setRole(this.item.role);
    localStorage.removeItem('integrateType');
    this.handleClearToolbarAction();
  }

  handleClearToolbarAction() {
    this.taskService.setSelectedConversationList([]);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }

  checkQueryParams(newQueryParams: Params) {
    if (!this.currentParams) return false;
    return (
      this.currentParams[ETaskQueryParams.TASKSTATUS] !==
        newQueryParams[ETaskQueryParams.TASKSTATUS] ||
      this.currentParams[ETaskQueryParams.TASKTYPEID] !==
        newQueryParams[ETaskQueryParams.TASKTYPEID] ||
      this.currentParams[ETaskQueryParams.INBOXTYPE] !==
        newQueryParams[ETaskQueryParams.INBOXTYPE] ||
      this.currentParams[EMessageQueryType.MESSAGE_STATUS] !==
        newQueryParams[EMessageQueryType.MESSAGE_STATUS]
    );
  }

  handleShowBadgeUnread(
    params,
    statisticUnreadTask,
    showMessageInTask = false
  ) {
    const cloneMessageRoutes = cloneDeep(this.messageInboxRoute);
    const cloneAppMessageRoutes = cloneDeep(this.appMessageRoute);
    const cloneVoidMailRoutes = cloneDeep(this.voiceMailInboxRoute);
    const cloneSmsRoutes = cloneDeep(this.smsMessageRoute);
    const totalField = showMessageInTask
      ? 'totalMessageInTaskCount'
      : 'totalMessageCount';
    const messageField = showMessageInTask ? 'messageInTask' : 'message';

    let statisticsEmail = [] as IStatisticsEmail[];
    let statisticsAppMessage = [] as IStatisticsEmail[];
    let statisticsVoiceMailMessage = [] as IStatisticsEmail[];
    let statisticsSmsMessage = [] as IStatisticsEmail[];

    const statisticTeamInbox = statisticUnreadTask[this.item.id]?.teamInbox;
    const statisticMyInbox = statisticUnreadTask[this.item.id]?.myInbox;

    const totalAppMessageCount =
      statisticTeamInbox?.[totalField]?.app?.resolved ||
      0 + statisticTeamInbox?.[totalField]?.app?.opened ||
      0;

    const totalVoiceMailCount =
      statisticTeamInbox?.[totalField]?.voicemail?.resolved ||
      0 + statisticTeamInbox?.[totalField]?.voicemail?.opened ||
      0;

    const totalSmsCount =
      statisticTeamInbox?.totalMessageCount?.sms?.resolved ||
      0 + statisticTeamInbox?.totalMessageCount?.sms?.opened ||
      0 + statisticMyInbox?.totalMessageCount?.sms?.resolved ||
      0 + statisticMyInbox?.totalMessageCount?.sms?.opened ||
      0;

    /// Update count for plan to check hidden voicemail tab and app message tab
    if (
      this.item.type === EMailBoxType.COMPANY &&
      this.item.status !== EMailBoxStatus.ARCHIVE
    ) {
      this.agencyService.updateCountPlan({
        mailBoxId: this.currentMailboxId,
        voiceCall: totalVoiceMailCount,
        mobile: totalAppMessageCount,
        sms: totalSmsCount
      });
    }

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
        // inprogress message
        cloneMessageRoutes.total =
          statisticUnreadTask[this.item.id]?.myInbox?.[
            totalField
          ]?.email?.opened;
        cloneMessageRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.myInbox?.[
            messageField
          ]?.email?.opened;

        cloneAppMessageRoutes.total =
          statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.app?.opened;
        cloneAppMessageRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.myInbox?.[
            messageField
          ]?.app?.opened;

        cloneVoidMailRoutes.total =
          statisticUnreadTask[this.item.id]?.myInbox?.[
            totalField
          ]?.voicemail?.opened;
        cloneVoidMailRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.myInbox?.[
            messageField
          ]?.voicemail?.opened;

        cloneSmsRoutes.total =
          statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.sms?.opened;
        cloneSmsRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.myInbox?.[
            messageField
          ]?.sms?.opened;

        statisticsAppMessage = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.app
                ?.opened,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.app
                ?.opened
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.app
                ?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.app
                ?.resolved
          }
        ];

        statisticsEmail = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.email
                ?.opened,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.email
                ?.opened
          },
          {
            status: TaskStatusType.draft,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.email
                ?.draft || 0,
            count: statisticUnreadTask[this.item.id]?.draft || 0
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.email
                ?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.email
                ?.resolved
          },
          {
            status: TaskStatusType.deleted,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.email
                ?.deleted,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.email
                ?.deleted
          }
        ];

        statisticsVoiceMailMessage = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]
                ?.voicemail?.opened,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]
                ?.voicemail?.opened
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]
                ?.voicemail?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]
                ?.voicemail?.resolved
          }
        ];

        statisticsSmsMessage = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.sms
                ?.opened,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.sms
                ?.opened
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.myInbox?.[messageField]?.sms
                ?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.myInbox?.[totalField]?.sms
                ?.resolved
          }
        ];

        break;
      case TaskStatusType.team_task:
        cloneMessageRoutes.total =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            totalField
          ]?.email?.opened;
        cloneMessageRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            messageField
          ]?.email?.opened;

        cloneAppMessageRoutes.total =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            totalField
          ]?.app?.opened;
        cloneAppMessageRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            messageField
          ]?.app?.opened;

        cloneVoidMailRoutes.total =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            totalField
          ]?.voicemail?.opened;
        cloneVoidMailRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            messageField
          ]?.voicemail?.opened;

        cloneSmsRoutes.total =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            totalField
          ]?.sms?.opened;
        cloneSmsRoutes.unReadMsgCount =
          statisticUnreadTask[this.item.id]?.teamInbox?.[
            messageField
          ]?.sms?.opened;

        statisticsAppMessage = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]?.app
                ?.opened,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]?.app
                ?.opened
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]?.app
                ?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]?.app
                ?.resolved
          }
        ];

        statisticsEmail = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]
                ?.email?.opened,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]?.email
                ?.opened
          },
          {
            status: TaskStatusType.draft,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]
                ?.email?.draft || 0,
            count: statisticUnreadTask[this.item.id]?.draft || 0
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]
                ?.email?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]?.email
                ?.resolved
          },
          {
            status: TaskStatusType.deleted,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]
                ?.email?.deleted,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]?.email
                ?.deleted
          }
        ];

        statisticsVoiceMailMessage = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]
                ?.voicemail?.opened,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]
                ?.voicemail?.opened
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]
                ?.voicemail?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]
                ?.voicemail?.resolved
          }
        ];

        statisticsSmsMessage = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]?.sms
                ?.opened,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]?.sms
                ?.opened
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[this.item.id]?.teamInbox?.[messageField]?.sms
                ?.resolved,
            count:
              statisticUnreadTask[this.item.id]?.teamInbox?.[totalField]?.sms
                ?.resolved
          }
        ];

        break;
    }

    if (this.item.id === this.currentMailboxId) {
      this.inboxSidebarService.setStatisticsEmail(statisticsEmail);
      this.inboxSidebarService.setStatisticsAppMessage(statisticsAppMessage);
      this.inboxSidebarService.setStatisticsVoiceMailMessage(
        statisticsVoiceMailMessage
      );
      this.inboxSidebarService.setStatisticsSmsMessage(statisticsSmsMessage);
    }

    this.messageInboxRoute = cloneMessageRoutes;
    this.appMessageRoute = cloneAppMessageRoutes;
    this.voiceMailInboxRoute = cloneVoidMailRoutes;
    this.smsMessageRoute = cloneSmsRoutes;
    this.cdRef.markForCheck();
  }

  handleShowBadgeUnreadChannel(
    params,
    statisticUnreadTask,
    channelId,
    showMessageInTask = false,
    field = ''
  ) {
    let total;
    let unReadMsgCount;
    const totalField = showMessageInTask
      ? 'totalMessageInTaskCount'
      : 'totalMessageCount';
    const messageField = showMessageInTask ? 'messageInTask' : 'message';

    let statisticsField = [] as IStatisticsEmail[];

    const statisticTeamInbox = statisticUnreadTask[channelId]?.teamInbox;
    const statisticMyInbox = statisticUnreadTask[channelId]?.myInbox;

    const totalCountField =
      (statisticTeamInbox?.[totalField]?.[field]?.resolved || 0) +
      (statisticTeamInbox?.[totalField]?.[field]?.opened || 0);
    /// Update count for plan to check hidden voicemail tab and app message tab
    if (
      this.item.type === EMailBoxType.COMPANY &&
      this.item.status !== EMailBoxStatus.ARCHIVE
    ) {
      this.agencyService.updateCountPlan({
        mailBoxId: this.currentMailboxId,
        [field]: totalCountField
      });
    }

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
        total =
          statisticUnreadTask[channelId]?.myInbox?.[totalField]?.[field]
            ?.opened || 0;
        unReadMsgCount =
          statisticUnreadTask[channelId]?.myInbox?.[messageField]?.[field]
            ?.opened || 0;

        statisticsField = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[channelId]?.myInbox?.[messageField]?.[field]
                ?.opened,
            count:
              statisticUnreadTask[channelId]?.myInbox?.[totalField]?.[field]
                ?.opened || 0
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[channelId]?.myInbox?.[messageField]?.[field]
                ?.resolved,
            count:
              statisticUnreadTask[channelId]?.myInbox?.[totalField]?.[field]
                ?.resolved || 0
          }
        ];

        break;
      case TaskStatusType.team_task:
        total =
          statisticUnreadTask[channelId]?.teamInbox?.[totalField]?.[field]
            ?.opened || 0;
        unReadMsgCount =
          statisticUnreadTask[channelId]?.teamInbox?.[messageField]?.[field]
            ?.opened || 0;

        statisticsField = [
          {
            status: TaskStatusType.inprogress,
            unread:
              statisticUnreadTask[channelId]?.teamInbox?.[messageField]?.[field]
                ?.opened,
            count:
              statisticUnreadTask[channelId]?.teamInbox?.[totalField]?.[field]
                ?.opened || 0
          },
          {
            status: TaskStatusType.resolved,
            unread:
              statisticUnreadTask[channelId]?.teamInbox?.[messageField]?.[field]
                ?.resolved,
            count:
              statisticUnreadTask[channelId]?.teamInbox?.[totalField]?.[field]
                ?.resolved || 0
          }
        ];

        break;
    }
    return {
      total,
      unReadMsgCount,
      statisticsField
    };
  }

  private handleGuardAiAssistant(
    mailbox: IMailBox,
    features: FeaturesConfigPlan,
    plan: EAgencyPlan,
    totalCountConversationLogs: ITotalCountConversationLogs
  ) {
    const url = this.activatedRoute.snapshot['_routerState']?.url;

    let param;
    if (url.includes(EInboxQueryParams.VOICEMAIL_MESSAGES)) {
      param = EAiAssistantAction.VOICE_MAIL;
    }

    if (url.includes(EInboxQueryParams.APP_MESSAGE)) {
      param = EAiAssistantAction.MOBILE;
    }

    if (url.includes(EInboxQueryParams.SMS_MESSAGES)) {
      param = EAiAssistantAction.SMS;
    }
    if (url.includes(EInboxQueryParams.MESSENGER)) {
      param = EAiAssistantAction.MESSENGER;
    }

    if (url.includes(EInboxQueryParams.WHATSAPP)) {
      param = EAiAssistantAction.WHATSAPP;
    }

    const isAllowedPlan =
      [EAgencyPlan.ELITE].includes(plan) ||
      [
        EAiAssistantAction.MOBILE_APP,
        EAiAssistantAction.VOICE_MAIL,
        EAiAssistantAction.MESSENGER,
        EAiAssistantAction.SMS,
        EAiAssistantAction.WHATSAPP
      ].some((i) => features?.[i]?.state) ||
      [
        EAiAssistantPlan.MOBILE,
        EAiAssistantPlan.VOICE_CALL,
        EAiAssistantAction.MESSENGER,
        EAiAssistantAction.SMS,
        EAiAssistantAction.WHATSAPP
      ].some((i) => totalCountConversationLogs?.[i] > 0);
    const isCompanyMailbox = [EMailBoxType.COMPANY].includes(this.item.type);
    const isShowAiAssistant = isCompanyMailbox && isAllowedPlan;
    const mobilelLogs = +totalCountConversationLogs?.mobile;
    const smsLogs = +totalCountConversationLogs?.sms;
    const conditionalMobile =
      mobilelLogs || features?.[EAiAssistantAction.MOBILE_APP]?.state;

    const voiceCallLogs = +totalCountConversationLogs?.voiceCall;
    const conditionalVoiceCall =
      voiceCallLogs || features?.[EAiAssistantAction.VOICE_MAIL]?.state;

    const conditionalSms =
      !!smsLogs || features?.[EAiAssistantAction.SMS]?.state;

    const facebookMessageLogs = +totalCountConversationLogs?.messenger;
    const conditionalFacebookMessage =
      facebookMessageLogs || features?.[EAiAssistantAction.MESSENGER]?.state;

    const whatsappLogs = +totalCountConversationLogs?.whatsapp;
    const conditionalWhatsapp =
      whatsappLogs || features?.[EAiAssistantAction.WHATSAPP]?.state;

    const isNotAllowMobile =
      param === EAiAssistantAction.MOBILE && !conditionalMobile;

    const isNotAllowVoiceMail =
      param === EAiAssistantAction.VOICE_MAIL && !conditionalVoiceCall;

    const isNotAllowFacebookMessage =
      param === EAiAssistantAction.MESSENGER && !conditionalFacebookMessage;

    const isNotAllowWhatsapp =
      param === EAiAssistantAction.WHATSAPP && !conditionalWhatsapp;

    this.isShowVoiceMailSection = isShowAiAssistant && !!conditionalVoiceCall;
    this.isShowAppMessageSection = isShowAiAssistant && !!conditionalMobile;
    this.isShowSmsMessageSection = isShowAiAssistant && !!conditionalSms;
    this.isShowFacebookSection =
      isShowAiAssistant && !!conditionalFacebookMessage;
    this.isShowWhatsappSection = isShowAiAssistant && !!conditionalWhatsapp;
    if (
      param &&
      (!this.isSupportRouteAiAssistant(param) ||
        isNotAllowMobile ||
        isNotAllowVoiceMail ||
        isNotAllowFacebookMessage ||
        isNotAllowWhatsapp ||
        !isShowAiAssistant)
    ) {
      this.router.navigate([`dashboard/inbox`], {
        replaceUrl: true
      });
    }

    localStorage.setItem(
      'isAppMessageEnabled',
      `${this.isShowAppMessageSection}`
    );

    localStorage.setItem(
      'isVoiceMailEnabled',
      `${this.isShowVoiceMailSection}`
    );

    localStorage.setItem(
      `isShowFacebookSection`,
      `${this.isShowFacebookSection}`
    );

    localStorage.setItem(
      'isSmsMessageEnabled',
      `${this.isShowSmsMessageSection}`
    );

    localStorage.setItem('isWhatsappEnabled', `${this.isShowWhatsappSection}`);

    this.subscriptionChannels();
  }

  isSupportRouteAiAssistant(query) {
    return [
      EAiAssistantAction.MOBILE,
      EAiAssistantAction.VOICE_MAIL,
      EAiAssistantAction.MESSENGER,
      EAiAssistantAction.SMS,
      EAiAssistantAction.WHATSAPP
    ].includes(query);
  }

  checkHasAiAssistantFilter() {
    this.isAiAssistantFilter = this.router.url.includes(
      EInboxQueryParams.AI_ASSISTANT
    );
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isAiAssistantFilter = this.router.url.includes(
        EInboxQueryParams.AI_ASSISTANT
      );
      this.cdRef.markForCheck();
    });
  }

  private channelSubsriptions = {
    facebookAccount: null as Subscription,
    facebookMessageCount: null as Subscription,
    whatsappAccount: null as Subscription,
    whatsappMessageCount: null as Subscription
  };

  subscriptionChannels() {
    const unsubscribeAndSubscribe = (
      subscription: Subscription,
      subscribeFn: () => Subscription
    ) => {
      subscription && subscription.unsubscribe();
      return subscribeFn();
    };

    const handleSubscription = (
      isShowSection: boolean,
      accountSubscriptionKey: 'facebookAccount' | 'whatsappAccount',
      messageCountSubscriptionKey:
        | 'facebookMessageCount'
        | 'whatsappMessageCount',
      accountService$: BehaviorSubject<
        PageFacebookMessengerType | PageWhatsAppType
      >,
      addOnType: EAddOnType,
      queryParams$: Observable<Params>,
      setStatisticsMessage: SetStatisticsMessage,
      inboxRoute: IMessageRoute
    ) => {
      if (!isShowSection) return;
      this.channelSubsriptions[accountSubscriptionKey] =
        unsubscribeAndSubscribe(
          this.channelSubsriptions[accountSubscriptionKey],
          () => this.subscribeAccountChannel(accountService$, addOnType)
        );

      this.channelSubsriptions[messageCountSubscriptionKey] =
        unsubscribeAndSubscribe(
          this.channelSubsriptions[messageCountSubscriptionKey],
          () =>
            this.subscribeCountMsgChannel(
              queryParams$,
              accountService$,
              EPageMessengerConnectStatus.ARCHIVED,
              addOnType.toLowerCase(),
              setStatisticsMessage,
              inboxRoute
            )
        );
    };

    const configs: SubscriptionChannelConfig[] = [
      {
        isShowSection: this.isShowFacebookSection,
        accountSubscriptionKey: 'facebookAccount',
        messageCountSubscriptionKey: 'facebookMessageCount',
        accountService$:
          this.facebookAccountService.currentPageMessengerActive$,
        addOnType: EAddOnType.MESSENGER,
        queryParams$: this.activatedRoute.queryParams,
        setStatisticsMessage:
          this.inboxSidebarService.setStatisticsFacebookMessage.bind(
            this.inboxSidebarService
          ),
        inboxRoute: this.facebookInboxRoute
      },
      {
        isShowSection: this.isShowWhatsappSection,
        accountSubscriptionKey: 'whatsappAccount',
        messageCountSubscriptionKey: 'whatsappMessageCount',
        accountService$: this.whatsappAccountService.currentPageWhatsappActive$,
        addOnType: EAddOnType.WHATSAPP,
        queryParams$: this.activatedRoute.queryParams,
        setStatisticsMessage:
          this.inboxSidebarService.setStatisticsWhatsappMessage.bind(
            this.inboxSidebarService
          ),
        inboxRoute: this.whatsappInboxRoute
      }
    ];

    configs.forEach((config) => {
      handleSubscription(
        config.isShowSection,
        config.accountSubscriptionKey,
        config.messageCountSubscriptionKey,
        config.accountService$,
        config.addOnType,
        config.queryParams$,
        config.setStatisticsMessage,
        config.inboxRoute
      );
    });
  }

  subscribeCountMsgChannel(
    queryParams$: Observable<Params>,
    currentPageActive$: Observable<
      PageFacebookMessengerType | PageWhatsAppType
    >,
    archivedStatus: string,
    channelType: string,
    setStatisticsMessage: SetStatisticsMessage,
    inboxRoute: IMessageRoute
  ) {
    return combineLatest([
      queryParams$,
      currentPageActive$,
      this.statisticService.getStatisticUnreadTaskChannel()
    ])
      .pipe(
        debounceTime(200),
        switchMap(([params, currentPageActive, statisticUnreadTaskChannel]) => {
          this.updateQueryParamsWithInboxType(params);
          const _channelId =
            currentPageActive && currentPageActive.status !== archivedStatus
              ? currentPageActive?.id
              : null;

          if (!statisticUnreadTaskChannel) return of(null);
          const { total, statisticsField, unReadMsgCount } =
            this.handleShowBadgeUnreadChannel(
              params,
              statisticUnreadTaskChannel,
              _channelId,
              this.currentParams['showMessageInTask'] === 'true',
              channelType
            );

          setStatisticsMessage(statisticsField);
          inboxRoute.channelId = _channelId || null;
          inboxRoute.total = total;
          inboxRoute.unReadMsgCount = unReadMsgCount;
          this.cdRef.markForCheck();

          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private subscribeAccountChannel(
    service$: BehaviorSubject<PageFacebookMessengerType | PageWhatsAppType>,
    statusKey: EAddOnType
  ) {
    return service$
      .pipe(
        filter((res) => !!res),
        switchMap((res) => {
          this.featuresConnectionStatus = {
            ...this.featuresConnectionStatus,
            [statusKey]: res?.status !== 'DISCONNECTED'
          };
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    Object.values(this.channelSubsriptions).forEach((subscription) => {
      subscription && subscription.unsubscribe();
    });
  }
}

type SetStatisticsMessage = (statisticsField: IStatisticsEmail[]) => void;

type SubscriptionChannelConfig = {
  isShowSection: boolean;
  accountSubscriptionKey: 'facebookAccount' | 'whatsappAccount';
  messageCountSubscriptionKey: 'facebookMessageCount' | 'whatsappMessageCount';
  accountService$: BehaviorSubject<
    PageFacebookMessengerType | PageWhatsAppType
  >;
  addOnType: EAddOnType;
  queryParams$: Observable<Params>;
  setStatisticsMessage: SetStatisticsMessage;
  inboxRoute: IMessageRoute;
};
