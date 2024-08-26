import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap
} from 'rxjs/operators';
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
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, firstValueFrom, take, takeUntil } from 'rxjs';
import {
  EMessageMenuOption,
  EMessageQueryType
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskService } from '@services/task.service';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EPropertyStatus, EUserPropertyType } from '@shared/enum/user.enum';
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
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import { EMessageDetailProperty } from '@/app/dashboard/modules/inbox/modules/app-message-list/pipes/message-detail.pipe';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { PropertiesService } from '@services/properties.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { SharedService } from '@services/shared.service';
import { MessageStatus } from '@services/conversation.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CHAR_WIDTH, TIME_FORMAT, trudiUserId } from '@services/constants';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-task-loading.service';
import { MessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-id-set.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { getSummaryMessage } from '@shared/feature/function.feature';
import { isEqual } from 'lodash-es';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { getUserFromParticipants } from '@/app/trudi-send-msg/utils/helper-functions';
import { ECrmStatus } from '@/app/user/utils/user.enum';
import { EConversationType } from '@shared/enum';
import { AutoScrollService } from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { DeliveryFailedMessageStorageService } from '@/app/services';

@DestroyDecorator
@Component({
  selector: 'app-message-item',
  templateUrl: './app-message-item.component.html',
  styleUrls: ['./app-message-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppMessageViewItemComponent
  implements AfterViewInit, OnInit, OnChanges, OnDestroy
{
  @ViewChild('menu') dropdownMenu: ElementRef;
  @ViewChild('messageRow') messageRow: ElementRef;
  @ViewChild('participantContainer') participantContainer: ElementRef;
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
  @Input() activeMobileApp: boolean;
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
    addToTask: false,
    moveToFolder: false,
    forward: false,
    unread: false,
    resolve: false,
    reOpen: false,
    reportSpam: false,
    delete: false,
    urgent: false,
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
  public isDeletedEnquiries: boolean;
  public isDisplayButtonMove: boolean;
  public tooltipListParticipants: string[] = [];
  public displayParticipants: IParticipant[] = [];
  public listProperty: UserPropertyInPeople[] = [];
  public titleExceedWidth: boolean = false;
  public isAddToTaskSubMenuVisible: boolean = false;
  public maxWidthParticipantName: number;
  private resizeObserver: ResizeObserver;
  public ECrmStatus = ECrmStatus;
  public isDisableActionByOffBoardStatus: boolean;
  public taskType = TaskType;
  public disabledDownloadPDF: boolean;

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
    private emailApiService: EmailApiService,
    public sharedMessageViewService: SharedMessageViewService,
    private nzContextMenuService: NzContextMenuService,
    private cdr: ChangeDetectorRef,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private appMessageListService: AppMessageListService,
    private readonly autoScrollService: AutoScrollService,
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

      this.isReadMsg = this.message.conversations.some(
        (msg) => this.message.conversationId === msg.id && msg.isSeen
      );
      this.isUrgent = this.message.conversations.some(
        (msg) => this.message.conversationId === msg.id && msg.isUrgent
      );
      this.menuDropDown.unread = this.isReadMsg;
      this.isDisableActionByOffBoardStatus =
        this.message?.conversations[0]?.status === TaskStatusType.resolved &&
        this.message?.conversations[0]?.conversationType ===
          EConversationType.APP &&
        !!this.message?.conversations[0]?.offBoardedDate;
      this.checkToEnableDownloadPDFOption();
      this.menuDropDown.removeFromTask =
        this.message?.taskType === TaskType.TASK;
    }

    if (
      changes['participants']?.currentValue ||
      !isEqual(
        changes['message']?.previousValue.property.id,
        this.message.property.id
      )
    ) {
      const receiverParticipants = this.participants.filter(
        (user) => user.type !== EUserPropertyType.MAILBOX
      );

      this.participants = receiverParticipants
        .map((participant) => {
          if (participant.userId === trudiUserId) {
            participant.firstName = `Trudi (AI Assistant)`;
            participant.type = EUserPropertyType.LEAD;
          }

          const isNoPropertyConversation = this.message.property?.isTemporary;
          const isMatchingPropertyWithConversation =
            this.message.property?.id === participant.propertyId;

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

      const isNoPropertyConversation = this.message.property?.isTemporary;
      const receiverParticipant = receiverParticipants[0];
      if (receiverParticipant) {
        const isMatchingPropertyWithConversation =
          this.message.property?.id === receiverParticipant.propertyId;
        this.tooltipListParticipants = [
          this.contactTitleByConversationPropertyPipe.transform(
            receiverParticipant,
            {
              isNoPropertyConversation,
              isMatchingPropertyWithConversation,
              showFullContactRole: true
            }
          )
        ];
      }
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
        this.cdr.markForCheck();
      }
    }
  }

  checkToEnableDownloadPDFOption() {
    this.disabledDownloadPDF =
      this.isArchivedMailbox ||
      this.isConsole ||
      this.listOfConversations?.[0]?.downloadingPDFFile;
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.checkToEnableDownloadPDFOption();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((route) => {
        const statusMessageType = route[EMessageQueryType.MESSAGE_STATUS];
        this.isDeletedEnquiries = statusMessageType === TaskStatusType.deleted;
        this.isDraftFolder = statusMessageType === TaskStatusType.draft;
        let menuDropdownByStatus = null;
        if (
          statusMessageType === TaskStatusType.inprogress ||
          this.isDraftFolder
        ) {
          menuDropdownByStatus = {
            ...this.menuDropDown,
            addToTask: true,
            urgent: true,
            resolve:
              this.message.conversations[0].status !== TaskStatusType.resolved
          };
        } else if (statusMessageType === TaskStatusType.completed) {
          menuDropdownByStatus = {
            ...this.menuDropDown,
            addToTask: true,
            reOpen: true
          };
        }
        if (menuDropdownByStatus) {
          this.menuDropDown = { ...menuDropdownByStatus };
        }
      });
    this.handleActiveMsg();

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchivedMailbox) => {
        this.isArchivedMailbox = isArchivedMailbox;
        this.checkToEnableDownloadPDFOption();
      });

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
    this.menuDropDown.saveToPropertyTree = !this.isRmEnvironment;
    this.menuDropDown.removeFromTask = this.message?.taskType === TaskType.TASK;
  }

  ngAfterViewInit() {
    const boxElement = this.ticketBox?.nativeElement;
    const countElement = boxElement?.querySelector('.ticket--box');
    if (boxElement) {
      const countWidth = countElement?.offsetWidth;
      boxElement.style.width = `${countWidth + 2}px`;
    }
  }

  formatParticipantTitle(participant: IParticipant) {
    const { firstName, lastName, email, phoneNumber, isUnidentifiedContact } =
      participant;
    if (isUnidentifiedContact) {
      return firstName || lastName || email || phoneNumber || 'Unknown';
    }
    if (!firstName && !lastName) {
      return email || phoneNumber || 'Unknown';
    }
    if (!firstName) {
      return lastName;
    }
    return ((firstName || '') + ' ' + (lastName || ''))?.trim();
  }

  formatParticipantRole(participant: IParticipant, isRmEnvironment: boolean) {
    const propertyType = participant?.userPropertyType;
    if (participant.isUnidentifiedContact) return '';
    switch (propertyType) {
      case EConfirmContactType.OTHER:
        return participant?.contactType?.replace('_', ' ');
      case EConfirmContactType.AGENT:
        return 'Property Manager';
      case EUserPropertyType.LANDLORD:
        return 'Owner';
      case EUserPropertyType.LANDLORD_PROSPECT:
        return 'Owner prospect';
      case EConfirmContactType.TENANT_UNIT:
        return isRmEnvironment
          ? USER_TYPE_IN_RM.TENANT_UNIT.replace(/[()]/g, '')
          : propertyType;
      case EConfirmContactType.TENANT_PROPERTY:
        return isRmEnvironment
          ? USER_TYPE_IN_RM.TENANT_PROPERTY.replace(/[()]/g, '')
          : propertyType;
      case EConfirmContactType.UNIDENTIFIED:
        return '';
      default:
        if (participant?.type === EConfirmContactType.SUPPLIER) {
          return EConfirmContactType.SUPPLIER;
        } else if (participant?.type === EConfirmContactType.OTHER) {
          return participant?.contactType?.replace('_', ' ');
        } else {
          return propertyType?.replace('_', ' ') || '';
        }
    }
  }

  mapConversationProperties() {
    if (!Array.isArray(this.message?.conversations)) return;
    this.listOfConversations = this.message.conversations
      .map((item) => ({
        ...item,
        summaryMessage: getSummaryMessage(
          item,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS,
          true
        ),
        timeAgo: item.messageDate,
        title: this.message.conversations[0]?.isDraft
          ? this.message.conversations[0]?.title
          : this.message.title
      }))
      .filter((_, index) => index === 0);
    this.cdr.markForCheck();
  }

  navigateToMessageDetail() {
    // prevent navigate same current message from scratch flow
    if (
      this.conversationId === this.message.conversationId &&
      this.activatedRoute.snapshot.queryParams['fromScratch']
    ) {
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
    this.appMessageListService.setPreFillCreateNewMessage(null);
    const isScratchDraftConversation =
      this.message?.conversations?.[0]?.isScratchDraft;
    const queryParams = {
      taskId: this.message.id,
      conversationId: this.message.conversationId,
      reminderType: null,
      appMessageCreateType: null,
      fromScratch: null,
      tempConversationId: null
    };

    if (this.message.conversations.length > 0) {
      queryParams['conversationId'] = this.message.conversations[0].id;
    }
    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge'
    });
    if (this.activeMsgList.length > 0) {
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
    if (
      this.message?.conversations[0]?.crmStatus === ECrmStatus.DELETED ||
      this.isDisableActionByOffBoardStatus
    ) {
      return;
    }

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

  handleMenu(option: EMessageMenuOption, schedule?: boolean, event?: Event) {
    if (schedule) {
      event?.stopPropagation();
      return;
    }
    this.handleClearSelected();
    this.popoverService.setActionConversation(null);
    this.menuChange.emit({
      message: this.message,
      option: option
    });
    this.closeMenu();
  }

  handleActiveMsg() {
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(
          (pre, curr) => pre?.['conversationId'] === curr?.['conversationId']
        ),
        tap((queryParams) => {
          this.currentQueryParams = queryParams;
          const { conversationId } = queryParams || {};
          if (conversationId === this.message?.conversations?.[0]?.id) {
            this.activeMessage.emit(this.message);
          }
        }),
        debounceTime(100)
      )
      .subscribe((queryParams) => {
        if (
          queryParams['conversationId'] === this.message?.conversations?.[0]?.id
        ) {
          const isScratchDraftConversation =
            this.message?.conversations?.[0]?.isScratchDraft;
          if (isScratchDraftConversation) {
            const appUser = getUserFromParticipants(
              this.message.conversations[0].participants as IParticipant[]
            )?.[0];

            this.appMessageListService.setPreFillCreateNewMessage({
              receivers: appUser
                ? [
                    {
                      ...appUser,
                      id: appUser.userId,
                      type: appUser.userPropertyType,
                      isAppUser: true,
                      streetline:
                        this.message.property.shortenStreetline ||
                        this.message.property.streetline
                    }
                  ]
                : [],
              title:
                this.message.conversations?.[0]?.title ||
                this.message.conversations?.[0]?.categoryName,
              draftMessageId:
                this.message.conversations?.[0]?.draftMessageId ||
                this.message.conversations?.[0]?.id
            });
          }
        }
      });
  }

  get isDraftEmailMessageWithoutConversation() {
    return !!(
      this.isConsole ||
      this.message.conversations?.[0]?.isScratchDraft ||
      this.message.conversations?.[0]?.isScratchTicket
    );
  }

  async onRightClick(event: MouseEvent, menu: NzDropdownMenuComponent) {
    if (this.isDraftEmailMessageWithoutConversation) {
      this.nzContextMenuService.create(event, menu);
      return;
    }

    event.preventDefault();

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
    if (
      this.isAbleMulClick() &&
      this.message?.conversations[0]?.crmStatus !== ECrmStatus.DELETED
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

  getClassObject(
    item,
    isLastMessageDraft: boolean,
    isConsole: boolean
  ): { [key: string]: boolean } {
    const conditions = [
      !!(item?.syncStatus || item?.conversationSyncDocumentStatus),
      !!item?.attachmentCount,
      !!item?.scheduleMessageCount,
      isLastMessageDraft && !isConsole
    ];

    const trueConditionsCount = conditions.filter(
      (condition) => condition
    ).length;

    let classObject: { [key: string]: boolean } = {};

    switch (trueConditionsCount) {
      case 1:
        classObject = { 'attachment-content': true };
        break;
      case 2:
        classObject = { 'schedule-content': true };
        break;
      case 3:
        classObject = { 'draft-content': true };
        break;
      case 4:
        classObject = { 'full-icon-content': true };
        break;
      default:
        classObject = {};
    }

    return classObject;
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetRightClickSelectedState() {
    const { isRightClickDropdownVisibleValue } = this.sharedMessageViewService;
    if (isRightClickDropdownVisibleValue) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }
}
