import {
  EMessageQueryType,
  EMessageType
} from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import { MessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-id-set.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-task-loading.service';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { EMessageDetailProperty } from '@/app/dashboard/modules/inbox/modules/message-list-view/pipes/message-detail.pipe';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import { AutoScrollService } from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TIME_FORMAT } from '@services/constants';
import { MessageStatus } from '@services/conversation.service';
import { PopoverService } from '@services/popover.service';
import { PropertiesService } from '@services/properties.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';

import {
  ECreatedFrom,
  EMessageComeFromType,
  EPropertyStatus,
  ERecognitionStatus,
  SyncMaintenanceType,
  TaskStatusType,
  TaskType
} from '@/app/shared/enum';
import { EDataE2EConversation } from '@/app/shared/enum/E2E.enum';
import { getSummaryMessage } from '@/app/shared/feature/function.feature';
import { ContactTitleByConversationPropertyPipe } from '@/app/shared/pipes/contact-title-by-property.pipe';
import {
  IParticipant,
  PreviewConversation,
  UserConversation
} from '@/app/shared/types/conversation.interface';
import { TaskItem } from '@/app/shared/types/task.interface';
import { UserPropertyInPeople } from '@/app/shared/types/user-property.interface';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { ECrmStatus } from '@/app/user/utils/user.enum';
import {
  AfterViewInit,
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
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isEqual } from 'lodash-es';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  Subject,
  distinctUntilChanged,
  firstValueFrom,
  take,
  takeUntil
} from 'rxjs';
import { BelongToOtherPropertiesText } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-message-detail-list/components/sms-message-detail-header/sms-message-detail-header.component';
import { DeliveryFailedMessageStorageService } from '@/app/services/deliveryFailedMessageStorage.service';
import { MessageTaskLoadingService as MessageLoading } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { EJoinConversationContent } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';

