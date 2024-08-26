import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Params,
  ResolveEnd,
  Router
} from '@angular/router';
import { Toast, ToastrService } from 'ngx-toastr';
import {
  Subject,
  auditTime,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  lastValueFrom,
  merge,
  mergeMap,
  of,
  skip,
  switchMap,
  takeUntil,
  tap,
  forkJoin,
  catchError,
  EMPTY,
  debounce,
  timer
} from 'rxjs';
import { PortfolioService } from './services/portfolio.service';
import { UserService as UserDashboardService } from './services/user.service';

import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { AuthService } from '@services/auth.service';
import { SocketType } from '@shared/enum/socket.enum';
import { conversations, properties } from 'src/environments/environment';
import {
  EAddOnType,
  EAgencyPlan,
  ECRMSystem,
  EPopupPlanState
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { PromotionsApiService } from '@/app/console-setting/promotions/services/promotions-api.service';
import { PromotionsService } from '@/app/console-setting/promotions/services/promotions.service';
import { IPromotionSocket } from '@/app/console-setting/promotions/utils/promotions.interface';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { ActionLinkService } from '@services/action-link.service';
import { ApiService } from '@services/api.service';
import { ChatGptService } from '@services/chatGpt.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { ConversationService } from '@services/conversation.service';
import { ErrorService } from '@services/error.service';
import { FirebaseService } from '@services/firebase.service';
import { GoogleAnalyticsService } from '@services/gaTracking.service';
import { GlobalService } from '@services/global.service';
import { LoadingService } from '@services/loading.service';
import {
  CAN_NOT_MOVE,
  GET_TITLE_REPORT_SPAM,
  MAIL_BOX_DISCONNECT
} from '@services/messages.constants';
import { NotificationService } from '@services/notification.service';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import {
  EMailBoxPopUp,
  EMailBoxStatus,
  EMailBoxType,
  EmailProvider
} from '@shared/enum/inbox.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import {
  ESyncTaskType,
  TaskStatusType,
  TaskType
} from '@shared/enum/task.enum';
import { EUserPropertyType, confirmPropertyType } from '@shared/enum/user.enum';
import {
  ISocketMailboxMember,
  ISocketSyncConversationToCRM,
  ISocketSyncTaskActivityToPT,
  SyncPropertyDocumentStatus
} from '@shared/types/socket.interface';
import {
  CompanyAgentCurrentUser,
  CurrentUser,
  IMailBox
} from '@shared/types/user.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { InboxFilterService } from './modules/inbox/services/inbox-filter.service';
import { InboxSidebarService } from './modules/inbox/services/inbox-sidebar.service';
import { InboxService } from './modules/inbox/services/inbox.service';
import { DashboardApiService } from './services/dashboard-api.service';
import { StatisticService } from './services/statistic.service';
import { ERouterHiddenSidebar } from './shared/types/sidebar.interface';
import { DEBOUNCE_SOCKET_TIME } from './utils/constants';
import { Location } from '@angular/common';
import {
  EActionSyncResolveMessage,
  EMessageMenuOption,
  EMessageQueryType,
  IConversationsConfirmProperties,
  IDownloadPDFFile
} from './modules/inbox/modules/message-list-view/interfaces/message.interface';
import { IListConversationTask, TaskItem } from '@shared/types/task.interface';
import {
  IConversationMove,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { InboxToolbarService } from './modules/inbox/services/inbox-toolbar.service';
import {
  IAiReply,
  IMailboxSetting
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { CalendarService } from '@services/calendar.service';
import { InboxFilterLoadingService } from './modules/inbox/services/inbox-filter-loading.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { AgencyDateFormatService } from './services/agency-date-format.service';
import { ElectronService } from '@services/electron.service';
import { COUNT_UNREAD_MESSAGE } from 'src/helpers/electron/constants';
import { EMessageType } from '@shared/enum/messageType.enum';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { HeaderService } from '@services/header.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import {
  EToastCustomType,
  EToastSocketType
} from '@/app/toast-custom/toastCustomType';
import { FolderService } from './modules/inbox/services/inbox-folder.service';
import { CompanyService } from '@services/company.service';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import { Store } from '@ngrx/store';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { SyncTaskActivityService } from '@services/sync-task-activity.service';
import { EToastType } from '@/app/toast/toastType';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { taskFolderPageActions } from '@core/store/taskFolder';
import {
  mailFolderPageActions,
  selectAllMailFolder
} from '@core/store/mail-folder';
import { CountryService } from './services/country.service';
import { setCurrentCountry } from '@shared/feature/function.feature';
import { VoiceMailService } from './modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { FilesService } from '@services/files.service';
import { orderMailboxes } from './modules/inbox/utils/mailbox';
import { ETaskQueryParams } from './modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { AiPolicyService } from './services/ai-policy.service';
import { HelperService } from '@services/helper.service';
import { FacebookApiService } from './modules/inbox/modules/facebook-view/services/facebook-api.service';
import { FacebookAccountService } from './services/facebook-account.service';
import { FacebookService } from './modules/inbox/modules/facebook-view/services/facebook.service';
import {
  EPageMessengerConnectStatus,
  PageFacebookMessengerType
} from './shared/types/facebook-account.interface';
import { CacheUpdateService } from '@/app/services/cache-update.service';
import { WhatsappService } from './modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import { WhatsappApiService } from './modules/inbox/modules/whatsapp-view/services/whatsapp-api.service';
import {
  PageWhatsAppType,
  WhatsAppConnectStatus
} from './shared/types/whatsapp-account.interface';
import { WhatsappAccountService } from './services/whatsapp-account.service';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  private toastSyncActivityTasks;
  public currentCompanyId: string = null;
  public popupStatusUser = false;
  public popupModalPosition = ModalPopupPosition;
  private mailboxPopup: EMailBoxPopUp;
  public isLoading = false;
  public isDisplay = false;
  public isActionSyncConversationToRM: boolean = false;
  private previousUrl: string = null;
  private currentUrl: string = null;
  public showError500: boolean = false;
  public isShowMailboxPerWarning: boolean = false;
  public currentMailboxId: string;
  public refreshEmailFolderMailBox: IMailBox;
  public popupPlanState: EPopupPlanState;
  public EPopupPlanState = EPopupPlanState;
  public planModifyingText: string = '';
  public listMailBoxs: IMailBox[] = [];
  public agencyPlans: EAgencyPlan;
  private statusMailBox: EMailBoxStatus;
  public isHiddenSidebar = false;
  public isShowPromotionsModal: boolean = false;
  public promotionsData = {};
  private currentUser: CurrentUser;
  readonly SYNC_TYPE = SyncMaintenanceType;
  public bottomHeight: string = '66px';
  public isRmEnvironment: boolean = false;
  public isShowSyncNoteRmPopup: boolean = false;
  public listConversationConfirmProperties: IConversationsConfirmProperties = {
    listConversationMove: [],
    listConversationNotMove: []
  };
  public isShowModalConfirmProperties: boolean = false;
  public dataConfirmedProperties: PreviewConversation[];
  public currentParams: Params;
  public actionSyncResolveMessage: string;
  public isResolveMsgInTaskDetail: boolean = false;
  public isOpenWarningFromNoti: boolean = false;
  public isShowModalConfirmTaskProperties: boolean = false;
  public listTaskConfirmProperties: IListConversationTask = {
    listConversationTaskMove: [],
    listConversationTaskNotMove: []
  };
  public dataTaskConfirmedProperties: ITaskRow[];
  public componentInstance: Toast;
  public messagesType = EMessageType;
  public conversationType = EConversationType;
  private MESSAGE_MOVE_TOAST = {
    INPROGRESS: 'moved to Inbox',
    COMPLETED: 'moved to Resolved',
    DELETED: 'moved to Deleted'
  };
  public visible: boolean = false;
  public isShowPopupMerge: boolean = false;
  public selectedReplies: IAiReply[];
  private isTriggeredDownloadPDFOption: boolean = false;
  private listArchiveMessenger: PageFacebookMessengerType[] = [];
  private facebookMessengerActive: PageFacebookMessengerType = null;
  private channelId: string;
  private whatsappActive: PageWhatsAppType = null;
  private whatsappChannelId: string = null;
  private listArchiveWhatsApp: PageWhatsAppType[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastrService,
    private chatGptService: ChatGptService,
    private firebaseService: FirebaseService,
    private propertyService: PropertiesService,
    private statisticService: StatisticService,
    private portfolioService: PortfolioService,
    private agentUserService: AgentUserService,
    private websocketService: RxWebsocketService,
    private dashboardApiService: DashboardApiService,
    private userDashboardService: UserDashboardService,
    private companyEmailSignatureService: CompanyEmailSignatureService,
    private agencyService: AgencyDashboardService,
    private userService: UserService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private gaTrackingService: GoogleAnalyticsService,
    private errorService: ErrorService,
    private inboxFilterService: InboxFilterService,
    private inboxService: InboxService,
    private readonly actionLinkService: ActionLinkService,
    private mailboxSettingService: MailboxSettingService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private inboxSidebarService: InboxSidebarService,
    private globalService: GlobalService,
    private taskService: TaskService,
    private authService: AuthService,
    private promotionApiService: PromotionsApiService,
    private promotionsService: PromotionsService,
    private sharedService: SharedService,
    private conversationService: ConversationService,
    private syncResolveMessageService: SyncResolveMessageService,
    private location: Location,
    private activeRouter: ActivatedRoute,
    private calendarService: CalendarService,
    private inboxToolbarService: InboxToolbarService,
    private inboxFilterLoading: InboxFilterLoadingService,
    private sharedMessageViewService: SharedMessageViewService,
    private agencyDateFormatService: AgencyDateFormatService,
    private electronService: ElectronService,
    private headerService: HeaderService,
    private toastCustomService: ToastCustomService,
    private folderService: FolderService,
    private companyService: CompanyService,
    private reminderMessageService: ReminderMessageService,
    private store: Store,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private syncTaskActivityService: SyncTaskActivityService,
    private countryService: CountryService,
    private voicemailInboxService: VoiceMailService,
    private filesService: FilesService,
    private aiPolicyService: AiPolicyService,
    private helper: HelperService,
    private readonly facebookApiService: FacebookApiService,
    private readonly facebookAccountService: FacebookAccountService,
    private readonly cacheUpdateService: CacheUpdateService,
    private readonly facebookService: FacebookService,
    private readonly whatsappService: WhatsappService,
    private readonly whatsappAccountService: WhatsappAccountService,
    private readonly whatsappApiService: WhatsappApiService
  ) {
    this.userDashboardService
      .getSelectedUser()
      .pipe(
        filter((res) => !!res?.id),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.websocketService.connect(res);
        this.userService.selectedUser.next(res);
      });
    this.subscribeNavigation();
  }

  ngOnInit(): void {
    this.loadStoreData();
    this.subscribeOpenPopup();
    this.mailboxSettingService
      .isOpenPopup()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.visible = res;
      });
    this.subscribeSyncResolveSocket();
    this.sharedService.showPopupNotifyNewVersion
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.bottomHeight = res?.isShowPopup
          ? `${res.heighPopup + 10 + 66}px`
          : '66px';
      });
    const isConsole = this.sharedService.isConsoleUsers();
    if (!isConsole) {
      this.websocketService.onSocketPromotion
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((data: IPromotionSocket) => {
          if (!!this.currentCompanyId) {
            this.onGetPublishedPromotion();
          }
        });
    }
    this.agencyService.currentPlan$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        this.agencyPlans = configPlan.plan;
      });
    this.globalService
      .getPopupPlanState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((state) => {
        if (!state) return;
        this.popupPlanState = state;
      });

    this.handleHideSidebar();
    this.subscribeRouter();
    this.loadingService.onLoading();
    this.gaTrackingService.init();
    this.initData();

    this.errorService.error$.subscribe((error) => {
      this.showError500 = error;
    });

    if (!!localStorage.getItem('_idToken')) {
      this.firebaseService.requestPermission();
      this.firebaseService.receiveMessage();
      if (!localStorage.getItem('listCategoryTypes')) {
        this.apiService
          .getAPI(conversations, 'list')
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res && res.list) {
              localStorage.setItem(
                'listCategoryTypes',
                JSON.stringify(res.list)
              );
            }
          });
      }
    }

    this.propertyService.currentPropertyId
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((propertyId) => {
          if (propertyId)
            return this.apiService.getAPI(
              properties,
              'property-by-id/' + propertyId
            );
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result) {
          this.propertyService.newCurrentProperty.next(result);
          this.propertyService.getPeople(result.id);
          this.propertyService.expenditureLimit = result.expenditureLimit;
        }
      });

    this.subscribeCurrentCompanyId();
    this.subscribeDetectResetSearchContactPage();
    this.subscribeToSocketBulkMail();
    this.subscribeSocketStatisticAndUnreadMailbox();
    this.subscribeToSocketUpdateAgencyStatus();
    this.subscribeToSocketUpdateAgencyTimezone();
    this.subscribeAgencyTopicsSocket();
    this.subscribeAgencyActionSocket();
    this.subscribeShowWMailboxPerWarning();
    this.setCurrentMailboxSetting();
    this.subscribeToSocketMailBox();
    this.subscribeToSocketNewMailboxFolder();
    this.subscribeArchiveMailboxSocket();
    this.getStatisticUnreadTask();
    this.getStatisticUnreadTaskChannel();
    this.subscribeSocketMailboxMember();
    this.setUnreadInbox();
    this.subscribeSocketUpdatePermissionMailBox();
    this.subscribeSocketDeactivated();
    this.getListMailBoxs();
    this.onCurrentMailBoxChanges();
    this.subscribeRefreshEmailFolderMailBoxId();
    this.getCurrentUser();
    this.onSocketTaskFolder();
    this.handleSyncStatusMessageList();
    this.handleSyncTasksActivity();
    this.subscribeSyncTasksActivity();
    this.agencyDateFormatService.init().subscribe();
    this.getAllListFacebookMessenger();
    this.subscribeSocketFacebookPageAction();
    this.subscribeSocketWhatsappPageAction();
    if (this.electronService.checkElectronApp()) {
      this.subscribeToSocketUserMailBoxUnread();
    }
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.agencyService.environment.next(
          this.isRmEnvironment
            ? ECRMSystem.RENT_MANAGER
            : ECRMSystem.PROPERTY_TREE
        );
        this.agencyService.getPhoneNumberMinLength.next(
          this.isRmEnvironment ? 10 : 9
        );
        this.subscribeHolidays();
      });

    this.activeRouter.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.currentParams = rs;
        if (
          this.currentParams['mailBoxId'] &&
          this.currentMailboxId &&
          this.currentParams['mailBoxId'] !== this.currentMailboxId &&
          this.listMailBoxs.length
        ) {
          this.triggerSetNewMailBox(
            this.currentParams['mailBoxId'],
            this.listMailBoxs
          );
        }

        if (this.facebookMessengerActive || this.listArchiveMessenger.length) {
          this.triggerSetFacebookMessengerselected();
        }
        if (this.whatsappActive || this.listArchiveWhatsApp.length) {
          this.triggerSetWhatsappSelected();
        }
      });

    this.subscribeToReOpenMessage();
    this.subscribeToSocketMoveEmailStatus();
    this.subscribeToSocketUnreadCountConversation();
    this.subscribeGetRegionByCrm();
    this.fetchTaskFolders();
    this.inboxService
      .getPopupMailBoxState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.mailboxPopup = res;
      });
    this.subscribeCurrentCountry();
    this.subscribeToExportPDFFile();
    this.subscribeTriggerStatisticGlobalTask();
    this.getAllTags();
    this.cacheUpdateService
      .listenToSocketUpdates()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
    this.facebookAccountService.currentPageMessengerActive$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.channelId = res?.id;
      });
    this.whatsappAccountService.currentPageWhatsappActive$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.whatsappChannelId = res.id;
      });
  }

  private subscribeTriggerStatisticGlobalTask() {
    this.statisticService.triggerStatisticGlobalTask$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((_) => this.dashboardApiService.getStatisticGlobalTask()),
        tap((statistic) =>
          this.statisticService.setStatisticGlobalTask(statistic)
        )
      )
      .subscribe();
  }

  private loadStoreData() {
    this.store.select(selectAllMailFolder).subscribe((res) => {
      try {
        this.setMailBoxLabels(res);
      } catch (e) {
        console.error(e);
      } finally {
        const mailBoxId = res?.[0]?.mailBoxId || null;
        const mailBoxIdSocketClient =
          this.inboxService.triggerUpdateFolderClientMailBoxId.getValue();
        // trigger email folder loaded by mailBoxId
        this.folderService.emailFoldersLoaded.next({
          [mailBoxIdSocketClient ? mailBoxIdSocketClient : mailBoxId]: true
        });
      }
    });
  }

  private fetchTaskFolders() {
    const companyId$ = this.companyService
      .getCurrentCompanyId()
      .pipe(filter(Boolean), distinctUntilChanged());

    companyId$
      .pipe(
        takeUntil(this.unsubscribe),
        skip(1) // skip the first time because the folders is loaded when app init by `dashboard-secondary-data.service`
      )
      .subscribe((companyId) => {
        this.store.dispatch(
          taskFolderPageActions.payloadChange({
            payload: { companyId }
          })
        );
      });
  }

  subscribeGetRegionByCrm() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.unsubscribe),
        filter(Boolean),
        switchMap((company) => {
          return this.dashboardApiService.getRegions({
            crmSystemId: company.CRM
          });
        })
      )
      .subscribe((listRegions) => {
        if (listRegions) {
          this.taskService.setListRegion(listRegions);
        }
      });
  }

  subscribeToSocketUnreadCountConversation() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((currentMailBoxId) => {
          return this.websocketService.onSocketUnreadConversationInTask.pipe(
            filter((socketData) => socketData.mailBoxId === currentMailBoxId)
          );
        })
      )
      .subscribe((rs) => {
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
        this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
          this.channelId
        );
      });
  }

  subscribeToExportPDFFile() {
    this.syncMessagePropertyTreeService.triggerExportConversationHistoryAction$
      .pipe(
        takeUntil(this.unsubscribe),
        filter(Boolean),
        mergeMap(({ payload, isDownloadPDFAction }) => {
          const conversationIds = payload.conversations.map(
            (conversation) => conversation.conversationId
          );
          if (isDownloadPDFAction) {
            this.toastCustomService.handleShowDownloadPDFToast(
              EToastType.SYNCING
            );
            this.syncMessagePropertyTreeService.setListConversationStatus({
              conversationIds,
              downloadingPDFFile: true
            });
            this.syncMessagePropertyTreeService.setStoreExportConversationFilePayload(
              payload
            );
            payload.type = 'DOWNLOAD';
            payload.conversations = payload.conversations.map(
              ({ conversationId }) => ({ conversationId })
            );
          }

          return this.syncMessagePropertyTreeService
            .syncMessagePropertyTree(payload)
            .pipe(
              catchError(() => {
                isDownloadPDFAction &&
                  this.toastCustomService.handleShowDownloadPDFToast(
                    EToastType.ERROR
                  );
                return EMPTY;
              }),
              finalize(
                () =>
                  isDownloadPDFAction &&
                  this.syncMessagePropertyTreeService.setListConversationStatus(
                    {
                      conversationIds,
                      downloadingPDFFile: false
                    }
                  )
              )
            );
        })
      )
      .subscribe({
        next: (res) => {
          const { failed, success } = res || {};
          if (failed?.conversations?.length) {
            this.displayDownloadFileToastByStatus(failed);
          } else if (success) {
            this.displayDownloadFileToastByStatus(success);
          }
        }
      });

    this.syncTaskActivityService.triggerExportTaskActivityAction$
      .pipe(
        takeUntil(this.unsubscribe),
        filter(Boolean),
        switchMap(({ payload, isDownloadPDFAction }) => {
          const taskIds = payload?.tasks?.map((task) => task.taskId) || [];
          if (isDownloadPDFAction) {
            this.syncTaskActivityService.setExportingPDFFileTaskIds(taskIds);
            this.toastCustomService.handleShowDownloadPDFToast(
              EToastType.SYNCING,
              true
            );
            this.syncTaskActivityService.setStoreExportTaskActivityPayload(
              payload
            );
            payload.exportType = 'DOWNLOAD';
            payload.tasks = payload.tasks.map(({ taskId }) => ({
              taskId
            }));
          }
          return this.syncTaskActivityService
            .syncTaskActivityToPropertyTree(payload)
            .pipe(
              finalize(() => {
                this.isTriggeredDownloadPDFOption = false;
                isDownloadPDFAction &&
                  this.syncTaskActivityService.setExportingPDFFileTaskIds(
                    taskIds,
                    true
                  );
              }),
              catchError(() => {
                isDownloadPDFAction &&
                  this.toastCustomService.handleShowDownloadPDFToast(
                    EToastType.ERROR
                  );
                return EMPTY;
              })
            );
        })
      )
      .subscribe({
        next: (res) => {
          const { failed, success } = res || {};
          if (failed?.length) {
            this.displayDownloadFileToastByStatus(
              {
                status: SyncPropertyDocumentStatus.FAILED,
                tasks: failed?.length ? failed : []
              },
              true
            );
          } else if (success) {
            this.displayDownloadFileToastByStatus(
              {
                status: SyncPropertyDocumentStatus.SUCCESS,
                tasks: success?.length ? success : []
              },
              true
            );
          }
        }
      });
  }

  displayDownloadFileToastByStatus(
    data: IDownloadPDFFile,
    isTask: boolean = false
  ) {
    const listFile = isTask ? data.tasks : data.conversations;

    switch (data.status) {
      case SyncPropertyDocumentStatus.SUCCESS:
        this.toastCustomService.handleShowDownloadPDFToast(
          EToastType.SUCCESS,
          isTask
        );
        listFile &&
          listFile.forEach((file) => {
            this.filesService.downloadResource(file.mediaLink, file.fileName);
          });
        break;
      case SyncPropertyDocumentStatus.FAILED:
        if (isTask) {
          this.syncTaskActivityService.filterStoreExportTaskActivityPayload(
            listFile?.map((file) => file?.taskId).filter(Boolean) || []
          );
        } else {
          this.syncMessagePropertyTreeService.filterStoreExportConversationFilePayload(
            listFile?.map((file) => file?.conversationId).filter(Boolean) || []
          );
        }
        this.toastCustomService.handleShowDownloadPDFToast(
          EToastType.ERROR,
          isTask
        );
        break;
    }
  }

  subscribeDetectResetSearchContactPage() {
    this.agencyService.triggerResetSearchContact$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((statusReset) => {
        if (statusReset) {
          this.removeSearchValue();
        }
      });
  }

  subscribeToReOpenMessage() {
    this.sharedMessageViewService
      .getMessageToReOpen()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.handleUpdateConversation(res);
      });
  }

  subscribeHolidays() {
    this.agencyService
      .getWorkingHoursExist()
      .pipe(
        filter((el) => !!el.id),
        switchMap((el) => this.calendarService.getHolidaysAPI(el.id))
      )
      .subscribe((res) => {
        this.calendarService.setHolidaysList(res);
      });
  }

  onGetPublishedPromotion() {
    this.promotionApiService.getPublishedPromotion().subscribe((promotion) => {
      this.isShowPromotionsModal = promotion?.length;
      this.promotionsData = promotion[0];
      this.promotionsService.setPromotionId(promotion[0]?.id);
    });
  }

  subscribeSyncResolveSocket() {
    merge(
      this.websocketService.onSocketSyncResolveNote,
      this.websocketService.onSocketSyncConversationToPT
    )
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe({
        next: (socketSync: ISocketSyncConversationToCRM) => {
          const {
            status,
            type,
            conversationSyncDocumentStatus,
            conversationType
          } = socketSync;
          // this.inboxToolbarService.setInboxItem([]);
          // this.inboxToolbarService.setFilterInboxList(false);
          // this.sharedMessageViewService.setIsSelectingMode(false);

          const syncSuccess =
            status === this.SYNC_TYPE.COMPLETED ||
            conversationSyncDocumentStatus === this.SYNC_TYPE.SUCCESS;
          const syncFailed =
            status === this.SYNC_TYPE.FAILED ||
            conversationSyncDocumentStatus === this.SYNC_TYPE.FAILED;
          if (syncSuccess || syncFailed) {
            this.handleShowToastRM(syncSuccess, socketSync);
          }

          if (type === SocketType.syncResolveNote) {
            this.syncResolveMessageService.isSyncToRM$.next(false);
            this.syncResolveMessageService.setListConversationStatus(
              socketSync
            );
          } else {
            this.syncMessagePropertyTreeService.setIsSyncToPT(false);
            this.syncMessagePropertyTreeService.setListConversationStatus(
              socketSync
            );
          }
        },
        error: () => {},
        complete: () => {}
      });
  }

  handleShowToastRM(
    syncSuccess: boolean,
    socket: ISocketSyncConversationToCRM
  ) {
    const user = this.userService.userInfo$?.getValue();
    const { companyId, userId } = socket || {};
    if (
      companyId !== this.currentCompanyId ||
      (!this.isRmEnvironment && userId !== user.id)
    )
      return;
    const syncSuccessMessage = this.isRmEnvironment
      ? 'Sync successfully'
      : 'Conversation synced to Property Tree';
    const syncFailedMessage = this.isRmEnvironment
      ? 'Sync failed'
      : 'Conversation failed to sync to Property Tree';
    this.toastService.show(
      syncSuccess ? syncSuccessMessage : syncFailedMessage,
      '',
      {
        timeOut: 3000
      },
      syncSuccess ? EToastCustomType.SUCCESS : EToastCustomType.ERROR
    );
  }

  handleConversationStatusInDetail(socketRes) {
    this.conversationService.listConversationByTask
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listConverSation) => {
        socketRes?.conversationIds?.forEach((item) => {
          const updateListConversation = listConverSation?.map(
            (conversation) => {
              if (conversation?.id === item) {
                this.conversationService.currentConversation.next({
                  ...conversation,
                  syncStatus: socketRes.status,
                  downloadingPDFFile: socketRes?.downloadingPDFFile,
                  updatedSyncAt: new Date(),
                  conversationSyncDocumentStatus:
                    socketRes.conversationSyncDocumentStatus
                });
                return {
                  ...conversation,
                  syncStatus: socketRes.status,
                  downloadingPDFFile: socketRes?.downloadingPDFFile,
                  updatedSyncAt: new Date(),
                  conversationSyncDocumentStatus:
                    socketRes.conversationSyncDocumentStatus
                };
              }
              return conversation;
            }
          );
          this.conversationService.updatedConversationList.next(
            updateListConversation || []
          );
        });
      });
  }

  handleSyncStatusMessageList() {
    merge([
      this.syncResolveMessageService.getListConversationStatus(),
      this.syncMessagePropertyTreeService.listConversationStatus
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listMessageSyncStatus) => {
        this.handleConversationStatusInDetail(listMessageSyncStatus);
      });
  }

  closePromotionModal(value) {
    this.promotionApiService
      .closePromotion(this.promotionsData['id'])
      .subscribe((x) => {
        this.isShowPromotionsModal = value;
      });
  }

  private async initData() {
    try {
      this.isLoading = this.router?.url == '/dashboard';
      const user = await lastValueFrom(
        this.dashboardApiService.getUserDetail()
      );
      this.popupStatusUser = this.userDashboardService.getPmPortalIsDeleted();
      if (!user) throw new Error('Get user detail fail!');
      this.userDashboardService.setUserDetail(user);
      this.getListMailbox();
      this.getInfoFacebookMessengerintegrate();
      this.getInfoWhatsAppintegrate();
      this.getListArchivedFacebookChannel();
      this.getListArchivedWhatsAppChannel();

      // TEMPORARY FIX
      this.userService.selectedUser.next(user);
      this.userDashboardService.setSelectedUser(user);
      const companies = await lastValueFrom(
        this.dashboardApiService.getUserAgencies(user.id)
      );
      if (!companies?.length || !companies[0]?.id) {
        throw new Error('Get user companies fail!');
      }
      this.chatGptService.setSetting(companies);

      if (!this.currentCompanyId) {
        let companyId = localStorage.getItem('companyId');
        this.currentCompanyId = user?.companyAgents?.some(
          (companyAgent) => companyAgent.companyId === companyId
        )
          ? companyId
          : user?.companyAgents[0]?.companyId;
        if (this.currentCompanyId !== companyId) {
          localStorage.setItem('companyId', this.currentCompanyId);
        }

        this.companyService.setCurrentCompanyId(this.currentCompanyId);
      }
      this.companyService.setCompanies(companies);
    } catch (error) {
      console.error(error);
    } finally {
      const onLoadingOff$ = new Subject<void>();
      this.router.events.pipe(takeUntil(onLoadingOff$)).subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.isLoading = false;
          onLoadingOff$.next();
          onLoadingOff$.complete();
        }
      });
    }
  }

  resetPopupPlanState() {
    this.globalService.setPopupPlanState(null);
    this.popupPlanState = null;
  }

  handlePopupRequest() {
    this.resetPopupPlanState();
  }

  handleChangePlan(requestedPlan: ConfigPlan) {
    const planIndex = Object.values(EAgencyPlan);
    this.planModifyingText =
      this.agencyPlans === EAgencyPlan.CUSTOM ||
      planIndex.indexOf(requestedPlan.requestPlan) >
        planIndex.indexOf(this.agencyPlans)
        ? 'upgrade'
        : 'downgrade';
    this.globalService.setPopupPlanState(EPopupPlanState.CONFIRM_PLAN_POPUP);
  }

  subscribeAgencyActionSocket() {
    combineLatest([
      this.companyService.getCompanies(),
      this.websocketService.onSocketAgencyAction
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(
          (pre, cur) => pre[1]?.socketTrackId === cur[1]?.socketTrackId
        ),
        filter(([companies, socket]) => {
          return (
            companies?.length &&
            socket &&
            !!companies.find((company) => company?.id === socket?.companyId)
          );
        })
      )
      .subscribe(([companies, socket]) => {
        const updatedCompanies = companies.map((company) => {
          if (company?.id === socket?.companyId) {
            return {
              ...company,
              addOns: socket.data?.addOns,
              configPlans: socket.data?.configPlans,
              isActive: socket.data?.mobileApp,
              isAISetting: socket.data?.agencies?.every(
                (it) => it?.agencySetting?.isAISetting
              )
            };
          }
          return company;
        });
        this.companyService.setCompanies(updatedCompanies);
        this.chatGptService.setSetting(updatedCompanies);

        if (socket?.data?.configPlans) {
          this.agencyService.updateCurrentPlan(socket.data.configPlans);
        }
      });
  }

  subscribeAgencyTopicsSocket() {
    this.websocketService.onSocketTopics
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        if (res?.companyId === this.currentCompanyId) {
          this.agencyService.refreshListTopicData();
          this.agencyService.refreshListTaskData();
        }
      });
  }

  subscribeArchiveMailboxSocket() {
    this.websocketService.onSocketArchiveMailbox
      .pipe(
        switchMap(() => this.dashboardApiService.getListMailbox()),
        takeUntil(this.unsubscribe)
      )
      .subscribe((listCompanyAgent) => {
        if (!listCompanyAgent) return;
        this.companyService.setListCompanyAgent(listCompanyAgent);
      });
  }

  subscribeRouter(): void {
    this.router.events.subscribe((event) => {
      this.handleHideSidebar();
    });
  }

  removeSearchValue() {
    localStorage.removeItem('searchText');
    this.userService.setSearchText('');
  }

  subscribeCurrentCompanyId() {
    this.companyService
      .getCurrentCompanyId()
      .pipe(
        filter((companyId) => Boolean(companyId)),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe),
        tap((companyId) => {
          // get published promotions
          const isConsole = this.sharedService.isConsoleUsers();
          if (!isConsole && !!companyId) {
            this.onGetPublishedPromotion();
          }
        })
      )
      .subscribe((companyId) => {
        if (this.currentCompanyId !== companyId) {
          this.getStatisticUnreadTask();
          this.getStatisticUnreadTaskChannel();
          this.getInfoFacebookMessengerintegrate();
          this.getInfoWhatsAppintegrate();
        }
        this.currentCompanyId = companyId;
        // get current plan
        this.agencyService.synchronizePlan().subscribe((res) => {
          if (!res) return;
          this.setIsVoicemailEnabled(res);
          this.agencyService.setCurrentPlan(res);
        });

        // get email signature
        this.companyEmailSignatureService
          .getEmailSignature()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe();
        // get enable suggestion ai
        this.chatGptService
          .getSetting()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe();

        this.propertyService.getProperties(companyId);
        this.propertyService.getPropertiesAllStatus(companyId);

        this.subcribeCalendarEventTask();

        this.dashboardApiService
          .getPortfolios()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe();

        this.authService
          .getPortfoliosByType()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res) {
              this.portfolioService.setPortfoliosByType(res);
            }
          });

        this.dashboardApiService
          .getListAgentPopup()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            this.inboxFilterService.setListDataFilter(res);
          });
        this.agencyService.getListTopic();
        this.agencyService.refreshListTaskData();

        // count notifications
        this.notificationService.getNotificationUnreadCount().subscribe();

        // mailbox
        this.inboxService.refreshedListMailBoxs();
      });
  }

  public subcribeCalendarEventTask() {
    this.inboxFilterLoading.onMultiLoading();
    this.dashboardApiService
      .getCalendarEventTaskApi()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.inboxFilterService.setCalendarEventFilterList(res);
        this.inboxFilterLoading.offMultiLoading();
      });
  }

  setIsVoicemailEnabled(configPlan: ConfigPlan) {
    const isVoicemailEnabled =
      configPlan.plan === EAgencyPlan.ELITE ||
      (configPlan.plan === EAgencyPlan.CUSTOM &&
        configPlan.features[EAddOnType.VOICE_MAIL].state);
    localStorage.setItem('isVoicemailEnabled', String(isVoicemailEnabled));
  }

  getListMailbox() {
    this.dashboardApiService
      .getListMailbox()
      .pipe(
        filter((list) => !!list),
        takeUntil(this.unsubscribe)
      )
      .subscribe((list) => {
        this.companyService.setListCompanyAgent(list);
      });
  }

  getListArchivedFacebookChannel() {
    this.dashboardApiService
      .getListArchivedFacebookChannel()
      .pipe(
        filter((list) => !!list),
        takeUntil(this.unsubscribe)
      )
      .subscribe((list) => {
        this.facebookService.setListArchiveMessenger([...list]);
      });
  }

  getListArchivedWhatsAppChannel() {
    this.dashboardApiService
      .getListArchivedWhatsAppChannel()
      .pipe(
        filter((list) => {
          return !!list;
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((list) => {
        this.whatsappService.setListArchiveWhatsApp([...list]);
      });
  }

  setCurrentMailboxSetting() {
    this.inboxFilterLoading.onMultiLoading();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((currentMailboxId) => {
          if (currentMailboxId)
            return combineLatest([
              this.mailboxSettingApiService.getMailboxSetting(currentMailboxId),
              this.agencyService.getListTaskNames({
                mailBoxId: currentMailboxId
              })
            ]);
          return of([]);
        })
      )
      .subscribe(([mailboxSetting, listTask]) => {
        if (listTask) {
          this.inboxFilterService.setlistTaskEditor(listTask);
          this.agencyService.listTask$.next(listTask);
        }

        if (mailboxSetting) {
          this.mailboxSettingService.setMailboxSetting(mailboxSetting);
          this.mailboxSettingService.setTeamMembersInMailBox(
            (mailboxSetting as IMailboxSetting)?.teamMembers
          );
          this.mailboxSettingService.setIsLoadingSetting(false);
        }
        this.inboxFilterLoading.offMultiLoading();
      });
    combineLatest([
      this.inboxService.refreshedListMailBoxs$.pipe(filter(Boolean)),
      this.companyService.listCompanyAgent$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([_, list]) => {
        if (!list || !this.currentCompanyId) return;
        let listMailBoxes =
          list.find((item) => item.companyId === this.currentCompanyId)
            ?.mailBoxes || [];
        const listNotSharedMailBoxes =
          list.find((item) => item.companyId === this.currentCompanyId)
            ?.mailBoxesNotShared || [];
        listMailBoxes = orderMailboxes(listMailBoxes);
        this.inboxService.setListMailBoxs(listMailBoxes);
        this.inboxService.setListNotSharedMailBoxs(listNotSharedMailBoxes);
        let currentMailBoxId = this.currentParams['mailBoxId'];
        if (
          !currentMailBoxId ||
          currentMailBoxId === 'undefined' ||
          !listMailBoxes.some((mb) => mb.id === currentMailBoxId)
        ) {
          currentMailBoxId =
            listMailBoxes.find((mb) => mb.status !== EMailBoxStatus.ARCHIVE)
              ?.id || '';
        }
        this.triggerSetNewMailBox(currentMailBoxId, listMailBoxes);
      });

    this.mailboxSettingService.senderMailBoxId
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((maiBoxId) => {
          if (maiBoxId)
            return this.mailboxSettingApiService.getMailboxSetting(maiBoxId);
          return of(null);
        })
      )
      .subscribe((mailboxSetting) => {
        if (mailboxSetting) {
          this.mailboxSettingService.setMailboxSetting(mailboxSetting);
          this.mailboxSettingService.setIsLoadingSetting(false);
        }
      });
  }

  setUnreadInbox() {
    combineLatest([
      this.companyService.getCurrentCompanyId(),
      this.companyService.listCompanyAgent$
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          ([companyId, listCompanyAgent]) => !!companyId && !!listCompanyAgent
        ),
        distinctUntilChanged(
          ([prevCompanyId, prevCompany], [currentCompanyId, currCompany]) =>
            prevCompanyId === currentCompanyId &&
            prevCompany.length === currCompany.length
        ),
        switchMap(([companyId, listCompanyAgent]) => {
          return this.mailboxIdsFromCompanyAgent(companyId, listCompanyAgent);
        })
      )
      .subscribe();

    combineLatest([
      this.inboxService.getCurrentMailBoxId(),
      this.statisticService.getStatisticUnreadTabsInbox(
        this.currentParams?.[ETaskQueryParams.SHOW_MESSAGE_IN_TASK] === 'true'
      )
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([mailBoxId, res]) => {
        if (mailBoxId && res && res[mailBoxId]) {
          this.statisticService.updateStatisticUnreadInbox(
            mailBoxId,
            res?.[mailBoxId]?.myInbox || res?.[mailBoxId]?.teamInbox
          );
        }
      });
  }

  handleSetBadgeAppElectron(numberOfUnread) {
    if (this.electronService.checkElectronApp()) {
      this.electronService.ipcRenderer.send(
        COUNT_UNREAD_MESSAGE,
        numberOfUnread
      );
    }
  }

  getStatisticUnreadTask() {
    this.dashboardApiService.getStatisticGlobalTask().subscribe((res) => {
      this.statisticService.setStatisticGlobalTask(res);
    });

    this.dashboardApiService
      .getStatisticTask()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.statisticService.setStatisticUnreadTask(res);
        }
      });

    this.inboxSidebarService.refreshStatisticsUnreadTask$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((mailBoxId) => Boolean(mailBoxId)),
        debounceTime(1000),
        switchMap((mailBoxId: string) => {
          return this.dashboardApiService.getStatisticTask(mailBoxId);
        })
      )
      .subscribe((res) => this.statisticService.setStatisticUnreadTask(res));
  }

  getStatisticUnreadTaskChannel() {
    this.dashboardApiService
      .getStatisticTaskChannel()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.statisticService.setStatisticUnreadTaskChannel(res);
        }
      });

    this.inboxSidebarService.refreshStatisticUnreadTaskChannel$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((channelId) => Boolean(channelId)),
        debounceTime(1000),
        switchMap((channelId: string) => {
          return this.dashboardApiService.getStatisticTaskChannel(channelId);
        })
      )
      .subscribe((res) =>
        this.statisticService.setStatisticUnreadTaskChannel(res)
      );
  }

  setCurrentMailboxSettingValues(agencyId: string, mailbox: IMailBox) {
    this.mailboxSettingService.setCurrentAgencyId(agencyId);
    this.mailboxSettingService.setMailBoxId(mailbox.id);
    this.mailboxSettingService.setRole(mailbox.role);
  }

  subscribeToSocketNewMailboxFolder() {
    this.websocketService.onSocketMailboxFolder
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.type === SocketType.newMailboxFolder) {
          this.inboxService.showFolders.next(true);
          this.store.dispatch(
            mailFolderPageActions.payloadChange({
              payload: { mailBoxId: res?.mailBoxId }
            })
          );
        }
      });
  }

  handleShowToastSuccessOrFailIntegrateMailbox(
    email: string,
    mailBoxId: string,
    status: EMailBoxStatus,
    toastCustomType: EToastCustomType
  ) {
    this.toastCustomService.openToastCustom(
      {
        companyId: this.currentCompanyId,
        isShowToast: true,
        type: SocketType.syncGmail,
        email: email,
        mailBoxId: mailBoxId,
        status: status,
        taskType: TaskType.MESSAGE,
        newStatus: TaskStatusType.inprogress
      },
      true,
      toastCustomType
    );
  }

  subscribeToSocketMailBox() {
    this.websocketService.onSocketSyncMailBox
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.spamFolder) {
          this.inboxService.setSpamFolderImap({
            ...res.spamFolder,
            mailBoxId: res.mailBoxId
          });
        }
        const companyAgents = this.companyService.listCompanyAgentValue;
        const matchedMailbox = companyAgents
          .find((company) => company.companyId === res?.companyId)
          ?.mailBoxes?.find((mailbox) => mailbox.id === res?.mailBoxId);
        if (
          !matchedMailbox ||
          !Object.keys(matchedMailbox)?.length ||
          !res?.status
        )
          return;
        let newListMailboxes = this.inboxService.listMailBoxsValue?.map(
          (mailbox) =>
            mailbox.id === res.mailBoxId
              ? { ...mailbox, status: res.status }
              : mailbox
        );
        const mailBox = this.inboxService.listMailBoxsValue.find(
          (item) => item.id === res.mailBoxId
        );
        switch (res.status) {
          case EMailBoxStatus.SYNCING:
            const regex = /\/inbox\/messages\/all\?.+$/;
            const isInboxPage = this.router.url.match(regex);
            if (
              !isInboxPage &&
              this.currentMailboxId === res?.mailBoxId &&
              !this.mailboxPopup
            ) {
              this.router.navigate(
                ['dashboard', this.currentCompanyId, 'inbox', 'messages'],
                {
                  queryParams: { status: TaskStatusType.inprogress }
                }
              );
            }
            break;
          case EMailBoxStatus.ACTIVE:
            this.inboxSidebarService.refreshStatisticsUnreadTask(
              this.currentMailboxId
            );
            this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
              this.channelId
            );
            this.inboxService.setMailBoxIntegrateId(mailBox.id);
            this.handleShowToastSuccessOrFailIntegrateMailbox(
              mailBox.emailAddress,
              mailBox.id,
              EMailBoxStatus.ACTIVE,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
            this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
              mailBox.id
            );
            break;
          case EMailBoxStatus.FAIL:
            this.inboxSidebarService.syncMailBoxSuccess$.next(true);
            newListMailboxes = newListMailboxes.map((mailbox) => {
              if (mailbox.id === res.mailBoxId) {
                return {
                  ...mailbox,
                  role: mailbox.role ? mailbox.role : [EUserPropertyType.OWNER],
                  lastTimeSync: res?.lastTimeSync
                };
              }
              return mailbox;
            });
            this.handleShowToastSuccessOrFailIntegrateMailbox(
              mailBox.emailAddress,
              mailBox.id,
              EMailBoxStatus.FAIL,
              EToastCustomType.ERROR
            );
            break;
          case EMailBoxStatus.DISCONNECT:
            if (this.currentMailboxId === res?.mailBoxId) {
              this.inboxService.showFolders.next(false);
              this.toastService.error(MAIL_BOX_DISCONNECT);
            }
            break;
          default:
            break;
        }
        this.updateCompanyAgentsWithMailboxes(companyAgents, newListMailboxes);
      });
  }

  updateCompanyAgentsWithMailboxes(
    companyAgents: CompanyAgentCurrentUser[],
    newListMailboxes: IMailBox[]
  ) {
    const updatedCompanyAgents = companyAgents.map((company) =>
      company.companyId === this.currentCompanyId
        ? { ...company, mailBoxes: newListMailboxes }
        : company
    );
    this.companyService.setListCompanyAgent(updatedCompanyAgents);
  }

  subscribeToSocketBulkMail() {
    this.websocketService.onSocketBulkEmail
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        if (rs?.message) {
          if (this.router.url.includes('tenants-landlords')) {
            this.agentUserService.reloadTenantLandlordData.next(true);
          }
        }
        this.toastService.success(rs?.message);
      });
  }

  subscribeSocketMailboxMember() {
    this.websocketService.onSocketUpdateMailboxMember
      .pipe(
        filter((x) => !!x),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.handleUpdateMailbox(res);
      });
  }
  subscribeSocketUpdatePermissionMailBox() {
    this.websocketService.onSocketUpdatePermissionMailBox
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.handleUpdateMailbox(res);
      });
  }

  handleUpdateMailbox(socketMailboxMember: ISocketMailboxMember) {
    const companyAgents = this.companyService.listCompanyAgentValue;
    const newMailbox = socketMailboxMember?.data;
    const matchedMailbox = companyAgents
      .find((agent) => agent.companyId === socketMailboxMember.companyId)
      ?.mailBoxes?.find((mailbox) => mailbox.id === newMailbox?.id);
    if (
      !companyAgents ||
      (newMailbox?.status === EMailBoxStatus.UNSYNC &&
        (matchedMailbox || !newMailbox?.role.includes(EUserPropertyType.OWNER)))
    )
      return;
    const updatedCompanyAgents = companyAgents.map((agent) => {
      if (socketMailboxMember?.companyId === agent?.companyId) {
        if (!matchedMailbox || !Object.keys(matchedMailbox)?.length) {
          if (newMailbox?.status === EMailBoxStatus.UNSYNC) {
            newMailbox.status = EMailBoxStatus.SYNCING;
          }
          return { ...agent, mailBoxes: agent.mailBoxes.concat(newMailbox) };
        } else if (!newMailbox.role || !newMailbox.role.length) {
          const filteredMailboxes = agent.mailBoxes.filter(
            (mailbox) => mailbox.id !== newMailbox.id
          );
          return { ...agent, mailBoxes: filteredMailboxes };
        } else {
          const updatedMailboxes = agent.mailBoxes.map((mailbox) =>
            mailbox.id === newMailbox.id
              ? { ...mailbox, role: newMailbox.role }
              : mailbox
          );
          return { ...agent, mailBoxes: updatedMailboxes };
        }
      }
      return agent;
    });
    this.companyService.setListCompanyAgent(updatedCompanyAgents);
  }
  subscribeSocketDeactivated() {
    this.websocketService.onSocketDeactivatedUser
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.handleUpdateStatusMailBox(res);
      });
  }
  handleUpdateStatusMailBox(socketData: any) {
    const companyAgents = this.companyService.listCompanyAgentValue;
    if (!companyAgents) return;
    const mailBoxIdsNeedArchived = socketData.data.mailBoxArchivedIds || [];
    const updatedCompanyAgents = companyAgents.map((company) => {
      if (company.companyId === socketData.companyId) {
        const mailBoxIdsExisted = company.mailBoxes
          .filter((m) => mailBoxIdsNeedArchived.includes(m.id))
          .map((m) => m.id);

        if (mailBoxIdsExisted && mailBoxIdsExisted.length) {
          const updatedMailboxes = company.mailBoxes.map((mailbox) =>
            mailBoxIdsExisted.includes(mailbox.id)
              ? { ...mailbox, status: EMailBoxStatus.ARCHIVE }
              : mailbox
          );
          return { ...company, mailBoxes: updatedMailboxes };
        }
      }
      return company;
    });
    this.companyService.setListCompanyAgent(updatedCompanyAgents);
  }

  subscribeToSocketStatistic() {
    // subscribe to socket unread task
    // All socket trigger recall task statistics should be added here
    let tempMailboxId = null;
    return merge(
      this.websocketService.onSocketStatisticTask.pipe(
        filter(
          (res) =>
            (res.companyId || res['data']?.companyId) ===
              this.currentCompanyId &&
            this.statusMailBox !== EMailBoxStatus.SYNCING
        )
      ),
      this.websocketService.onSocketMessageToTask.pipe(
        filter(
          (rs) =>
            this.statusMailBox !== EMailBoxStatus.SYNCING &&
            (!rs.mailBoxId || rs.mailBoxId === this.currentMailboxId)
        )
      ),
      this.websocketService.onSocketStatisticTaskChannel.pipe(
        filter(
          (rs) =>
            this.statusMailBox !== EMailBoxStatus.SYNCING &&
            (!rs.mailBoxId || rs.mailBoxId === this.currentMailboxId)
        )
      ),
      this.websocketService.onSocketNewUnreadNoteData,
      this.websocketService.onSocketMessage
    ).pipe(
      debounce((data) =>
        tempMailboxId === data.mailBoxId ? timer(1000) : of({})
      ),
      tap((data) => (tempMailboxId = data.mailBoxId))
    );
  }

  subscribeSocketStatisticAndUnreadMailbox() {
    this.subscribeToSocketStatistic()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((data) => {
          return forkJoin([
            this.dashboardApiService.getStatisticTask(data?.mailBoxId),
            this.dashboardApiService.getStatisticGlobalTask(),
            this.dashboardApiService.getStatisticTaskChannel()
          ]).pipe(
            tap(([statisticTask, statisticGlobal, statisticTaskChannel]) => {
              if (statisticTask)
                this.statisticService.setStatisticUnreadTask(statisticTask);
              if (statisticGlobal)
                this.statisticService.setStatisticGlobalTask(statisticGlobal);
              if (statisticTaskChannel)
                this.statisticService.setStatisticUnreadTaskChannel(
                  statisticTaskChannel
                );
            }),
            switchMap(() => {
              if (
                this.statusMailBox === EMailBoxStatus.SYNCING ||
                !data?.mailBoxId
              )
                return of(null);
              return this.mailboxIdsFromSocket(data.mailBoxId);
            })
          );
        })
      )
      .subscribe();
  }

  subscribeToSocketUpdateAgencyStatus() {
    this.websocketService.onSocketUpdateAgencyStatus
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.agencyId === this.currentCompanyId) {
          this.companyService.setActiveMobileApp(res.isActive);
        }
      });
  }

  subscribeToSocketUpdateAgencyTimezone() {
    this.websocketService.onSocketUpdateAgencyTimezone
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe(async (res) => {
        if (this.currentUser?.id) {
          const companies = await lastValueFrom(
            this.dashboardApiService.getUserAgencies(this.currentUser?.id)
          );
          if (!companies?.length || !companies[0]?.id) {
            throw new Error('Get user agencies fail!');
          }
          this.companyService.setCompanies(companies);
        }
      });
  }

  subscribeNavigation() {
    this.router.events
      .pipe(
        takeUntil(this.unsubscribe),
        filter((event) => event instanceof NavigationEnd),
        switchMap(
          (event: NavigationEnd) => this.actionLinkService.isChangeUrl$
        ),
        filter((data) => !!data)
      )
      .subscribe(() => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = this.router.url;
      });
    this.router.events
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          (event) =>
            event instanceof NavigationEnd || event instanceof ResolveEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.updateValidMailboxSelection();

        this.previousUrl = this.currentUrl;
        this.currentUrl = event.urlAfterRedirects;
        const params = event.urlAfterRedirects.split('/');
        this.isHiddenSidebar = (params || []).some((param) =>
          Object.values(ERouterHiddenSidebar).includes(
            param as ERouterHiddenSidebar
          )
        );
        if (
          (this.previousUrl !== this.currentUrl &&
            this.helper.isDashboardInbox &&
            !this.helper.isInboxDetail) ||
          this.helper.isDashboardTask ||
          this.helper.isDashboardEvent ||
          this.helper.isDashboardContact ||
          this.helper.isDashboardInsight
        ) {
          this.actionLinkService.setPreviousUrl(this.previousUrl);
        }
      });
  }

  subscribeShowWMailboxPerWarning() {
    combineLatest([
      this.notificationService.openModalWarningFromNoti$,
      this.errorService.ishowMailBoxPermissionWarning$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([openFromNoti, isShowWarning]) => {
        this.isShowMailboxPerWarning = isShowWarning;
        this.isOpenWarningFromNoti = openFromNoti;
      });
  }

  mailboxIdsFromSocket(mailBoxId: string) {
    return this.getUnreadMailboxList([mailBoxId]);
  }

  mailboxIdsFromCompanyAgent(
    companyId: string,
    companyAgents: CompanyAgentCurrentUser[]
  ) {
    const mailBoxIds =
      companyAgents
        ?.find((item) => item.companyId === companyId)
        ?.mailBoxes?.map((item) => item.id) || [];
    return this.getUnreadMailboxList(mailBoxIds, 3000);
  }

  getUnreadMailboxList(mailBoxIds: Array<string>, timer: number = 0) {
    if (!mailBoxIds.length) {
      this.statisticService.setStatisticUnreadInbox({});
    }

    return of(mailBoxIds.length).pipe(
      takeUntil(this.unsubscribe),
      auditTime(timer),
      filter((value) => !!value),
      mergeMap(() =>
        this.apiService.postAPI(conversations, `unread-mailbox-list`, {
          mailBoxIds
        })
      ),
      tap((res) => {
        if (res) {
          this.statisticService.setStatisticUnreadInbox(res);
        }
      })
    );
  }

  handleClosePopupStatusUser() {
    this.popupStatusUser = false;
  }

  handleCloseWarningMailbox() {
    this.errorService.handleShowMailBoxPermissionWarning(false);
    if (this.isOpenWarningFromNoti) {
      this.notificationService.setOpenModalWarningFromNoti(false);
      return;
    }
    const firstMailActive = this.listMailBoxs.filter(
      (mailbox) => mailbox.status !== EMailBoxStatus.ARCHIVE
    )?.[0]?.id;

    const isTaskDetail =
      this.currentUrl.includes('/inbox/detail/') &&
      !this.currentUrl.includes('/internal-note');
    const isMessageDetail = this.currentUrl.includes('/inbox/messages');
    const isInternalNoteDetail = this.currentUrl.includes('/internal-note');

    if (isTaskDetail || isMessageDetail) {
      this.router.navigate(['/dashboard', 'inbox'], {
        queryParams: { mailBoxId: firstMailActive }
      });
    } else if (isInternalNoteDetail) {
      this.location.back();
    }
  }

  getListMailBoxs() {
    this.inboxService.listMailBoxs$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listMailBoxs) => {
        if (!listMailBoxs) return;
        this.listMailBoxs = listMailBoxs;
      });
  }

  getCurrentUser() {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.currentUser = rs;
      });
  }

  onCurrentMailBoxChanges() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((mailBoxId) => !!mailBoxId),
        distinctUntilChanged((prev, curr) => prev === curr)
      )
      .subscribe((mailBoxId) => {
        this.currentMailboxId = mailBoxId;
        this.reminderMessageService.getMessageReminderSetting(
          this.currentMailboxId
        );
      });
  }

  //fresh list email folder (call api 'mailbox/mail-folder')
  subscribeRefreshEmailFolderMailBoxId() {
    this.inboxService.refreshEmailFolderMailBox$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((mailBox) => !!mailBox),
        distinctUntilChanged((prev, curr) => prev === curr)
      )
      .subscribe((mailBox) => {
        if (!mailBox) return;
        const listEmailFolder = this.folderService.getEmailFolderByMailBoxId(
          mailBox.id
        );
        if (!mailBox.id || listEmailFolder?.tree?.length) return;
        this.refreshEmailFolderMailBox = mailBox;
        this.store.dispatch(
          mailFolderPageActions.payloadChange({
            payload: { mailBoxId: this.refreshEmailFolderMailBox.id }
          })
        );
      });
  }

  private setMailBoxLabels(folders) {
    const mailBoxId = folders?.[0]?.mailBoxId || null;
    const mailBoxIdSocketClient =
      this.inboxService.triggerUpdateFolderClientMailBoxId.getValue();
    const currentMailBoxId = mailBoxIdSocketClient
      ? mailBoxIdSocketClient
      : mailBoxId;
    this.folderService.buildTree(folders, currentMailBoxId);
  }

  onSocketTaskFolder() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        switchMap((currentMailBoxId) =>
          this.websocketService.onSocketTaskFolder.pipe(
            takeUntil(this.unsubscribe),
            distinctUntilChanged(),
            debounceTime(DEBOUNCE_SOCKET_TIME),
            filter((res) => res?.mailBoxId === currentMailBoxId)
          )
        )
      )
      .subscribe((res) => {
        if (res) {
          if (res?.fromUserId === this.currentUser?.id) return;
          switch (res.type) {
            case SocketType.createTaskFolder:
              this.inboxSidebarService.handleSocketCreateTaskFolder(res.data);
              break;
            case SocketType.updateTaskFolder:
              this.inboxSidebarService.handleSocketUpdateTaskFolder(res.data);
              break;
            case SocketType.deletedTaskFolder:
              this.inboxSidebarService.handleSocketDeleteTaskFolder(res.data);
              break;
          }
        }
      });
  }

  subscribeToSocketUserMailBoxUnread() {
    this.websocketService.onSocketUserMailBoxUnread
      .pipe(
        distinctUntilChanged(),
        filter((res) => !!res),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.handleSetBadgeAppElectron(res.unreadCount);
      });
  }

  @HostListener('window:resize', ['$event'])
  handleHideSidebar = () => {
    const { innerWidth } = window;
    this.isDisplay =
      innerWidth < 1160 ? this.router.url.includes('/inbox/detail/') : false;
  };

  private handleGetListConversation(listMessageResolve: TaskItem[]) {
    if (!listMessageResolve) return;
    let listConverSation;
    if (
      [EActionSyncResolveMessage.COMPLETED_AND_TASK_DETAIL].includes(
        this.actionSyncResolveMessage as EActionSyncResolveMessage
      )
    ) {
      listConverSation =
        this.addPropertyInfoToConversations(listMessageResolve);
    }
    if (
      [EActionSyncResolveMessage.SEND_MESSAGE_RESOLVE].includes(
        this.actionSyncResolveMessage as EActionSyncResolveMessage
      )
    ) {
      listConverSation = listMessageResolve.map((item) => ({
        ...item?.conversations,
        propertyId: item?.propertyId,
        streetline: item?.streetline,
        propertyType: item?.conversations?.['startMessageBy']
      }));
    }
    return listConverSation;
  }

  addPropertyInfoToConversations(listMessageResolve) {
    if (!listMessageResolve) return;
    return listMessageResolve
      .filter((item) => item?.conversations && item?.conversations?.length > 0)
      .map((item) => {
        if (!item.conversations?.length) return;
        return item?.conversations?.map((conversation) => ({
          ...conversation,
          propertyId: item?.property?.id,
          streetline: item?.property?.streetline,
          textContent: conversation?.message,
          title: item?.indexTitle || ''
        }));
      })
      .flat();
  }

  private handleSaveToRentManager(listConversation: PreviewConversation[]) {
    this.resetListConfirmProperties();
    if (!listConversation?.length) return;
    listConversation.forEach((item) => {
      if (
        confirmPropertyType.includes(
          item.startMessageBy as EUserPropertyType
        ) ||
        ([EUserPropertyType.LANDLORD, EUserPropertyType.OWNER].includes(
          item.startMessageBy as EUserPropertyType
        ) &&
          !item.streetline)
      ) {
        this.listConversationConfirmProperties.listConversationNotMove.push(
          item
        );
      } else {
        this.listConversationConfirmProperties.listConversationMove.push(item);
      }
    });
    this.handleShowConfirmPropertiesModal();
  }

  handleShowConfirmPropertiesModal() {
    if (this.listConversationConfirmProperties) {
      if (
        !this.listConversationConfirmProperties.listConversationNotMove?.length
      ) {
        this.listConversationConfirmProperties.listConversationMove.concat(
          this.listConversationConfirmProperties?.listConversationNotMove
        );
        this.dataConfirmedProperties =
          this.listConversationConfirmProperties.listConversationMove;
        this.onSyncConversationToCRM();
        this.isShowModalConfirmProperties = false;
      } else {
        this.isResolveMsgInTaskDetail =
          this.listConversationConfirmProperties?.listConversationNotMove[0]?.[
            'taskType'
          ] === TaskType.TASK;
        this.isActionSyncConversationToRM = true;
        this.isShowModalConfirmProperties = true;
      }
    }
  }

  onSyncConversationToCRM() {
    const payload = this.dataConfirmedProperties.map((conversation) => ({
      propertyId: conversation.propertyId,
      conversationId: conversation.id
    }));
    const listConverSationStatusSyncing = {
      conversationIds: payload.map((item) => item.conversationId),
      status: this.SYNC_TYPE.INPROGRESS
    };
    if (this.isRmEnvironment) {
      this.syncResolveMessageService.setListConversationStatus(
        listConverSationStatusSyncing
      );
      this.syncResolveMessageService.isSyncToRM$.next(true);
      this.syncResolveMessageService
        .syncResolveMessageNoteProperties(payload)
        .subscribe(() => {});
    } else {
      this.syncMessagePropertyTreeService.setListConversationStatus(
        listConverSationStatusSyncing
      );
      this.syncMessagePropertyTreeService.setIsSyncToPT(true);
      this.syncMessagePropertyTreeService
        .syncMessagePropertyTree({
          conversations: payload,
          mailBoxId: this.currentMailboxId
        })
        .subscribe();
    }
  }

  resetListConfirmProperties() {
    this.listConversationConfirmProperties = {
      listConversationMove: [],
      listConversationNotMove: []
    };
    this.isShowModalConfirmProperties = false;
    this.isActionSyncConversationToRM = false;
  }

  handleConfirmProperties() {
    this.taskService
      .getListConfirmProperties()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.dataConfirmedProperties = [
          ...res.listConversationMove,
          ...res.listConversationNotMove.filter((item) => item.isChecked)
        ];
      });
    this.onSyncConversationToCRM();
  }

  handleCancelConfirmProperties(e) {
    this.isShowModalConfirmProperties = e;
    this.isActionSyncConversationToRM = e;
    this.resetListConfirmProperties();
  }

  handleUpdateConversation(input: IConversationMove) {
    const { currentConversation, currentMailBoxId, isAppMessage } = input;
    const currentTaskId = this.taskService.currentTaskId$.getValue();

    this.taskService
      .changeTaskStatus(currentTaskId, TaskStatusType.inprogress)
      .subscribe((res) => {
        if (res) {
          this.headerService.setConversationAction({
            option: EMessageMenuOption.REOPEN,
            taskId: currentTaskId,
            isTriggeredFromRightPanel: true,
            conversationId: currentConversation?.id
          });
          const dataForToast = {
            conversationId: currentConversation?.id,
            taskId: currentTaskId,
            isShowToast: true,
            type: SocketType.changeStatusTask,
            mailBoxId: currentMailBoxId,
            taskType: TaskType.MESSAGE,
            status: TaskStatusType.inprogress,
            pushToAssignedUserIds: [],
            isAppMessage: isAppMessage ? true : false,
            conversationType: currentConversation?.conversationType
          };
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
          this.loadingService.onLoading();
          this.conversationService
            .updateStatus(
              EConversationType.open,
              currentConversation?.id,
              currentConversation?.isSendViaEmail,
              ''
            )
            .subscribe((res) => {
              if (res) {
                this.conversationService.reloadConversationList.next(true);
                this.loadingService.stopLoading();
              }
            });
        }
      });
  }

  private subscribeToSocketMoveEmailStatus() {
    this.websocketService.onSocketMoveEmailStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        const spamTitle = [
          EToastSocketType.NOT_SPAM,
          EToastSocketType.REPORT_SPAM,
          EToastSocketType.UNDO_SPAM
        ];
        if (
          res?.fromUserId === this.currentUser?.id &&
          res?.companyId === this.currentCompanyId
        ) {
          if (!res?.total) {
            this.toastService.clear();
            this.toastService.success(CAN_NOT_MOVE);
            return;
          }
          if (spamTitle.includes(res?.typeMove)) {
            const threadIds = res?.listSuccess
              .filter((item) => !item.isTask)
              .map((item) => item.threadId);
            const conversationIds = res?.listSuccess
              .filter((item) => item.isTask)
              .map((item) => item.conversationId);
            const dataUndoSpam = {
              mailBoxId: res?.mailBoxId,
              conversationIds,
              threadIds,
              ...(this.currentParams[EMessageQueryType.MESSAGE_STATUS] !==
              TaskStatusType.mailfolder
                ? { currentStatus: res?.currentStatus }
                : { currentLabelId: res?.currentLabel?.id })
            };

            switch (res?.typeMove) {
              case EToastSocketType.REPORT_SPAM:
                const dataForToastSpam = {
                  title: GET_TITLE_REPORT_SPAM(
                    true,
                    res?.provider === EmailProvider.GMAIL,
                    res?.listSuccess.length
                  ),
                  message:
                    res?.listSuccess.length > 1
                      ? ''
                      : res?.listSuccess?.[0].title
                };
                this.toastCustomService.setDataUndoSpam(dataUndoSpam);
                this.toastService.clear();
                this.toastCustomService.openToastCustom(
                  dataForToastSpam,
                  true,
                  EToastCustomType.SUCCESS_WITH_UNDO_BTN
                );
                break;
              case EToastSocketType.NOT_SPAM:
                const dataForToastNotSpam = {
                  title: GET_TITLE_REPORT_SPAM(
                    false,
                    res?.provider === EmailProvider.GMAIL,
                    res?.listSuccess.length
                  ),
                  message:
                    res?.listSuccess.length > 1
                      ? ''
                      : res?.listSuccess?.[0].title
                };
                this.toastCustomService.setDataUndoSpam(dataUndoSpam);
                this.toastService.clear();
                this.toastCustomService.openToastCustom(
                  dataForToastNotSpam,
                  true,
                  EToastCustomType.SUCCESS_WITH_UNDO_BTN
                );
                break;
              case EToastSocketType.UNDO_SPAM:
                this.toastService.clear();
                break;
              default:
                break;
            }
          } else {
            this.inboxSidebarService.refreshStatisticsUnreadTask(
              this.currentMailboxId
            );
            this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
              this.channelId
            );
            if (res.isShowToast === false) return;
            if (res?.listSuccess?.length === 1 || res?.isRemoveFromTask) {
              const conversationNeedNavigate = res?.isRemoveFromTask
                ? res.listSuccess.find(
                    (item) => item.mailBoxType === EMailBoxType.COMPANY
                  ) || res?.listSuccess?.[0]
                : res?.listSuccess?.[0];

              const dataForToast = {
                conversationId: conversationNeedNavigate?.conversationId,
                conversationType: conversationNeedNavigate?.conversationType,
                isAppMessage:
                  conversationNeedNavigate?.conversationType ===
                  EConversationType.APP,
                taskId: conversationNeedNavigate?.taskId,
                isShowToast: true,
                type: SocketType.moveToFolder,
                mailBoxId: res?.isRemoveFromTask
                  ? conversationNeedNavigate.mailBoxId
                  : res?.mailBoxId,
                taskType: TaskType.EMAIL,
                status: res?.newStatus || 'FOLDER',
                pushToAssignedUserIds: [],
                mailFolderId: res?.newLabel?.externalId,
                threadId:
                  res?.typeMove === SocketType.mailToInbox
                    ? ''
                    : conversationNeedNavigate.threadId,
                folderName: res?.newLabel?.name
              };
              this.toastService.clear();
              this.toastCustomService.openToastCustom(
                dataForToast,
                true,
                EToastCustomType.SUCCESS_WITH_VIEW_BTN
              );
            } else {
              this.toastService.clear();
              if (res?.typeMove === EToastSocketType.REPORT_SPAM) {
                this.toastService.success(
                  `${res?.total} ${
                    res?.total > 1 ? 'messages ' : 'message'
                  } marked as ${
                    res?.provider === EmailProvider.GMAIL ? 'spam' : 'junk'
                  }`
                );
              } else if (res?.typeMove === EToastSocketType.NOT_SPAM) {
                this.toastService.success(
                  `${res?.total} ${
                    res?.total > 1 ? 'messages ' : 'message'
                  }  unmarked as ${
                    res?.provider === EmailProvider.GMAIL ? 'spam' : 'junk'
                  }`
                );
              } else {
                this.toastService.success(
                  `${res?.total} ${res?.total > 1 ? 'messages ' : 'message '}` +
                    (res?.newStatus
                      ? this.MESSAGE_MOVE_TOAST[res?.newStatus]
                      : `moved to ${res?.newLabel?.name} folder`)
                );
              }
            }
          }
        }
      });
  }
  handleCloseModal(event: boolean) {
    this.visible = false;
    this.isShowPopupMerge = false;
  }
  subscribeOpenPopup() {
    this.mailboxSettingService
      .isOpenPopupEnquiry()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isShowPopupMerge = res;
      });
  }
  handleSelectedReplies(event) {
    this.selectedReplies = event;
  }

  subscribeSyncTasksActivity() {
    this.websocketService.onSocketSyncTaskActivityToPT.subscribe({
      next: (socketSync: ISocketSyncTaskActivityToPT) => {
        const { status, companyId, userId } = socketSync;
        if (
          !(this.currentCompanyId === companyId) &&
          !(this.currentUser?.id === userId)
        )
          return;
        this.taskService.setCurrentTaskActivity(socketSync);
        this.showToastSyncTaskActivityToPT(status);
        this.taskService.reloadTaskDetail.next(true);
      },
      error: () => {},
      complete: () => {}
    });
  }
  showToastSyncTaskActivityToPT(syncStatus: ESyncStatus) {
    const toastConfig = {
      [ESyncStatus.SUCCESS]: {
        message: 'Task activity synced to Property Tree',
        toastType: EToastType.SUCCESS,
        timeOut: 3000
      },
      [ESyncStatus.PENDING]: {
        message: 'Task activity is syncing',
        toastType: EToastType.SYNCING,
        timeOut: 300000000
      },
      [ESyncStatus.FAILED]: {
        message: 'Activities fail to save to Property Tree',
        toastType: EToastType.ERROR,
        timeOut: 3000
      }
    };

    if ([ESyncStatus.PENDING].includes(syncStatus)) {
      this.toastSyncActivityTasks = this.toastService.show(
        toastConfig[syncStatus]?.message,
        '',
        {
          timeOut: toastConfig[syncStatus]?.timeOut
        },
        toastConfig[syncStatus]?.toastType
      );
    }
    if ([ESyncStatus.FAILED, ESyncStatus.SUCCESS].includes(syncStatus)) {
      this.toastService.clear();
      this.toastSyncActivityTasks.onHidden.subscribe(() => {
        this.toastService.show(
          toastConfig[syncStatus]?.message,
          '',
          {
            timeOut: toastConfig[syncStatus]?.timeOut
          },
          toastConfig[syncStatus]?.toastType
        );
      });
    }
  }

  handleSyncTasksActivity() {
    this.syncTaskActivityService.listTaskActivity$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe(({ tasks, isDownloadPDFOption }) => {
        this.isTriggeredDownloadPDFOption = isDownloadPDFOption;
        this.resetListTaskConfirmProperties();
        const tasksFormat = tasks.map((item) => ({
          ...item,
          propertyId: item?.property.id
        }));
        if (!tasksFormat?.length) return;
        tasksFormat.forEach((item) => {
          if (
            !item?.property?.streetline &&
            !item?.property?.shortenStreetline &&
            !isDownloadPDFOption
          ) {
            this.listTaskConfirmProperties.listConversationTaskNotMove.push(
              item
            );
          } else {
            this.listTaskConfirmProperties.listConversationTaskMove.push(item);
          }
        });
        this.showConfirmTaskPropertiesModal();
      });
  }

  showConfirmTaskPropertiesModal() {
    if (this.listTaskConfirmProperties) {
      if (
        !this.listTaskConfirmProperties.listConversationTaskNotMove?.length ||
        this.isTriggeredDownloadPDFOption
      ) {
        this.listTaskConfirmProperties.listConversationTaskMove.concat(
          this.listTaskConfirmProperties?.listConversationTaskNotMove
        );
        this.dataTaskConfirmedProperties =
          this.listTaskConfirmProperties.listConversationTaskMove;
        this.onSyncTaskActivityToPT();
        this.isShowModalConfirmTaskProperties = false;
      } else {
        this.isShowModalConfirmTaskProperties = true;
      }
    }
  }

  onSyncTaskActivityToPT() {
    const tasksActivity = this.dataTaskConfirmedProperties.map((item) => ({
      taskId: item.id,
      propertyId: item.propertyId
    }));
    const payload = {
      tasks: tasksActivity,
      syncTaskType: ESyncTaskType.Activity,
      mailBoxId: this.currentMailboxId
    };

    this.syncTaskActivityService.setTriggerExportTaskActivityAction(
      payload,
      this.isTriggeredDownloadPDFOption
    );

    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setListToolbarConfig([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
  }
  handleConfirmTaskProperties() {
    this.taskService
      .getConversationsTaskConfirmProperties()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.dataTaskConfirmedProperties = [
          ...res.listConversationTaskMove,
          ...res.listConversationTaskNotMove.filter((item) => item.isSelected)
        ];
      });
    this.onSyncTaskActivityToPT();
  }
  resetListTaskConfirmProperties() {
    this.listTaskConfirmProperties = {
      listConversationTaskMove: [],
      listConversationTaskNotMove: []
    };
    this.isShowModalConfirmTaskProperties = false;
  }

  subscribeCurrentCountry() {
    this.countryService.currentInformationCountry$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentInforCountry) => {
        setCurrentCountry(currentInforCountry.countryName);
      });
  }

  subscribeSocketFacebookPageAction() {
    this.websocketService.onSocketFacebookPageAction
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => !!res)
      )
      .subscribe((res) => {
        if (res.status === EPageMessengerConnectStatus.ARCHIVED) {
          this.facebookService.setListArchiveMessenger([
            res,
            ...this.listArchiveMessenger
          ]);
        }

        const data = this.facebookMessengerActive
          ? {
              ...this.facebookMessengerActive,
              ...res
            }
          : res;
        this.facebookAccountService.currentPageMessengerActive$.next(data);
        // whatsappfix
      });
  }

  subscribeSocketWhatsappPageAction() {
    this.websocketService.onSocketWhatsappPageAction
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => !!res)
      )
      .subscribe((res) => {
        if (res.status === WhatsAppConnectStatus.ARCHIVED) {
          this.whatsappService.setListArchiveWhatsApp([
            res,
            ...this.listArchiveWhatsApp
          ]);
        }

        const data = this.whatsappActive
          ? {
              ...this.whatsappActive,
              ...res
            }
          : res;
        this.whatsappAccountService.currentPageWhatsappActive$.next(data);
        // whatsappfix
      });
  }

  /**
   * Ensures the user has access to a valid mailbox.
   * If the current mailbox is not accessible, it selects a valid mailbox.
   */
  private updateValidMailboxSelection() {
    const listMailBoxes = this.inboxService.listMailBoxsValue;
    if (
      this.currentMailboxId &&
      !this.helper.isInboxDetail &&
      listMailBoxes?.length &&
      !listMailBoxes.some((item) => item.id === this.currentMailboxId)
    ) {
      let currentMailBoxId =
        listMailBoxes.find((mb) => mb.status !== EMailBoxStatus.ARCHIVE)?.id ||
        '';
      if (this.mailboxPopup === EMailBoxPopUp.ASSIGN_TEAM) {
        currentMailBoxId = this.currentParams['mailBoxId'];
      }
      this.triggerSetNewMailBox(currentMailBoxId, listMailBoxes);
    }
  }

  triggerSetNewMailBox(mailBoxId, listMailBoxes: IMailBox[]) {
    const mailBox =
      listMailBoxes.find((mailbox) => mailbox.id === mailBoxId) ??
      listMailBoxes[0];
    if (mailBox) {
      this.inboxService.setIsArchiveMailbox(
        mailBox.status === EMailBoxStatus.ARCHIVE
      );
      this.inboxService.setIsDisconnectedMailbox(
        mailBox.status === EMailBoxStatus.DISCONNECT
      );
      this.statusMailBox = mailBox.status;
      this.inboxService.setSyncMailBoxStatus(mailBox.status);
      this.inboxService.setCurrentMailBoxId(mailBox.id);
      this.inboxService.setCurrentMailBox(mailBox);
      this.setCurrentMailboxSettingValues(this.currentCompanyId, mailBox);
      this.inboxService.setMailBoxRole(mailBox.role);
      this.inboxSidebarService.setAccountAdded(true);
    } else {
      this.inboxSidebarService.setAccountAdded(false);
      this.inboxService.setSyncMailBoxStatus(EMailBoxStatus.INACTIVE);
    }
  }

  handleCancelConfirmTaskProperties(e) {
    this.isShowModalConfirmTaskProperties = e;
    this.resetListTaskConfirmProperties();
  }

  getAllTags() {
    this.aiPolicyService
      .getAllTag()
      .pipe(tap((tags) => this.aiPolicyService.setTags(tags)))
      .subscribe();
  }

  getInfoFacebookMessengerintegrate() {
    this.facebookApiService
      .getInfoFacebookMessengerintegrate()
      .subscribe((res) => {
        this.facebookAccountService.currentPageMessengerActive$.next(res);
      });
  }

  getInfoWhatsAppintegrate() {
    this.whatsappApiService.getInfoWhatsAppIntegrate().subscribe((res) => {
      this.whatsappActive = res;
      this.whatsappAccountService.currentPageWhatsappActive$.next(res);
      this.whatsappService.setWhatsappConnected(
        res?.status === EPageMessengerConnectStatus.ACTIVE
      );
    });
  }

  getAllListFacebookMessenger() {
    combineLatest([
      this.facebookAccountService.currentPageMessengerActive$,
      this.facebookService.listArchiveMessenger$
    ])
      .pipe(
        filter(
          ([currentFacebookPage, listArchiveMessengerData]) =>
            !!currentFacebookPage || !!listArchiveMessengerData
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([currentFacebookPage, listArchiveMessengerData]) => {
        this.facebookService.setFacebookConnected(
          currentFacebookPage?.status === EPageMessengerConnectStatus.ACTIVE
        );
        this.listArchiveMessenger = [...listArchiveMessengerData];
        this.facebookMessengerActive = currentFacebookPage;
        if (this.currentParams) this.triggerSetFacebookMessengerselected();
      });

    combineLatest([
      this.whatsappAccountService.currentPageWhatsappActive$,
      this.whatsappService.listArchiveWhatsApp$
    ])
      .pipe(
        filter(
          ([currentWhatsappPage, listArchiveWhatsApp]) =>
            !!currentWhatsappPage || !!listArchiveWhatsApp
        )
      )
      .subscribe(([currentWhatsappPage, listArchiveWhatsApp]) => {
        this.whatsappService.setWhatsappConnected(
          currentWhatsappPage?.status === WhatsAppConnectStatus.ACTIVE
        );
        this.listArchiveWhatsApp = [...listArchiveWhatsApp];
        // fix archive whatsapp
        this.whatsappActive = currentWhatsappPage;
        if (this.currentParams) this.triggerSetWhatsappSelected();
      });
  }

  triggerSetFacebookMessengerselected() {
    const pageMessengers = [...this.listArchiveMessenger];
    if (this.facebookMessengerActive)
      pageMessengers.push(this.facebookMessengerActive);

    this.facebookService.setFacebookMessengerSelected(
      this.currentParams['channelId']
        ? pageMessengers.find(
            (item) => item.id === this.currentParams['channelId']
          )
        : null
    );
  }

  triggerSetWhatsappSelected() {
    const pageMessengers = [...this.listArchiveWhatsApp];
    if (this.whatsappActive) pageMessengers.push(this.whatsappActive);
    this.whatsappService.setWhatsAppSelected(
      this.currentParams['channelId']
        ? pageMessengers.find(
            (item) => item.id === this.currentParams['channelId']
          )
        : null
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.handleSetBadgeAppElectron(0);
  }
}
