import { selectFetchingTaskFolder } from '@core/store/taskFolder';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { cloneDeep, isEqual } from 'lodash-es';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  merge,
  switchMap,
  takeUntil
} from 'rxjs';
import { tap } from 'rxjs/operators';
import { EAgencyPlan } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  FeaturesConfigPlan,
  ITotalCountConversationLogs
} from '@/app/console-setting/agencies/utils/console.type';
import {
  EFolderType,
  IStatisticsEmail,
  ITaskFolder,
  ITaskFolderRoute
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { TaskFolderService } from '@/app/dashboard/services/task-folder.service';
import { StatisticUnread } from '@/app/dashboard/shared/types/statistic.interface';
import { DEBOUNCE_SOCKET_TIME } from '@/app/dashboard/utils/constants';
import {
  APP_MESSAGE_ROUTE_DATA,
  FACEBOOK_INBOX_ROUTE_DATA,
  MESSAGE_INBOX_ROUTE_DATA,
  VOICE_MAIL_INBOX_ROUTE_DATA
} from '@/app/dashboard/utils/inbox-sidebar-router-data';
import { CompanyService } from '@services/company.service';
import { ConversationService } from '@services/conversation.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import {
  EInboxQueryParams,
  EMailBoxStatus,
  EMailBoxType,
  EmailProvider
} from '@shared/enum/inbox.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { IMailBox } from '@shared/types/user.interface';
import {
  EAiAssistantAction,
  EAiAssistantPlan,
  EEmailFolderPopup,
  ERouterLinkInbox,
  EmailStatusType
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EmailFolderService } from '@/app/dashboard/modules/inbox/components/gmail-folder-sidebar/services/email-folder.service';
import { ICompany } from '@shared/types/company.interface';

export interface IMessageRoute {
  id: string;
  name: string;
  icon: string;
  unReadMsgCount: number;
  total: number;
  status?: string;
  hoverTotal?: number;
  routerLink: string;
  folderType?: EFolderType;
  channelId?: string;
}

export interface IEmailRoute {
  id: string;
  name: string;
  folderType?: EFolderType;
  icon?: string;
  unReadMsgCount: number;
  total: number;
  status?: string;
}

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
  SHOW_MESSAGE_IN_TASK = 'showMessageInTask'
}

export enum EFolderNameEmailRouter {
  SPAM = 'Spam',
  JUNKEMAILS = 'Junk emails'
}

@Component({
  selector: 'inbox-sidebar',
  templateUrl: './inbox-sidebar.component.html',
  styleUrls: ['./inbox-sidebar.component.scss']
})
export class InboxSidebarComponent implements OnInit, OnDestroy {
  @ViewChild('emailFolders') emailFoldersRef: ElementRef;
  private destroy$ = new Subject<void>();
  public currentParams: Params;
  public isTaskFolderLoading: boolean = false;
  public isMailFolderLoading: boolean = false;
  public nameEmailFolder: string = '';

  public messageInboxRoute: IMessageRoute = MESSAGE_INBOX_ROUTE_DATA;
  public appMessageRoute: IMessageRoute = APP_MESSAGE_ROUTE_DATA;
  public voiceMailInboxRoute: IMessageRoute = VOICE_MAIL_INBOX_ROUTE_DATA;
  public facebookInboxRoute: IMessageRoute = FACEBOOK_INBOX_ROUTE_DATA;

  public emailFolder: ITaskFolderRoute = {
    name: 'GMAIL FOLDER',
    type: EFolderType.GMAIL,
    isOpen: true,
    icon: 'iconPlus2',
    children: []
  };

  emailRoutes: IEmailRoute[] = [
    {
      id: '1',
      name: 'Spam',
      status: EmailStatusType.spam,
      icon: 'iconFolder',
      unReadMsgCount: 0,
      total: null
    }
  ];

