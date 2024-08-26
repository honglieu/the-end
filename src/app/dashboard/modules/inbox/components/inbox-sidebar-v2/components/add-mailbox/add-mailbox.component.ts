import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  Component,
  ViewChild,
  NgZone,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  EMailBoxPopUp,
  EMailBoxStatus,
  EMailBoxType,
  EmailProvider,
  SocketType
} from '@shared/enum';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { IMailBox } from '@shared/types/user.interface';
import { CompanyService } from '@services/company.service';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from '@services/shared.service';
import { LoadingService } from '@services/loading.service';
import {
  configGoogleApplication,
  outlookAuthUrl
} from '@/environments/environment';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
import { EMAIL_SYNC_TYPE } from '@/app/mailbox-setting/utils/constant';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import {
  ISharedMailboxForm,
  ResponseAuth
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { ToastrService } from 'ngx-toastr';
import {
  INTEGRATE_IMAP_MAILBOX_FAILED,
  INTEGRATE_IMAP_MAILBOX_SUCCESSFUL,
  INTEGRATING_MAILBOX,
  MAIL_BOX_DISCONNECT,
  MAIL_BOX_SYNC_FAILED,
  SHARED_MAIL_BOX_FAILED
} from '@services/messages.constants';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { SharedWorkerService } from '@/app/shared-worker.service';
import * as Sentry from '@sentry/angular-ivy';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ImapForm } from '@shared/types/inbox.interface';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';

