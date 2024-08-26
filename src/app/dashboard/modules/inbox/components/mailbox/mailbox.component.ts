import { LoadingService } from '@services/loading.service';
import { InboxService } from './../../services/inbox.service';
import {
  CompanyAgentCurrentUser,
  IMailBox
} from '@shared/types/user.interface';
import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  ViewChild,
  OnDestroy,
  NgZone
} from '@angular/core';
import {
  Subject,
  takeUntil,
  switchMap,
  filter,
  tap,
  combineLatest,
  of,
  distinctUntilChanged,
  debounceTime
} from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import {
  configGoogleApplication,
  outlookAuthUrl
} from 'src/environments/environment';
import {
  ISharedMailboxForm,
  ResponseAuth
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ToastrService } from 'ngx-toastr';
import {
  EMailBoxPopUp,
  EMailBoxStatus,
  EMailBoxType,
  EmailProvider
} from '@shared/enum/inbox.enum';
import { MessageApiService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-api.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { EMailProcess } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { collapseMotion, expandCollapse } from '@core';
import { InboxToolbarService } from './../../services/inbox-toolbar.service';
import { SharedService } from '@services/shared.service';
import { EMAIL_SYNC_TYPE } from '@/app/mailbox-setting/utils/constant';
import {
  INTEGRATE_IMAP_MAILBOX_FAILED,
  INTEGRATE_IMAP_MAILBOX_SUCCESSFUL,
  INTEGRATING_MAILBOX,
  MAIL_BOX_DISCONNECT,
  MAIL_BOX_SYNC_FAILED,
  SHARED_MAIL_BOX_FAILED
} from '@services/messages.constants';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { UserService } from '@services/user.service';
import { ErrorService } from '@services/error.service';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskStatusType } from '@shared/enum/task.enum';
import { SharedWorkerService } from '@/app/shared-worker.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { ImapForm } from '@shared/types/inbox.interface';
import { TaskService } from '@services/task.service';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { env } from 'src/environments/environment';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { DEBOUNCE_SOCKET_TIME } from '@/app/dashboard/utils/constants';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import * as Sentry from '@sentry/angular-ivy';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { CompanyService } from '@services/company.service';
import { Store } from '@ngrx/store';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { SocketType } from '@shared/enum';

@Component({
  selector: 'mailbox',
  templateUrl: './mailbox.component.html',
  styleUrls: ['./mailbox.component.scss'],
  providers: [MessageApiService],
  animations: [collapseMotion, expandCollapse]
})
export class MailboxComponent implements OnInit, OnDestroy {
  @ViewChild('hasAccountContent') hasAccountContent: ElementRef;
  @ViewChild('addAccountContent') addAccountContent: ElementRef;

  isShowDropdown: boolean = false;
  syncGmailStatus: EMailBoxStatus;
  popupState: EMailBoxPopUp;
  listMailBoxs: IMailBox[] = [];
  isLoading: boolean = true;
  textTooltip: string = `We've lost connection to your email account.`;
  idMailBox: string;
  isUnread: boolean = false;
  isOwnerMailBox: boolean = false;
  isExpandArchivedMailbox: boolean = false;
  listActiveMailBoxes: IMailBox[];
  hasArchivedMailboxes: boolean = false;
  totalItemCount: number = 0;
  totalMessageSynced: number = 0;

  readonly EMAIL_SYNC_TYPE = EMAIL_SYNC_TYPE;

  private isOwner: boolean = false;
  private unsubscribe = new Subject<void>();
  public selectedmailboxType: EMailBoxType = EMailBoxType.INDIVIDUAL;
  private selectedEmailProvider: EmailProvider;
  private isExistCompanyMailbox: boolean = false;
  private listenerClickDropdownDecision: () => void;
  private currentCompanyId: string;
  private listCompanyAgent: CompanyAgentCurrentUser[];
  public isConsole: boolean;
  public unreadList: { [x: string]: boolean } = {};
  private queryParams = {};
  private newWindow: Window | null;
  public disableFormIntegrateIMAP: boolean = false;
  public isConnectAgainIMAP: boolean = false;
  public isOwnerOutlook: boolean = false;
  public env_live = 'live';
  public isRm: boolean = false;
  public onStepBeforeIntegrateMailbox: boolean = false;
  public isAccountAdded: boolean;
  public configIntegrateToast = {
    type: SocketType.syncImap,
    title: INTEGRATE_IMAP_MAILBOX_FAILED,
    status: EMailBoxStatus.FAIL
  };

