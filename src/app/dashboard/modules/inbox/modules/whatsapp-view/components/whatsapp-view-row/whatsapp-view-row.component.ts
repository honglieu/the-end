import { SharedMessageViewService } from '@/app/services/shared-message-view.service';
import { SharedService } from '@/app/services/shared.service';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  BehaviorSubject,
  Subject,
  distinctUntilChanged,
  filter,
  fromEvent,
  merge,
  take,
  takeUntil
} from 'rxjs';
import { Router } from '@angular/router';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { TaskItem } from '@shared/types/task.interface';
import {
  IParticipant,
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import { getSummaryMessage } from '@shared/feature/function.feature';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TaskService } from '@/app/services/task.service';
import {
  EConversationType,
  SocketType,
  SyncMaintenanceType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IconsSync } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { AutoScrollService } from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import {
  WhatsappMessage,
  WhatsappQueryType,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import { WhatsappMenuService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp-menu.service';
import { PluralizePipe } from '@/app/shared/pipes/pluralize';

@Component({
  selector: 'whatsapp-view-row',
  templateUrl: './whatsapp-view-row.component.html',
  styleUrl: './whatsapp-view-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatsappViewRowComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() isRmEnvironment: boolean = false;
  @Input() set item(value) {
    this._item$.next(value);
  }
  @Input() first: boolean;
  @Input() last: boolean;
  @Input() queryTaskId: string;
  @Input() queryConversationId: string;
  @Input() search: string = '';
  @Input() index: number;
  @Input() listMsgActive: string[] = [];

  @Output() addSelectedMsg = new EventEmitter();
  @Output() removeActiveMsg = new EventEmitter();
  @Output() pressShiftClick = new EventEmitter();
  @Output() navigateToNextMessage = new EventEmitter<void>();
  @Output() navigateToPreviousMessage = new EventEmitter<void>();

  public isChecked: boolean = false;
  public isSelected: boolean = false;
  public isRightClick: boolean = false;
  public isConsole: boolean = false;
  public isUrgent: boolean = false;
  public isReadMsg: boolean = false;
  public isUserVerified: boolean = false;
  public previewConversations: PreviewConversation[];
  public isShowSingleItem: boolean = false;
  public isOpenTaskModal: boolean = false;
  public isArchivedMailbox: boolean = false;
  public disabledDownloadPDF: boolean = false;
  public menuDropDown = {
    addToTask: true,
    forward: true,
    unread: true,
    resolve: true,
    reOpen: true,
    urgent: true,
    saveToPropertyTree: true,
    removeFromTask: false
  };
  public syncStatus: string;
  public iconSync;
  public tooltipPlacement: string[] = ['top', 'bottom'];
  public tooltipEnterMouseDelay: number = 1;
  private destroy$ = new Subject<void>();
  private readonly _item$ = new BehaviorSubject<TaskItem>({} as TaskItem);
  public readonly item$ = this._item$.asObservable();

  get item() {
    return this._item$.getValue();
  }

  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  readonly TaskType = TaskType;
  readonly SyncMaintenanceType = SyncMaintenanceType;
  readonly MenuOption = MenuOption;
  readonly EDataE2EConversation = EDataE2EConversation;
  readonly TaskStatusType = TaskStatusType;
  readonly IconsSync = IconsSync;

  get isSelectedMove() {
    return this.inboxToolbarService.hasItem;
  }

  constructor(
    private readonly router: Router,
    private readonly sharedService: SharedService,
    private readonly taskService: TaskService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly agencyDateFormatService: AgencyDateFormatService,
    private readonly cdr: ChangeDetectorRef,
    private readonly whatsappService: WhatsappService,
    private readonly whatsappMenuService: WhatsappMenuService,
    private readonly toastCustomService: ToastCustomService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly autoScrollService: AutoScrollService,
    public readonly sharedMessageViewService: SharedMessageViewService,
    public readonly inboxToolbarService: InboxToolbarService,
    public readonly inboxService: InboxService,
    private elementRef: ElementRef,
    private ngZone: NgZone
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.handleItemChange(changes['item']);
    this.handleQueryConversationIdChange(
      changes['queryConversationId'],
      changes['queryTaskId'],
      changes['item']
    );
    changes['listMsgActive'] &&
      this.handleListMsgActiveChange(changes['listMsgActive']);
    this.checkSyncStatusMessage();
  }

  checkSyncStatusMessage() {
    this.syncStatus =
      this.previewConversations?.[0]?.syncStatus ||
      this.previewConversations?.[0]?.conversationSyncDocumentStatus;
    switch (this.syncStatus) {
      case this.SyncMaintenanceType.COMPLETED:
      case this.SyncMaintenanceType.SUCCESS:
        this.iconSync = this.IconsSync.SYNC_SUCCESS;
        break;
      case this.SyncMaintenanceType.FAILED:
        this.iconSync = this.IconsSync.SYNC_FAIL;
        break;
      case this.SyncMaintenanceType.INPROGRESS:
      case this.SyncMaintenanceType.PENDING:
        this.iconSync = this.IconsSync.SYNCING;
        break;
      default:
        break;
    }
  }

  private handleItemChange(itemChange: SimpleChange): void {
    if (itemChange && itemChange.currentValue) {
      this.checkMessageStatus();
      this.mapConversationProperties();
      this.checkMenuCondition();
      this.checkToEnableDownloadPDFOption();
    }
  }

  checkToEnableDownloadPDFOption() {
    this.disabledDownloadPDF =
      this.isArchivedMailbox ||
      this.previewConversations?.[0]?.downloadingPDFFile;
  }

  private handleQueryConversationIdChange(
    queryConversationIdChange: SimpleChange,
    queryTaskIdChange: SimpleChange,
    queryItemChange: SimpleChange
  ): void {
    const hasQueryConversationIdChanged =
      queryConversationIdChange &&
      queryConversationIdChange.currentValue !==
        queryConversationIdChange.previousValue;
    const hasQueryTaskIdChanged =
      queryTaskIdChange &&
      queryTaskIdChange.currentValue !== queryTaskIdChange.previousValue;
    const hasQueryItemChange =
      queryItemChange &&
      queryItemChange.currentValue !== queryItemChange.previousValue;

    if (
      hasQueryConversationIdChanged ||
      hasQueryTaskIdChanged ||
      hasQueryItemChange
    ) {
      this.closeMenu();

      const isTaskIdMatch = this.item.id === this.queryTaskId;
      const isConversationIdMatch = this.item.conversationId
        ? this.item.conversationId === this.queryConversationId
        : this.item.conversations.some((c) =>
            c.conversationType === EConversationType.VOICE_MAIL
              ? c.id === this.queryConversationId
              : this.item.conversations[0].id === this.queryConversationId
          );

      const newActiveValue = isTaskIdMatch && isConversationIdMatch;

      if (newActiveValue !== this.isSelected) {
        this.isSelected = newActiveValue;
        this.cdr.markForCheck();
      }
    }
  }

  private handleListMsgActiveChange(listMsgActiveChange: SimpleChange): void {
    if (listMsgActiveChange && listMsgActiveChange.currentValue) {
      const selectedItems = listMsgActiveChange.currentValue;
      const isActive = selectedItems.includes(this.item.conversationId);
      if ((isActive && !this.isChecked) || (!isActive && this.isChecked)) {
        this.handleChangeSelection(!this.isChecked);
      }
    } else {
      this.isChecked = false;
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.sharedMessageViewService.isSelectingMode$
      .pipe(
        takeUntil(this.destroy$),
        filter((state) => !state)
      )
      .subscribe(() => {
        this.isChecked = false;
        this.cdr.markForCheck();
      });

    this.sharedMessageViewService.rightClicKSelectedMessageId$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((messageId) => {
        this.isRightClick = messageId === this.item.conversationId;
        this.cdr.markForCheck();
      });

    this.whatsappService.currentWhatsappTask$
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (currentWhatsappTask) =>
            !!currentWhatsappTask && currentWhatsappTask.id === this.item.id
        )
      )
      .subscribe((currentWhatsappTask) => {
        this.item = {
          ...currentWhatsappTask,
          property: this.item.property,
          status: this.item.status,
          conversationId: this.item.conversationId,
          conversations: currentWhatsappTask.conversations.map(
            (conversation) => ({
              ...conversation,
              property: this.item.conversations?.[0]?.property,
              participants: this.item.conversations?.[0]?.participants,
              isSeen: this.item.conversations?.[0]?.isSeen,
              endSession: this.item.conversations?.[0]?.endSession,
              isUrgent: this.item.conversations?.[0]?.isUrgent,
              userId: this.item.conversations?.[0]?.userId
            })
          )
        };
        this.checkMessageStatus();
        this.checkMenuCondition();
        this.cdr.markForCheck();
      });

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchivedMailbox) => {
        this.isArchivedMailbox = isArchivedMailbox;
      });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      const clickEvent = fromEvent(document, 'click');
      const contextEvent = fromEvent(document, 'contextmenu');
      merge(clickEvent, contextEvent)
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => {
          if (
            !this.elementRef.nativeElement?.contains(event.target) &&
            this.sharedMessageViewService.isRightClickDropdownVisibleValue
          ) {
            this.resetRightClickSelectedState();
          }
        });
    });
  }

  checkMessageStatus() {
    this.isReadMsg = this.item.conversations.every((msg) => msg.isSeen);
    this.isUrgent = this.item.conversations.every((msg) => msg.isUrgent);
    this.isUserVerified = this.item.conversations?.[0].isPmJoined;
  }

  checkMenuCondition() {
    const checkIsReopen = () => {
      return ![
        TaskStatusType.unassigned,
        TaskStatusType.inprogress,
        TaskStatusType.open
      ].includes(this.item.status);
    };

    this.menuDropDown.addToTask = !(
      this.item?.isUnHappyPath && this.item?.unhappyStatus?.isConfirmProperty
    );
    this.menuDropDown.reOpen = checkIsReopen();
    this.menuDropDown.resolve = !(
      this.item.status === TaskStatusType.deleted ||
      this.item.status === TaskStatusType.completed
    );
    this.menuDropDown.urgent =
      this.item.status === TaskStatusType.inprogress ||
      this.item.status === TaskStatusType.unassigned;
    this.menuDropDown.unread = this.isReadMsg;
    this.menuDropDown.saveToPropertyTree = !this.isRmEnvironment;
    this.menuDropDown.removeFromTask = this.item.taskType === TaskType.TASK;
  }

  private mapConversationProperties(): void {
    if (!Array.isArray(this.item?.conversations)) return;
    const pluralizeClass = new PluralizePipe();
    this.previewConversations = this.item.conversations
      .map((item) => ({
        ...item,
        summaryMessage: getSummaryMessage(
          item,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS,
          true
        ),
        timeAgo: item.messageDate,
        title: this.item.conversations[0]?.title || this.item.title,
        attachmentTooltipText: item.attachmentCount
          ? `${pluralizeClass.transform(item.attachmentCount, 'attachment')}`
          : ''
      }))
      .filter((_, index) => index === 0);
  }

  handleChangeSelection(state: boolean): void {
    this.inboxToolbarService.inboxItem$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((inboxItems: TaskItem[]) => {
        let listMessage = inboxItems || [];
        let listConversation: (PreviewConversation | UserConversation)[] = [];
        let listConversationId: string[] = [];
        this.isChecked = state;
        this.item = { ...this.item, msgIndex: this.index };
        this.taskService
          .getSelectedConversationList()
          .subscribe((value) => (listConversation = [...value]));
        if (
          state &&
          !listMessage.find(
            (item) => item.conversationId === this.item.conversationId
          )
        ) {
          listMessage.push(this.item);
          listConversation = [
            ...listConversation,
            ...this.previewConversations
          ];
          this.addSelectedMsg.emit({
            currentMsgId: this.item.conversationId,
            currentMsgIndex: this.index
          });
        }

        if (
          !state ||
          (!state &&
            listMessage.find(
              (item) => item.conversationId === this.item.conversationId
            ))
        ) {
          listMessage = listMessage.filter(
            (item) => item.conversationId !== this.item.conversationId
          );
          listConversation = listConversation.filter(
            (item) => item.id !== this.item.conversationId
          );
          listConversationId = [
            ...listConversation.map((conversation) => conversation.id)
          ];
          this.removeActiveMsg.emit(this.item?.conversationId);
        }
        listMessage = listMessage.sort((a, b) => a.msgIndex - b.msgIndex);

        if (listMessage.length >= 2) this.nzContextMenuService?.close();

        this.setListConversationId(listConversation);
        this.taskService.setSelectedConversationList(listConversation);
        this.inboxToolbarService.setInboxItem(listMessage);
        this.closeMenu();
      });
  }

  setListConversationId(listConversation) {
    const listConversationId = [
      ...listConversation.map((conversation) => conversation.id)
    ];
    this.taskService.setSelectedListConversationId(listConversationId);
    return listConversationId;
  }

  onRightClick(event: MouseEvent, menu: NzDropdownMenuComponent): void {
    event.preventDefault();
    if (this.isConsole || this.inboxToolbarService.countSelectedItems > 0)
      return;

    //prevent create menu when more than 1 msg is selected
    this.sharedMessageViewService.setIsRightClickDropdownVisible(true);
    this.sharedMessageViewService.setRightClickSelectedMessageId(
      this.item.conversationId
    );
    this.nzContextMenuService.create(event, menu);
  }

  onShiftClick(event): void {
    if (this.isAbleMulClick()) {
      window.getSelection().removeAllRanges();
      const isKeepShiftCtr =
        (event.ctrlKey && event.shiftKey) || (event.metaKey && event.shiftKey);
      this.pressShiftClick.emit({ isKeepShiftCtr, lastIndex: this.index });
    }
  }

  onCtrClick(): void {
    if (this.isAbleMulClick()) {
      this.handleChangeSelection(!this.isChecked);
    }
  }

  onDowKeyClick(): void {
    this.navigateToNextMessage.emit();
  }

  onUpKeyClick(): void {
    this.navigateToPreviousMessage.emit();
  }

  onDelKeyClick(): void {
    this.handleMenu(MenuOption.DELETE, 'isDeleting');
  }

  isAbleMulClick() {
    let isAbleMulClick = false;
    this.sharedMessageViewService.isSelectingMode$
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe((isSelect) => (isAbleMulClick = isSelect));
    return isAbleMulClick;
  }

  handleMenu(option: MenuOption, field: string, event?: MouseEvent): void {
    const disableSaveToPT =
      option === MenuOption.SAVE_TO_PROPERTY_TREE &&
      (this.isArchivedMailbox ||
        [SyncMaintenanceType.INPROGRESS, SyncMaintenanceType.PENDING].includes(
          (this.previewConversations?.[0]?.syncStatus ||
            this.previewConversations?.[0]
              ?.conversationSyncDocumentStatus) as SyncMaintenanceType
        ));
    const disableDownloadPDF =
      option === MenuOption.DOWNLOAD_AS_PDF && this.disabledDownloadPDF;
    if (
      (this.isConsole && option !== MenuOption.DOWNLOAD_AS_PDF) ||
      disableSaveToPT ||
      disableDownloadPDF
    ) {
      if (event) event.stopPropagation();
      return;
    }
    if ([MenuOption.RESOLVE, MenuOption.REOPEN].includes(option)) {
      this.inboxService.isLoadingDetail.next(true);
    }
    this.whatsappMenuService
      .handleMenuChange({
        message: this.item,
        option,
        conversationId: this.item.conversationId
      })
      .then((value) => {
        if (!value) return;
        this.isOpenTaskModal = false;
        this.handleChangeConversation(field, value?.[field] || '');
        this.checkMessageStatus();
        this.mapConversationProperties();
        this.checkMenuCondition();
        if ([MenuOption.RESOLVE, MenuOption.REOPEN].includes(option)) {
          this.openToast(this.item, option);
        }

        this.whatsappService.setMenuRightClick({
          taskId: this.item.id,
          conversationId: this.item.conversations[0].id,
          field,
          value,
          option
        });
        this.inboxService.isLoadingDetail.next(false);
        this.cdr.markForCheck();
      });

    this.closeMenu();
  }

  openToast(item: WhatsappMessage, option: MenuOption) {
    const dataForToast = {
      conversationId: item.conversations[0].id,
      taskId: item.conversations[0].taskId,
      isShowToast: true,
      type: SocketType.changeStatusTask,
      mailBoxId: item.mailBoxId,
      taskType: TaskType.MESSAGE,
      status:
        option === MenuOption.REOPEN
          ? TaskStatusType.inprogress
          : TaskStatusType.resolved,
      pushToAssignedUserIds: [],
      conversationType: item.conversations[0].conversationType,
      isIdentifier:
        item?.conversations[0]?.isDetectedContact &&
        !(item?.conversations[0]?.participants?.[0] as IParticipant)
          ?.isTemporary
    };

    this.toastCustomService.openToastCustom(
      dataForToast,
      true,
      EToastCustomType.SUCCESS_WITH_VIEW_BTN,
      false,
      true
    );
  }

  handleChangeConversation(field: string, value: boolean) {
    if (this.queryTaskId === this.item?.id) {
      this.whatsappService.setCurrentWhatsappTask({
        ...this.item,
        conversations: this.item.conversations.map((item) => ({
          ...item,
          [field]: value
        }))
      });
      return;
    }
  }

  closeMenu(): void {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  onOpenTaskDetail(): void {
    const queryParams = {
      [WhatsappQueryType.TASK_ID]: this.item.id,
      [WhatsappQueryType.CONVERSATION_ID]:
        this.item.conversationId ||
        this.item.conversations.find(
          (c) => c.conversationType === EConversationType.VOICE_MAIL
        ).id ||
        this.item.conversations?.[0]?.id
    };

    this.router
      .navigate([], {
        queryParams,
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.taskService.setSelectedConversationList([]);
        this.inboxToolbarService.setInboxItem([]);
        this.userProfileDrawerService.clear();
        this.autoScrollService.disableAutoScroll();
      });
  }

  private resetRightClickSelectedState() {
    if (
      this.sharedMessageViewService.rightClickSelectedMessageIdValue ===
      this.item.conversationId
    ) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
