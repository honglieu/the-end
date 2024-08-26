import { EPopupConversionTask } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import {
  ECreatedFrom,
  EMessageComeFromType
} from '@shared/enum/messageType.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  distinctUntilChanged,
  filter,
  merge,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import { ICheckMoveMailFolderResponse } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IconsSync } from '@/app/dashboard/shared/types/sidebar.interface';
import { CHAR_WIDTH, trudiUserId } from '@services/constants';
import {
  ConversationService,
  MessageStatus
} from '@services/conversation.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { SharedService } from '@services/shared.service';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import {
  EConversationType,
  ESyncToRmStatus
} from '@shared/enum/conversationType.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EPage } from '@shared/enum/trudi';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  IParticipant,
  UserConversation
} from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import {
  EConversationStatus,
  EConversationStatusTab
} from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { getSummaryMessage } from '@shared/feature/function.feature';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { ECrmStatus } from '@/app/user/utils/user.enum';
import { defaultConfigsButtonAction } from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { Router } from '@angular/router';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';

@Component({
  selector: 'header-conversation-item',
  templateUrl: './header-conversation-item.component.html',
  styleUrls: ['./header-conversation-item.component.scss']
})
export class HeaderConversationItemComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() conversation: UserConversation;
  @Input() isRmEnvironment: boolean = false;
  @Input() isArchiveMailbox: boolean = false;
  @Input() task: TaskItem;
  @Input() currentTab: EConversationStatusTab;
  @Input() activeMobileApp: boolean = false;
  @Input() isMessageActive: boolean = false;
  @ViewChild('participantContainer') participantContainer: ElementRef;
  @ViewChild('conversationTitle') conversationTitle: ElementRef<HTMLDivElement>;
  @ViewChild('menu') dropdownMenu: ElementRef;
  @ViewChild('conversationRow') conversationRow: ElementRef;
  @Output() menuChange = new EventEmitter<{
    conversation: UserConversation;
    option: EMessageMenuOption | string;
  }>();
  public taskType = TaskType;
  public EConversationStatus = EConversationStatus;
  readonly EMessageMenuOption = EMessageMenuOption;
  readonly ESyncToRmStatus = ESyncToRmStatus;
  readonly SYNC_TYPE = SyncMaintenanceType;
  readonly EDataE2EConversation = EDataE2EConversation;
  readonly EConversationStatusTab = EConversationStatusTab;
  public isConsoleUser: boolean = false;
  public userPropertyType = EUserPropertyType;
  public MessageStatus = MessageStatus;
  public isUnhappyFlow = false;
  public participants = [];
  public displayParticipants: IParticipant[] = [];
  public remainingParticipants: IParticipant[] = [];
  public currentUser: CurrentUser;
  public isShowSingleItem: boolean = false;
  public tooltipListParticipants: string[] = [];
  private _destroy$ = new Subject<void>();
  public isUnidentifiedContact: boolean = false;
  public tooltipPlacement: string[] = ['top', 'bottom'];
  public titleExceedWidth: boolean = false;
  public iconSync: string;
  public readonly EPage = EPage;
  public modalAddToTask: EPopupConversionTask;
  public modalTypeAddToTask = EPopupConversionTask;
  private resizeObserver: ResizeObserver;
  readonly ICON_SYNC = IconsSync;
  public menuDropDown = {
    addTask: true,
    removeConversation: true,
    delete: true,
    read: true,
    resolve: true,
    urgent: true,
    reOpen: true,
    reportSpam: true,
    saveToRentManager: true,
    saveToPropertyTree: true
  };
  public currentMailboxId: string;
  public currentQueryParams;
  public isDisplayButtonMove: boolean;
  public isMenuDisplayed: boolean = false;
  public tooltipEnterMouseDelay = 1;
  public readonly EMessageComeFromType = EMessageComeFromType;
  public readonly ECreatedFrom = ECreatedFrom;
  public readonly EConversationType = EConversationType;
  public maxWidthParticipantName: number;
  private refetchCheckMoveToFolder$ = new Subject<void>();
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  public ECrmStatus = ECrmStatus;
  public isDisableActionByOffBoardStatus: boolean;
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
  } = {
    ...defaultConfigsButtonAction,
    'body.prefillToCcBccReceiversList': null,
    'body.draftMessageId': '',
    'body.prefillSender': '',
    'header.isPrefillProperty': false,
    'body.prefillTitle': '',
    'otherConfigs.conversationPropertyId': '',
    'header.hideSelectProperty': true,
    'header.title': ''
  };
  public textContent = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private conversationService: ConversationService,
    private nzContextMenuService: NzContextMenuService,
    public sharedMessageViewService: SharedMessageViewService,
    private elementRef: ElementRef,
    private sharedService: SharedService,
    private syncResolveMessageService: SyncResolveMessageService,
    private emailApiService: EmailApiService,
    private inboxService: InboxService,
    private taskDetailService: TaskDetailService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private agencyDateFormatService: AgencyDateFormatService,
    private _router: Router,
    private _messageFlowService: MessageFlowService,
    private _inboxSidebarService: InboxSidebarService
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
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    merge([
      this.syncMessagePropertyTreeService.isSyncToPT$,
      this.syncResolveMessageService.isSyncToRM$
    ])
      .pipe(takeUntil(this._destroy$), filter(Boolean))
      .subscribe(() => {
        this.handleSyncStatusMessage();
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this._destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailboxId = res;
      });

    this.subscribeCheckMoveToFolder();
    this.sharedMessageViewService.rightClicKSelectedMessageId$
      .pipe(takeUntil(this._destroy$), distinctUntilChanged())
      .subscribe((id) => {
        this.isMenuDisplayed = id === this.conversation.id;
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversation']?.currentValue) {
      this.conversation.options = this.conversation?.messageOptions;

      this.conversation = {
        ...this.conversation,
        summaryMessage: getSummaryMessage(
          this.conversation,
          this.agencyDateFormatService.dateFormat$.value?.DATE_FORMAT_DAYJS,
          true
        )
      };
      this.textContent =
        this.currentTab === EConversationStatusTab.DRAFT ||
        (this.conversation.conversationType === EConversationType.APP
          ? this.currentTab === EConversationStatusTab.RESOLVED
          : false)
          ? this.conversation?.lastMessageDraft?.textContent ||
            this.conversation?.summaryMessage
          : this.conversation?.summaryMessage;
      let receiverParticipants = this.conversation?.isScratchDraft
        ? this.conversation.participants?.filter((item) =>
            item?.emailMetadataType?.includes('TO')
          )
        : this.conversation.participants;

      if (
        this.conversation.conversationType === EConversationType.VOICE_MAIL ||
        this.conversation.conversationType === EConversationType.APP
      ) {
        this.menuDropDown = {
          ...this.menuDropDown,
          delete: false,
          reportSpam: false,
          saveToRentManager: false
        };

        if (
          this.conversation.conversationType === EConversationType.VOICE_MAIL ||
          this.conversation.conversationType === EConversationType.APP
        ) {
          if (
            this.conversation?.isAppMessageLog ||
            this.conversation.conversationType === EConversationType.VOICE_MAIL
          ) {
            receiverParticipants = receiverParticipants.concat({
              firstName: 'Trudi',
              type: EUserPropertyType.AI_ASSISTANT
            } as unknown as IParticipant);
          }
        }
      }

      this.participants = receiverParticipants
        .map((participant) => {
          const isNoPropertyConversation =
            this.conversation.isTemporaryProperty;
          const isMatchingPropertyWithConversation =
            this.conversation.propertyId === participant.propertyId;

          return {
            ...participant,
            title: this.contactTitleByConversationPropertyPipe.transform(
              participant,
              {
                isNoPropertyConversation,
                isMatchingPropertyWithConversation
              }
            )
          };
        })
        ?.filter((participant) => !!participant.title);

      const trudiIndex = this.participants.findIndex(
        (participant) => participant.userId === trudiUserId
      );

      if (trudiIndex !== -1) {
        const [trudiItem] = this.participants.splice(trudiIndex, 1);
        this.participants.push(trudiItem);
      }

      this.tooltipListParticipants = receiverParticipants.map((participant) => {
        if (participant.userId === trudiUserId) {
          participant.firstName = `Trudi (AI Assistant)`;
          participant.type = EUserPropertyType.LEAD;
        }
        const isNoPropertyConversation = this.conversation.isTemporaryProperty;
        const isMatchingPropertyWithConversation =
          this.conversation.propertyId === participant.propertyId;

        return this.contactTitleByConversationPropertyPipe.transform(
          participant,
          {
            isNoPropertyConversation,
            isMatchingPropertyWithConversation,
            showFullContactRole: true
          }
        );
      });

      this.iconSync = this.conversationService.getSyncStatusIcon(
        this.conversation?.syncStatus ||
          this.conversation?.conversationSyncDocumentStatus
      );

      this.isDisableActionByOffBoardStatus =
        this.conversation?.conversationType === EConversationType.APP &&
        this.conversation?.status === TaskStatusType.resolved &&
        !!this.conversation?.offBoardedDate;
    }
  }

  handleSyncStatusMessage() {
    const currentListByCRM$ = this.isRmEnvironment
      ? this.syncResolveMessageService.getListConversationStatus()
      : this.syncMessagePropertyTreeService.listConversationStatus;
    currentListByCRM$
      .pipe(takeUntil(this._destroy$))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        if (
          listMessageSyncStatus?.conversationIds?.includes(this.conversation.id)
        ) {
          this.conversation.syncStatus =
            listMessageSyncStatus.status ||
            listMessageSyncStatus.conversationSyncDocumentStatus;
          this.conversation.downloadingPDFFile =
            listMessageSyncStatus.downloadingPDFFile;
          this.disabledDownloadPDF =
            this.syncMessagePropertyTreeService.checkToEnableDownloadPDFOption(
              this.isArchiveMailbox,
              this.isConsoleUser,
              this.conversation.downloadingPDFFile
            );
          this.iconSync = this.conversationService.getSyncStatusIcon(
            this.conversation?.syncStatus ||
              this.conversation?.conversationSyncDocumentStatus
          );
        }
      });
  }

  private subscribeCheckMoveToFolder() {
    if (this.isConsoleUser) return;
    this.refetchCheckMoveToFolder$
      .pipe(
        switchMap(() =>
          this.emailApiService.checkMoveMailFolder({
            mailBoxId: this.currentMailboxId,
            threadIds: [],
            conversationIds: [this.conversation.id],
            status: this.currentQueryParams['status']
          })
        ),
        takeUntil(this._destroy$)
      )
      .subscribe((res: ICheckMoveMailFolderResponse) => {
        if (!res) return;
        this.isDisplayButtonMove = !res?.emailFolders?.length;
        const emailFolders = res?.emailFolders.map((item) => item.id);
        this.emailApiService.setlistEmailFolder(emailFolders);
      });
  }

  ngAfterViewInit() {
    this.observeContainerResize();
    if (this.conversationTitle?.nativeElement) {
      this.titleExceedWidth =
        this.conversationTitle.nativeElement.scrollWidth >
        this.conversationTitle.nativeElement.clientWidth;
    }
  }

  private observeContainerResize(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { clientWidth } = entry.target as HTMLElement;
        if (!!clientWidth) {
          this.determineParticipantsToDisplay(clientWidth);
          this.maxWidthParticipantName = !!this.remainingParticipants.length
            ? clientWidth - CHAR_WIDTH * 4
            : clientWidth - CHAR_WIDTH * 2;
        }
      });
    });

    if (this.participantContainer?.nativeElement) {
      this.resizeObserver.observe(this.participantContainer?.nativeElement);
    }
  }

  private determineParticipantsToDisplay(containerClientWidth: number) {
    let availableSpace = containerClientWidth - CHAR_WIDTH * 4;
    let currentCummulativeWidth = 0;
    const displayParticipants = [];
    const firstItemExceedAvailableSpace =
      this.participants[0]?.title?.length * CHAR_WIDTH >= availableSpace;
    const processParticipant = (participant: IParticipant) => {
      const participantWidth = participant.title.length * CHAR_WIDTH;
      if (currentCummulativeWidth + participantWidth >= availableSpace) {
        return false;
      }
      if (participant?.userId === trudiUserId) {
        participant.title = 'Trudi (AI Assistant)';
      }
      currentCummulativeWidth += participantWidth + CHAR_WIDTH * 2;
      displayParticipants.push(participant);
      return true;
    };

    if (firstItemExceedAvailableSpace) {
      displayParticipants.push(this.participants[0]);
    } else {
      for (const participant of this.participants) {
        if (!processParticipant(participant)) {
          break;
        }
      }
    }

    this.displayParticipants = displayParticipants;
    this.remainingParticipants = this.participants.slice(
      displayParticipants.length
    );
    this.isShowSingleItem =
      this.participants.length === 1 &&
      this.participants[0]?.title?.length * CHAR_WIDTH > containerClientWidth;
    this.cdr.markForCheck();
  }

  get isDraftEmailMessageWithoutConversation() {
    return !!(
      this.isConsoleUser ||
      this.conversation.isScratchDraft ||
      this.conversation.isScratchTicket
    );
  }

  async onRightClick(event: MouseEvent, menu: NzDropdownMenuComponent) {
    if (this.isDraftEmailMessageWithoutConversation) {
      this.nzContextMenuService.create(event, menu);
      return;
    }
    event.preventDefault();
    this.taskDetailService.closeMenuThreeDots();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(true);
    this.sharedMessageViewService.setRightClickSelectedMessageId(
      this.conversation.id
    );
    this.nzContextMenuService.create(event, menu);
  }

  closeMenu(): void {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  handleMenu(option: EMessageMenuOption, event?: Event) {
    if (
      event &&
      (this.conversation.syncStatus === this.SYNC_TYPE.INPROGRESS ||
        (option !== EMessageMenuOption.MOVE_TO_INBOX &&
          this.isArchiveMailbox) ||
        this.isConsoleUser)
    ) {
      event.stopPropagation();
      return;
    }
    // this.popoverService.setActionConversation(null);
    this.menuChange.emit({
      conversation: this.conversation,
      option: option
    });
    this.closeMenu();
    this.handleCancelModal();
  }

  openAddToTaskModal() {
    this.modalAddToTask = EPopupConversionTask.SELECT_OPTION;
  }

  handleCancelModal() {
    this.modalAddToTask = null;
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this._destroy$.next();
    this._destroy$.complete();
  }
  private resetRightClickSelectedState() {
    if (
      this.sharedMessageViewService.rightClickSelectedMessageIdValue ===
      this.conversation.id
    ) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }

  navigateToMessageDetail() {
    this.menuChange.emit({
      conversation: this.conversation,
      option: EMessageMenuOption.EDIT
    });
  }

  handleEditMessage({ id: conversationId }: UserConversation) {
    this.conversationService
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
            }
          };
          this.sendMsgModalConfig['otherConfigs.isFromDraftFolder'] =
            this._router.url?.includes(ERouterLinkInbox.MSG_DRAFT);
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
        }
      });
  }
}
