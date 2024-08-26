import { SharedMessageViewService } from '@services/shared-message-view.service';
import { SharedService } from '@services/shared.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  MenuOption,
  VoiceMailMessage,
  VoiceMailQueryType
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import {
  BehaviorSubject,
  Subject,
  distinctUntilChanged,
  filter,
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
import { TaskService } from '@services/task.service';
import {
  EConversationType,
  ECreatedFrom,
  SocketType,
  SyncMaintenanceType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { VoiceMailMenuService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-menu.service';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IconsSync } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { AutoScrollService } from '@/app/dashboard/modules/inbox/services/auto-scroll.service';

@Component({
  selector: 'voice-mail-row',
  templateUrl: './voice-mail-row.component.html',
  styleUrls: ['./voice-mail-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoiceMailRowComponent implements OnInit, OnChanges, OnDestroy {
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
  @Output() pressShiftClick = new EventEmitter();
  @Output() navigateToNextMessage = new EventEmitter<void>();
  @Output() navigateToPreviousMessage = new EventEmitter<void>();

  @ViewChild('participantContainer') participantContainer: ElementRef;

  public isChecked: boolean = false;
  public isSelected: boolean = false;
  public isRightClick: boolean = false;
  public isConsole: boolean = false;
  public isUrgent: boolean = false;
  public isReadMsg: boolean = false;
  public previewConversations: PreviewConversation[];
  public tooltipListParticipants: string[] = [];
  public participants: IParticipant[] = [];
  public displayParticipants: IParticipant[] = [];
  public remainingParticipants: IParticipant[] = [];
  public maxWidthParticipantName: number;
  public isShowSingleItem: boolean = false;
  public isOpenTaskModal: boolean = false;
  public isArchivedMailbox: boolean = false;
  readonly SYNC_TYPE = SyncMaintenanceType;
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
  public taskType = TaskType;

  private readonly _item$ = new BehaviorSubject<TaskItem>({} as TaskItem);
  public readonly item$ = this._item$.asObservable();
  get item() {
    return this._item$.getValue();
  }
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  readonly ECreatedFrom = ECreatedFrom;
  readonly MenuOption = MenuOption;
  readonly EDataE2EConversation = EDataE2EConversation;
  readonly TaskStatusType = TaskStatusType;
  readonly ICON_SYNC = IconsSync;
  public disabledDownloadPDF: boolean = false;
  readonly MAX_COUNT_THRESHOLD = 99;

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
    private readonly voicemailInboxService: VoiceMailService,
    private readonly voiceMailMenuService: VoiceMailMenuService,
    private readonly toastCustomService: ToastCustomService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly autoScrollService: AutoScrollService,
    public readonly sharedMessageViewService: SharedMessageViewService,
    public readonly inboxToolbarService: InboxToolbarService,
    public readonly inboxService: InboxService
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
      case this.SYNC_TYPE.COMPLETED:
      case this.SYNC_TYPE.SUCCESS:
        this.iconSync = this.ICON_SYNC.SYNC_SUCCESS;
        break;
      case this.SYNC_TYPE.FAILED:
        this.iconSync = this.ICON_SYNC.SYNC_FAIL;
        break;
      case this.SYNC_TYPE.INPROGRESS:
      case this.SYNC_TYPE.PENDING:
        this.iconSync = this.ICON_SYNC.SYNCING;
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
      this.isConsole ||
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

    this.voicemailInboxService.currentVoicemailTask$
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (currentVoicemailTask) =>
            !!currentVoicemailTask && currentVoicemailTask.id === this.item.id
        )
      )
      .subscribe((currentVoicemailTask) => {
        this.item = {
          ...currentVoicemailTask,
          status: this.item.status,
          conversationId: this.item.conversationId,
          conversations: currentVoicemailTask.conversations.map(
            (conversation) => ({
              ...conversation,
              isSeen: this.item.conversations?.[0]?.isSeen,
              endSession: this.item.conversations?.[0]?.endSession,
              isUrgent: this.item.conversations?.[0]?.isUrgent
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
        this.checkToEnableDownloadPDFOption();
      });
  }

  checkMessageStatus() {
    this.isReadMsg = this.item.conversations.every((msg) => msg.isSeen);
    this.isUrgent = this.item.conversations.every((msg) => msg.isUrgent);
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
    this.previewConversations = this.item.conversations
      .map((item) => ({
        ...item,
        summaryMessage: getSummaryMessage(
          item,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        ),
        timeAgo: item.messageDate,
        title: this.item.conversations[0]?.title || this.item.title
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

  openAddToTaskModal() {
    this.closeMenu();
    this.isOpenTaskModal = true;
  }

  taskModalChange(event) {
    this.isOpenTaskModal = event;
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

  handleMenu(option: MenuOption, field: string): void {
    this.voiceMailMenuService
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

        this.voicemailInboxService.setMenuRightClick({
          taskId: this.item.id,
          conversationId: this.item.conversations[0].id,
          field,
          value
        });
        this.cdr.markForCheck();
      });

    this.closeMenu();
  }

  openToast(item: VoiceMailMessage, option: MenuOption) {
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
      conversationType: item.conversations[0].conversationType
    };

    this.toastCustomService.openToastCustom(
      dataForToast,
      true,
      EToastCustomType.SUCCESS_WITH_VIEW_BTN
    );
  }

  handleChangeConversation(field: string, value: boolean) {
    if (this.queryTaskId === this.item?.id) {
      this.voicemailInboxService.setCurrentVoicemailTask({
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
      [VoiceMailQueryType.TASK_ID]: this.item.id,
      [VoiceMailQueryType.CONVERSATION_ID]:
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
        this.voicemailInboxService.setIsVoicemailDetailLoading(true);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
