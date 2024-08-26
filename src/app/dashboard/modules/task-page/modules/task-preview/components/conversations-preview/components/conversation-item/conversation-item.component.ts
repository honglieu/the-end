import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  EventEmitter,
  OnInit,
  HostListener
} from '@angular/core';
import {
  Subject,
  filter,
  merge,
  switchMap,
  takeUntil,
  distinctUntilChanged
} from 'rxjs';
import { CHAR_WIDTH } from '@services/constants';
import {
  ConversationService,
  MessageStatus
} from '@services/conversation.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  IParticipant,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { IconsSync } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { SharedService } from '@services/shared.service';
import { ITaskPreview, TaskItem } from '@shared/types/task.interface';
import { TaskType } from '@shared/enum/task.enum';
import {
  EConversationType,
  ESyncToRmStatus
} from '@shared/enum/conversationType.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { ICheckMoveMailFolderResponse } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { Router } from '@angular/router';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import {
  ECreatedFrom,
  EMessageComeFromType
} from '@shared/enum/messageType.enum';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { EPopupConversionTask } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';

@Component({
  selector: 'conversation-item',
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss']
})
export class ConversationItemComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() task: TaskItem;
  @Input() taskPreview: ITaskPreview;
  @Input() conversation: PreviewConversation;
  @Input() isRmEnvironment: boolean = false;
  @Input() currentUser: CurrentUser;
  @Input() isArchiveMailbox: boolean = false;
  @ViewChild('participantContainer') participantContainer: ElementRef;
  @ViewChild('conversationTitle') conversationTitle: ElementRef<HTMLDivElement>;
  @ViewChild('menu') dropdownMenu: ElementRef;
  @ViewChild('conversationRow') conversationRow: ElementRef;
  @Output() menuChange = new EventEmitter<{
    conversation: PreviewConversation;
    option: EMessageMenuOption | string;
  }>();
  public taskType = TaskType;
  public EConversationType = EConversationType;
  readonly EMessageMenuOption = EMessageMenuOption;
  readonly ESyncToRmStatus = ESyncToRmStatus;
  readonly SYNC_TYPE = SyncMaintenanceType;
  public isConsoleUser: boolean = false;
  public userPropertyType = EUserPropertyType;
  public MessageStatus = MessageStatus;
  public isUnhappyFlow = false;
  public participants = [];
  public displayParticipants: IParticipant[] = [];
  public remainingParticipants: IParticipant[] = [];
  public isShowSingleItem: boolean = false;
  public tooltipListParticipants: string[] = [];
  private _destroy$ = new Subject<void>();
  public isUnidentifiedContact: boolean = false;
  public tooltipPlacement: string[] = ['top', 'bottom'];
  public titleExceedWidth: boolean = false;
  private resizeObserver: ResizeObserver;
  public iconSync: string;
  readonly ICON_SYNC = IconsSync;
  public currentQueryParams;
  public currentMailboxId: string;
  public isDisplayButtonMove: boolean;
  public isMenuDisplayed: boolean = false;
  private refetchCheckMoveToFolder$ = new Subject<void>();
  public menuDropDown = {
    addTask: true,
    read: true,
    resolve: true,
    reOpen: true,
    delete: true,
    urgent: true,
    reportSpam: true,
    saveToRentManager: true,
    saveToPropertyTree: true,
    removeFromTask: true
  };
  public tooltipEnterMouseDelay = 1;
  public readonly EMessageComeFromType = EMessageComeFromType;
  public readonly ECreatedFrom = ECreatedFrom;
  public readonly EConversationStatus = EConversationStatus;
  public maxWidthParticipantName: number;
  public modalAddToTask: EPopupConversionTask;
  public modalTypeAddToTask = EPopupConversionTask;
  public disabledDownloadPDF: boolean = false;

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
    private router: Router,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService
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
      if (this.conversation.participants?.length) {
        let receiverParticipants = this.conversation?.isScratchDraft
          ? (this.conversation.participants as IParticipant[])?.filter((item) =>
              item?.emailMetadataType?.includes('TO')
            )
          : (this.conversation.participants as IParticipant[]);

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
          this.menuDropDown = {
            ...this.menuDropDown,
            delete: false,
            reportSpam: false,
            saveToRentManager: false
          };
        }

        this.participants = receiverParticipants
          .map((participant) => {
            const isNoPropertyConversation = this.task?.property?.isTemporary;
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

        this.tooltipListParticipants = receiverParticipants.map(
          (participant) => {
            const isNoPropertyConversation = this.task?.property?.isTemporary;
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
          }
        );

        this.iconSync = this.conversationService.getSyncStatusIcon(
          this.conversation.syncStatus ||
            this.conversation.conversationSyncDocumentStatus
        );
      }
    }
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

  handleSyncStatusMessage() {
    const currentListByCRM$ = this.isRmEnvironment
      ? this.syncResolveMessageService.getListConversationStatus()
      : this.syncMessagePropertyTreeService.listConversationStatus;
    currentListByCRM$
      .pipe(takeUntil(this._destroy$))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        const syncStatus =
          listMessageSyncStatus.status ||
          listMessageSyncStatus.conversationSyncDocumentStatus ||
          this.conversation?.conversationSyncDocumentStatus;
        if (
          listMessageSyncStatus?.conversationIds?.includes(this.conversation.id)
        ) {
          this.conversation.syncStatus = syncStatus;
          this.conversation.downloadingPDFFile =
            listMessageSyncStatus.downloadingPDFFile;
          this.disabledDownloadPDF =
            this.syncMessagePropertyTreeService.checkToEnableDownloadPDFOption(
              this.isArchiveMailbox,
              this.isConsoleUser,
              this.conversation.downloadingPDFFile
            );
          this.iconSync =
            this.conversationService.getSyncStatusIcon(syncStatus);
          this.cdr.markForCheck();
        }
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

  async onRightClick(event: MouseEvent, menu: NzDropdownMenuComponent) {
    if (this.isConsoleUser || this.conversation.isScratchDraft) return;
    event.preventDefault();
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
        this.isArchiveMailbox ||
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

  handleNavigateTaskDetail() {
    this.router.navigate(
      ['dashboard', 'inbox', 'detail', this.taskPreview?.id],
      {
        queryParams: {
          type: 'TASK',
          conversationId: this.conversation.id,
          conversationType: this.conversation.conversationType
        },
        queryParamsHandling: 'merge'
      }
    );
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
}