  isFirstRun = true;
  isShowAiAssistant = false;
  public currentMailboxId: string;
  public providerMailbox: string;
  public emailProvider = EmailProvider;
  readonly EMailBoxStatus = EMailBoxStatus;
  public isConsole: boolean;
  public showTaskFolderPopup = false;
  public selectedTaskFolder: ITaskFolder;
  public orderFolders = [];
  public expandEmailFolder = true;
  public mailBoxId: string;
  public labelId: string = '';
  public sortTaskType: string = '';
  private statisticUnreadTask: StatisticUnread;
  public openByViewButton: boolean = false;
  readonly messageViewIndexUrl: string = '/dashboard/inbox/messages';
  public EViewDetailMode = EViewDetailMode;
  public teamMembers: number = 0;
  public statusParam: TaskStatusType;
  readonly TaskStatusType = TaskStatusType;
  readonly ERouterLinkInbox = ERouterLinkInbox;
  public isAiAssistantFilter: boolean = false;
  public isMailboxCompany: boolean = false;
  public activeMobileApp: boolean = false;
  public isShowVoiceMailSection: boolean = false;
  public isShowAppMessageSection: boolean = false;
  public currentCompany: ICompany;

  constructor(
    private activatedRoute: ActivatedRoute,
    private statisticService: StatisticService,
    private agencyService: AgencyService,
    private dashboardApiService: DashboardApiService,
    private conversationService: ConversationService,
    private router: Router,
    private inboxSidebarService: InboxSidebarService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    public inboxFilterService: InboxFilterService,
    private taskFolderService: TaskFolderService,
    private websocketService: RxWebsocketService,
    public folderService: FolderService,
    private emailFolderService: EmailFolderService,
    private companyService: CompanyService,
    public mailboxSettingService: MailboxSettingService,
    private cdRef: ChangeDetectorRef,
    public webSocketService: RxWebsocketService,
    private store: Store
  ) {}
  ngOnInit(): void {
    this.inboxService.isOpenMoreInboxSidebar$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.openByViewButton = true;
      });

    this.inboxFilterService
      .getSelectedSortTaskType()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.sortTaskType = res;
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.destroy$),
        filter((mailBoxId) => Boolean(mailBoxId)),
        tap((mailBoxId) => {
          if (this.mailBoxId && mailBoxId !== this.mailBoxId) {
            this.openByViewButton = false;
          }
          this.mailBoxId = mailBoxId;
        })
      )
      .subscribe({});

    this.isConsole = this.sharedService.isConsoleUsers();

    if ([EInboxQueryParams.SETTINGS].some((e) => this.router.url.includes(e))) {
      this.isTaskFolderLoading = false;
      this.isMailFolderLoading = false;
    }

    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.activeMobileApp = res;
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
            (i) => i.mailBoxId === mailbox.id
          );
          this.nameEmailFolder = this.mapNameEmailFolder(mailbox.provider);
          this.emailFolder.name = this.nameEmailFolder;
          this.isMailboxCompany = [EMailBoxType.COMPANY].includes(mailbox.type);
          this.handleGuardAiAssistant(mailbox, features, plan, mailboxPlan);
        }
      );

    this.inboxService.currentMailBox$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
      )
      .subscribe((mailBox) => {
        this.currentMailboxId = mailBox?.id ?? '';
      });

    const taskFolderFetching$ = this.store.select(selectFetchingTaskFolder);

    combineLatest([this.folderService.emailFoldersLoaded, taskFolderFetching$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([listEmailFolderStatus, taskFolderFetching]) => {
        this.isTaskFolderLoading = taskFolderFetching;
        this.isMailFolderLoading = !listEmailFolderStatus;
      });

    combineLatest([
      this.activatedRoute.queryParams,
      this.statisticService.getStatisticUnreadTask()
    ])
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged()
      )
      .subscribe(([params, statisticUnreadTask]) => {
        if (this.checkQueryParams(params)) {
          this.statisticService.setStatisticTotalTask(null);

          if (!params?.[ETaskQueryParams.INBOXTYPE]) {
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
        this.statisticUnreadTask = statisticUnreadTask;
        // handle show unread count and total count
        if (statisticUnreadTask) {
          this.handleShowBadgeUnread(params, statisticUnreadTask);
        }
        this.isFirstRun = false;
      });

    // handle show total task
    this.statisticService.statisticTotalTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((totalTask) => {
        if (this.currentParams) {
          this.handleShowTotalTask(totalTask);
        } else this.clearTotalCount();
      });

    combineLatest([
      this.companyService.getCurrentCompany(),
      this.inboxService.currentMailBox$
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(([_, mailBox]) => Boolean(mailBox)),
        switchMap(([currentCompany, mailBox]) => {
          this.currentCompany = currentCompany;
          this.providerMailbox = mailBox.provider;
          return this.conversationService.messageActionTriggered$;
        })
      )
      .subscribe(() => {
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
      });
    this.taskFolderService.selectedTaskFolderBS
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.selectedTaskFolder = {
            icon: data.icon,
            name: data.name,
            ...data
          };
        }
      });
    this.emailFolderService.emailFolderAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((emailFolderAction) => {
        if (emailFolderAction === EEmailFolderPopup.TASK_FOLDER) {
          this.showTaskFolderPopup = true;
          const dataFolderCreated =
            this.folderService.createEmailFolder.getValue();
          if (dataFolderCreated) {
            this.taskFolderService.setSelectedTaskFolder({
              id: dataFolderCreated.internalId,
              ...this.selectedTaskFolder
            });
            this.folderService.createEmailFolder.next(null);
          }
          this.emailFolderService.setEmailFolderAction(null);
        }
      });
    this.subcribeSeenConversationWS();
    this.subcribeUpdateMessageFolderCountWS();
    this.subscribeMailboxSettings();
    this.checkHasAiAssistantFilter();
    this.getSelectedFilter();
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

  subscribeMailboxSettings() {
    this.mailboxSettingService.mailboxSetting$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailboxSettings) => {
        this.teamMembers = mailboxSettings?.teamMembers;
        this.cdRef.markForCheck();
      });

    combineLatest([
      this.mailboxSettingService.mailBoxId$,
      this.webSocketService.onSocketUpdatePermissionMailBox
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([mailBoxId, socket]) => {
        if (socket.data?.id === mailBoxId) {
          this.teamMembers = socket.data?.teamMembers;
          this.cdRef.markForCheck();
        }
      });
  }

  private subcribeSeenConversationWS() {
    this.websocketService.onSocketSeenConversation
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(
          (prev, curr) => prev.socketTrackId === curr.socketTrackId
        ),
        filter(
          (res) =>
            res?.taskType === TaskType.EMAIL &&
            !this.isConsole &&
            this.websocketService.checkIgnoreCurrentUser(res?.fromUserId)
        ),
        debounceTime(DEBOUNCE_SOCKET_TIME)
      )
      .subscribe((res) => {
        this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
          res?.mailBoxId
        );
      });
  }

  private subcribeUpdateMessageFolderCountWS() {
    const moveMessageToFolder$ =
      this.websocketService.onSocketMoveMessageToFolder;
    const updateMessageFolder$ = this.websocketService.onSocketUpdateMsgFolder;
    const syncSpamMail$ = this.websocketService.onSocketSyncSpamMailBox;
    const newMesssageFolder$ = this.websocketService.onSocketMessage.pipe(
      takeUntil(this.destroy$),
      filter((res) => res?.type === SocketType.newMessages)
    );

    merge(
      moveMessageToFolder$,
      updateMessageFolder$,
      syncSpamMail$,
      newMesssageFolder$
    )
      .pipe(
        distinctUntilChanged(
          (prev, curr) => prev.socketTrackId === curr.socketTrackId
        ),
        filter(() => !this.isConsole),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
          res?.mailBoxId
        );
      });
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

    const isAllowedPlan =
      [EAgencyPlan.ELITE].includes(plan) ||
      [EAiAssistantAction.MOBILE_APP, EAiAssistantAction.VOICE_MAIL].some(
        (i) => features?.[i]?.state
      ) ||
      [EAiAssistantPlan.MOBILE, EAiAssistantPlan.VOICE_CALL].some(
        (i) => totalCountConversationLogs?.[i] > 0
      );

    const isCompanyMailbox = [EMailBoxType.COMPANY].includes(mailbox.type);
    this.isShowAiAssistant = isCompanyMailbox && isAllowedPlan;

    const mobilelLogs = +totalCountConversationLogs?.mobile;
    const conditionalMobile =
      mobilelLogs || features?.[EAiAssistantAction.MOBILE_APP]?.state;

    const voiceCallLogs = +totalCountConversationLogs?.voiceCall;
    const conditionalVoiceCall =
      voiceCallLogs || features?.[EAiAssistantAction.VOICE_MAIL]?.state;

    const isNotAllowMobile =
      param === EAiAssistantAction.MOBILE && !conditionalMobile;
    const isNotAllowVoiceMail =
      param === EAiAssistantAction.VOICE_MAIL && !conditionalVoiceCall;

    this.isShowVoiceMailSection =
      this.isShowAiAssistant && !!conditionalVoiceCall;

    this.isShowAppMessageSection =
      this.isShowAiAssistant && !!conditionalMobile;

    if (
      param &&
      (!this.isSupportRouteAiAssistant(param) ||
        isNotAllowMobile ||
        isNotAllowVoiceMail ||
        !this.isShowAiAssistant)
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
  }

  isSupportRouteAiAssistant(query) {
    return [EAiAssistantAction.MOBILE, EAiAssistantAction.VOICE_MAIL].includes(
      query
    );
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

  private mapNameEmailFolder(provider: string): string {
    switch (provider) {
      case EmailProvider.GMAIL:
        return 'GMAIL FOLDERS';
      case EmailProvider.OUTLOOK:
        return 'OUTLOOK FOLDERS';
      case EmailProvider.OTHER:
        return 'EMAIL FOLDERS';
      default:
        return 'EMAIL FOLDERS';
    }
  }
  handleShowBadgeUnread(params, statisticUnreadTask) {
    const cloneMessageRoutes = cloneDeep(this.messageInboxRoute);
    const cloneAppMessageRoutes = cloneDeep(this.appMessageRoute);
    const cloneVoidMailRoutes = cloneDeep(this.voiceMailInboxRoute);
    const cloneFacebookRoutes = cloneDeep(this.facebookInboxRoute);

    let statisticsEmail = [] as IStatisticsEmail[];
    let statisticsAppMessage = [] as IStatisticsEmail[];
    let statisticsVoiceMailMessage = [] as IStatisticsEmail[];
    let statisticsFacebookMessage = [] as IStatisticsEmail[];

    const totalAppMessageCount =
      statisticUnreadTask.teamInbox.totalMessageCount.app.completed +
      statisticUnreadTask.teamInbox.totalMessageCount.app.opened;

    const totalVoiceMailCount =
      statisticUnreadTask.teamInbox.totalMessageCount.voicemail.completed +
      statisticUnreadTask.teamInbox.totalMessageCount.voicemail.opened;

    /// Update count for plan to check hidden voicemail tab and app message tab
    /// replace to inbox-sidebar-v2
    // this.agencyService.updateCountPlan({
    //   mailBoxId: this.currentMailboxId,
    //   voiceCall: totalVoiceMailCount,
    //   mobile: totalAppMessageCount
    // });

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
          statisticUnreadTask.myInbox.totalMessageCount?.email?.opened;
        cloneMessageRoutes.unReadMsgCount =
          statisticUnreadTask.myInbox.message.email.opened;

        cloneAppMessageRoutes.total =
          statisticUnreadTask.myInbox.totalMessageCount.app.opened;
        cloneAppMessageRoutes.unReadMsgCount =
          statisticUnreadTask.myInbox.message.app.opened;

        cloneVoidMailRoutes.total =
          statisticUnreadTask.myInbox.totalMessageCount.voicemail.opened;
        cloneVoidMailRoutes.unReadMsgCount =
          statisticUnreadTask.myInbox.message.voicemail.opened;

        cloneFacebookRoutes.total =
          statisticUnreadTask.myInbox.totalMessageCount.messenger.opened;
        cloneFacebookRoutes.unReadMsgCount =
          statisticUnreadTask.myInbox.message.messenger.opened;

        statisticsAppMessage = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.myInbox.message.app.opened,
            count: statisticUnreadTask.myInbox.totalMessageCount.app.opened
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.myInbox.message.app.completed,
            count: statisticUnreadTask.myInbox.totalMessageCount.app.completed
          }
        ];

        statisticsEmail = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.myInbox.message.email.opened,
            count: statisticUnreadTask.myInbox.totalMessageCount.email.opened
          },
          {
            status: TaskStatusType.draft,
            unread: statisticUnreadTask.myInbox.message.email.draft || 0,
            count: statisticUnreadTask.draft || 0
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.myInbox.message.email.completed,
            count: statisticUnreadTask.myInbox.totalMessageCount.email.completed
          },
          {
            status: TaskStatusType.deleted,
            unread: statisticUnreadTask.myInbox.message.email.deleted,
            count: statisticUnreadTask.myInbox.totalMessageCount.email.deleted
          }
        ];

        statisticsVoiceMailMessage = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.myInbox.message.voicemail.opened,
            count:
              statisticUnreadTask.myInbox.totalMessageCount.voicemail.opened
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.myInbox.message.voicemail.completed,
            count:
              statisticUnreadTask.myInbox.totalMessageCount.voicemail.completed
          }
        ];

        statisticsFacebookMessage = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.myInbox.message.messenger.opened,
            count:
              statisticUnreadTask.myInbox.totalMessageCount.messenger.opened
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.myInbox.message.messenger.completed,
            count:
              statisticUnreadTask.myInbox.totalMessageCount.messenger.completed
          }
        ];
        break;
      case TaskStatusType.team_task:
        cloneMessageRoutes.total =
          statisticUnreadTask.teamInbox.totalMessageCount?.email?.opened;
        cloneMessageRoutes.unReadMsgCount =
          statisticUnreadTask.teamInbox.message.email.opened;

        cloneAppMessageRoutes.total =
          statisticUnreadTask.teamInbox.totalMessageCount.app.opened;
        cloneAppMessageRoutes.unReadMsgCount =
          statisticUnreadTask.teamInbox.message.app.opened;

        cloneVoidMailRoutes.total =
          statisticUnreadTask.teamInbox.totalMessageCount.voicemail.opened;
        cloneVoidMailRoutes.unReadMsgCount =
          statisticUnreadTask.teamInbox.message.voicemail.opened;

        cloneFacebookRoutes.total =
          statisticUnreadTask.myInbox.totalMessageCount.messenger.opened;
        cloneFacebookRoutes.unReadMsgCount =
          statisticUnreadTask.myInbox.message.messenger.opened;

        statisticsAppMessage = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.teamInbox.message.app.opened,
            count: statisticUnreadTask.teamInbox.totalMessageCount.app.opened
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.teamInbox.message.app.completed,
            count: statisticUnreadTask.teamInbox.totalMessageCount.app.completed
          }
        ];

        statisticsEmail = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.teamInbox.message.email.opened,
            count: statisticUnreadTask.teamInbox.message.email.opened
          },
          {
            status: TaskStatusType.draft,
            unread: statisticUnreadTask.teamInbox.message.email.draft || 0,
            count: statisticUnreadTask.draft || 0
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.teamInbox.message.email.completed,
            count:
              statisticUnreadTask.teamInbox.totalMessageCount.email.completed
          },
          {
            status: TaskStatusType.deleted,
            unread: statisticUnreadTask.teamInbox.message.email.deleted,
            count: statisticUnreadTask.teamInbox.totalMessageCount.email.deleted
          }
        ];

        statisticsVoiceMailMessage = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.teamInbox.message.voicemail.opened,
            count:
              statisticUnreadTask.teamInbox.totalMessageCount.voicemail.opened
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.teamInbox.message.voicemail.completed,
            count:
              statisticUnreadTask.teamInbox.totalMessageCount.voicemail
                .completed
          }
        ];

        statisticsFacebookMessage = [
          {
            status: TaskStatusType.inprogress,
            unread: statisticUnreadTask.myInbox.message.messenger.opened,
            count:
              statisticUnreadTask.myInbox.totalMessageCount.messenger.opened
          },
          {
            status: TaskStatusType.resolved,
            unread: statisticUnreadTask.myInbox.message.messenger.completed,
            count:
              statisticUnreadTask.myInbox.totalMessageCount.messenger.completed
          }
        ];
        break;
    }
    this.inboxSidebarService.setStatisticsEmail(statisticsEmail);
    this.inboxSidebarService.setStatisticsAppMessage(statisticsAppMessage);
    this.inboxSidebarService.setStatisticsVoiceMailMessage(
      statisticsVoiceMailMessage
    );
    this.inboxSidebarService.setStatisticsFacebookMessage(
      statisticsFacebookMessage
    );

    this.messageInboxRoute = cloneMessageRoutes;
    this.appMessageRoute = cloneAppMessageRoutes;
    this.voiceMailInboxRoute = cloneVoidMailRoutes;
    this.facebookInboxRoute = cloneFacebookRoutes;
  }

  handleMergeInprogressAndCompletedTaskCount(
    inprogress: { [key: string]: number },
    completed: { [key: string]: number }
  ) {
    return Object.entries(inprogress ?? {}).reduce(
      (result, [key, value]) => ({
        ...result,
        [key]: (result[key] || 0) + value
      }),
      completed
    );
  }

  // show total count on active sidebar item
  handleShowTotalTask(totalTask: number) {
    const status = this.currentParams[ETaskQueryParams.STATUS];
    let sidebarEmail: IEmailRoute = null;

    // TODO replace by using immutable library
    const cloneEmailRoutes = cloneDeep(this.emailRoutes);

    if (status) {
      sidebarEmail = cloneEmailRoutes.find(
        (mailRoute) => mailRoute.status === status
      );
    }
    if (sidebarEmail) {
      sidebarEmail.total = totalTask;
      if (status) {
        this.emailRoutes = cloneEmailRoutes;
      }
    }
  }

  // clear total count on all sidebar item
  clearTotalCount() {
    this.emailRoutes.forEach((emailRoute) => {
      emailRoute.total = null;
    });
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

  handleCloseTaskFolder() {
    this.showTaskFolderPopup = false;
  }

  handleDropInboxSidebarItem(event: ITaskFolder[]) {
    if (event && Array.isArray(event)) {
      this.inboxSidebarService.setInboxTaskFolder(event);
      this.dashboardApiService.updateTaskFolder(event).subscribe();
    }
  }

  trackByGmailRouteItem(index: number, item: IEmailRoute): string {
    return item.id;
  }

  isShowNewFolder: boolean = false;
  public handleCreateNewFolder() {
    this.isShowNewFolder = true;
  }
  handleOnCloseCreateContact(event) {
    this.isShowNewFolder = false;
  }

  convertTonestedFolders(data, pid = 0) {
    return data.reduce((r, e) => {
      if (pid == e.parent) {
        const object = { ...e };
        const children = this.convertTonestedFolders(data, e.id);
        if (children.length) {
          object.children = children;
        }
        r.push(object);
      }
      return r;
    }, []);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
