import {
  EMailBoxPopUp,
  EMailBoxStatus,
  EMailBoxType,
  EUserPropertyType,
  EmailProvider,
  GroupType
} from '@shared/enum';
import {
  CompanyAgentCurrentUser,
  IMailBox
} from '@shared/types/user.interface';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@services/company.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { SharedService } from '@services/shared.service';
import { LoadingService } from '@services/loading.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
import { UserService } from '@services/user.service';
import { ErrorService } from '@services/error.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { env } from '@/environments/environment';
import { DEBOUNCE_SOCKET_TIME } from '@/app/dashboard/utils/constants';
import { EMailProcess } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { uniqBy } from 'lodash-es';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import uuid4 from 'uuid4';
import { IReorderMailBoxList } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { orderMailboxes } from '@/app/dashboard/modules/inbox/utils/mailbox';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { PageFacebookMessengerType } from '@/app/dashboard/shared/types/facebook-account.interface';
import { PageWhatsAppType } from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';

@Component({
  selector: 'inbox-sidebar-v2',
  templateUrl: './inbox-sidebar-v2.component.html',
  styleUrl: './inbox-sidebar-v2.component.scss'
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class InboxSidebarV2Component implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  public isOwner: boolean = false;
  private listCompanyAgent: CompanyAgentCurrentUser[];
  public currentCompanyId: string;
  public queryParams = {};
  public isExistCompanyMailbox: boolean = false;
  public listMailBoxs: IMailBox[] = [];
  public listArchiveMessenger: PageFacebookMessengerType[] = [];
  public listArchiveWhatsApp: PageWhatsAppType[] = [];
  public isConsole: boolean;
  public isOwnerOutlook: boolean = false;
  public syncGmailStatus: EMailBoxStatus;
  public isOwnerMailBox: boolean = false;
  public env_live = 'live';
  readonly env = env;
  isLoading: boolean = true;
  public selectedmailboxType: EMailBoxType = EMailBoxType.INDIVIDUAL;
  public totalItemCount = {};
  readonly EPopupState = EMailBoxPopUp;
  public totalMessageSynced = {};
  public isRm: boolean = false;
  public showViewArchivedList: boolean = false;
  public hasActiveMailboxes: boolean = false;
  public unreadList: { [x: string]: boolean } = {};

  constructor(
    private inboxService: InboxService,
    private companyService: CompanyService,
    private activatedRoute: ActivatedRoute,
    private mailboxSettingService: MailboxSettingService,
    private sharedService: SharedService,
    private loadingService: LoadingService,
    private messageIdSetService: MessageIdSetService,
    private websocketService: RxWebsocketService,
    private userService: UserService,
    private errorService: ErrorService,
    private emailApiService: EmailApiService,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private statisticService: StatisticService,
    private cdr: ChangeDetectorRef,
    private mailboxSettingApiService: MailboxSettingApiService,
    private router: Router,
    private readonly facebookService: FacebookService,
    private whatsappService: WhatsappService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    localStorage.setItem('mailBoxType', this.selectedmailboxType);
    let currentMailbox: IMailBox;
    this.onReorderListMailBox();
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

        this.setListMailBoxs(
          this.listMailBoxs.map((mailBox) =>
            mailBox.id === currentMailbox.id ? currentMailbox : mailBox
          )
        );
        if (currentMailbox?.status === EMailBoxStatus.UNSYNC) {
          this.selectedmailboxType = currentMailbox?.type;
        }
      });

    // TODO[D]: remove logic handle current mailBox, just update list mailBoxes to render only
    combineLatest([
      this.companyService.getCurrentCompanyId(),
      this.companyService.listCompanyAgent$,
      this.facebookService.listArchiveMessenger$,
      this.whatsappService.listArchiveWhatsApp$
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          ([companyId, list, listArchiveMessenger, listArchiveWhatsApp]) =>
            !!companyId &&
            !!list &&
            !!listArchiveMessenger &&
            !!listArchiveWhatsApp
        )
      )
      .subscribe(
        ([companyId, list, listArchiveMessenger, listArchiveWhatsApp]) => {
          this.currentCompanyId = companyId;
          this.listCompanyAgent = list;
          this.listArchiveMessenger = listArchiveMessenger;
          this.listArchiveWhatsApp = listArchiveWhatsApp;
          const listMailbox =
            this.listCompanyAgent.find(
              (item) => item.companyId === this.currentCompanyId
            )?.mailBoxes || [];
          this.setListMailBoxs(listMailbox || []);
          this.showViewArchivedList =
            this.listMailBoxs.some(
              (mailboxItem) => mailboxItem?.status === EMailBoxStatus.ARCHIVE
            ) ||
            !!listArchiveMessenger.length ||
            !!listArchiveWhatsApp.length;
          this.hasActiveMailboxes = this.listMailBoxs.some(
            (mailboxItem) => mailboxItem?.status === EMailBoxStatus.ACTIVE
          );
          this.isOwner =
            this.listCompanyAgent.find(
              (item) => item.companyId === this.currentCompanyId
            )?.role === EUserPropertyType.OWNER;

          this.isOwnerMailBox = this.listMailBoxs.some((mailbox) =>
            mailbox?.role?.includes(EUserPropertyType.OWNER)
          );

          this.isExistCompanyMailbox = this.listMailBoxs.some(
            (mailbox) => mailbox.type === EMailBoxType.COMPANY
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
          this.updateSyncingMailboxes();
          if (!this.listMailBoxs.length) {
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
          this.cdr.markForCheck();
        }
      );
    this.handleAddNewMailbox();

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isRm = this.companyService.isRentManagerCRM(res);
      });

    this.statisticService
      .getStatisticUnreadInbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.unreadList = res;
        }
      });

    this.handleCheckSharedMailbox();
    this.subscribeSocketUpdatePermissionMailBox();
    this.subscribeTotalItemCount();
    this.subscribeSocketSyncMailboxItemProgress();
  }

  updateSyncingMailboxes() {
    const syncingMailboxes = this.listMailBoxs.filter(
      (mailbox) => mailbox.status === EMailBoxStatus.SYNCING
    );
    if (syncingMailboxes.length > 0) {
      const requests = syncingMailboxes.map((mailbox) =>
        this.emailApiService
          .getSyncMailboxStatus(mailbox.id)
          .pipe(takeUntil(this.unsubscribe))
      );

      forkJoin(requests)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((responses) => {
          responses.forEach((res) => {
            const mailBoxId = res.mailBoxId;
            const updatedMailbox = this.listMailBoxs.find(
              (m) => m.id === res.mailBoxId
            );
            if (updatedMailbox) {
              updatedMailbox.totalItem = {
                totalItemCount: res.totalItemCount
                  ? res.totalItemCount
                  : this.totalItemCount[mailBoxId]
                  ? this.totalItemCount[mailBoxId]
                  : 0,
                totalMessageSynced: res.totalMessageSynced || 0
              };
              updatedMailbox.isOpen = true;
            }
          });
        });
    }
  }

  onReorderListMailBox() {
    this.mailboxSettingService.triggerOrderListMailBox
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const payload: IReorderMailBoxList[] = [];
        res.forEach((item) => {
          payload.push({
            id: item.orderId || uuid4(),
            order: item.order,
            mailBoxId: item.id
          });
        });
        this.mailboxSettingApiService.reorderMailboxList(payload).subscribe({
          next: () => {
            const listMailbox = this.listMailBoxs.map((mailbox) => {
              const found = payload.find(
                (item) => item.mailBoxId === mailbox.id
              );
              if (!found) return mailbox;
              this.mailboxSettingService.orderListMailBox.set(found.mailBoxId, {
                orderId: found.id,
                order: found.order
              });
              return {
                ...mailbox,
                orderId: found.id,
                order: found.order
              };
            });
            this.setListMailBoxs(listMailbox);
          }
        });
      });
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
                totalItemCount: res?.data?.totalItem?.totalItemCount
                  ? res?.data?.totalItem?.totalItemCount
                  : this.totalItemCount[item?.id]
                  ? this.totalItemCount[item?.id]
                  : 0,
                totalMessageSynced:
                  res?.data?.totalItem?.totalMessageSynced || 0
              },
              isOpen: true
            };
          }
          return item;
        });

        this.setListMailBoxs(updatedListMailBoxs);
      });
  }

  subscribeTotalItemCount() {
    this.inboxService.totalItemCount$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const { totalItem, mailBoxId } = res;
        this.totalItemCount[mailBoxId] = totalItem || 0;
      });
  }

  handleUpdateMailBox(event) {
    this.setListMailBoxs(event);
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
            this.totalMessageSynced[res?.mailBoxId] = res?.totalMessageSynced;
            this.totalItemCount[res?.mailBoxId] = res?.totalItemCount;

            return {
              ...item,
              totalItem: {
                totalItemCount: this.totalItemCount[item?.id] || 0,
                totalMessageSynced: res?.totalMessageSynced || 0
              },
              isOpen: true
            };
          } else {
            return item;
          }
        });
        this.setListMailBoxs(updatedListMailBoxs);
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

  handleStopLoading() {
    this.isLoading = false;
    this.loadingService.stopLoading();
    this.inboxService.setSkeletonMessage(false);
    this.messageTaskLoadingService.stopLoadingMessage();
  }

  handleAddNewMailbox() {
    this.inboxService.addNewMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          const mailBox = res;
          const mailBoxId = res.id;
          const result = { ...res, isOpen: true };
          this.inboxService.setCurrentMailBox(mailBox);
          this.mailboxSettingService.setMailBoxId(mailBoxId);
          this.mailboxSettingService.setRole(mailBox.role);
          const newMailBoxList = uniqBy([...this.listMailBoxs, result], 'id');
          this.setListMailBoxs(newMailBoxList);
          this.inboxService.setListMailBoxs(newMailBoxList);
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
          this.inboxService.setPopupMailBoxState(EMailBoxPopUp.ASSIGN_TEAM);
          const isFocus = localStorage.getItem('mailbox-focus')
            ? GroupType.MY_TASK
            : GroupType.TEAM_TASK;
          this.router.navigateByUrl(
            `dashboard/inbox/messages/all?inboxType=${isFocus}&status=INPROGRESS&mailBoxId=${res?.id}`
          );
          this.inboxService.setSyncMailBoxStatus(res.status);
        }
      });
  }

  setListMailBoxs(value: IMailBox[]) {
    this.mailboxSettingService.setOrderListMailBox(value);
    this.listMailBoxs = orderMailboxes(value);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
