import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  pairwise,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { SharedService } from '@/app/services/shared.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NzResizeEvent } from 'ng-zorro-antd/resizable';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { ConversationService } from '@/app/services/conversation.service';
import { isEqual, throttle } from 'lodash-es';
import { FilesService } from '@/app/services/files.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ToastrService } from 'ngx-toastr';
import { PreviewConversation } from '@/app/shared/types/conversation.interface';
import {
  EConversationType,
  ERequestType,
  SocketType,
  TaskType
} from '@/app/shared/enum';
import { EGenerateSummaryStatus } from '@/app/task-detail/modules/summary-message-dialog/interface/message-summary.interface';
import {
  FileCarousel,
  IFile,
  TaskItem,
  whiteListClickOutsideSelectReceiver,
  whiteListInHeader,
  whiteListInMessage,
  whiteListInMsgDetail
} from '@/app/shared';
import { UserService } from '@/app/services/user.service';
import {
  IConversationSummary,
  IConversationSummaryItem
} from './interface/conversation-summary';
import { ConverationSummaryService } from './services/converation-summary.service';
import { WidgetLinkedService } from '@/app/task-detail/modules/sidebar-right/services/widget-linked.service';
import { CompanyService } from '@/app/services';
import { AgencyService } from '@/app/dashboard/services/agency.service';
const HEIGHT_MULTIPLIERS = {
  MIN: 0.2,
  MAX: 0.7,
  MAX_EMAIL: 0.8,
  DEFAULT: 0.4,
  HEADER_SUMMARY: 48
};
const SCROLL_DELAY_MS = 100;
const DEFAULT_CONTENT_HEIGHT = 36;
@Component({
  selector: 'conversation-summary',
  templateUrl: './conversation-summary.component.html',
  styleUrl: './conversation-summary.component.scss',
  animations: [
    trigger('collapseModal', [
      state('expanded', style({ height: '*' })),
      state('collapsed', style({ height: 36, maxWidth: 360 })),
      transition('collapsed => expanded', animate('0.25s ease-in-out')),
      transition('expanded => collapsed', animate('0.25s ease-in-out'))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSummaryComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('conversationSummary') conversationSummary: ElementRef;
  @ViewChild('conversationSummaryContainer')
  conversationSummaryContainer: ElementRef<HTMLElement>;

  @Input() set currentConversation(value: PreviewConversation) {
    this.currentConversation$.next(value);
  }
  @Input() set currentTask(value: TaskItem) {
    this.currentTask$.next(value);
  }
  @Input() elementRefHeight: number = 0;
  @Input() isNoMessage: boolean = false;
  @Input() emailVerified: string = '';
  @Output() readonly triggerCurrentConversation =
    new EventEmitter<PreviewConversation>();

  private readonly currentConversation$ =
    new BehaviorSubject<PreviewConversation>(null);
  private readonly currentTask$ = new BehaviorSubject<TaskItem>(null);
  private readonly refetchCurrentConversation$ = new BehaviorSubject<boolean>(
    false
  );
  private readonly contactSummaryTrigger$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  public listConversationSummary: IConversationSummaryItem[] = [];
  public isExpandConversationSummary: boolean = false;
  public isConsole: boolean = false;
  public isGeneratingMsg: boolean = false;
  public isResizeDisable: boolean = false;
  public isTaskType: boolean = false;
  public isResized: boolean = false;
  public isMessagesSocket: boolean = false;
  public showAttachment: boolean = false;
  public callApi: boolean = true;
  public isRmEnvironment: boolean = false;

  public inputTaskType: TaskType;
  public lastSession;
  public selectedTicketId: string;
  public status: string;
  public maxContentHight: number;
  public contentHeight: number;
  public minHeight: number;
  public maxHeight: number;
  public heightContentSummary: number;
  public id: number;
  public timeoutToggle: NodeJS.Timeout;
  public timeOut: NodeJS.Timeout;
  public scrollTimeoutId: NodeJS.Timeout;
  private scrollTimeOut: NodeJS.Timeout;
  readonly EConversationType = EConversationType;
  readonly whiteListMsgDetail = [
    ...whiteListInMsgDetail,
    ...whiteListInHeader,
    ...whiteListClickOutsideSelectReceiver,
    ...whiteListInMessage
  ];

  public listAudioFile: IFile[] | FileCarousel[];
  private resizeObserver: ResizeObserver;
  private previousHeight: number | null = null;
  private scrollHandler: (event: Event) => void;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly sharedService: SharedService,
    private readonly websocketService: RxWebsocketService,
    private readonly filesService: FilesService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly toastService: ToastrService,
    private readonly userService: UserService,
    private readonly converationSummaryService: ConverationSummaryService,
    private readonly companyService: CompanyService,
    private readonly ngZone: NgZone,
    private readonly agencyService: AgencyService,
    public readonly inboxService: InboxService,
    public readonly conversationService: ConversationService,
    public readonly router: Router,
    private widgetLinkedService: WidgetLinkedService
  ) {}

  get currentConversation() {
    return this.currentConversation$?.getValue() ?? null;
  }

  get currentTask() {
    return this.currentTask$?.getValue() ?? null;
  }

  get disableSummaryGeneration() {
    return (
      (!this.currentConversation?.lastSummaryUpdatedAt && this.isConsole) ||
      this.isNoMessage
    );
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.converationSummaryService.loadingMessageSummary$.next(true);
    this.subscribeCurrentCompany();
    this.subscribleCurrentTask();
    this.onPairwiseConversation();
    this.subscribleCurrentConversation();
    this.subscribeQueryParam();
    this.subscribeSocketGenerateConversationSummary();
    this.subscribeSocketNewTicket();
    this.subscribeSocketSend();
    this.subscribeSocketAssignContact();
    this.subscribeSocketDeleteContact();
    this.subscribeContactSummary();
    this.subscribeSocketReadTicket();

    this.widgetLinkedService.actionItemData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.listConversationSummary = this.listConversationSummary?.map(
          (item) => {
            if (item?.messageId === rs?.additionalData?.sessionId) {
              return {
                ...item,
                messageRequest: [rs?.actionItem]
              };
            }
            return item;
          }
        );
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit() {
    this.initializeResizeObserver();
    this.initializeScrollObserver();
  }

  private subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }

  private subscribleCurrentTask() {
    this.currentTask$.pipe(takeUntil(this.destroy$)).subscribe((task) => {
      this.isTaskType = task?.taskType !== TaskType.MESSAGE;
      this.inputTaskType = task?.taskType;
    });
  }

  onPairwiseConversation() {
    this.currentConversation$
      .pipe(pairwise(), takeUntil(this.destroy$))
      .subscribe(([previousValue, current]) => {
        if (previousValue?.id !== current?.id) {
          this.callApi = true;
        }
      });
  }

  private subscribleCurrentConversation() {
    combineLatest([
      this.currentConversation$.pipe(
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      ),
      this.refetchCurrentConversation$
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(
          ([
            { isGenerateSummary, id, lastSummaryUpdatedAt, conversationType }
          ]) =>
            this.filterConditionSummary(
              conversationType,
              id,
              lastSummaryUpdatedAt,
              isGenerateSummary
            )
        ),
        switchMap(([{ id }]) => {
          this.getCacheConversationSummary(id);
          return combineLatest([
            of(id),
            this.converationSummaryService.getMessageSummary(
              id || this.currentTask?.conversations?.[0]?.id
            )
          ]);
        }),
        tap(([id, res]) => this.saveCacheConversationSummary(id, res)),
        debounceTime(300)
      )
      .subscribe({
        next: ([_, res]) => this.handleSummarySuccess(res)
      });
  }

  private filterConditionSummary(
    conversationType: EConversationType,
    id: string,
    lastSummaryUpdatedAt: string,
    isGenerateSummary: boolean
  ) {
    if (conversationType === EConversationType.EMAIL) {
      return lastSummaryUpdatedAt !== null && !!id && this.callApi;
    }

    return isGenerateSummary && !!id && this.callApi;
  }

  private handleSummarySuccess(data) {
    this.isGeneratingMsg = false;
    this.callApi = false;
    this.lastSession = data?.lastSession;
    this.refetchCurrentConversation$.next(false);
    this.updateCurrentConversation({
      isGenerateSummary: true
    });
    const dataEnd = this.mapListConversationSummary(
      this.currentConversation?.conversationType === EConversationType.EMAIL
        ? data
        : data?.summaries
    );
    this.sortListConversationSummary(dataEnd);
    const sessionIdLinkedTask =
      this.inboxService.sessionIdLinkedTask$.getValue();
    const requestIdLinkedTask =
      this.inboxService.requestIdLinkedTask$.getValue();

    const lastEmailMessage = data[data?.length - 1];
    this.triggerExpandSessionItem(
      sessionIdLinkedTask ||
        data?.lastSession?.sessionId ||
        lastEmailMessage?.sessionId,
      requestIdLinkedTask
    );
    requestIdLinkedTask && this.inboxService.requestIdLinkedTask$.next(null);
    sessionIdLinkedTask && this.inboxService.sessionIdLinkedTask$.next(null);
  }

  private mapListConversationSummary(data) {
    data = data?.map((item) => {
      if (
        this.currentConversation?.conversationType === EConversationType.EMAIL
      ) {
        return {
          ...item,
          sessionCreatedAt: item?.createdAt,
          sessionId: item?.messageId
        };
      }
      return item;
    });
    return data;
  }

  private getCacheConversationSummary(id: string) {
    const dataLocal =
      this.converationSummaryService.cacheConversationSummary.get(id);
    if (dataLocal) this.handleSummarySuccess(dataLocal);
  }

  private saveCacheConversationSummary(id: string, res: IConversationSummary) {
    this.converationSummaryService.cacheConversationSummary.set(id, res);
  }

  private updateConversationSummary(data) {
    this.listConversationSummary = this.listConversationSummary.map((message) =>
      message?.conversationId === data?.conversationId &&
      message?.sessionId === data?.sessionId
        ? {
            ...message,
            displayName: data?.displayName,
            isTemporary: data?.user?.isTemporary,
            emailMetaData: { to: [data?.user] }
          }
        : message
    );

    this.mapListAudioFile();
  }

  private subscribeContactSummary() {
    this.contactSummaryTrigger$
      .pipe(
        switchMap(() =>
          this.shouldGetContactSummarySession()
            ? this.converationSummaryService.getContactSummarySession(
                this.currentConversation?.id,
                this.lastSession?.sessionId ||
                  this.currentConversation?.lastSessionId
              )
            : EMPTY
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          if (data && this.isRelevantSession(data)) {
            this.updateConversationSummary(data);
          }
        }
      });
  }

  private shouldGetContactSummarySession() {
    return (
      this.currentConversation?.id &&
      (this.lastSession?.sessionId || this.currentConversation?.lastSessionId)
    );
  }

  private isRelevantSession(data) {
    return (
      data?.conversationId === this.currentConversation?.id &&
      (data?.sessionId === this.lastSession?.sessionId ||
        data?.sessionId === this.currentConversation?.lastSessionId)
    );
  }

  private subscribeSocketAssignContact() {
    this.websocketService.onSocketAssignContact
      .pipe(
        filter((res) => res?.conversationId === this.currentConversation?.id),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (
          this.currentConversation?.conversationType === EConversationType.EMAIL
        ) {
          this.refetchCurrentConversation$.next(true);
        } else {
          this.contactSummaryTrigger$.next();
        }
      });
  }

  private subscribeSocketDeleteContact() {
    this.websocketService.onSocketDeleteSecondaryContact
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (res) =>
            [
              SocketType.deleteInternalContact,
              SocketType.deleteSecondaryPhone,
              SocketType.deleteSecondaryEmail
            ].includes(res?.type as SocketType) &&
            res?.conversationId === this.currentConversation?.id
        )
      )
      .subscribe(() => this.contactSummaryTrigger$.next());
  }

  private sortListConversationSummary(data: IConversationSummaryItem[]) {
    const orderBy = ['photo', 'audio', 'video', 'file'];
    this.listConversationSummary = data?.sort(this.sortBySessionCreatedAt);

    this.listConversationSummary?.forEach((item) => {
      if (item?.attachments) {
        item.attachments.sort((a, b) => this.sortAttachments(a, b, orderBy));
      }
    });

    this.mapListAudioFile();
  }

  private sortBySessionCreatedAt(
    a: IConversationSummaryItem,
    b: IConversationSummaryItem
  ): number {
    return (
      new Date(a?.sessionCreatedAt).getTime() -
      new Date(b?.sessionCreatedAt).getTime()
    );
  }

  private sortAttachments(a, b, orderBy: string[]): number {
    const aType = this.filesService.getFileTypeSlash(a?.fileType?.name);
    const bType = this.filesService.getFileTypeSlash(b?.fileType?.name);

    const typeComparison = orderBy.indexOf(aType) - orderBy.indexOf(bType);
    if (typeComparison !== 0) return typeComparison;

    const dateComparison =
      new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime();
    if (dateComparison !== 0) return dateComparison;

    if (aType === 'file' && bType === 'file') {
      const aSize = parseInt(a?.size, 10);
      const bSize = parseInt(b?.size, 10);
      return bSize - aSize;
    }

    return 0;
  }

  private subscribeQueryParam() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.callApi = true;
        this.contentHeight = 50;
        this.isResized = false;
        this.isExpandConversationSummary = false;
        this.maxContentHight = null;
        this.lastSession = null;
        this.converationSummaryService.triggerExpandConversationSummary$.next(
          false
        );
        this.converationSummaryService.loadingMessageSummary$.next(true);
        if (params['lastSessionId']) {
          if (this.timeoutToggle) clearTimeout(this.timeoutToggle);
          this.timeoutToggle = setTimeout(() => {
            this.toggleConversationSummary(params['lastSessionId']);
          }, 300);
          this.removeQueryParamAfterNavigate();
        }
      });
  }

  private removeQueryParamAfterNavigate() {
    this.router.navigate([], {
      queryParams: {
        lastSessionId: null,
        ticketId: null
      },
      queryParamsHandling: 'merge'
    });
  }

  private subscribeSocketGenerateConversationSummary() {
    this.websocketService.onSocketGenerateMessageSummary
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (data) =>
            data.type === SocketType.generateMessageSummary &&
            data?.conversationId === this.currentConversation?.id
        ),
        distinctUntilChanged((pre, curr) => isEqual(pre, curr))
      )
      .subscribe((data) => {
        if (
          !this.isGeneratingMsg &&
          this.currentConversation?.conversationType === EConversationType.EMAIL
        ) {
          this.isExpandConversationSummary = false;
          this.converationSummaryService.triggerExpandConversationSummary$.next(
            false
          );
        }

        this.status = data?.status;

        this.updateCurrentConversation({
          lastSummaryUpdatedAt: data?.lastSummaryUpdatedAt,
          isGenerateSummary: true
        });

        if (data?.status === EGenerateSummaryStatus.FAILED) {
          this.toastService.error('Fail to summarize. Please try again.');
          this.isGeneratingMsg = false;
          return;
        }

        this.callApi = true;
        this.refetchCurrentConversation$.next(true);
        if (
          this.currentConversation?.conversationType === EConversationType.EMAIL
        ) {
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }

  private subscribeSocketSend() {
    this.websocketService.onSocketSend
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (data) =>
            data.type === SocketType.send &&
            data?.mailBoxId === this.currentTask?.mailBoxId &&
            data?.conversationId === this.currentConversation?.id
        )
      )
      .subscribe((data) => {
        this.updateCurrentConversation({ isGenerateSummary: false });
        this.handleExpandConversationSummary(data?.options);
      });
  }

  private handleExpandConversationSummary(
    optionsJson: string | undefined
  ): void {
    if (!optionsJson) return;

    try {
      const parsedOptions = JSON.parse(optionsJson) as {
        response: { type: ERequestType };
      };

      const isResponseTypeValid = Object.values(ERequestType).includes(
        parsedOptions.response.type
      );

      if (isResponseTypeValid) {
        this.isExpandConversationSummary = false;
      }
    } catch (error) {
      console.error('Failed to parse options JSON:', error);
    }
  }

  private subscribeSocketNewTicket() {
    this.websocketService.onSocketNewTicket
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (data) =>
            data?.type === SocketType.newTicket &&
            data?.conversationType ===
              this.currentConversation.conversationType &&
            data?.conversationId === this.currentConversation?.id
        )
      )
      .subscribe((data) => {
        this.isExpandConversationSummary = false;
        if (data?.isNewTicket) {
          const countUnreadTicket =
            (this.currentConversation?.countUnreadTicket || 0) + 1;
          this.updateCurrentConversation({
            countUnreadTicket,
            isGenerateSummary: false
          });
          this.triggerCountTicketConversation({
            ...data,
            countUnreadTicket
          });
        }
        this.cdr.detectChanges();
      });
  }

  private subscribeSocketReadTicket() {
    this.websocketService.onSocketReadTicket
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (data) =>
            data?.type === SocketType.readTicket &&
            data?.userId === this.userService.userInfo$.getValue()?.id
        )
      )
      .subscribe((data) => {
        if (!data) return;
        this.updateCurrentConversation({
          countUnreadTicket: 0
        });
        this.triggerCountTicketConversation({ ...data, countUnreadTicket: 0 });
      });
  }

  private updateCurrentConversation({
    countUnreadTicket = this.currentConversation?.countUnreadTicket,
    isGenerateSummary = this.currentConversation?.isGenerateSummary,
    lastSummaryUpdatedAt = this.currentConversation?.lastSummaryUpdatedAt
  }) {
    if (!this.currentConversation) return;

    this.triggerCurrentConversation.next({
      ...this.currentConversation,
      countUnreadTicket: countUnreadTicket,
      isGenerateSummary: isGenerateSummary,
      lastSummaryUpdatedAt: lastSummaryUpdatedAt
    });
  }

  private triggerCountTicketConversation(data) {
    if (!data) return;

    this.converationSummaryService.setTriggerCountTicketConversation({
      taskId: data?.taskId,
      countUnreadTicket: data?.countUnreadTicket,
      conversationId: data?.conversationId
    });
  }

  private triggerExpandSessionItem(sessionId: string, messageId?: string) {
    const lastMessage =
      this.listConversationSummary[this.listConversationSummary.length - 1];

    this.listConversationSummary = this.listConversationSummary?.map(
      (summary: IConversationSummaryItem) => ({
        ...summary,
        isOpen:
          summary?.sessionId === sessionId ||
          summary?.sessionId === lastMessage?.sessionId
      })
    );

    this.mapListAudioFile();

    const currrentConversationSummary = this.listConversationSummary?.find(
      (item) =>
        item.sessionId === sessionId ||
        item?.sessionId === lastMessage?.sessionId
    );

    if (!this.listConversationSummary?.length) return;
    const messageRequest = currrentConversationSummary?.messageRequest;
    if (!!messageRequest?.length) {
      this.isExpandConversationSummary &&
        this.converationSummaryService.selectedTicketId$.next(
          messageId || messageRequest?.[messageRequest?.length - 1]?.messageId
        );
    } else {
      this.scrollToElement(currrentConversationSummary?.sessionId);
    }
  }

  private triggerUpdateReadTicket() {
    if (
      this.currentConversation?.countUnreadTicket &&
      this.isExpandConversationSummary &&
      !this.isConsole
    ) {
      this.converationSummaryService
        .readTicket(this.currentConversation?.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.updateCurrentConversation({
            countUnreadTicket: res?.countUnreadTicket
          });
          this.triggerCountTicketConversation(res);
          this.cdr.detectChanges();
        });
    }
  }

  private generateMessageSummary(isGeneratingMsg = true) {
    if (this.isGeneratingMsg) {
      return;
    }
    this.isGeneratingMsg = isGeneratingMsg;
    const bodyGeneral = {
      conversationId: this.currentConversation?.id,
      mailBoxId: this.currentTask?.mailBoxId,
      currentUserId: this.userService.userInfo$.getValue()?.id,
      receiveUserId: this.currentConversation?.userId,
      conversationType: this.currentConversation?.conversationType
    };
    const bodyEmail = {
      conversationId: this.currentConversation?.id,
      mailBoxId:
        this.currentTask?.mailBoxId || this.currentConversation?.mailBoxId
    };
    this.converationSummaryService
      .generateMessageSummary(
        this.currentConversation?.conversationType === EConversationType.EMAIL
          ? bodyEmail
          : bodyGeneral
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  toggleConversationSummary(sectionIdParam: string) {
    // Toggle the state of the conversation summary expansion
    this.isExpandConversationSummary = !this.isExpandConversationSummary;
    this.converationSummaryService.triggerExpandConversationSummary$.next(
      this.isExpandConversationSummary
    );

    // If the summary is collapsed, clear the timeout and exit the function
    if (!this.isExpandConversationSummary) {
      clearTimeout(this.scrollTimeOut);
      return;
    }

    // Set showAttachment to true when the summary is expanded
    this.showAttachment = true;

    // Trigger update for read ticket status
    this.triggerUpdateReadTicket();

    if (this.shouldGenerateSummary) {
      this.generateMessageSummary();
    } else {
      this.isGeneratingMsg = false;
      const lastEmailMessage =
        this.listConversationSummary[this.listConversationSummary.length - 1];
      this.triggerExpandSessionItem(
        sectionIdParam ||
          this.lastSession?.sessionId ||
          lastEmailMessage?.sessionId
      );
    }
  }

  get shouldGenerateSummary() {
    // Check if we need to generate the summary or just expand the session item
    if (
      this.currentConversation?.conversationType === EConversationType.EMAIL
    ) {
      return (
        !this.currentConversation?.lastSummaryUpdatedAt &&
        this.status !== EGenerateSummaryStatus.FAILED
      );
    }
    return (
      !this.currentConversation?.isGenerateSummary &&
      this.status !== EGenerateSummaryStatus.FAILED
    );
  }

  onOutsideClick() {
    if (this.isExpandConversationSummary) {
      this.isExpandConversationSummary = false;
    }
    this.cdr.detectChanges();
  }

  scrollToElement(sessionId: string): void {
    const containerElement = this.conversationSummary?.nativeElement;

    // Clear any existing timeout to avoid multiple scrolls
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }

    // Set a timeout to handle scrolling after a short delay
    this.scrollTimeoutId = setTimeout(() => {
      const targetElement = containerElement?.querySelector(
        `#item_${sessionId}`
      );
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, SCROLL_DELAY_MS);
  }

  private initializeResizeObserver() {
    const element = this.conversationSummary.nativeElement;

    if (!element) return;

    this.resizeObserver = new ResizeObserver(() =>
      this.ngZone.run(() => this.handleResize())
    );
    this.resizeObserver.observe(element);
  }

  private handleResize(): void {
    const element = this.conversationSummary.nativeElement;
    const newHeight = element.offsetHeight;

    if (this.previousHeight === null || newHeight !== this.previousHeight) {
      this.previousHeight = newHeight;
      this.calculateContentDimensions(newHeight);
      this.cdr.detectChanges();
    }
  }

  private updateMessageDialogHeight() {
    this.adjustHeightValues(this.elementRefHeight);
    this.isResizeDisable = this.contentHeight < this.minHeight;

    // Ensure content height does not exceed maximum height
    if (this.contentHeight > this.maxHeight) {
      this.contentHeight = this.maxHeight;
    }
  }

  private adjustHeightValues(sectionElementHeight: number) {
    this.minHeight = sectionElementHeight * HEIGHT_MULTIPLIERS.MIN;
    this.maxHeight =
      this.currentConversation.conversationType === EConversationType.EMAIL
        ? sectionElementHeight * HEIGHT_MULTIPLIERS.MAX_EMAIL
        : sectionElementHeight * HEIGHT_MULTIPLIERS.MAX;
    this.contentHeight = sectionElementHeight * HEIGHT_MULTIPLIERS.DEFAULT;
  }

  private computeBodyMessageHeight(
    attachmentsHeight: number,
    bodySummaryHeight: number
  ) {
    return bodySummaryHeight + (attachmentsHeight || 0);
  }

  private updateContentHeight(bodyMessageHeight: number, minHeight: number) {
    const adjustedHeight =
      bodyMessageHeight + HEIGHT_MULTIPLIERS.HEADER_SUMMARY;
    const exceedsMinHeight =
      bodyMessageHeight > minHeight - HEIGHT_MULTIPLIERS.HEADER_SUMMARY;

    this.isResizeDisable = !exceedsMinHeight;
    this.contentHeight = adjustedHeight;
    this.maxHeight = exceedsMinHeight ? adjustedHeight : this.maxHeight;
    this.minHeight = exceedsMinHeight ? minHeight : this.minHeight;
  }

  private calculateContentDimensions(
    conversationSummaryHeight: number = 1,
    attachmentsListHeight: number = 0
  ) {
    if (!this.elementRefHeight) {
      this.contentHeight = DEFAULT_CONTENT_HEIGHT;
      this.cdr.markForCheck();
      return;
    }

    const minHeight = this.elementRefHeight * HEIGHT_MULTIPLIERS.MIN;
    const defaultContentHeight =
      this.elementRefHeight * HEIGHT_MULTIPLIERS.DEFAULT;
    const bodyMessageHeight = this.computeBodyMessageHeight(
      attachmentsListHeight,
      conversationSummaryHeight
    );

    if (
      bodyMessageHeight <
      defaultContentHeight - HEIGHT_MULTIPLIERS.HEADER_SUMMARY
    ) {
      this.updateContentHeight(bodyMessageHeight, minHeight);
    } else {
      this.updateMessageDialogHeight();
    }

    this.cdr.markForCheck();
  }

  private initializeScrollObserver() {
    this.ngZone.runOutsideAngular(() => {
      const element = this.conversationSummaryContainer.nativeElement;
      this.scrollHandler = throttle(
        (event: Event) => this.onScroll(event),
        200
      ); // Throttle to 200ms
      element.addEventListener('scroll', this.scrollHandler);
    });
  }

  private onScroll(event: Event) {
    this.converationSummaryService.triggerScroll$.next(true);
  }

  onAnimationEnd(event: AnimationEvent) {
    if (this.maxContentHight) {
      this.contentHeight = this.maxContentHight;
    }

    if ((event as any).toState === 'expanded') {
      this.maxContentHight = this.contentHeight;
    } else {
      this.isResized = false;
    }
  }

  onResizable({ height }: NzResizeEvent): void {
    if (height !== undefined) {
      cancelAnimationFrame(this.id);
      this.id = requestAnimationFrame(() => {
        this.contentHeight = height;
        this.isResized = true;
        this.cdr.detectChanges();
      });
    }
  }

  private mapListAudioFile() {
    if (
      this.currentConversation?.conversationType !==
      EConversationType.VOICE_MAIL
    )
      return;

    this.listAudioFile = [...this.listConversationSummary].map(
      (item, index) => {
        if (item.audioFile?.name) {
          let fileName = item.audioFile.name;
          const date = new Date(item.sessionCreatedAt);
          if (date) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(2);
            const formatDate = this.isRmEnvironment
              ? `${month}${day}${year}`
              : `${day}${month}${year}`;
            fileName = `Rec${formatDate}_${index + 1}.mp3`;
          }
          const audioFile = {
            id: (item.audioFile as any)?.fileId,
            fileName: fileName,
            name: fileName,
            propertyDocumentId: (item.audioFile as any)?.fileId,
            ...item.audioFile
          };
          this.listConversationSummary[index] = {
            ...this.listConversationSummary[index],
            audioFile
          };
          return audioFile;
        }
        return null;
      }
    ) as IFile[] | FileCarousel[];
  }

  destroyObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.scrollHandler) {
      this.conversationSummaryContainer.nativeElement.removeEventListener(
        'scroll',
        this.onScroll.bind(this)
      );
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.currentConversation$.complete();
    this.refetchCurrentConversation$.complete();
    this.contactSummaryTrigger$.complete();
    [this.timeOut, this.scrollTimeOut, this.timeoutToggle].forEach((timeout) =>
      clearTimeout(timeout)
    );
    this.destroyObserver();
  }
}