@Component({
  selector: 'add-mailbox',
  templateUrl: './add-mailbox.component.html',
  styleUrl: './add-mailbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddMailboxComponent implements OnInit, OnDestroy {
  @ViewChild(CdkOverlayOrigin) trigger: CdkOverlayOrigin;
  @Input() isOwner: boolean = false;
  @Input() isExistCompanyMailbox: boolean = false;
  @Input() listMailBoxs: IMailBox[] = [];
  @Input() selectedmailboxType: EMailBoxType = EMailBoxType.INDIVIDUAL;
  @Input() currentCompanyId: string;
  @Input() isOwnerOutlook: boolean = false;
  @Input() isOwnerMailBox: boolean = false;
  @Output() onUpdateListMailBoxs = new EventEmitter<IMailBox[]>();

  public queryParams = {};
  private unsubscribe = new Subject<void>();
  public isDropdownVisible: boolean = false;
  popupState: EMailBoxPopUp;
  public onStepBeforeIntegrateMailbox: boolean = false;
  public isConsole: boolean;
  isLoading: boolean = true;
  public disableFormIntegrateIMAP: boolean = false;
  public isConnectAgainIMAP: boolean = false;
  private selectedEmailProvider: EmailProvider;
  private newWindow: Window | null;
  public configIntegrateToast = {
    type: SocketType.syncImap,
    title: INTEGRATE_IMAP_MAILBOX_FAILED,
    status: EMailBoxStatus.FAIL
  };
  readonly EPopupState = EMailBoxPopUp;
  public isRm: boolean = false;
  readonly mailBoxType = EMailBoxType;
  public newMailBoxId: string;

  constructor(
    private inboxService: InboxService,
    private companyService: CompanyService,
    private activatedRoute: ActivatedRoute,
    private sharedService: SharedService,
    private loadingService: LoadingService,
    private messageIdSetService: MessageIdSetService,
    private inboxSidebarService: InboxSidebarService,
    private dashboardApiService: DashboardApiService,
    private toastService: ToastrService,
    private statisticService: StatisticService,
    private sharedWorkerService: SharedWorkerService,
    private toastCustomService: ToastCustomService,
    private ngZone: NgZone,
    private messageTaskLoadingService: MessageTaskLoadingService
  ) {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((params) => {
        this.queryParams = params;
      });
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
        this.inboxService.totalItemCount$.next({
          totalItem: data?.payload?.totalItemCount,
          mailBoxId: data?.payload?.id
        });
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
    this.subscribePopupState();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isRm = this.companyService.isRentManagerCRM(res);
      });

    this.connectAgain();
    this.handleRetrySync();
    this.getSyncMailboxStatus();
  }

  getSyncMailboxStatus() {
    this.inboxService.currentMailBox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailBox) => {
        if (mailBox) {
          const { status, role } = mailBox;
          this.setSyncMailboxStatus(status, role);
        }
      });
  }

  handleSharedMailbox() {
    this.inboxService.setPopupMailBoxState(EMailBoxPopUp.SHARED_MAILBOX);
    this.isDropdownVisible = false;
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
    let mailBoxId = this.newMailBoxId || this.queryParams['mailBoxId'];
    const mailbox = this.listMailBoxs.find(
      (mailbox) => mailbox?.id === mailBoxId
    );
    if (this.listMailBoxs.length > 0) {
      this.inboxService.setPopupMailBoxState(null);
      switch (mailbox?.provider) {
        case EmailProvider.GMAIL:
        case EmailProvider.OUTLOOK:
          this.dashboardApiService.syncMailBox(mailBoxId).subscribe({
            error: () => {
              this.toastService.error(MAIL_BOX_DISCONNECT);
            }
          });
          break;
        case EmailProvider.OTHER:
          this.dashboardApiService.syncIMAP(mailBoxId).subscribe({
            error: () => {
              this.toastService.error(MAIL_BOX_DISCONNECT);
            }
          });
          break;
      }
    }
  }

  handleAfterIntegrate(res) {
    this.inboxService.setCurrentMailBoxId(res?.mailBoxId || res?.id);
    this.inboxService.addNewMailbox$.next(res);
    this.newMailBoxId = res?.mailBoxId || res?.id;
  }

  setSyncMailboxStatus(
    status: EMailBoxStatus,
    role: Array<keyof typeof EUserMailboxRole>
  ) {
    switch (status) {
      case EMailBoxStatus.FAIL:
      case EMailBoxStatus.ACTIVE:
        this.loadingService.stopLoading();
        break;
      case EMailBoxStatus.UNSYNC:
        role.includes(EUserMailboxRole.OWNER) &&
          this.inboxService.setPopupMailBoxState(EMailBoxPopUp.ASSIGN_TEAM);
        this.messageIdSetService.setIsMessageIdsEmpty(true);
        this.handleStopLoading();
        break;
      default:
        break;
    }
  }

  handleStopLoading() {
    this.isLoading = false;
    this.loadingService.stopLoading();
    this.inboxService.setSkeletonMessage(false);
    this.messageTaskLoadingService.stopLoadingMessage();
  }

  overlayOutsideClick(event: MouseEvent) {
    const buttonElement = this.trigger.elementRef.nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (!buttonElement.contains(targetElement)) {
      this.isDropdownVisible = false;
    }
  }

  public handleEncourageUser() {
    this.inboxService.setPopupMailBoxState(EMailBoxPopUp.ENCOURAGE_USER);
    this.isDropdownVisible = false;
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

  private refreshStateOnStepBeforeIntegrateMailbox() {
    this.onStepBeforeIntegrateMailbox =
      this.popupState == EMailBoxPopUp.ENCOURAGE_USER ||
      this.popupState == EMailBoxPopUp.MAILBOX_TYPE ||
      this.popupState == EMailBoxPopUp.CONFIRM_EXISTING_COMPANY ||
      this.popupState == EMailBoxPopUp.EMAIL_PROVIDER ||
      this.popupState == EMailBoxPopUp.INTEGRATE_IMAP_SMTP_SERVER;
  }

  handleAddAcount() {
    if (this.isOwner) {
      this.inboxService.setPopupMailBoxState(EMailBoxPopUp.MAILBOX_TYPE);
    } else {
      this.inboxService.setPopupMailBoxState(EMailBoxPopUp.EMAIL_PROVIDER);
      this.selectedmailboxType = EMailBoxType.INDIVIDUAL;
    }
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
    this.inboxService.setIsConnectAgainMailbox(null);
  }

  closePopupIntegrateOutlook() {
    this.newWindow?.close();
    this.handleCancel();
  }

  public async integrateGmail(syncType: string) {
    if (this.isConsole && !this.inboxSidebarService.isAccountAdded.value)
      return;
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
                this.inboxService.totalItemCount$.next({
                  totalItem: res?.totalItemCount,
                  mailBoxId: res?.id
                });
                this.handleAfterIntegrate(res);
              },
              error: ({ error }) => {
                this.handleStopLoading();
                this.toastService.error(error.message);
              }
            });
        } else if (syncType === EMAIL_SYNC_TYPE.CONNECT_AGAIN) {
          const mailBoxId = localStorage.getItem('reconnectMailBoxId');
          this.dashboardApiService
            .connectMailboxAgain({ code, type, mailBoxId })
            .pipe(takeUntil(this.unsubscribe))
            .subscribe({
              error: () => {
                this.toastService.error(MAIL_BOX_DISCONNECT);
                this.inboxService.setIsConnectAgainMailbox(null);
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

  handleLoadingWhenIntegrate() {
    this.isLoading = true;
    this.loadingService.onLoading();
    this.inboxService.setSkeletonMessage(true);
    // this.messageTaskLoadingService.onLoading();
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
          this.inboxService.setIsConnectAgainMailbox(null);
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
            this.handleAfterIntegrate(res);
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
    const shareTo = payload?.sharedMailbox;

    this.dashboardApiService
      .addSharedMailbox({ mailBoxId: payload?.ownerMailBox, shareTo })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.inboxService.setPopupMailBoxState(null);
          this.handleAfterIntegrate(res);
        },
        error: ({ error }) => {
          this.toastService.error(error?.message || SHARED_MAIL_BOX_FAILED);
        }
      });
  }

  public connectAgain() {
    this.inboxService
      .getIsConnectAgainMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        switch (res?.provider) {
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
      });
  }

  handleRetrySync() {
    this.inboxService
      .getIsRetryMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        let provider: string = '';
        this.listMailBoxs = this.listMailBoxs.map((item) => {
          if (item.id === res?.id) {
            item.status = EMailBoxStatus.SYNCING;
            provider = item.provider;
          }
          return item;
        });
        switch (provider) {
          case EmailProvider.GMAIL:
          case EmailProvider.OUTLOOK:
            this.dashboardApiService.retrySyncMailBox(res?.id).subscribe({
              next: () => {
                this.inboxService.setIsRetryMailbox(null);
              },
              error: () => {
                this.toastService.error(MAIL_BOX_DISCONNECT);
              }
            });
            break;
          case EmailProvider.OTHER:
            this.dashboardApiService.retrySyncImap(res?.id).subscribe({
              next: () => {
                this.inboxService.setIsRetryMailbox(null);
              },
              error: () => {
                this.toastService.error(MAIL_BOX_DISCONNECT);
              }
            });
            break;
        }
      });
  }

  handleCancel() {
    this.inboxService.setPopupMailBoxState(null);
    localStorage.setItem('firstLoginApp', 'true');
    this.disableFormIntegrateIMAP = false;
    this.isConnectAgainIMAP = false;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