@Component({
  selector: 'sms-message-item',
  templateUrl: './sms-message-item.component.html',
  styleUrl: './sms-message-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmsMessageItemComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @ViewChild('menu') dropdownMenu: ElementRef;
  @ViewChild('messageRow') messageRow: ElementRef;
  @ViewChild('participantContainer') participantContainer: ElementRef;
  @ViewChild('conversationTitle') conversationTitle: ElementRef<HTMLDivElement>;
  @ViewChild('ticketBox') ticketBox: ElementRef;

  @Input() isRmEnvironment: boolean = false;
  @Input() message: TaskItem;
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
  @Input() isHiddenMessageTypeCallFile: boolean;
  @Input() isAppMessageLog: boolean;
  @Output() checkedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() removeItem = new EventEmitter<string>();
  @Output() setItem = new EventEmitter<void>();
  @Output() menuChange = new EventEmitter<{
    message: TaskItem;
    option: EMessageMenuOption | string;
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
    unread: false,
    resolve: false,
    reOpen: false,
    urgent: false,
    saveToRentManager: false,
    saveToPropertyTree: false
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
  public ERecognitionStatus = ERecognitionStatus;

  public currentQueryParams;
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
  readonly EMessageType = EMessageType;
  readonly EJoinConversationContent = EJoinConversationContent;

  public isDisplayButtonMove: boolean;
  public tooltipListParticipants: string[] = [];
  public displayParticipants: IParticipant[] = [];
  public remainingParticipants: IParticipant[] = [];
  public isShowSingleItem: boolean = false;
  public listProperty: UserPropertyInPeople[] = [];
  public titleExceedWidth: boolean = false;
  public isAddToTaskSubMenuVisible: boolean = false;
  public maxWidthParticipantName: number;
  private refetchCheckMoveToFolder$ = new Subject<void>();
  private resizeObserver: ResizeObserver;
  public ECrmStatus = ECrmStatus;
  public isDisableActionByOffBoardStatus: boolean;
  public taskType = TaskType;
  public disabledDownloadPDF: boolean;
  public disabledAction: boolean;
  public isNotDetectedContact: boolean;
  public userRaiseMsg: IParticipant;
  readonly contactTitleVariable = {
    isNoPropertyConversation: false,
    isMatchingPropertyWithConversation: true,
    showPrimaryText: true
  };
  public smsPhoneNumber: string = '';
  isLoading: boolean;
  public userName: string = '';

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
    private messageConversationIdSetService: MessageConversationIdSetService,
    public inboxService: InboxService,
    public sharedMessageViewService: SharedMessageViewService,
    private nzContextMenuService: NzContextMenuService,
    private cdr: ChangeDetectorRef,
    private smsMessageListService: SmsMessageListService,
    private readonly autoScrollService: AutoScrollService,
    private readonly contactTitleResolver: ContactTitleByConversationPropertyPipe,
    public deliveryFailedMessageStorageService: DeliveryFailedMessageStorageService,
    private readonly phoneFormatPipe: PhoneNumberFormatPipe,
    public messageLoading: MessageLoading
  ) {
    this.propertiesService.listPropertyAllStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((properties) => {
        this.listProperty = properties || [];
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!isEqual(changes['message']?.previousValue, this.message)) {
      this.isNotDetectedContact =
        !this.message?.conversations[0]?.isDetectedContact;
      this.mapConversationProperties();
      this.isReadMsg = this.message.conversations.some(
        (msg) => this.message.conversationId === msg.id && msg.isSeen
      );
      this.isUrgent = this.message.conversations.some(
        (msg) => this.message.conversationId === msg.id && msg.isUrgent
      );
      this.menuDropDown.unread = this.isReadMsg;
      this.checkToDisableAction();
    }
    if (changes['activeMsgList']?.currentValue) {
      const selectedItems = changes['activeMsgList']?.currentValue;
      if (selectedItems.length > 0) {
        this.isActive = selectedItems.some((item) => {
          return (
            item === this.message?.conversationId && !this.isNotDetectedContact
          );
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
      const newActiveValue =
        this.queryTaskId === this.message.id &&
        this.conversationId === this.message.conversationId;

      if (newActiveValue != this.isFocused) {
        this.isFocused = newActiveValue;
        this.cdr.markForCheck();
      }
    }

    if (changes['participants']?.currentValue) {
      this.participants = this.composeParticipants(
        changes['participants']?.currentValue,
        this.message
      );
    }
  }

  composeParticipants = (participants: IParticipant[], message: TaskItem) => {
    return participants.map((participant) => {
      const transformOptions = {
        isNoPropertyConversation: message.property?.isTemporary,
        isMatchingPropertyWithConversation:
          message.property?.id === participant.propertyId
      };
      return {
        ...participant,
        title: this.contactTitleResolver.transform(
          participant,
          transformOptions
        ),
        tooltipTitle: this.contactTitleResolver.transform(participant, {
          ...transformOptions,
          showFullContactRole: true
        })
      };
    });
  };

  checkToDisableAction() {
    this.disabledAction = this.isConsole || this.isArchivedMailbox;
    this.disabledDownloadPDF =
      this.disabledAction || this.listOfConversations?.[0]?.downloadingPDFFile;
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((route) => {
        const statusMessageType = route[EMessageQueryType.MESSAGE_STATUS];
        let menuDropdownByStatus = null;
        switch (statusMessageType) {
          case TaskStatusType.inprogress:
            menuDropdownByStatus = {
              ...this.menuDropDown,
              urgent: true,
              resolve:
                this.message.conversations[0].status !== TaskStatusType.resolved
            };
            break;
          case TaskStatusType.completed:
            menuDropdownByStatus = {
              ...this.menuDropDown,
              urgent: false
            };
            break;
          default:
            break;
        }
        if (menuDropdownByStatus) {
          this.menuDropDown = { ...menuDropdownByStatus };
        }
      });

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchivedMailbox) => {
        this.isArchivedMailbox = isArchivedMailbox;
        this.checkToDisableAction();
      });

    this.sharedMessageViewService.rightClicKSelectedMessageId$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((messageId) => {
        this.isMenuDisplayed = messageId === this.message.conversationId;
        this.cdr.markForCheck();
      });
    this.menuDropDown.saveToPropertyTree = !this.isRmEnvironment;
    this.messageLoading.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLoading) => {
        this.isLoading = isLoading;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit() {
    const boxElement = this.ticketBox?.nativeElement;
    const countElement = boxElement?.querySelector('.ticket--box');
    if (boxElement) {
      const countWidth = countElement?.offsetWidth;
      boxElement.style.width = `${countWidth + 2}px`;
    }
  }

  mapConversationProperties() {
    if (!Array.isArray(this.message?.conversations)) return;
    const {
      conversations,
      title,
      property: { id: propertyId, isTemporary: isTemporaryProperty }
    } = this.message;

    this.listOfConversations = conversations
      .map((item) => ({
        ...item,
        summaryMessage: getSummaryMessage(
          item,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS,
          true,
          true
        ),
        timeAgo: item.messageDate,
        title: conversations[0]?.isDraft ? conversations[0]?.title : title,
        propertyId,
        isTemporaryProperty
      }))
      .filter((_, index) => index === 0);
    this.userRaiseMsg =
      this.smsMessageListService.getUserRaiseMsgFromParticipants(
        this.listOfConversations?.[0] as UserConversation
      );
    this.smsPhoneNumber =
      this.listOfConversations?.[0]?.channelUser?.externalId;
    this.userName = this.getUserName(this.userRaiseMsg);
    this.cdr.markForCheck();
  }

  getUserName(user: IParticipant) {
    if (user?.showUserName) {
      const textContactTitleTooltip = this.contactTitleResolver.transform(
        user,
        this.contactTitleVariable
      );
      return textContactTitleTooltip;
    }
    const textPhoneTitleTooltip = this.phoneFormatPipe.transform(
      this.smsPhoneNumber
    );
    const textBelongToOtherProperties = user?.isBelongToOtherProperties
      ? BelongToOtherPropertiesText
      : '';
    return textPhoneTitleTooltip + textBelongToOtherProperties;
  }

  navigateToMessageDetail() {
    if (this.conversationId === this.message.conversationId) {
      return;
    }
    if (
      this.queryTaskId !== this.message.id ||
      this.conversationId !== this.message.conversationId
    ) {
      this.messageTaskLoadingService.onLoading();
      this.taskService.triggerOpenMessageDetail.next(this.message.id);
      this.inboxService.setChangeUnreadData(null);
    }
    this.smsMessageListService.setPreFillCreateNewMessage(null);
    const queryParams = {
      taskId: this.message.id,
      conversationId: this.message.conversationId
    };

    if (!!this.message.conversations?.length) {
      queryParams['conversationId'] = this.message.conversations[0].id;
    }

    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge'
    });
    if (!!this.activeMsgList.length) {
      this.removeActiveMsg.emit();
    }
    this.autoScrollService.disableAutoScroll();
    this.messageConversationIdSetService.setIsMessageIdsEmpty(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxToolbarService.setInboxItem([]);
    this.resetRightClickSelectedState();
    this.setItem.emit();
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

  handleMenu(option: EMessageMenuOption) {
    this.handleClearSelected();
    this.popoverService.setActionConversation(null);
    this.menuChange.emit({
      message: this.message,
      option: option
    });
    this.closeMenu();
  }

  async onRightClick(event: MouseEvent, menu: NzDropdownMenuComponent) {
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

  isAbleMulClick() {
    let isAbleMulClick = false;
    this.sharedMessageViewService.isSelectingMode$
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe((isSelect) => (isAbleMulClick = isSelect));
    return isAbleMulClick;
  }

  onShiftClick(event: MouseEvent) {
    if (
      this.isAbleMulClick() &&
      this.message?.conversations[0]?.crmStatus !== ECrmStatus.DELETED &&
      !this.isNotDetectedContact
    ) {
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

  private resetRightClickSelectedState() {
    const { isRightClickDropdownVisibleValue } = this.sharedMessageViewService;
    if (isRightClickDropdownVisibleValue) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
