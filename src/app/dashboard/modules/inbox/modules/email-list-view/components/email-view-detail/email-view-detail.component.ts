import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  EmailItem,
  ICheckMoveMailFolderResponse,
  IPortalConversation
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EInboxAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil,
  tap,
  throttleTime
} from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { EmailViewService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-view.service';
import { LoadingService } from '@services/loading.service';
import { EmailTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-task-loading.service';
import { MessageService } from '@services/message.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_MOVING_TO_TASK } from '@services/messages.constants';
import { TaskService } from '@services/task.service';
import { ConversationService } from '@services/conversation.service';
import { SyncAttachmentType } from '@shared/enum/inbox.enum';
import { isEqual } from 'lodash-es';
import { EToastSocketTitle } from '@/app/toast-custom/toastCustomType';
import {
  LABEL_EXTERNAL_ID_MAIL_BOX,
  LABEL_NAME_OUTLOOK
} from '@services/constants';
import { TaskStatusType } from '@shared/enum/task.enum';
import { SharedService } from '@services/shared.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { DEFAULT_MOVE_TO_OPTIONS } from '@/app/dashboard/modules/inbox/modules/email-list-view/util/constant';

@Component({
  selector: 'email-view-detail',
  templateUrl: './email-view-detail.component.html',
  styleUrls: ['./email-view-detail.component.scss']
})
export class EmailViewDetailComponent implements OnInit, OnDestroy {
  @ViewChild('scrollMessages') scrollMessages: ElementRef<HTMLElement>;

  listMessages: EmailItem[] = [];
  currentMailboxId: string;
  currentThreadId: string;
  previousThreadId: string;
  isDropdownVisible: boolean = false;
  isLoadingDetail: boolean = true;
  emailMenuItems = DEFAULT_MOVE_TO_OPTIONS;
  public isLoadingPortalConversation: boolean = true;
  public isSpamFolder: boolean = false;
  public isSentItemsFolder: boolean = false;
  public isSentFolder: boolean = false;
  public portalConversation: IPortalConversation;
  readonly inboxAction = EInboxAction;
  private destroy$ = new Subject<void>();
  private refetchCheckMoveToFolder$ = new Subject<void>();
  private eventChangeQuoteSizeHandler: (e: Event) => void;
  private currentQueryParams: Params;
  private currentLabelId: string;
  readonly taskStatusType = TaskStatusType;
  public firstUnreadMessageIndex: number;
  private scrollTimeOut: NodeJS.Timeout = null;
  public noReloadDetail: boolean = false;

  constructor(
    public loadingService: LoadingService,
    private activatedRoute: ActivatedRoute,
    private inboxService: InboxService,
    private emailApiService: EmailApiService,
    public emailViewService: EmailViewService,
    public emailTaskLoadingService: EmailTaskLoadingService,
    private messageService: MessageService,
    public inboxToolbarService: InboxToolbarService,
    public folderService: FolderService,
    private toastService: ToastrService,
    private taskService: TaskService,
    public conversationService: ConversationService,
    private sharedService: SharedService,
    private inboxSidebarService: InboxSidebarService
  ) {}

  ngOnInit() {
    this.subscribeInitialData();
    this.subscribePortalConversation();
    this.subscribeCheckMoveToFolder();
    this.subscribeEventChangeHeightIframe();
    this.subscribeResetEmailDetail();
    this.subscribeTriggerNewMessage();
  }

  subscribeResetEmailDetail() {
    this.emailViewService.resetEmailDetail$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!!this.listMessages?.length) {
          this.listMessages = [];
        }
      });
  }

  subscribeTriggerNewMessage() {
    this.emailApiService.newMessageFromSocket$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.noReloadDetail = true;
      });
  }

  subscribeEventChangeHeightIframe() {
    this.eventChangeQuoteSizeHandler = (e: CustomEvent) => {
      this.messageService.setMessageChangeIframeId(e.detail?.messageId);
    };
    window.document.addEventListener(
      'eventChangeQuoteSize',
      (e) => this.eventChangeQuoteSizeHandler(e),
      false
    );
  }

  private triggerRefetchCheckMoveToFolder() {
    this.refetchCheckMoveToFolder$.next();
  }

  private subscribeInitialData() {
    combineLatest([
      this.activatedRoute.queryParams,
      this.inboxService.getCurrentMailBoxIdEmailFolder(),
      this.emailViewService.emailItemLists$,
      this.inboxService.currentMailBoxEmailFolder$
    ])
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        switchMap(([params, currentMailboxId, emailItemLists, mailBox]) => {
          this.isDropdownVisible = false;
          this.isLoadingDetail = true && !this.noReloadDetail;
          if (!emailItemLists?.length) {
            this.isLoadingDetail = false;
            return of(null);
          }

          this.currentQueryParams = params;
          const { threadId } = params;
          this.isSpamFolder =
            this.currentQueryParams['externalId'] ===
            mailBox?.spamFolder?.externalId;
          if (
            threadId &&
            currentMailboxId &&
            currentMailboxId === this.currentQueryParams['mailBoxId']
          ) {
            this.currentMailboxId = currentMailboxId;
            this.currentThreadId = threadId;

            if (
              !this.listMessages?.length ||
              !this.listMessages.every(
                (item) => item.threadId === this.currentThreadId
              ) ||
              this.noReloadDetail
            ) {
              return this.emailApiService
                .getDetailMessage(threadId, currentMailboxId)
                .pipe(takeUntil(this.destroy$));
            }
          }

          return of(null);
        })
      )
      .subscribe((listMessagesResponse: EmailItem[]) => {
        if (listMessagesResponse) {
          this.listMessages = listMessagesResponse;
          const lastMessageIndex = listMessagesResponse.length - 1;
          this.firstUnreadMessageIndex = this.listMessages.findIndex(
            (message) => message.isRead === false
          );
          if (this.firstUnreadMessageIndex >= 0) {
            this.markReadMessage(listMessagesResponse[lastMessageIndex]?.id);
          }
          const folderTarget = this.folderService.getCurrentFolder(
            this.currentQueryParams[EMessageQueryType.EXTERNAL_ID],
            this.currentMailboxId
          );
          this.isSentItemsFolder =
            folderTarget.wellKnownName === LABEL_NAME_OUTLOOK.SENT_ITEMS;
          this.currentLabelId = folderTarget?.internalId;
          this.scrollToMessageAtIndex(
            Number(
              this.firstUnreadMessageIndex >= 0
                ? this.firstUnreadMessageIndex
                : lastMessageIndex
            )
          );
        }
        this.isLoadingDetail = false;
        this.noReloadDetail = false;
      });

    this.subscribeReloadHistory();
    this.subscribeSyncAttachmentEvent();
  }

  markReadMessage(lastMessageId: string) {
    const isConsole = this.sharedService.isConsoleUsers();
    if (!isConsole) {
      this.emailApiService
        .modifyReadMessage(lastMessageId)
        .pipe(
          takeUntil(this.destroy$),
          tap(() => {
            this.inboxToolbarService.setFilterUnReadMessage(lastMessageId);
            this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
              this.currentMailboxId
            );
          })
        )
        .subscribe();
    }
  }

  scrollToMessageAtIndex(position: number) {
    this.scrollTimeOut = setTimeout(() => {
      const scrollElement = this.scrollMessages?.nativeElement;
      const targetElement = scrollElement?.children?.[position];
      if (!targetElement) {
        return;
      }
      targetElement.scrollIntoView({
        block: 'start',
        inline: 'nearest',
        behavior: 'smooth'
      });
    }, 200);
  }

  subscribeReloadHistory() {
    this.taskService.triggerReloadHistoryAfterSync
      .pipe(takeUntil(this.destroy$), throttleTime(300))
      .subscribe((res) => {
        if (!res.status || !res.threadIds.includes(this.currentThreadId))
          return;
        this.reloadGetMessages();
      });
  }

  subscribeSyncAttachmentEvent() {
    this.taskService.triggerSyncAttachment
      .pipe(
        takeUntil(this.destroy$),
        throttleTime(300),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((threadIds) => {
        if (!threadIds?.includes(this.currentThreadId)) return;
        this.conversationService.syncAttachment({
          mailBoxId: this.currentMailboxId,
          threadIds: [this.currentThreadId],
          type: SyncAttachmentType.MAIL_FOLDER
        });
      });
  }

  reloadGetMessages() {
    return this.emailApiService
      .getDetailMessage(this.currentThreadId, this.currentMailboxId)
      .subscribe({
        next: (res: EmailItem[]) => {
          if (!res) return;
          this.listMessages = res;
        }
      });
  }

  subscribePortalConversation() {
    combineLatest([
      this.activatedRoute.queryParams,
      this.inboxService.getCurrentMailBoxIdEmailFolder()
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([queryParams, currentMailBoxId]) => {
          this.isLoadingPortalConversation = true;
          const { threadId } = queryParams;
          if (!queryParams?.[EMessageQueryType.EXTERNAL_ID] || !threadId) {
            return of(null);
          }
          const folderTarget = this.folderService.getCurrentFolder(
            queryParams[EMessageQueryType.EXTERNAL_ID],
            currentMailBoxId
          );
          if (!folderTarget) {
            return of(null);
          }
          this.isSentItemsFolder =
            folderTarget.wellKnownName === LABEL_NAME_OUTLOOK.SENT_ITEMS;
          this.isSentFolder =
            queryParams['externalId'] === LABEL_EXTERNAL_ID_MAIL_BOX.SENT ||
            queryParams['externalId'] === 'sent';
          this.portalConversation = null;
          return this.emailApiService.getConversationDetail(
            threadId,
            currentMailBoxId,
            queryParams[EMessageQueryType.EXTERNAL_ID] ?? ''
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.portalConversation = res?.data;
          }
          this.isLoadingPortalConversation = false;
        }
      });
  }

  showMovingToast() {
    this.toastService.clear();
    this.toastService.show(
      MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );
  }

  showToastError(error) {
    this.toastService.clear();
    this.toastService.error(
      error?.error?.message ?? 'Report spam failed. Please try again.'
    );
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
  }

  handleNotSpam() {
    this.emailViewService.setPreQuerryParamsMoveMessage(
      this.currentQueryParams
    );
    this.showMovingToast();
    const body = {
      mailBoxId: this.currentMailboxId,
      threadIds: [this.currentThreadId]
    };
    this.emailApiService
      .handleNotSpam(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.inboxToolbarService.setInboxItem([]);
          this.inboxToolbarService.setFilterInboxList(false);
        },
        error: (error) => {
          this.showToastError(error);
        }
      });
  }

  handleReportSpam() {
    this.emailViewService.setPreQuerryParamsMoveMessage(
      this.currentQueryParams
    );
    this.showMovingToast();
    const body = {
      mailBoxId: this.currentMailboxId,
      threadIds: [this.currentThreadId],
      conversationIds: [],
      currentLabelId: this.currentLabelId
    };
    this.emailApiService
      .reportSpamFolder(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.inboxToolbarService.setInboxItem([]);
          this.inboxToolbarService.setFilterInboxList(false);
        },
        error: () => {
          this.toastService.error(EToastSocketTitle.MESSAGE_SPAM_FAIL);
        }
      });
  }

  private handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }

  private subscribeCheckMoveToFolder() {
    this.refetchCheckMoveToFolder$
      .pipe(
        switchMap(() =>
          this.emailApiService.checkMoveMailFolder({
            mailBoxId: this.currentMailboxId,
            threadIds: [this.currentThreadId],
            conversationIds: [],
            labelId: this.currentLabelId
          })
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res: ICheckMoveMailFolderResponse) => {
        if (!res) return;
        const emailFolders = res?.emailFolders.map((item) => item.id);
        this.emailApiService.setlistEmailFolder(emailFolders);
        this.emailMenuItems.forEach((item) => {
          switch (item?.action) {
            case EInboxAction.MOVE_MESSAGE_TO_INBOX:
              item.disabled = !res.inbox;
              break;
            case EInboxAction.MOVE_MESSAGE_TO_RESOLVED:
              item.disabled = !res.resolvedEnquiries;
              break;
            case EInboxAction.MOVE_MESSAGE_TO_DELETED:
              item.disabled = !res.deletedEnquiries;
              break;
          }
        });
        if (!res.emailFolders?.length) {
          this.emailMenuItems = this.emailMenuItems.filter(
            (item) => item.action !== EInboxAction.MOVE_MESSAGE_TO_EMAIL
          );
        }
      });
  }

  handleVisibleChange(isVisible: boolean) {
    this.isDropdownVisible = isVisible;
    if (this.isDropdownVisible) {
      this.triggerRefetchCheckMoveToFolder();
    }
  }

  handleEmailMoveToAction(action: EInboxAction) {
    this.handleClearSelected();
    this.emailViewService.setEmailMoveToAction({
      threadId: this.currentThreadId,
      action
    });
    this.isDropdownVisible = false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.eventChangeQuoteSizeHandler) {
      window.document.removeEventListener(
        'eventChangeQuoteSize',
        this.eventChangeQuoteSizeHandler,
        false
      );
    }
    clearTimeout(this.scrollTimeOut);
  }
}