  readonly EMailBoxStatus = EMailBoxStatus;
  readonly EPopupState = EMailBoxPopUp;
  readonly mailBoxType = EMailBoxType;
  readonly EmailProvider = EmailProvider;
  readonly EUserMailboxRole = EUserMailboxRole;
  readonly env = env;

  constructor(
    private dashboardApiService: DashboardApiService,
    private companyService: CompanyService,
    private toastService: ToastrService,
    private inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private renderer: Renderer2,
    private loadingService: LoadingService,
    private statisticService: StatisticService,
    private activatedRoute: ActivatedRoute,
    private inboxToolbarService: InboxToolbarService,
    private sharedService: SharedService,
    private readonly router: Router,
    private mailboxSettingService: MailboxSettingService,
    private errorService: ErrorService,
    private userService: UserService,
    private inboxFilterService: InboxFilterService,
    private sharedWorkerService: SharedWorkerService,
    private ngZone: NgZone,
    private taskService: TaskService,
    private websocketService: RxWebsocketService,
    private emailApiService: EmailApiService,
    private sharedMessageViewService: SharedMessageViewService,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private messageIdSetService: MessageIdSetService,
    private folderService: FolderService,
    private toastCustomService: ToastCustomService,
    private readonly store: Store
  ) {
    this.sharedWorkerService.messages
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        Sentry.captureMessage(
          `Data Integrated Outlook: ${JSON.stringify(data || '')}`,
          'debug'
        );
        if (!data?.payload && !data?.type) {
          this.closePopupIntegrateOutlook();
          this.configIntegrateToast = {
            ...this.configIntegrateToast,
            type: SocketType.syncOutlook,
            title: MAIL_BOX_SYNC_FAILED
          };

          this.toastCustomService.openToastCustom(
            this.configIntegrateToast,
            true
          );
          return;
        }
        this.totalItemCount = data?.payload?.totalItemCount || 0;
        this.ngZone.run(() => {
          this.closePopupIntegrateOutlook();
          switch (data?.type) {
            case EMAIL_SYNC_TYPE.INTEGRATE_MAIL:
              if (data.isSuccess) {
                this.handleAfterIntegrate(data?.payload);
              } else {
                this.configIntegrateToast = {
                  ...this.configIntegrateToast,
                  type: SocketType.syncOutlook,
                  title:
                    data?.payload?.message?.message || data?.payload?.message
                };
                this.toastCustomService.openToastCustom(
                  this.configIntegrateToast,
                  true
                );
              }
              break;
            case EMAIL_SYNC_TYPE.CONNECT_AGAIN:
              if (!data.isSuccess) {
                this.toastService.error(MAIL_BOX_DISCONNECT);
              }
              break;
            default:
              break;
          }
          localStorage.removeItem('integrateType');
        });
      });
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    localStorage.setItem('mailBoxType', this.selectedmailboxType);
    this.subscribePopupState();
    combineLatest([
      this.companyService.getCurrentCompanyId(),
      this.companyService.listCompanyAgent$
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        filter(([companyId, list]) => !!companyId && !!list),
        tap(([companyId, list]) => {
          this.currentCompanyId = companyId;
          this.listCompanyAgent = list;
        }),
        switchMap(() => this.activatedRoute.queryParams)
      )
      .subscribe((queryParams) => {
        this.queryParams = queryParams;
        this.listMailBoxs =
          this.listCompanyAgent.find(
            (item) => item.companyId === this.currentCompanyId
          )?.mailBoxes || [];
        this.isOwner =
          this.listCompanyAgent.find(
            (item) => item.companyId === this.currentCompanyId
          )?.role === EUserPropertyType.OWNER;
        this.isExistCompanyMailbox = this.listMailBoxs.some(
          (mailbox) => mailbox.type === EMailBoxType.COMPANY
        );
        if (this.listMailBoxs.length) {
          let mailBoxId = queryParams['mailBoxId'];
          let mailBox = this.listMailBoxs.find((lmb) => lmb.id === mailBoxId);
          if (mailBoxId && mailBox) {
            this.inboxService.setCurrentMailBox(mailBox);
            this.mailboxSettingService.setMailBoxId(mailBoxId);
            this.inboxService.setCurrentMailBoxId(mailBoxId);
            this.mailboxSettingService.setRole(mailBox.role);
            this.listMailBoxs = this.listMailBoxs.sort((a, b) => {
              if (a.id === mailBoxId) return -1;
              if (b.id === mailBoxId) return 1;
              return a?.name.localeCompare(b?.name);
            });
            const filteredListMailBoxes = this.listMailBoxs.filter(
              (mailboxItem) => mailboxItem.id !== mailBox.id
            );
            this.hasArchivedMailboxes = filteredListMailBoxes.some(
              (mailbox) => mailbox.status === EMailBoxStatus.ARCHIVE
            );
            if (this.isConsole) {
              this.isOwnerOutlook = true;
            } else {
              this.isOwnerOutlook = this.listMailBoxs?.some(
                (mb) =>
                  mb?.provider === EmailProvider.OUTLOOK &&
                  mb?.role?.includes(EUserPropertyType.OWNER) &&
                  mb?.status === EMailBoxStatus.ACTIVE
              );
            }
          } else {
            const mailboxId = this.listMailBoxs[0]?.id;
            this.inboxService.setCurrentMailBox(this.listMailBoxs[0]);
            this.inboxService.setCurrentMailBoxId(mailboxId);
            this.mailboxSettingService.setMailBoxId(mailboxId);
            this.listMailBoxs[0] &&
              this.mailboxSettingService.setRole(this.listMailBoxs[0].role);
          }

          this.idMailBox = this.listMailBoxs[0]?.id;
          this.syncGmailStatus = this.listMailBoxs[0]?.status;
          if (this.syncGmailStatus === EMailBoxStatus.SYNCING) {
            const mailBoxId = this.queryParams['mailBoxId'];
            this.emailApiService
              .getSyncMailboxStatus(mailBoxId)
              .subscribe((res) => {
                this.totalItemCount = res?.totalItemCount || 0;
                this.totalMessageSynced = res?.totalMessageSynced || 0;
                const updatedListMailBoxs = this.listMailBoxs.map((item) => {
                  if (item.id === res.mailBoxId) {
                    return {
                      ...item,
                      totalItem: {
                        totalItemCount: res?.totalItemCount || 0,
                        totalMessageSynced: res?.totalMessageSynced || 0
                      }
                    };
                  }
                  return item;
                });
                this.listMailBoxs = updatedListMailBoxs;
              });
          } else {
            this.totalItemCount = 0;
            this.totalMessageSynced = 0;
          }

          this.isOwnerMailBox = this.listMailBoxs[0]?.role?.includes(
            EUserPropertyType.OWNER
          );
          this.setSyncMailboxStatus(this.syncGmailStatus);
          this.inboxService.setSyncMailBoxStatus(this.syncGmailStatus);
        } else {
          //todo: hide add account popup
          if (env !== this.env_live) {
            const isFirstLogin = localStorage.getItem('firstLoginApp');
            if (!isFirstLogin && !this.isConsole) {
              this.inboxService.setPopupMailBoxState(
                this.isOwner
                  ? EMailBoxPopUp.MAILBOX_TYPE
                  : EMailBoxPopUp.EMAIL_PROVIDER
              );
            }
          }
          this.loadingService.stopLoading();
          this.inboxService.setCurrentMailBox(null);
          this.inboxService.setCurrentMailBoxId(null);
        }
        this.isLoading = false;
      });
    let currentMailbox: IMailBox;
    this.inboxService.currentMailBox$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((mailbox) => {
          currentMailbox = mailbox;
          if (
            mailbox &&
            mailbox.provider === EmailProvider.OTHER &&
            mailbox.status === EMailBoxStatus.ACTIVE &&
            !mailbox.spamFolder
          ) {
            return this.inboxService.getSpamFolderImap();
          } else {
            return of(null);
          }
        })
      )
      .subscribe((spamFolder) => {
        if (
          spamFolder &&
          currentMailbox.id === spamFolder.mailBoxId &&
          !currentMailbox.spamFolder
        ) {
          currentMailbox.spamFolder = spamFolder;
          this.inboxService.setCurrentMailBox(currentMailbox);
        }
        this.listMailBoxs = this.listMailBoxs.map((mailBox) =>
          mailBox.id === currentMailbox.id ? currentMailbox : mailBox
        );
        if (currentMailbox?.status === EMailBoxStatus.UNSYNC) {
          this.selectedmailboxType = currentMailbox?.type;
        }
      });

    this.listenerClickDropdownDecision = this.renderer.listen(
      'window',
      'click',
      (e: Event) => {
        if (
          !this.hasAccountContent?.nativeElement.contains(e.target as Node) &&
          !this.addAccountContent?.nativeElement.contains(e.target as Node) &&
          this.isShowDropdown
        ) {
          this.isShowDropdown = false;
        }
      }
    );

    combineLatest([
      this.inboxService.getCurrentMailBoxId(),
      this.statisticService.getStatisticUnreadTabsInbox()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([mailBoxId, res]) => {
        if (mailBoxId && res) {
          this.isUnread =
            res?.[mailBoxId]?.myInbox || res?.[mailBoxId]?.teamInbox;
        }
      });

    // this.statisticService
    //   .getStatisticUnreadTabsInbox()
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe((res) => {
    //     if (res) {
    //       this.isUnread = res.myInbox || res.teamInbox;
    //     }
    //   });

    this.statisticService
      .getStatisticUnreadInbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.unreadList = res;
        }
      });

    this.handleCheckSharedMailbox();
    this.subscribeSocketSyncMailboxProgress();
    this.subscribeSocketSyncMailboxItemProgress();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isRm = this.companyService.isRentManagerCRM(res);
      });

    this.checkVisibleSetting();
    this.subscribeSocketUpdatePermissionMailBox();
  }

  subscribeSocketUpdatePermissionMailBox() {
    this.websocketService.onSocketUpdatePermissionMailBox
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const updatedListMailBoxs = this.listMailBoxs.map((item) => {
          if (item.id === res.data.id) {
            return {
              ...item,
              totalItem: {
                totalItemCount: res?.data?.totalItem?.totalItemCount || 0,
                totalMessageSynced:
                  res?.data?.totalItem?.totalMessageSynced || 0
              }
            };
          }
          return item;
        });
        this.listMailBoxs = updatedListMailBoxs;
      });
  }

  subscribeSocketSyncMailboxItemProgress() {
    this.websocketService.onSocketSyncMailboxProgress
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged()
      )
      .subscribe((res) => {
        const updatedListMailBoxs = this.listMailBoxs.map((item) => {
          if (item.id === res.mailBoxId) {
            return {
              ...item,
              totalItem: {
                totalItemCount: res?.totalItemCount || 0,
                totalMessageSynced: res?.totalMessageSynced || 0
              }
            };
          } else {
            return item;
          }
        });
        this.listMailBoxs = updatedListMailBoxs;
      });
  }

  subscribeSocketSyncMailboxProgress() {
    this.websocketService.onSocketSyncMailboxProgress
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((res) => res?.mailBoxId === this.idMailBox)
      )
      .subscribe((res) => {
        this.totalItemCount = res?.totalItemCount || 0;
        this.totalMessageSynced = res?.totalMessageSynced || 0;
      });
  }

  handleCheckSharedMailbox() {
    combineLatest([
      this.companyService.getCurrentCompanyId(),
      this.activatedRoute.queryParams
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(([, params]) => {
          if (
            params['mailProcess'] === EMailProcess.NEW_SHARED_MAILBOX &&
            params['mailBoxId']
          ) {
            return this.userService.checkMailboxIsExist(params['mailBoxId']);
          }
          return of(true);
        })
      )
      .subscribe({
        next: (res) => {
          const isExistNewMailbox = this.listMailBoxs.find(
            (mail) => mail.id === res.id
          );
          if (!isExistNewMailbox && res?.id) {
            const listMailbox: IMailBox[] = [...this.listMailBoxs, res];
            const currentAgency = this.companyService.listCompanyAgentValue;
            currentAgency[0].mailBoxes = Array.from(
              new Map(listMailbox.map((m) => [m.id, m])).values()
            );
            this.companyService.setListCompanyAgent(currentAgency);
          }
          if (!res) {
            this.errorService.handleShowMailBoxPermissionWarning(true);
          }
        },
        error: (_) => {
          this.errorService.handleShowMailBoxPermissionWarning(true);
        }
      });
  }

  subscribePopupState() {
    this.inboxService
      .getPopupMailBoxState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.popupState = res;
        this.refreshStateOnStepBeforeIntegrateMailbox();
      });
  }

  handleAddAcount() {
    this.isShowDropdown = false;
    if (this.isOwner) {
      this.inboxService.setPopupMailBoxState(EMailBoxPopUp.MAILBOX_TYPE);
    } else {
      this.inboxService.setPopupMailBoxState(EMailBoxPopUp.EMAIL_PROVIDER);
      this.selectedmailboxType = EMailBoxType.INDIVIDUAL;
    }
  }

  handleSharedMailbox() {
    this.isShowDropdown = false;
    this.inboxService.setPopupMailBoxState(EMailBoxPopUp.SHARED_MAILBOX);
  }

  handleOpenDropdown() {
    this.isShowDropdown = !this.isShowDropdown;
    this.isExpandArchivedMailbox = this.isShowDropdown;
  }

  toggleArchivedMailboxDropdown() {
    this.isExpandArchivedMailbox = !this.isExpandArchivedMailbox;
  }

  public onNextEmailProvider(provider: EmailProvider) {
    if (this.isConsole) return;
    this.selectedEmailProvider = provider;
    this.inboxService.setPopupMailBoxState(null);
    switch (this.selectedEmailProvider) {
      case EmailProvider.GMAIL:
        this.integrateGmail(EMAIL_SYNC_TYPE.INTEGRATE_MAIL);
        break;
      case EmailProvider.OUTLOOK:
        this.handleIntegrateOutLook(EMAIL_SYNC_TYPE.INTEGRATE_MAIL);
        break;
      case EmailProvider.OTHER:
        this.inboxService.setPopupMailBoxState(
          EMailBoxPopUp.INTEGRATE_IMAP_SMTP_SERVER
        );
        break;
    }
  }

  public async integrateGmail(syncType: string) {
    if (this.isConsole && !this.inboxSidebarService.isAccountAdded.value)
      return;
    this.isShowDropdown = false;
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: configGoogleApplication.CLIENT_ID,
      scope: configGoogleApplication.SCOPE,
      ux_mode: 'popup',
      select_account: true,
      redirect_uri: configGoogleApplication.REDIRECT_URI,
      callback: ({ code }: ResponseAuth) => {
        if (!code) return;
        const type = this.selectedmailboxType;
        if (syncType === EMAIL_SYNC_TYPE.INTEGRATE_MAIL) {
          this.handleLoadingWhenIntegrate();
          this.dashboardApiService
            .integrateEmailProvider({ code, type }, EmailProvider.GMAIL)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe({
              next: (res) => {
                this.totalItemCount = res?.totalItemCount || 0;
                this.handleAfterIntegrateMailboxSuccess(res);
              },
              error: ({ error }) => {
                this.handleStopLoading();
                this.toastService.error(error.message);
              }
            });
        } else if (syncType === EMAIL_SYNC_TYPE.CONNECT_AGAIN) {
          let mailBoxId = localStorage.getItem('mailBoxId');
          this.dashboardApiService
            .connectMailboxAgain({ code, type, mailBoxId })
            .pipe(takeUntil(this.unsubscribe))
            .subscribe({
              error: () => {
                this.toastService.error(MAIL_BOX_DISCONNECT);
              }
            });
        }
      },
      error_callback: (error) => {
        console.log('error', error);
      }
    });
    return client.requestCode();
  }

  public integrateIMAP(payload: ImapForm) {
    this.disableFormIntegrateIMAP = true;
    payload.type = this.selectedmailboxType;
    this.toastService.show(
      INTEGRATING_MAILBOX,
      '',
      {
        disableTimeOut: true
      },
      'toast-syncing'
    );
    if (this.isConnectAgainIMAP) {
      delete payload.picture;
      this.dashboardApiService.reconnectImap(payload).subscribe({
        next: () => {
          this.toastService.clear();
          this.toastService.success(INTEGRATE_IMAP_MAILBOX_SUCCESSFUL);
          this.inboxService.setPopupMailBoxState(null);
          this.disableFormIntegrateIMAP = false;
          this.isConnectAgainIMAP = false;
        },
        error: () => {
          this.disableFormIntegrateIMAP = false;
          this.toastService.clear();
          this.toastService.error(MAIL_BOX_DISCONNECT);
        }
      });
    } else {
      delete payload.mailBoxId;
      this.handleLoadingWhenIntegrate();
      this.dashboardApiService.integrateIMAP(payload).subscribe({
        next: (res) => {
          this.toastService.clear();
          if (res?.id) {
            this.configIntegrateToast = {
              ...this.configIntegrateToast,
              title: INTEGRATE_IMAP_MAILBOX_SUCCESSFUL,
              status: EMailBoxStatus.ACTIVE
            };

            this.toastCustomService.openToastCustom(
              this.configIntegrateToast,
              true
            );
            this.inboxService.setPopupMailBoxState(null);
            this.disableFormIntegrateIMAP = false;
            this.isConnectAgainIMAP = false;
            this.handleAfterIntegrateMailboxSuccess(res);
          } else {
            this.handleStopLoading();
            this.toastCustomService.openToastCustom(
              this.configIntegrateToast,
              true
            );
          }
        },
        error: (err) => {
          this.handleStopLoading();
          this.disableFormIntegrateIMAP = false;
          this.toastService.clear();
          const { status, message } = err?.error?.message || {};
          if (status === 409 && message) {
            this.configIntegrateToast = {
              ...this.configIntegrateToast,
              title: message
            };
            this.toastCustomService.openToastCustom(
              this.configIntegrateToast,
              true
            );
          } else {
            this.toastCustomService.openToastCustom(
              this.configIntegrateToast,
              true
            );
          }
        }
      });
    }
  }

  public handleAddSharedMailbox(payload: ISharedMailboxForm) {
    if (this.isConsole) return;
    this.isShowDropdown = false;
    const shareTo = payload?.sharedMailbox;

    this.dashboardApiService
      .addSharedMailbox({ mailBoxId: payload?.ownerMailBox, shareTo })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.inboxService.setPopupMailBoxState(null);
          this.handleAfterIntegrateMailboxSuccess(res);
        },
        error: ({ error }) => {
          this.toastService.error(error?.message || SHARED_MAIL_BOX_FAILED);
        }
      });
  }

  private handleAfterIntegrateMailboxSuccess(newMailbox: IMailBox) {
    this.inboxService.setCurrentMailBoxId(
      this.selectedEmailProvider == EmailProvider.GMAIL
        ? newMailbox['mailBoxId']
        : newMailbox.id
    );
    if (newMailbox.type === EMailBoxType.COMPANY) {
      this.listMailBoxs.forEach((item) => {
        if (
          item.type === EMailBoxType.COMPANY &&
          item.status !== EMailBoxStatus.ARCHIVE
        ) {
          item.status = EMailBoxStatus.ARCHIVE;
        }
      });
    }
    this.updateListMailBoxs([newMailbox, ...this.listMailBoxs]);
    this.statisticService.setStatisticTotalTask({
      type: this.queryParams[EMessageQueryType.MESSAGE_STATUS],
      value: 0
    });
  }

  public connectAgain() {
    if (this.listMailBoxs.length > 0) {
      switch (this.listMailBoxs[0].provider) {
        case EmailProvider.GMAIL:
          this.integrateGmail(EMAIL_SYNC_TYPE.CONNECT_AGAIN);
          break;
        case EmailProvider.OUTLOOK:
          this.handleIntegrateOutLook(EMAIL_SYNC_TYPE.CONNECT_AGAIN);
          break;
        case EmailProvider.OTHER:
          this.isConnectAgainIMAP = true;
          this.inboxService.setPopupMailBoxState(
            EMailBoxPopUp.INTEGRATE_IMAP_SMTP_SERVER
          );
          break;
      }
    }
  }

  public onSaveAssignDefault() {
    this.inboxService.setPopupMailBoxState(null);
    this.syncMail();
    if (!this.isRm) {
      this.inboxService.setPopupMailBoxState(
        EMailBoxPopUp.SAVE_MAILBOX_ACTIVITY_TO_PT
      );
    }
  }

  public syncMail() {
    if (this.listMailBoxs.length > 0) {
      this.inboxService.setPopupMailBoxState(null);
      switch (this.listMailBoxs[0].provider) {
        case EmailProvider.GMAIL:
        case EmailProvider.OUTLOOK:
          this.dashboardApiService.syncMailBox(this.idMailBox).subscribe({
            error: () => {
              this.toastService.error(MAIL_BOX_DISCONNECT);
            }
          });
          break;
        case EmailProvider.OTHER:
          this.dashboardApiService.syncIMAP(this.idMailBox).subscribe({
            error: () => {
              this.toastService.error(MAIL_BOX_DISCONNECT);
            }
          });
          break;
      }
    }
  }

  handleAfterIntegrate(res) {
    this.inboxService.setCurrentMailBoxId(res?.mailBoxId);
    if (res?.type === EMailBoxType.COMPANY) {
      this.listMailBoxs = (this.listMailBoxs || []).map((m) => {
        if (
          m?.type === EMailBoxType.COMPANY &&
          m?.status !== EMailBoxStatus.ARCHIVE
        ) {
          return { ...m, status: EMailBoxStatus.ARCHIVE };
        }
        return m;
      });
    }
    this.updateListMailBoxs([res, ...this.listMailBoxs]);
    this.statisticService.setStatisticTotalTask({
      type: this.queryParams[EMessageQueryType.MESSAGE_STATUS],
      value: 0
    });
  }

  handleIntegrateOutLook(connectType) {
    localStorage.setItem('integrateType', connectType);
    this.newWindow = window.open(
      outlookAuthUrl,
      'popup',
      `width=600,height=600,left=${(window.innerWidth - 600) / 2},top=${
        (window.innerHeight - 600) / 2
      }
  `
    );
  }
  closePopupIntegrateOutlook() {
    this.newWindow?.close();
    this.handleCancel();
  }

  handleClearToolbarAction() {
    this.taskService.setSelectedConversationList([]);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }

  handleLoadingWhenIntegrate() {
    this.isLoading = true;
    this.loadingService.onLoading();
    this.inboxService.setSkeletonMessage(true);
    this.messageTaskLoadingService.onLoading();
  }

  handleStopLoading() {
    this.isLoading = false;
    this.loadingService.stopLoading();
    this.inboxService.setSkeletonMessage(false);
    this.messageTaskLoadingService.stopLoadingMessage();
  }

  handleSelectAccount(item: IMailBox) {
    if (this.sharedMessageViewService.isShowSelectValue) {
      this.sharedMessageViewService.setIsShowSelect(false);
    }
    this.inboxService.setCurrentMailBox(item);
    this.inboxService.setCurrentMailBoxId(item.id);
    this.inboxService.setIsDisconnectedMailbox(
      item.status === EMailBoxStatus.DISCONNECT
    );
    this.inboxService.setIsArchiveMailbox(
      item.status === EMailBoxStatus.ARCHIVE
    );
    this.mailboxSettingService.setMailBoxId(item.id);
    this.mailboxSettingService.setRole(item.role);
    localStorage.removeItem('integrateType');
    this.handleClearToolbarAction();
    const currentInboxType = this.inboxFilterService.getSelectedInboxType();
    this.router
      .navigate(['dashboard', 'inbox', 'messages'], {
        queryParams: {
          status: TaskStatusType.inprogress,
          inboxType: currentInboxType,
          mailBoxId: null
        }
      })
      .then(() => {
        this.updateListMailBoxs(this.listMailBoxs);
        this.isShowDropdown = false;
      });
  }

  handleRetrySync() {
    let provider: string = '';
    const newList = this.listMailBoxs.map((item) => {
      if (item.id === this.idMailBox) {
        item.status = EMailBoxStatus.SYNCING;
        provider = item.provider;
      }
      return item;
    });
    this.updateListMailBoxs(newList);
    switch (provider) {
      case EmailProvider.GMAIL:
      case EmailProvider.OUTLOOK:
        this.dashboardApiService.retrySyncMailBox(this.idMailBox).subscribe({
          error: () => {
            this.toastService.error(MAIL_BOX_DISCONNECT);
          }
        });
        break;
      case EmailProvider.OTHER:
        this.dashboardApiService.retrySyncImap(this.idMailBox).subscribe({
          error: () => {
            this.toastService.error(MAIL_BOX_DISCONNECT);
          }
        });
        break;
    }
  }

  handleCancel() {
    this.inboxService.setPopupMailBoxState(null);
    localStorage.setItem('firstLoginApp', 'true');
    this.disableFormIntegrateIMAP = false;
    this.isConnectAgainIMAP = false;
  }

  updateListMailBoxs(list: IMailBox[]) {
    const companyAgents = this.companyService.listCompanyAgentValue;
    const updatedCompanyAgents = companyAgents.map((company) => {
      if (company.companyId === this.currentCompanyId) {
        const uniqueIds = {};
        const filteredArray = list.filter((item) => {
          if (!uniqueIds[item.id]) {
            uniqueIds[item.id] = true;
            return true;
          }
          return false;
        });

        company.mailBoxes = filteredArray;
      }

      return company;
    });
    this.companyService.setListCompanyAgent(updatedCompanyAgents);
  }

  setSyncMailboxStatus(value: EMailBoxStatus) {
    switch (value) {
      case EMailBoxStatus.FAIL:
      case EMailBoxStatus.ACTIVE:
        this.loadingService.stopLoading();
        break;
      case EMailBoxStatus.UNSYNC:
        this.isOwnerMailBox &&
          this.inboxService.setPopupMailBoxState(EMailBoxPopUp.ASSIGN_TEAM);
        this.messageIdSetService.setIsMessageIdsEmpty(true);
        this.handleStopLoading();
        break;
      default:
        break;
    }
  }

  public handleEncourageUser() {
    this.isShowDropdown = false;
    this.inboxService.setPopupMailBoxState(EMailBoxPopUp.ENCOURAGE_USER);
  }

  public onNextSelectMailboxType(type: EMailBoxType) {
    this.selectedmailboxType = type;
    if (
      this.isExistCompanyMailbox &&
      this.selectedmailboxType === EMailBoxType.COMPANY
    ) {
      this.inboxService.setPopupMailBoxState(
        EMailBoxPopUp.CONFIRM_EXISTING_COMPANY
      );
    } else {
      this.inboxService.setPopupMailBoxState(EMailBoxPopUp.EMAIL_PROVIDER);
    }
    localStorage.setItem('mailBoxType', this.selectedmailboxType);
  }

  private refreshStateOnStepBeforeIntegrateMailbox() {
    this.onStepBeforeIntegrateMailbox =
      this.popupState == EMailBoxPopUp.ENCOURAGE_USER ||
      this.popupState == EMailBoxPopUp.MAILBOX_TYPE ||
      this.popupState == EMailBoxPopUp.CONFIRM_EXISTING_COMPANY ||
      this.popupState == EMailBoxPopUp.EMAIL_PROVIDER ||
      this.popupState == EMailBoxPopUp.INTEGRATE_IMAP_SMTP_SERVER;
  }

  checkVisibleSetting() {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isAccountAdded = res;
      });
  }

  navigateToMailboxSetting() {
    this.router.navigateByUrl('/dashboard/mailbox-settings');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    localStorage.removeItem('integrateType');
    if (this.listenerClickDropdownDecision) {
      this.listenerClickDropdownDecision();
    }
  }
}
