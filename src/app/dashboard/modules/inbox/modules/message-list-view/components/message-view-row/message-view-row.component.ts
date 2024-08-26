import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import {
  BehaviorSubject,
  Subject,
  firstValueFrom,
  take,
  takeUntil
} from 'rxjs';
import {
  EMessageMenuOption,
  EMessageQueryType
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskService } from '@services/task.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EPropertyStatus } from '@shared/enum/user.enum';
import {
  IParticipant,
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { PopoverService } from '@services/popover.service';
import {
  ECreatedFrom,
  EMessageComeFromType
} from '@shared/enum/messageType.enum';
import { EMessageDetailProperty } from '@/app/dashboard/modules/inbox/modules/message-list-view/pipes/message-detail.pipe';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { PropertiesService } from '@services/properties.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { SharedService } from '@services/shared.service';
import {
  ConversationService,
  MessageStatus
} from '@services/conversation.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TIME_FORMAT, trudiUserId } from '@services/constants';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { ICheckMoveMailFolderResponse } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { getSummaryMessage } from '@shared/feature/function.feature';
import { isEqual } from 'lodash-es';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import { EPopupConversionTask } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { AddToTaskWarningService } from '@/app/dashboard/modules/inbox/components/add-to-task-warning/add-to-task-warning.service';
import { AutoScrollService } from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { defaultConfigsButtonAction } from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { FileMessage } from '@shared/types/message.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import { DeliveryFailedMessageStorageService } from '@/app/services';

@DestroyDecorator
@Component({
  selector: 'message-view-row',
  templateUrl: './message-view-row.component.html',
  styleUrls: ['./message-view-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageViewRowComponent
  implements AfterViewInit, OnInit, OnChanges, OnDestroy
{
  @ViewChild('menu') dropdownMenu: ElementRef;
  @ViewChild('messageRow') messageRow: ElementRef;
  @ViewChild('conversationTitle') conversationTitle: ElementRef<HTMLDivElement>;

  @Input() isRmEnvironment: boolean = false;
  @Input() set message(value) {
    this._message$.next(value);
  }
  @Input() dataFormat: string;
  @Input() queryTaskId: string;
  @Input() conversationId: string;
  @Input() search: string = '';
  @Input() index: number;
  @Input() currentUserId: string;
  @Input() activeMsgList: string[] = [];
  @Input() participants: IParticipant[] = [];
  @Input() isDraft: boolean;
  @Input() isLastMessageDraft: boolean;
  @Input() isDraftFolder: boolean;
  @Output() checkedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() removeItem = new EventEmitter<string>();
  @Output() setItem = new EventEmitter<void>();
  @Output() menuChange = new EventEmitter<{
    message: TaskItem;
    option: EMessageMenuOption | string;
    isDraftMessageWithoutConversation?: boolean;
  }>();
  @Output() activeMessage = new EventEmitter();
  @Output() pressShiftClick = new EventEmitter();
  @Output() removeActiveMsg = new EventEmitter();
  @Output() addSelectedMsg = new EventEmitter();
  @Output() navigateToNextMessage = new EventEmitter<void>();
  @Output() navigateToPreviousMessage = new EventEmitter<void>();
  public userContactOutlet: TemplateRef<HTMLElement>;
  public userPropertyOutlet: TemplateRef<HTMLElement>;
  public listOfConversations: PreviewConversation[];
  private destroy$ = new Subject<void>();
  public TaskStatusType = TaskStatusType;
  public menuDropDown = {
    addToTask: true,
    moveToFolder: true,
    forward: true,
    unread: false,
    resolve: true,
    reOpen: true,
    reportSpam: true,
    delete: true,
    urgent: true,
    saveToRentManager: false,
    saveToPropertyTree: false,
    removeFromTask: false
  };
  public tooltipPlacement = ['top', 'bottom'];
  public isReadMsg = false;
  public isUrgent = false;
  public isShowNoProperty: boolean;
  public isConsole: boolean = false;
  public isPropertyTypeLandlordOrOwner: boolean = false;
  public isActive: boolean = false;
  public isFocused: boolean = false;
  public pipeType: string = EMessageDetailProperty.ROLE;
  public toolTipProperty: string;
  public isArchivedMailbox: boolean = false;
  public isCheckSyncingStatus: boolean = false;
  public currentMailboxId: string;
  public isMenuDisplayed: boolean = false;
  public tooltipEnterMouseDelay = 1;
  public isChecked: boolean = false;
  listOfFiles: FileMessage[] = [];
  contactsList: ISelectedReceivers[] = [];

  private readonly _message$ = new BehaviorSubject<TaskItem>({} as TaskItem);
  public readonly message$ = this._message$.asObservable();
  get message() {
    return this._message$.getValue();
  }

  public currentQueryParams: Params;
  readonly EMessageMenuOption = EMessageMenuOption;
  readonly EPropertyStatus = EPropertyStatus;
  readonly EMessageComeFromType = EMessageComeFromType;
  readonly ECreatedFrom = ECreatedFrom;
  readonly EMessageStatus = MessageStatus;
  readonly EViewDetailMode = EViewDetailMode;
  readonly EDataE2EConversation = EDataE2EConversation;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly SYNC_TYPE = SyncMaintenanceType;
  public isDeletedEnquiries: boolean;
  public isDisplayButtonMove: boolean;
  public tooltipListParticipants: string[] = [];
  public displayParticipants: IParticipant[] = [];
  public remainingParticipants: IParticipant[] = [];
  public listProperty: UserPropertyInPeople[] = [];
  public titleExceedWidth: boolean = false;
  public isAddToTaskSubMenuVisible: boolean = false;
  public maxWidthParticipantName: number;
  public modalAddToTask: EPopupConversionTask;
  public modalTypeAddToTask = EPopupConversionTask;
  private refetchCheckMoveToFolder$ = new Subject<void>();
  private resizeObserver: ResizeObserver;
  public taskType = TaskType;
  public disabledDownloadPDF: boolean = false;

  public sendMsgModalConfig: typeof defaultConfigsButtonAction & {
    'body.prefillToCcBccReceiversList': any;
    'body.draftMessageId': string;
    'body.prefillSender': string;
    'header.isPrefillProperty': boolean;
    autoGenerateMessage?: boolean;
    'body.prefillTitle': string;
    'header.title': string;
    'otherConfigs.conversationPropertyId': string;
    'header.hideSelectProperty': boolean;
    'otherConfigs.scheduleDraft': string;
    'body.typeSendMsg': string;
  } = {
    ...defaultConfigsButtonAction,
    'body.prefillToCcBccReceiversList': null,
    'body.draftMessageId': '',
    'body.prefillSender': '',
    'header.isPrefillProperty': false,
    'body.prefillTitle': '',
    'otherConfigs.conversationPropertyId': '',
    'header.hideSelectProperty': true,
    'header.title': '',
    'otherConfigs.scheduleDraft': null,
    'body.typeSendMsg': SendOption.Send
  };

  get isDisabledSaveToPT() {
    return (
      this.isArchivedMailbox ||
      this.isConsole ||
      [this.SYNC_TYPE.INPROGRESS, this.SYNC_TYPE.PENDING].includes(
        (this.listOfConversations?.[0]?.syncStatus as SyncMaintenanceType) ||
          (this.listOfConversations?.[0]
            ?.conversationSyncDocumentStatus as SyncMaintenanceType)
      )
    );
  }

  constructor(
    private router: Router,
    private inboxToolbarService: InboxToolbarService,
    private taskService: TaskService,
    private popoverService: PopoverService,
    private propertiesService: PropertiesService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    private activatedRoute: ActivatedRoute,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private messageIdSetService: MessageIdSetService,
    public inboxService: InboxService,
    private emailApiService: EmailApiService,
    public sharedMessageViewService: SharedMessageViewService,
    private nzContextMenuService: NzContextMenuService,
    private addToTaskWarningService: AddToTaskWarningService,
    private cdr: ChangeDetectorRef,
    private readonly autoScrollService: AutoScrollService,
    private strategyProvider: RxStrategyProvider,
    private _messageFlowService: MessageFlowService,
    private _conversationService: ConversationService,
    private _inboxSidebarService: InboxSidebarService,
    public deliveryFailedMessageStorageService: DeliveryFailedMessageStorageService
  ) {
    this.propertiesService.listPropertyAllStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((properties) => {
        this.listProperty = properties || [];
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!isEqual(changes['message']?.previousValue, this.message)) {
      this.mapConversationProperties();
      this.isReadMsg = this.message.conversations.every((msg) => msg.isSeen);
      this.isUrgent = this.message.conversations.every((msg) => msg.isUrgent);
      this.checkMenuCondition();
    }

    if (changes['activeMsgList']?.currentValue) {
      const selectedItems = changes['activeMsgList']?.currentValue;
      if (selectedItems.length > 0) {
        this.isActive = selectedItems.some((item) => {
          return item === this.message?.conversationId;
        });
        if (
          (this.isActive && !this.isChecked) ||
          (!this.isActive && this.isChecked)
        ) {
          this.handleChangeSelected(!this.isChecked);
        }
      } else {
        this.isActive = false;
        this.isChecked = false;
        this.isFocused =
          this.queryTaskId === this.message.id &&
          this.message.conversationId === this.conversationId;
      }
    }

    if (
      changes['conversationId']?.currentValue !==
      changes['conversationId']?.previousValue
    ) {
      // update active message item by diff conversation
      const newActiveValue =
        this.queryTaskId === this.message.id &&
        this.conversationId === this.message.conversationId;
      if (newActiveValue != this.isFocused) {
        this.isFocused = newActiveValue;
      }
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((route) => {
        this.isDeletedEnquiries =
          route[EMessageQueryType.MESSAGE_STATUS] === TaskStatusType.deleted;
        this.isDraftFolder =
          route[EMessageQueryType.MESSAGE_STATUS] === TaskStatusType.draft;
      });
    this.handleActiveMsg();

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchivedMailbox) => {
        this.isArchivedMailbox = isArchivedMailbox;
        this.checkToEnableDownloadPDFOption();
      });
    this.checkMenuCondition();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailboxId = res;
      });

    this.sharedMessageViewService.rightClicKSelectedMessageId$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((messageId) => {
        this.isAddToTaskSubMenuVisible = false;
        this.isMenuDisplayed = messageId === this.message.conversationId;
        this.cdr.markForCheck();
      });
    this.subscribeCheckMoveToFolder();
  }

  ngAfterViewInit() {
    if (this.conversationTitle?.nativeElement) {
      this.titleExceedWidth =
        this.conversationTitle.nativeElement.scrollWidth >
        this.conversationTitle.nativeElement.clientWidth;
    }
  }

  private subscribeCheckMoveToFolder() {
    if (this.isConsole) return;
    this.refetchCheckMoveToFolder$
      .pipe(
        switchMap(() =>
          this.emailApiService.checkMoveMailFolder({
            mailBoxId: this.currentMailboxId,
            threadIds: [],
            conversationIds: [this.message.conversations[0].id],
            status: this.currentQueryParams['status']
          })
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res: ICheckMoveMailFolderResponse) => {
        if (!res) return;
        this.isDisplayButtonMove = !res?.emailFolders?.length;
        const emailFolders = res?.emailFolders.map((item) => item.id);
        this.emailApiService.setlistEmailFolder(emailFolders);
      });
  }

  handleOpenMoveTo(event: Event) {
    event.stopPropagation();
    this.emailApiService
      .checkMoveMailFolder({
        mailBoxId: this.currentMailboxId,
        threadIds: [],
        conversationIds: [this.message.conversations[0].id],
        status: this.currentQueryParams['status']
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.isDisplayButtonMove = !res?.emailFolders?.length;
        const emailFolders = res?.emailFolders.map((item) => item.id);
        this.emailApiService.setlistEmailFolder(emailFolders);
      });
  }

  checkMenuCondition() {
    const checkIsReopen = () => {
      const checkStatus = (status: TaskStatusType) =>
        [
          TaskStatusType.unassigned,
          TaskStatusType.inprogress,
          TaskStatusType.open
        ].includes(status);
      // NOTE: Draft message status based on the conversation status
      if (this.message.status === TaskStatusType.draft) {
        const [firstConversation] = this.message.conversations;
        return !checkStatus(firstConversation.status as TaskStatusType);
      } else {
        return !checkStatus(this.message.status);
      }
    };

    this.menuDropDown.addToTask = !(
      this.message?.isUnHappyPath &&
      this.message?.unhappyStatus?.isConfirmProperty
    );
    this.menuDropDown.reOpen = checkIsReopen();
    this.menuDropDown.reportSpam = !this.isArchivedMailbox;
    this.menuDropDown.delete = !(
      this.message.status === TaskStatusType.deleted ||
      this.message.conversations[0].status === TaskStatusType.deleted
    );
    this.menuDropDown.resolve = !(
      this.message.conversations[0].status === TaskStatusType.deleted ||
      this.message.conversations[0].status === TaskStatusType.resolved ||
      this.message.status === TaskStatusType.deleted ||
      this.message.status === TaskStatusType.completed
    );
    this.menuDropDown.urgent =
      this.message.conversations[0].status === TaskStatusType.open ||
      this.message.status === TaskStatusType.inprogress ||
      this.message.status === TaskStatusType.unassigned;
    this.menuDropDown.unread = this.isReadMsg;
    this.menuDropDown.saveToRentManager =
      ![
        TaskStatusType.unassigned,
        TaskStatusType.inprogress,
        TaskStatusType.deleted
      ].includes(this.message.status) && this.isRmEnvironment;
    this.menuDropDown.saveToPropertyTree = !this.isRmEnvironment;
    this.menuDropDown.removeFromTask = this.message?.isMessageInTask;
  }

  mapConversationProperties() {
    if (!Array.isArray(this.message?.conversations)) return;
    this.listOfConversations = this.message.conversations
      .map((item) => ({
        ...item,
        summaryMessage: getSummaryMessage(
          item,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        ),
        timeAgo: item.messageDate,
        title: this.message.conversations[0]?.isDraft
          ? this.message.conversations[0]?.title
          : this.message.title
      }))
      .filter((_, index) => index === 0);
    this.checkToEnableDownloadPDFOption();
  }

  checkToEnableDownloadPDFOption() {
    this.disabledDownloadPDF =
      this.isArchivedMailbox ||
      this.isConsole ||
      this.listOfConversations?.[0]?.downloadingPDFFile;
  }

  navigateToMessageDetail() {
    this.strategyProvider
      .schedule(
        () => {
          if (
            this.queryTaskId !== this.message.id ||
            this.conversationId !== this.message.conversationId
          ) {
            this.messageTaskLoadingService.onLoading();
            this.taskService.triggerOpenMessageDetail.next(this.message.id);
            this.inboxService.setChangeUnreadData(null);
          }

          if (this.activeMsgList.length > 0) {
            this.removeActiveMsg.emit();
          }

          this.autoScrollService.disableAutoScroll();
          this.messageIdSetService.setIsMessageIdsEmpty(false);
          this.inboxToolbarService.setInboxItem([]);
          this.nzContextMenuService.close();
          this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
          this.sharedMessageViewService.setRightClickSelectedMessageId('');
          this.setItem.emit();
        },
        {
          strategy: 'immediate'
        }
      )
      .pipe(take(1))
      .subscribe();

    this.taskService.setSelectedConversationList([]);
    const queryParams = {
      taskId: this.message.id,
      conversationId:
        this.message.conversations?.[0]?.id ?? this.message.conversationId,
      reminderType: null
    };

    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  handleChangeSelected(value: boolean) {
    this.inboxToolbarService.inboxItem$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((inboxItems: TaskItem[]) => {
        let listMessage = inboxItems || [];
        let listConversation: (PreviewConversation | UserConversation)[] = [];
        let listConversationId: string[] = [];
        this.isChecked = value;
        this.checkedChange.emit(value);
        this.message = { ...this.message, msgIndex: this.index };
        this.taskService
          .getSelectedConversationList()
          .subscribe((value) => (listConversation = [...value]));
        if (value) {
          const conversationIds = listMessage.map(
            (item) => item.conversationId
          );
          if (conversationIds.includes(this.message.conversationId)) {
            return;
          }
          listMessage.push(this.message);
          listConversation = [...listConversation, ...this.listOfConversations];
          this.addSelectedMsg.emit({
            currentMsgId: this.message?.conversationId,
            currentMsgIndex: this.index
          });
        } else {
          listMessage = listMessage.filter(
            (item) => item?.conversationId !== this.message?.conversationId
          );
          listConversation = listConversation.filter(
            (item) => item?.id !== this.message?.conversationId
          );
          listConversationId = [
            ...listConversation.map((conversation) => conversation.id)
          ];
          this.removeActiveMsg.emit(this.message?.conversationId);
        }
        listMessage = listMessage.sort((a, b) => a.msgIndex - b.msgIndex);

        //if 1 msg is selected => do nothing
        //if 2 msg ...         => close menu if the menu is open;
        if (listMessage.length >= 2) this.nzContextMenuService?.close();

        this.setListConversationId(listConversation);
        this.taskService.setSelectedConversationList(listConversation);
        this.inboxToolbarService.setInboxItem(listMessage);
      });
  }

  setListConversationId(listConversation) {
    const listConversationId = [
      ...listConversation.map((conversation) => conversation.id)
    ];
    this.taskService.setSelectedListConversationId(listConversationId);
    return listConversationId;
  }

  private handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }

  handleMenu(option: EMessageMenuOption, schedule?: boolean, event?: Event) {
    if (schedule) {
      event?.stopPropagation();
      return;
    }
    this.handleClearSelected();
    this.popoverService.setActionConversation(null);
    this.menuChange.emit({
      message: this.message,
      option: option,
      isDraftMessageWithoutConversation: this.isDraftMessageWithoutConversation
    });
    this.closeMenu();
    this.handleCancelModal();
  }

  handleActiveMsg() {
    if (this.isConsole) return;
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(
          (pre, curr) => pre?.['conversationId'] === curr?.['conversationId']
        )
      )
      .subscribe((queryParams) => {
        this.currentQueryParams = queryParams;
        const { conversationId } = queryParams || {};
        if (conversationId === this.message?.conversations?.[0]?.id) {
          this.activeMessage.emit(this.message);
        }
      });
  }
  get isDraftMessageWithoutConversation() {
    return !!(
      this.isConsole ||
      (this.currentQueryParams['status'] === TaskStatusType.draft &&
        this.isDraft)
    );
  }
  async onRightClick(event: MouseEvent, menu: NzDropdownMenuComponent) {
    if (this.isDraftMessageWithoutConversation) {
      this.nzContextMenuService.create(event, menu);
      return;
    }

    event.preventDefault();
    this.refetchCheckMoveToFolder$.next();

    //prevent create menu when more than 1 msg is selected
    const messageList = await firstValueFrom(
      this.inboxToolbarService.inboxItem$
    );
    if (messageList?.length < 2) {
      this.sharedMessageViewService.setIsRightClickDropdownVisible(true);
      this.sharedMessageViewService.setRightClickSelectedMessageId(
        this.message.conversationId
      );
      this.nzContextMenuService.create(event, menu);
    }
  }

  closeMenu(): void {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  handleNavigateNextMessage() {
    this.navigateToNextMessage.emit();
  }

  handleNavigatePreMessage() {
    this.navigateToPreviousMessage.emit();
  }

  handleDeleteMessage() {
    if (
      this.router.url.includes(ERouterLinkInbox.MSG_DELETED) ||
      this.message.isDeleting
    )
      return;
    this.message = { ...this.message, isDeleting: true };
    this.handleMenu(EMessageMenuOption.DELETE);
  }

  isAbleMulClick() {
    let isAbleMulClick = false;
    this.sharedMessageViewService.isSelectingMode$
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe((isSelect) => (isAbleMulClick = isSelect));
    return isAbleMulClick;
  }

  onShiftClick(event: MouseEvent) {
    if (this.isAbleMulClick()) {
      window.getSelection().removeAllRanges();
      const isKeepShiftCtr =
        (event.ctrlKey && event.shiftKey) || (event.metaKey && event.shiftKey);
      this.pressShiftClick.emit({ isKeepShiftCtr, lastIndex: this.index });
    }
  }

  onCtrClick() {
    if (this.isAbleMulClick()) {
      this.handleChangeSelected(!this.isChecked);
    }
  }

  openAddToTaskModal() {
    this.closeMenu();
    this.addToTaskWarningService.showWarningAddToTask(() => {
      this.modalAddToTask = EPopupConversionTask.SELECT_OPTION;
      this.cdr.markForCheck();
    }, this);
  }

  handleCancelModal() {
    this.modalAddToTask = null;
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetRightClickSelectedState() {
    if (
      this.sharedMessageViewService.rightClickSelectedMessageIdValue ===
      this.message.conversationId
    ) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }

  handleEditMessage({ conversationId }: TaskItem) {
    this._conversationService
      .getHistoryOfConversationV2(conversationId)
      .subscribe({
        next: ({ list: [message] }) => {
          this.closeMenu();
          this.sendMsgModalConfig = {
            ...this.sendMsgModalConfig,
            'body.draftMessageId': message.id,
            'body.prefillSender':
              message.userId === trudiUserId ? trudiUserId : message.userId,
            'body.prefillToCcBccReceiversList': {
              bcc: message.emailMetadata.bcc,
              cc: message.emailMetadata.cc,
              to: message.emailMetadata.to
            },
            'otherConfigs.scheduleDraft': message?.sendOptions?.time,
            'body.typeSendMsg': message?.sendOptions?.type || SendOption.Send
          };
          this.sendMsgModalConfig['otherConfigs.isFromDraftFolder'] =
            this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT);
          this.sendMsgModalConfig = {
            ...this.sendMsgModalConfig,
            'otherConfigs.filterSenderForReply': false,
            'otherConfigs.isCreateMessageType': false,
            'header.title': '',
            autoGenerateMessage: null,
            'header.hideSelectProperty': false,
            'header.isPrefillProperty': true,
            'body.isFromInlineMsg': true,
            'body.prefillTitle': message.title,
            'otherConfigs.conversationPropertyId': message.propertyId
          };
          this.sendMsgModalConfig['inputs.rawMsg'] = message.message;
          this.sendMsgModalConfig['body.replyQuote'] = null;
          this._messageFlowService.openSendMsgModal(this.sendMsgModalConfig);
          this.listOfFiles = [
            ...(message.files?.fileList || []),
            ...(message.files?.mediaList || [])
          ];
          this.contactsList = (
            message?.options?.contacts as unknown as ISelectedReceivers[]
          )?.map((item) => ({ ...item, streetLine: item.address }));
          this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
          this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
          this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
        }
      });
  }

  handleDeleteDraft() {
    this._conversationService
      .deleteDraftMsg({
        draftMessageId: this.message.conversations[0].draftMessageId,
        taskId: this.message.conversations[0].taskId,
        conversationId: this.message.conversationId,
        isFromDraftFolder: this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT)
      })
      .subscribe(() => {
        this.closeMenu();
        this._inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
      });
  }
}
