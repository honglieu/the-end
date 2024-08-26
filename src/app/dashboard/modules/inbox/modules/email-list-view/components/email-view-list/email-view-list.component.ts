import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import {
  Subject,
  combineLatest,
  debounce,
  filter,
  firstValueFrom,
  map,
  of,
  skip,
  switchMap,
  takeUntil,
  tap,
  timer
} from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { LIMIT_TASK_LIST } from '@/app/dashboard/utils/constants';
import { isEqual } from 'lodash-es';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { PopoverService } from '@services/popover.service';
import {
  EScrollState,
  EmailItem,
  IGetAllMessage,
  IMailFolderQueryParams,
  IMessagesResponse,
  ICheckMoveMailFolderResponse,
  IDataMailFolder
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { RxWebsocketService } from '@services/rx-websocket.service';

import { ToastrService } from 'ngx-toastr';
import {
  CAN_NOT_MOVE,
  MESSAGES_MOVING_TO_TASK,
  MESSAGE_MOVING_TO_TASK,
  MOVE_MESSAGE_FAIL,
  getTitleToastMovingProcessing
} from '@services/messages.constants';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EInboxFilterSelected,
  EMessageQueryType
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { EFolderType } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { EmailViewService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-view.service';
import { EmailTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-task-loading.service';
import { CurrentUser } from '@shared/types/user.interface';
import { UserService } from '@/app/dashboard/services/user.service';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { ISocketUpdateMsgFolder } from '@shared/types/socket.interface';
import {
  LABEL_EXTERNAL_ID_MAIL_BOX,
  LABEL_NAME_OUTLOOK
} from '@services/constants';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import {
  EInboxAction,
  EPopupMoveMessToTaskState
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SharedService } from '@services/shared.service';
import { getDeletedItemsFolderExternalId } from '@/app/dashboard/modules/inbox/utils/function';
import { EDataE2EMailFolder } from '@shared/enum/E2E.enum';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { InboxExpandService } from '@/app/dashboard/modules/inbox/services/inbox-expand.service';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import {
  messagesMailFolderPageActions,
  selectAllmessagesMailFolder,
  selectFetchingMessage,
  selectFetchingMoreMessage,
  selectMessagesResponseState
} from '@core/store/message-mail-folder';
import { messagesMailFolderActions } from '@core/store/message-mail-folder/actions/message-mail-folder.actions';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';

@Component({
  selector: 'email-view-list',
  templateUrl: './email-view-list.component.html',
  styleUrls: ['./email-view-list.component.scss']
})
export class EmailViewListComponent implements OnInit, OnDestroy {
  @ViewChild('infiniteScrollView')
  infiniteScrollView: ElementRef<HTMLElement>;
  @ViewChild('infiniteScrollIndex')
  infiniteScrollIndex: ElementRef<HTMLElement>;

  public readonly EDataE2EMailFolder = EDataE2EMailFolder;
  public readonly EInboxAction = EInboxAction;
  public isSkeleton: boolean = true;
  public gmailList: EmailItem[] = [];
  public currentDraggingToFolderName: string = '';
  private searchText: string = '';
  private currentMailMessageId: string;
  private externalId: string;
  private isTargetElement: boolean = true;
  private currentQueryParams: Params;
  private pagination = {
    pageIndex: 0,
    initial: true
  };
  public showSpinnerTop: boolean = false;
  public showSpinnerBottom: boolean = false;
  totalMail: number = 0;
  scrollTop: number = 0;
  isLoadingMore: boolean = false;
  isShowLine: boolean = false;
  queryThreadId: string;
  previousThreadId: string;

  private destroy$ = new Subject<void>();
  private inboxList: EmailItem[] = [];
  private currentMailboxId: string;
  private pageLimit = LIMIT_TASK_LIST;
  private isMoving = false;
  private refreshMessageSubject$ = new Subject();
  readonly inboxFilterSelectedType = EInboxFilterSelected;
  private scrollTimeOut: NodeJS.Timeout = null;
  public selectedGmail: EmailItem;
  public isError: boolean = false;
  public preQuerryParamsMoveMessage: Params;

  public currentUser: CurrentUser;
  public activeGmailList: string[] = [];
  public startIndex: number = -1;
  public menuDropDown = {
    [EInboxAction.MOVE_MESSAGE_TO_INBOX]: false,
    [EInboxAction.MOVE_MESSAGE_TO_EMAIL]: false,
    [EInboxAction.MOVE_MESSAGE_TO_RESOLVED]: false,
    [EInboxAction.MOVE_MESSAGE_TO_DELETED]: false,
    [EInboxAction.REPORT_SPAM]: false,
    [EInboxAction.NOT_SPAM]: false
  };
  public isSpam: boolean;
  public isConsoleUser: boolean = false;
  public lastPage = false;
  public titleDropMessage: string;
  public showPopupConfirmMoveMultiple: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public listConfirmMoveMailToInbox: any[] = [];
  private isMoveMultipleMessages: boolean = false;
  private payloadMoveMessageToInbox: IMailFolderQueryParams = {};

  private get loadingMore() {
    return this.showSpinnerTop || this.showSpinnerBottom;
  }

  private set loadingMore(value: boolean) {
    this.showSpinnerTop = value;
    this.showSpinnerBottom = value;
  }

  constructor(
    public loadingService: LoadingService,
    public inboxService: InboxService,
    public websocketService: RxWebsocketService,
    private inboxToolbarService: InboxToolbarService,
    private activatedRoute: ActivatedRoute,
    private statisticService: StatisticService,
    private emailApiService: EmailApiService,
    private popoverService: PopoverService,
    private messageIdSetService: MessageIdSetService,
    private taskDragDropService: TaskDragDropService,
    private toastService: ToastrService,
    private inboxSidebarService: InboxSidebarService,
    private cdr: ChangeDetectorRef,
    private emailViewService: EmailViewService,
    private emailTaskLoadingService: EmailTaskLoadingService,
    private renderer: Renderer2,
    private router: Router,
    private userService: UserService,
    private folderService: FolderService,
    private sharedMessageViewService: SharedMessageViewService,
    private elementRef: ElementRef,
    private nzContextMenuService: NzContextMenuService,
    private sharedService: SharedService,
    private readonly store: Store,
    private inboxExpandService: InboxExpandService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  ngOnInit(): void {
    this.previousThreadId =
      this.activatedRoute.snapshot.queryParams['threadId'];
    this.isConsoleUser = this.sharedService.isConsoleUsers();

    this.refreshMessageSubject$
      .pipe(debounce((rs) => timer(rs['timer'])))
      .subscribe((rs) => {
        this.store.dispatch(
          messagesMailFolderPageActions.pageChange({
            pageIndex: rs['payload']?.page
          })
        );
      });

    this.onStoreChange();
    //skip when focused a email and reload to avoid losing focus
    this.inboxToolbarService.handleInboxItemSelection$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: ({ threadId, id }) => {
          this._handleUpdateEmailPreview(threadId, id);
        }
      });
    this.subscribeMessageList();
    combineLatest([
      this.inboxService.currentMailBoxEmailFolder$,
      this.activatedRoute.queryParams
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(([currentMailBox, _]) => !!currentMailBox)
      )
      .subscribe(([currentMailBox, queryParams]) => {
        this.isSpam =
          currentMailBox.spamFolder.externalId === queryParams['externalId'];
        this.menuDropDown[EInboxAction.REPORT_SPAM] = !this.isSpam;
        this.menuDropDown[EInboxAction.NOT_SPAM] = this.isSpam;
        if (this.isSpam) return;
        const currentFolder = this.folderService.getCurrentFolder(
          this.currentQueryParams[EMessageQueryType.EXTERNAL_ID],
          this.currentMailboxId
        );
        this.menuDropDown[EInboxAction.REPORT_SPAM] = !(
          currentFolder?.wellKnownName === LABEL_NAME_OUTLOOK.SENT_ITEMS
        );
      });
    this.subscribeFilterInboxList();
    this.subscribeFilterGmailList();
    this.subscribeToSocketSpamMailBox();
    this.onLoadMoreMessage();
    this.subscribeToSocketMoveEmailFolder();
    this.subscribeInboxItem();
    this.subscribeToSocketUpdateMsgFolder();
    this.subscribeSocketSeenConversations();
    this.subscribepreQuerryParamsMoveMessage();
    this.subscribeToSocketNewMailMessage();
    this.subscribeConfirmMoveMailToInbox();
  }

  subscribepreQuerryParamsMoveMessage() {
    this.emailViewService.preQuerryParamsMoveMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((pq) => {
        this.preQuerryParamsMoveMessage = pq;
      });
  }

  subscribeToSocketNewMailMessage() {
    this.websocketService.onSocketNewMailMessage
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res?.mailBoxId === this.currentMailboxId)
      )
      .subscribe((res) => {
        if (!res) return;
        const externalIdsResponse = res?.labels.map(
          (label) => label?.externalId
        );
        const includesExternalId = externalIdsResponse.includes(
          this.currentQueryParams[EInboxFilterSelected.EXTERNAL_ID]
        );
        const threadIdsResponse = res?.labels.map((label) => label?.threadId);
        const includesthreadId = threadIdsResponse.includes(
          this.currentQueryParams[EMessageQueryType.THREAD_ID]
        );
        if (!includesExternalId) return;
        const threadIds = this.gmailList.map((message) => message.threadId);
        if (!threadIds.includes(res?.threadId)) {
          this.store.dispatch(
            messagesMailFolderPageActions.pageChange({
              pageIndex: this.pagination.pageIndex
            })
          );
          return;
        } else {
          const updatedList = this.handleSortListMessage(
            this.gmailList.map((message) => {
              if (message.threadId === res?.threadId) {
                return {
                  ...message,
                  timestamp: res?.timestamp,
                  textContent: res?.textContent,
                  totalMessages: '' + (+message.totalMessages + 1),
                  isRead: includesthreadId ? true : res?.isRead
                };
              }
              return message;
            })
          );
          this.updatedGmailList(updatedList);
        }

        if (
          includesExternalId &&
          includesthreadId &&
          this.currentQueryParams[EMessageQueryType.EMAIL_MESSAGE_ID] &&
          this.currentQueryParams[EMessageQueryType.EMAIL_MESSAGE_ID] !==
            res?.id
        ) {
          this.emailApiService.triggerNewMessage();
          const updatedParams = {
            ...this.currentQueryParams,
            emailMessageId: res?.id ?? ''
          };
          this.router.navigate([], {
            queryParams: updatedParams,
            queryParamsHandling: 'merge'
          });
        }
      });
  }

  subscribeSocketSeenConversations() {
    this.websocketService.onSocketSeenEmailFolder
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res?.mailBoxId === this.currentMailboxId)
      )
      .subscribe((res) => {
        const { emails } = res;
        if (this.gmailList?.length > 0) {
          emails.forEach((email) => {
            if (
              email.externalId ===
              this.currentQueryParams[EInboxFilterSelected.EXTERNAL_ID]
            ) {
              const updatedList = this.gmailList.map((message) => {
                if (email.threadIds.includes(message?.threadId)) {
                  return {
                    ...message,
                    isRead: res.isSeen
                  };
                }
                return message;
              });
              this.updatedGmailList(updatedList);
            }
          });
          this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
            res.mailBoxId
          );
        }
      });
  }

  handleDragStarted(message: EmailItem) {
    const count = this.inboxToolbarService.countSelectedItems;
    if (count <= 1) {
      this.titleDropMessage = '1 message';
      this.isMoveMultipleMessages = false;
    } else {
      this.titleDropMessage = `${count} messages`;
      this.isMoveMultipleMessages = true;
    }
  }

  public get disableDragging() {
    return this.inboxToolbarService.hasItem;
  }

  updatedGmailList(messages) {
    this.store.dispatch(messagesMailFolderActions.setAll({ messages }));
  }

  subscribeMessageList() {
    combineLatest([
      this.activatedRoute.queryParams,
      this.inboxService.getCurrentMailBoxIdEmailFolder(),
      this.userService.getUserDetail()
    ])
      .pipe(
        filter(([queryParams, mailBoxId]) => {
          queryParams = {
            ...queryParams,
            status: TaskStatusType.mailfolder
          };
          this.currentQueryParams = queryParams;
          this.queryThreadId = queryParams['threadId'];
          this.currentMailMessageId = queryParams['emailMessageId'];
          const isSearchTextDifferent =
            queryParams?.[EInboxFilterSelected.SEARCH] !== undefined &&
            this.searchText !== queryParams?.[EInboxFilterSelected.SEARCH];

          const isMailboxIdDifferent = this.currentMailboxId !== mailBoxId;

          const isExternalIdDifferent =
            this.externalId !== queryParams?.['externalId'];

          const shouldFilter =
            isSearchTextDifferent ||
            isMailboxIdDifferent ||
            isExternalIdDifferent;
          if (isExternalIdDifferent || isMailboxIdDifferent) {
            this.emailViewService.triggerResetEmailDetail();
          }

          if (shouldFilter) {
            this.gmailList = [];
            this.emailViewService.setEmailItemLists([]);
            this.isSkeleton = true;
            this.isShowLine = false;
            this.emailTaskLoadingService.onLoading();
          }

          return shouldFilter;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(([queryParams, mailBoxId, currentUser]) => {
        if (currentUser) {
          this.currentUser = currentUser;
        }
        this.externalId = queryParams?.['externalId'];
        this.currentMailboxId = mailBoxId;

        if (mailBoxId && Object.keys(queryParams)?.length > 0) {
          if (this.checkQueryParam(queryParams)) {
            this.gmailList = [];
          }

          this.searchText = queryParams[EInboxFilterSelected.SEARCH];
          this.pagination = {
            pageIndex: 0,
            initial: true
          };

          this.messageIdSetService.clear();
          const payload = this.mapPayloadMessageList(queryParams);
          this.store.dispatch(
            messagesMailFolderPageActions.payloadChange({
              payload
            })
          );
        }
      });
  }

  subscribeToSocketMoveEmailFolder() {
    this.websocketService.onSocketMoveMessageToFolder
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.listSuccess?.length) {
          const queryParamsExternalId =
            this.currentQueryParams[EMessageQueryType.EXTERNAL_ID];
          const currentLabelExternalId = res?.currentLabel?.externalId;
          const newLabelExternalId = res?.newLabel?.externalId;
          const threadIds = res?.listSuccess.map((item) => item.threadId);
          const removeLabels = res?.listSuccess
            .flatMap((item) => item.removeLabels)
            .filter((externalId) => externalId !== undefined);
          const addLabels = res?.listSuccess
            .flatMap((item) => item.addLabels)
            .filter((externalId) => externalId !== undefined);
          const externalIdsRemove = removeLabels.map((item) => {
            return item?.externalId;
          });
          if (
            externalIdsRemove.includes(queryParamsExternalId) ||
            queryParamsExternalId === currentLabelExternalId
          ) {
            if (currentLabelExternalId === newLabelExternalId) return;
            this.handleMovedMessages(threadIds);
          }
          const externalIdsAdd = addLabels.map((item) => item?.externalId);
          if (
            externalIdsAdd.includes(queryParamsExternalId) ||
            queryParamsExternalId === newLabelExternalId
          ) {
            this.handleAddMessages(
              {
                limit: 20,
                page: 0,
                search: '',
                mailBoxId: res.mailBoxId,
                threads: threadIds,
                externalId: newLabelExternalId
              },
              EInboxAction.REPORT_SPAM
            );
          }
        }
      });
  }

  subscribeInboxItem() {
    combineLatest([
      this.inboxToolbarService.filterInboxList$,
      this.inboxToolbarService.inboxItem$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([filterInboxList, inboxItem]) => {
        if (
          inboxItem.length === 0 &&
          !filterInboxList &&
          this.activeGmailList.length > 0
        ) {
          this.handleRemoveActiveGmail();
        }
      });
  }

  subscribeToSocketUpdateMsgFolder() {
    this.websocketService.onSocketUpdateMsgFolder
      .pipe(
        takeUntil(this.destroy$),
        map((res: ISocketUpdateMsgFolder) => ({
          mailBoxId: res.mailBoxId,
          addedLabel: res.dataAddedLabel || [],
          removedLabel: res.dataRemovedLabel || []
        })),
        filter(
          ({ mailBoxId, addedLabel, removedLabel }) =>
            mailBoxId === this.currentMailboxId &&
            (addedLabel.length > 0 || removedLabel.length > 0)
        )
      )
      .subscribe(({ addedLabel, removedLabel }) => {
        if (addedLabel) {
          this.handleAddedLabel(addedLabel, this.currentMailboxId);
        }
        if (removedLabel) {
          this.handleRemovedLabel(removedLabel);
        }
      });
  }

  private handleAddedLabel(addedLabel, mailBoxId) {
    const threadIdGmailList = this.gmailList.map((item) => item.threadId);
    const externalId = this.currentQueryParams['externalId'];
    const threadIdsToAdd = addedLabel
      .filter((item) => item.labelId === externalId)
      .map((i) => i.threadIds)
      .flat()
      .filter((threadId) => !threadIdGmailList.includes(threadId));
    if (threadIdsToAdd.length > 0) {
      this.handleAddMessages({
        limit: 20,
        page: 0,
        search: '',
        mailBoxId,
        threads: threadIdsToAdd,
        externalId
      });
    }
  }

  private handleRemovedLabel(removedLabel) {
    const threadIdsToRemove = removedLabel
      .filter((item) => item.labelId === this.currentQueryParams['externalId'])
      .map((item) => item.threadIds)
      .flat();

    if (threadIdsToRemove.length > 0) {
      this.handleMovedMessages(threadIdsToRemove);
    }
  }

  private handleMovedMessages(threadIds: string[]) {
    const { threadId } = this.currentQueryParams;
    if (threadIds.includes(threadId)) {
      this.updateQuerryParams();
    }
    const gmailList = this.gmailList?.filter(
      (item) => !threadIds?.includes(item?.threadId)
    );
    this.updatedGmailList(gmailList);
    if (threadIds?.includes(this.queryThreadId)) {
      this.emailViewService.triggerResetEmailDetail();
    }
    if (gmailList.length === 0) {
      this.emailViewService.setEmailItemLists([]);
    }
  }

  scrollToElement(
    position: number,
    block: ScrollLogicalPosition = 'center',
    inline: ScrollLogicalPosition = 'nearest'
  ): void {
    this.scrollTimeOut = setTimeout(() => {
      const targetElement =
        this.infiniteScrollView?.nativeElement.children[position];

      if (targetElement) {
        targetElement.scrollIntoView({
          block,
          inline
        });
      }

      this.cdr.markForCheck();
    }, 0);
  }

  private handleAddMessages(payload: IGetAllMessage, type?: EInboxAction) {
    this.emailApiService
      .getAllMessage(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res?.messages.length) return;
        const gmailList = this.handleReduntantDuplicateListMessage(
          res?.messages,
          this.gmailList,
          true
        );
        this.updatedGmailList(gmailList);
        if (type === EInboxAction.REPORT_SPAM) {
          this.emailViewService.setEmailItemLists(gmailList);
        }
        if (
          payload.threads.includes(
            this.preQuerryParamsMoveMessage[EMessageQueryType.THREAD_ID]
          ) &&
          this.currentQueryParams[EMessageQueryType.EXTERNAL_ID] ===
            this.preQuerryParamsMoveMessage[EMessageQueryType.EXTERNAL_ID]
        ) {
          this.updateQuerryParams(
            this.preQuerryParamsMoveMessage?.[EMessageQueryType.THREAD_ID],
            this.preQuerryParamsMoveMessage?.[
              EMessageQueryType.EMAIL_MESSAGE_ID
            ]
          );
        }
        this.cdr.markForCheck();
      });
  }

  handleSortListMessage(listMessage: EmailItem[]) {
    const sortedList = listMessage.sort((a, b) => {
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return timestampB - timestampA;
    });

    return sortedList;
  }

  handleReduntantDuplicateListMessage(
    newListMessage: EmailItem[],
    oldListMessage: EmailItem[],
    isMapping: boolean = false
  ) {
    const threadIds = oldListMessage.map((item) => item.threadId);
    const listMessageAdded = newListMessage.filter(
      (item) => !threadIds.includes(item.threadId)
    );
    if (isMapping) {
      const isReadMap = {};
      newListMessage.forEach((message) => {
        isReadMap[message.threadId] = message.isRead;
      });
      oldListMessage = oldListMessage.map((item) => {
        return {
          ...item,
          isRead:
            isReadMap[item.threadId] !== undefined
              ? isReadMap[item.threadId]
              : item?.isRead
        };
      });
    }
    const tempGmailList = [...listMessageAdded, ...oldListMessage];
    const sortedGmailList = this.handleSortListMessage(tempGmailList);
    return [...sortedGmailList];
  }

  updateQuerryParams(threadId?: string, emailMessageId?: string) {
    const updatedParams = {
      ...this.currentQueryParams,
      status: TaskStatusType.mailfolder,
      threadId: threadId ?? '',
      emailMessageId: emailMessageId ?? ''
    };

    this.router.navigate([], {
      queryParams: updatedParams,
      queryParamsHandling: ''
    });
  }
  private onStoreChange() {
    const messagesRes$ = this.store
      .select(selectMessagesResponseState)
      .pipe(filter(Boolean));

    const messagesMailFolder$ = this.store
      .select(selectAllmessagesMailFolder)
      .pipe(takeUntil(this.destroy$), filter(Boolean));

    const fetching$ = this.store
      .select(selectFetchingMessage)
      .pipe(
        tap(
          (fetching) =>
            this.isSkeleton !== fetching && (this.isSkeleton = fetching)
        )
      );

    const fetchingMore$ = this.store
      .select(selectFetchingMoreMessage)
      .pipe(
        tap(
          (fetchingMore) =>
            this.loadingMore !== fetchingMore &&
            (this.loadingMore = fetchingMore)
        )
      );

    combineLatest([messagesMailFolder$, messagesRes$, fetching$, fetchingMore$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([messages, res, fetching]) => {
        this.gmailList = [];
        this.isSkeleton = fetching;
        const newResponse = {
          ...res,
          messages
        };
        this.updateUIMessagesList(newResponse);
        if (!!res.error) {
          this.isSkeleton = false;
          this.emailViewService.setEmailItemLists([]);
          this.emailTaskLoadingService.stopLoading();
          this.isError = true;
        }
      });
  }

  updateUIMessagesList(res: IMessagesResponse) {
    if (this.pagination.initial) {
      this.pagination = {
        pageIndex: res?.currentPage || 0,
        initial: false
      };
    }
    this.handleResponseListMessageSpam(res);
    this.emailViewService.setEmailItemLists(this.gmailList);
  }

  subscribeToSocketSpamMailBox() {
    this.websocketService.onSocketSyncSpamMailBox
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { externalId } = this.activatedRoute.snapshot.queryParams;
        if (
          res.mailBoxId !== this.currentMailboxId ||
          !res?.['folderExternalIds']?.includes(externalId)
        ) {
          return;
        }
        this.messageIdSetService.clear();
        this.store.dispatch(
          messagesMailFolderPageActions.pageChange({
            pageIndex: this.pagination.pageIndex
          })
        );
      });
  }

  handleResponseListMessageSpam(res: IMessagesResponse) {
    if (!res) {
      this.gmailList = [];
      this.isSkeleton = false;
      this.emailTaskLoadingService.stopLoading();
      return;
    }

    this.totalMail = res?.total as number;

    if (res?.messages) {
      this.statisticService.setStatisticTotalTask({
        type: this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS],
        value: this.totalMail
      });
    }
    const tempGmailList = this.handleReduntantDuplicateListMessage(
      res?.messages ?? [],
      this.gmailList
    );
    this.gmailList = this.handleMapGmailList(tempGmailList, this.inboxList);
    const process = this.processListMessage(res);

    if (Object.keys(res).length > 0 && process) {
      this.emailTaskLoadingService.stopLoading();
    }
    this.cdr.markForCheck();
  }

  private processListMessage(rs) {
    if (Array.isArray(rs)) return false;

    const conversationIndex = rs?.messages?.findIndex(
      (task) => task.id === this.currentMailMessageId
    );

    if (
      this.isPaginationNeeded(
        rs?.messages?.length,
        rs?.currentPage,
        conversationIndex
      )
    ) {
      this.onScrollToTop(true);
      return false;
    }

    this.checkAfterLazyLoad(rs);
    return true;
  }

  private isPaginationNeeded(
    logsLength: number,
    currentPage: number,
    conversationIndex: number
  ): boolean {
    const page = Math.ceil(this.totalMail / LIMIT_TASK_LIST) - 1;

    const isFirstConditionMet =
      logsLength > 10 &&
      currentPage > 0 &&
      conversationIndex >= 0 &&
      conversationIndex <= 3;
    const isSecondConditionMet =
      this.pagination.pageIndex > 0 &&
      this.pagination.pageIndex === page &&
      currentPage === page &&
      conversationIndex >= 0 &&
      conversationIndex < 10;

    return isFirstConditionMet || isSecondConditionMet;
  }

  checkAfterLazyLoad(rs): void {
    if (!this.gmailList.length) return;

    const indexTask = this.gmailList.findIndex(
      (i) => i.id === this.currentMailMessageId
    );

    if (indexTask >= 0 && this.isTargetElement) {
      this.scrollToElement(indexTask);
    }

    if (
      rs?.currentPage >= 0 &&
      rs?.currentPage < this.pagination.pageIndex &&
      !this.isTargetElement
    ) {
      this.scrollToUp(rs.messages.length);
    }
  }

  onLoadMoreMessage() {
    this.emailApiService.refreshListMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((param) => {
        if (param?.page) {
          this.store.dispatch(messagesMailFolderPageActions.nextPage());
          this.isLoadingMore = true;
        }
      });
    this.emailApiService.refreshedListMesasge$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoadingMore = false;
      });
  }

  subscribeFilterGmailList() {
    this.inboxToolbarService.filterUnReadMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (!rs) return;
        this.gmailList = [...this.gmailList].map((gmail) => {
          if (rs === gmail.id) {
            return {
              ...gmail,
              isRead: true
            };
          } else {
            return {
              ...gmail
            };
          }
        });
        this.inboxToolbarService.setFilterUnReadMessage(null);
      });
  }

  subscribeFilterInboxList() {
    this.inboxToolbarService.filterInboxList$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((rs) => {
          if (!rs) {
            this.gmailList = this.handleMapGmailList(this.gmailList);
            return of(null);
          }
          return this.inboxToolbarService.inboxItem$.pipe(
            takeUntil(this.destroy$)
          );
        })
      )
      .subscribe((rs) => {
        if (!rs) return;
        this.gmailList = [...this.gmailList].filter(
          (it) => !rs.some((r) => r.id === it.id)
        );
        this.inboxToolbarService.setFilterInboxList(null);
        this.inboxToolbarService.setInboxItem([]);
      });
  }

  mapPayloadMessageList(queryParams: Params) {
    return {
      mailBoxId: this.currentMailboxId,
      page: this.pagination.pageIndex,
      pageLimit: this.pageLimit,
      limit: this.pageLimit,
      search: queryParams[EInboxFilterSelected.SEARCH],
      externalId: queryParams['externalId'],
      currentMailMessageId:
        !!queryParams[EInboxFilterSelected.SEARCH] ||
        queryParams['mailBoxId'] !== this.currentMailboxId
          ? null
          : queryParams['emailMessageId'],
      isLoading: true
    };
  }

  getListEmailFolder() {
    return this.folderService.flattenTreeEmailFolder(
      this.folderService.getEmailFolderByMailBoxId(this.currentMailboxId)?.tree,
      '',
      this.currentMailboxId
    );
  }

  handleDropMessageToFolder($event) {
    this.inboxExpandService.handleCollapseFolder();
    let elmDrop = this.taskDragDropService.getRootElement(
      $event.dropPoint,
      'drop_task--folder'
    );
    const externalId = this.currentQueryParams['externalId'];
    if (!elmDrop) return;
    const folderType = elmDrop?.getAttribute('folder-type');
    const folderMailBoxId = elmDrop?.getAttribute('folder-mailbox-id');
    const message = $event.item.data;
    const listMailFolder = this.getListEmailFolder();
    const currentLabelId = listMailFolder?.find(
      (lmf) => lmf.externalId === externalId
    )?.internalId;

    const listThreadId = this.isMoveMultipleMessages ? [] : [message.threadId];

    switch (folderType) {
      case EFolderType.EMAIL:
      case EFolderType.MORE:
        const folderStatus = elmDrop?.getAttribute(
          'folder-status'
        ) as TaskStatusType;
        if (
          this.isMoving ||
          ![
            TaskStatusType.completed,
            TaskStatusType.inprogress,
            TaskStatusType.deleted
          ].includes(folderStatus) ||
          message.mailBoxId !== folderMailBoxId
        ) {
          this.toastService.clear();
          this.toastService.success(CAN_NOT_MOVE);
          return;
        }
        this.inboxService.dropMessageToPortalInbox$.next({
          status: folderStatus,
          listThreadId
        });
        break;
      case EFolderType.MAIL:
        const dataFolder = JSON.parse(
          elmDrop?.getAttribute('folder-data')
        ) as IDataMailFolder;
        if (
          !dataFolder?.moveAble ||
          currentLabelId === dataFolder.internalId ||
          this.isMoving ||
          message.mailBoxId !== folderMailBoxId
        ) {
          this.toastService.clear();
          this.toastService.success(CAN_NOT_MOVE);
          return;
        }
        this.moveMessagesToMailFolder(dataFolder, listThreadId, currentLabelId);
        break;
    }
  }

  handleMoveToMailFolder(
    payload: IMailFolderQueryParams,
    message: EmailItem,
    folderStatus?: string
  ) {
    this.isMoving = true;
    this.toastService.show(
      MESSAGE_MOVING_TO_TASK,
      '',
      {
        disableTimeOut: false
      },
      'toast-syncing-custom'
    );

    this.emailApiService
      .moveMailFolder(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isMoving = false;
          this.inboxSidebarService.refreshStatisticsUnreadTask(
            this.currentMailboxId
          );
          this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
            this.currentMailboxId
          );
        },
        error: () => {
          this.isMoving = false;
          this.toastService.clear();
          this.toastService.error(MOVE_MESSAGE_FAIL);
        }
      });
  }

  moveMessagesToMailFolder(
    dataFolder: IDataMailFolder,
    listThreadId: string[],
    currentLabelId: string
  ) {
    const filteredItems = this.inboxList.filter(() => {
      return (
        this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
        TaskStatusType.mailfolder
      );
    });
    const threadIds =
      listThreadId.length > 0
        ? listThreadId
        : filteredItems.map((item: EmailItem) => item?.threadId);
    const payload: IMailFolderQueryParams = {
      newLabelId: dataFolder.internalId,
      mailBoxId: this.currentMailboxId,
      currentLabelId,
      threadIds: threadIds,
      isValidateTask:
        dataFolder?.wellKnownName === EInboxAction.INBOX &&
        this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
          TaskStatusType.mailfolder
    };
    this.toastService.clear();
    this.toastService.show(
      getTitleToastMovingProcessing(
        threadIds,
        payload.isValidateTask ? TaskStatusType.inprogress : ''
      ),
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );

    this.emailApiService
      .moveMailFolder(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.data?.length > 0) {
            this.toastService.clear();
            this.emailViewService.handleConfirmMoveMailToInbox.next({
              data: res?.data,
              payload
            });
          } else {
            this.inboxSidebarService.refreshStatisticsUnreadTask(
              this.currentMailboxId
            );
            this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
              this.currentMailboxId
            );
            this.handleClearSelected();
          }
        },
        error: (error) => {
          this.handleClearSelected();
          this.toastService.clear();
          this.toastService.error(error?.error?.message ?? MOVE_MESSAGE_FAIL);
        }
      });
  }

  subscribeConfirmMoveMailToInbox() {
    this.emailViewService.handleConfirmMoveMailToInbox
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ data, payload }) => {
        if (!data) return;
        this.payloadMoveMessageToInbox = payload;
        this.listConfirmMoveMailToInbox = data;
        this.showPopupConfirmMoveMultiple = true;
      });
  }

  handleMapGmailList(mails: EmailItem[], inboxItems?: EmailItem[]) {
    return (
      Array.isArray(mails) &&
      [...mails]?.map((it) => ({
        ...it,
        isSelected: !!inboxItems && inboxItems?.some((ib) => ib.id === it.id)
      }))
    );
  }

  checkQueryParam(newQueryParams: Params) {
    if (!this.currentQueryParams) return true;
    return !isEqual(this.currentQueryParams, newQueryParams);
  }

  onDistinctScroll($event) {
    if (this.sharedMessageViewService.isRightClickDropdownVisibleValue) {
      this.resetRightClickSelectedState();
    }
    this.scrollTop =
      $event.target.scrollTop < 1000 ? $event.target.scrollTop : this.scrollTop;
    this.cdr.markForCheck();
  }

  scrollToUp(position: number = 20): void {
    this.scrollTimeOut = setTimeout(() => {
      const targetElement =
        this.infiniteScrollView?.nativeElement.children[position];

      this.scrollToTarget(targetElement, 'start', 'nearest');

      if (this.infiniteScrollIndex.nativeElement.scrollTop) {
        this.renderer.setProperty(
          this.infiniteScrollIndex.nativeElement,
          'scrollTop',
          this.infiniteScrollIndex.nativeElement.scrollTop + this.scrollTop
        );
      }
      this.cdr.markForCheck();
    }, 0);
  }

  private scrollToTarget(
    targetElement: Element | HTMLElement,
    block: ScrollLogicalPosition,
    inline: ScrollLogicalPosition
  ): void {
    if (targetElement) {
      targetElement.scrollIntoView({
        block,
        inline
      });
    }
  }

  onScrollToBottom() {
    if (this.showSpinnerBottom) return;
    this.isTargetElement = false;
    this.store.dispatch(messagesMailFolderPageActions.nextPage());
  }

  onScrollToTop(isTarget: boolean = false) {
    this.isTargetElement = isTarget;
    this.popoverService.name$.next('');
    this.popoverService.setActionConversation(null);

    this.pagination = {
      ...this.pagination,
      initial: false
    };

    if (this.showSpinnerTop) return;
    this.store.dispatch(messagesMailFolderPageActions.prevPage());
  }

  trackByMessageEmail(index: number, item: EmailItem): string {
    return item.id;
  }

  handleSelectedGmails(event) {
    if (this.startIndex === -1) {
      this.startIndex = this.gmailList.findIndex(
        (item) => item.id === this.currentMailMessageId
      );
    }
    this.activeGmailList = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.activeGmailList,
      this.gmailList
    );
  }

  handleAddSelectedGmail(event) {
    const res = addItem(
      event.currentGmailId,
      event.currentGmailIndex,
      this.activeGmailList
    );
    if (res) {
      this.activeGmailList = res.activeItems;
      this.startIndex = res._startIndex;
    }
  }

  handleRemoveActiveGmail(currentGmailId?: string) {
    const { activeItems, _startIndex } = removeActiveItem(
      this.activeGmailList,
      this.startIndex,
      currentGmailId
    );
    this.activeGmailList = activeItems;
    this.startIndex = _startIndex;
  }

  handleDeleteGmail($event) {
    if (
      this.currentQueryParams['externalId'] ===
        LABEL_EXTERNAL_ID_MAIL_BOX.TRASH ||
      this.currentQueryParams['externalId'] ===
        encodeURIComponent(
          getDeletedItemsFolderExternalId(
            this.folderService,
            this.folderService.getEmailFolderByMailBoxId(this.currentMailboxId),
            this.currentMailboxId
          )
        )
    )
      return;
    const externalId = this.currentQueryParams['externalId'];
    const listMailFolder = this.getListEmailFolder();
    const currentLabelId = listMailFolder?.find(
      (lmf) => lmf.externalId === externalId
    )?.internalId;
    const deleteFolder = listMailFolder.find(
      (folder) =>
        folder.wellKnownName === LABEL_NAME_OUTLOOK.DELETED_ITEMS ||
        folder.externalId === LABEL_EXTERNAL_ID_MAIL_BOX.TRASH
    );

    const payload: IMailFolderQueryParams = {
      mailBoxId: this.currentMailboxId,
      threadIds: [$event.threadId],
      conversationIds: [],
      currentLabelId,
      newLabelId: deleteFolder.internalId
    };
    this.handleMoveToMailFolder(payload, null, null);
  }

  async onRightClick(event, menu, mail: EmailItem) {
    event.preventDefault();
    const messageList = await firstValueFrom(
      this.inboxToolbarService.inboxItem$
    );
    if (messageList?.length < 2) {
      this.sharedMessageViewService.setIsRightClickDropdownVisible(true);
      this.sharedMessageViewService.setRightClickSelectedMessageId(mail.id);
      this.selectedGmail = mail;
      this.nzContextMenuService.create(event, menu);
    }
  }

  resetRightClickSelectedState() {
    this.selectedGmail = null;
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
    // this.emailViewService.triggerResetEmailDetail();
  }

  handleNavigateNextEmail() {
    if (!this.currentMailMessageId) return;
    const emailIndex = this.gmailList?.findIndex(
      (item) => item.id === this.currentMailMessageId
    );
    if (
      emailIndex > -1 &&
      emailIndex !== this.gmailList?.length &&
      this.gmailList[emailIndex + 1]?.id
    ) {
      this.handleNavigateEmailDetail(this.gmailList[emailIndex + 1]);
    }
  }

  handleNavigatePreEmail() {
    if (!this.currentMailMessageId) return;
    const messageIndex = this.gmailList?.findIndex(
      (item) => item.id === this.currentMailMessageId
    );
    if (messageIndex > 0 && this.gmailList[messageIndex - 1]?.id) {
      this.handleNavigateEmailDetail(this.gmailList[messageIndex - 1]);
    }
  }

  handleNavigateEmailDetail(gmail: EmailItem) {
    this.router.navigate([], {
      queryParams: {
        threadId: gmail.threadId,
        emailMessageId: gmail.id,
        status: TaskStatusType.mailfolder
      },
      queryParamsHandling: 'merge'
    });
    if (gmail && !gmail.isRead) {
      this.emailApiService
        .modifyReadMessage(gmail.firstMessageId || gmail?.id)
        .pipe(
          takeUntil(this.destroy$),
          tap(() => {
            this.inboxToolbarService.setFilterUnReadMessage(gmail.id);
            this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
              this.currentMailboxId
            );
          })
        )
        .subscribe();
    }
  }

  private handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
    this.sharedMessageViewService.setIsSelectingMode(false);
  }

  handleContextMenu(emailMenuType: EInboxAction) {
    this.handleClearSelected();
    switch (emailMenuType) {
      case EInboxAction.MOVE_MESSAGE_TO_INBOX:
        const inboxStatus = TaskStatusType.inprogress;

        this.inboxService.dropMessageToPortalInbox$.next({
          status: inboxStatus,
          listThreadId: [this.selectedGmail?.threadId]
        });
        break;
      case EInboxAction.MOVE_MESSAGE_TO_EMAIL:
        this.showMoveToMailFolderPopup();
        break;
      case EInboxAction.MOVE_MESSAGE_TO_RESOLVED:
      case EInboxAction.MOVE_MESSAGE_TO_DELETED:
        const newStatus =
          emailMenuType === EInboxAction.MOVE_MESSAGE_TO_RESOLVED
            ? TaskStatusType.completed
            : TaskStatusType.deleted;

        this.inboxService.dropMessageToPortalInbox$.next({
          status: newStatus,
          listThreadId: [this.selectedGmail?.threadId]
        });
        break;
      case EInboxAction.REPORT_SPAM:
        this.emailViewService.setPreQuerryParamsMoveMessage(
          this.currentQueryParams
        );
        this.handleReportSpam();
        break;
      case EInboxAction.NOT_SPAM:
        this.emailViewService.setPreQuerryParamsMoveMessage(
          this.currentQueryParams
        );
        this.handleNotSpam();
        break;
      default:
        break;
    }
    this.nzContextMenuService.close();
  }

  dragMovedHandler(event: CdkDragMove) {
    this.currentDraggingToFolderName =
      this.inboxExpandService.getFolderNameWhenDragging(event.pointerPosition);
    this.inboxExpandService.expandSubMenu(event.pointerPosition);
    if (this.sharedMessageViewService.isRightClickDropdownVisibleValue) {
      this.resetRightClickSelectedState();
    }
  }

  showMoveToMailFolderPopup() {
    this.emailViewService.setEmailMoveToAction({
      action: EInboxAction.MOVE_MESSAGE_TO_EMAIL,
      threadId: this.selectedGmail?.threadId
    });
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_EMAIL_FOLDER
    );
  }

  handleOpenMoveTo(event: Event) {
    event.stopPropagation();
    const externalId = this.currentQueryParams['externalId'];
    const gmail = this.gmailList.find(
      (rs) =>
        rs.id === this.sharedMessageViewService.rightClickSelectedMessageIdValue
    );
    const listMailFolder = this.getListEmailFolder();
    const currentEmailFolder = listMailFolder?.find(
      (folder) => folder.externalId === externalId
    );
    const payload = {
      mailBoxId: this.currentMailboxId,
      threadIds: [gmail?.threadId],
      labelId: currentEmailFolder?.internalId
    };
    this.emailApiService
      .checkMoveMailFolder(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: ICheckMoveMailFolderResponse) => {
        if (res) {
          const emailFolders = res?.emailFolders.map((item) => item.id);
          this.emailApiService.setlistEmailFolder(emailFolders);
          this.menuDropDown[EInboxAction.MOVE_MESSAGE_TO_INBOX] = res.inbox;
          this.menuDropDown[EInboxAction.MOVE_MESSAGE_TO_EMAIL] =
            !!res.emailFolders?.length;
          this.menuDropDown[EInboxAction.MOVE_MESSAGE_TO_RESOLVED] =
            res.resolvedEnquiries;
          this.menuDropDown[EInboxAction.MOVE_MESSAGE_TO_DELETED] =
            res.deletedEnquiries;
        }
      });
  }

  handleReportSpam() {
    const externalId = this.currentQueryParams['externalId'];
    const listMailFolder = this.getListEmailFolder();
    const currentEmailFolder = listMailFolder?.find(
      (folder) => folder.externalId === externalId
    );
    this.showMovingToast();
    const body = {
      mailBoxId: this.currentMailboxId,
      conversationIds: [],
      threadIds: [this.selectedGmail?.threadId],
      currentLabelId: currentEmailFolder?.internalId
    };
    this.emailApiService
      .reportSpamFolder(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedGmail = null;
        },
        error: (error) => {
          this.showToastError(error);
        }
      });
  }

  showMovingToast() {
    this.toastService.clear();
    this.toastService.show(
      MESSAGE_MOVING_TO_TASK,
      '',
      {
        disableTimeOut: false
      },
      'toast-syncing-custom'
    );
  }

  handleNotSpam() {
    this.showMovingToast();
    const body = {
      mailBoxId: this.currentMailboxId,
      threadIds: [this.selectedGmail?.threadId]
    };
    this.emailApiService
      .handleNotSpam(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: (error) => {
          this.showToastError(error);
        }
      });
  }

  showToastError(error) {
    this.toastService.clear();
    this.toastService.error(
      error?.error?.message ?? 'Report spam failed. Please try again.'
    );
  }

  handleCancelPopupConfirm() {
    this.showPopupConfirmMoveMultiple = false;
  }

  handleConfirmPopupConfirm($event) {
    this.toastService.clear();
    this.toastService.show(
      $event.length > 1 ? MESSAGES_MOVING_TO_TASK : MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );
    this.emailApiService
      .moveMailFolder({
        ...this.payloadMoveMessageToInbox,
        isValidateTask: false
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.inboxSidebarService.refreshStatisticsUnreadTask(
            this.currentMailboxId
          );
          this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
            this.currentMailboxId
          );
          this.handleClearSelected();
        },
        error: (error) => {
          this.handleClearSelected();
          this.toastService.clear();
          this.toastService.error(error?.error?.message ?? MOVE_MESSAGE_FAIL);
        }
      });
    this.showPopupConfirmMoveMultiple = false;
  }

  ngOnDestroy() {
    this.resetRightClickSelectedState();
    this.store.dispatch(messagesMailFolderPageActions.exitPage());
    this.emailViewService.setEmailMoveToAction(null);
    this.inboxService.setPopupMoveToTaskState(null);
    this.messageIdSetService.clear();
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.scrollTimeOut);
  }

  private _handleUpdateEmailPreview(threadId: string, emailMessageId: string) {
    if (!threadId || !emailMessageId) {
      this.emailViewService.triggerResetEmailDetail();
    }

    const currentQueryParams = this.activatedRoute.snapshot.queryParamMap;
    if (
      currentQueryParams.get(EMessageQueryType.THREAD_ID) === threadId &&
      currentQueryParams.get(EMessageQueryType.EMAIL_MESSAGE_ID) ===
        emailMessageId
    ) {
      return;
    }
    this.router.navigate([], {
      queryParams: {
        threadId,
        emailMessageId
      },
      queryParamsHandling: 'merge'
    });
    this.resetRightClickSelectedState();
  }
}
