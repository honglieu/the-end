import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
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
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  TIME_FORMAT,
  documentTypeInvoiceId,
  documentTypeQuoteId,
  trudiUserId
} from '@services/constants';
import { DragDropFilesService } from '@services/drag-drop.service';
import { FilesService } from '@services/files.service';
import { TaskService } from '@services/task.service';
import { ECategoryType } from '@shared/enum/category.enum';
import { EMessageType, PeopleFromViaEmailType } from '@shared/enum/index.enum';
import {
  EMessageEmailStatusEnum,
  EMessageStatusTooltip
} from '@shared/enum/mesageEmailStatus.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import {
  isEmail,
  isHtmlContent,
  replaceUrlWithAnchorTag,
  setTranslatedContent,
  mapThreeDotsForMessage,
  formatNameHasEmail,
  combineNames
} from '@shared/feature/function.feature';
import { userType } from '@trudi-ui';
import {
  IParticipant,
  IParticipantContact,
  KeywordIntent,
  UserConversation
} from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import { AgentFileProp } from '@shared/types/user-file.interface';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import { ActionLinkService } from '@services/action-link.service';
import { ConversationService } from '@services/conversation.service';
import { MessageService } from '@services/message.service';
import { TicketService } from '@services/ticket.service';
import { EExcludedUserRole, EUserPropertyType } from '@shared/enum/user.enum';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import {
  ETooltipQuoteMessage,
  FileMessage,
  IMessage,
  IPeopleFromViaEmail,
  MessageObject
} from '@shared/types/message.interface';
import { TrudiButton } from '@shared/types/trudi.interface';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISelectedReceivers,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EButtonAction } from '@/app/task-detail/interfaces/task-detail.interface';
import {
  defaultConfigsButtonAction,
  taskForwardConfigsButtonAction
} from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import {
  TaskDetailService,
  UserProfileDrawerService
} from '@/app/task-detail/services/task-detail.service';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { cloneDeep, isEqual } from 'lodash-es';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { CompanyService } from '@services/company.service';
import {
  extractQuoteAndMessage,
  isMailboxCompany
} from '@/app/trudi-send-msg/utils/helper-functions';
import { SharedService } from '@services/shared.service';
import { Router } from '@angular/router';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EDataE2EThreeDotsAction } from '@shared/enum/E2E.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { PreventButtonService } from '@trudi-ui';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { EMPTY_MESSAGE } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';

enum MessageType {
  text = 'text',
  url = 'url'
}

@DestroyDecorator
@Component({
  selector: 'app-message-via-email',
  templateUrl: './message-via-email.component.html',
  styleUrls: ['./message-via-email.component.scss']
})
export class MessageViaEmailComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @ViewChild('fileList', { static: true }) fileList:
    | string
    | CdkDropList
    | (string | CdkDropList);
  @ViewChild('textContain') private textContain: ElementRef;

  @Input() message: IMessage;
  @Input() isSending: boolean = false;
  @Input() isError: boolean = true;
  @Output() fileOnClicked = new EventEmitter<{
    state: boolean;
    imageId: string;
  }>();
  @Output() onCollapseMess = new EventEmitter<boolean>(true);
  @Output() onSendQuoteLandlordClicked = new EventEmitter<boolean>(false);
  @Output() onSendInvoicePTClicked = new EventEmitter<boolean>(false);
  @Output() showSelectPeople = new EventEmitter<IPeopleFromViaEmail>();
  @Output() listQuoteSelected = new EventEmitter<any>();
  @Output() fileEmit = new EventEmitter<any>();
  @Output() reSendEmitter = new EventEmitter<string>();
  @Output() removeDraftMsg = new EventEmitter<string>();
  @Output() updateDraftMsg = new EventEmitter();
  @Output() onSent = new EventEmitter();
  @Input() draftMsg: IMessage = null;
  @Input() lastItem: boolean = false;
  @Input() needToExpand: boolean = false;

  public trudiUserId: string = trudiUserId;
  public listofAgentFiles: Array<any> = [];
  public messageType = MessageType;
  public optionType = EOptionType;
  public buttonAction: TrudiButton;
  public fileSendQuote = [];
  public forwardButtons: TrudiButton[] = [];
  public messageSendQuote = '';
  public categoryType = '';
  public messageEmailStatusEnum = EMessageEmailStatusEnum;
  public messageStatusTooltip = EMessageStatusTooltip;
  public intentList: string[] = [];
  public pos1 = 0;
  public pos2 = 0;
  public isShowBoxInfo = false;
  public isCollapseMess = true;
  public currentTask: TaskItem;
  public currentConversation: UserConversation;
  public emailSignatureHeight: number = 0;
  public emailSignature: HTMLDivElement;
  public emailQuote: HTMLDivElement;
  public isRmEnvironment: boolean = false;
  public isShowSignature: boolean = false;
  public isShowQuote: boolean = false;
  public pipeType: string = userType.NO_BRACKET;
  public isShowIframeContent: boolean;
  public previousStatusSending = false;
  public isReplyAction: boolean;
  heightCalculationTime: NodeJS.Timeout = null;
  updatedMessage: string;
  fileLists: FileMessage[] = [];
  mediaLists: FileMessage[] = [];
  audioLists: FileMessage[] = [];
  listOfFiles: FileMessage[] = [];
  contactsList: ISelectedReceivers[] = [];

  private originalMessage: string;
  private htmlContent: string = '';
  private conversationTrudiRespone: any;
  private unsubscribe = new Subject<void>();
  private listKeywordData: KeywordIntent[] = [];
  public isConsole: boolean;
  public excludedUserRole = [
    EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
    EExcludedUserRole.UNRECOGNIZED,
    EExcludedUserRole.EMPTY
  ];
  public readonly EUserPropertyType = EUserPropertyType;
  private messageReadStatus$ = new Subject<boolean>();

  get isShowResendButton() {
    const currentMailBoxStatus = this.currentMailBox.status;
    return ![EMailBoxStatus.DISCONNECT, EMailBoxStatus.ARCHIVE].includes(
      currentMailBoxStatus
    );
  }

  TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ' ' + format)
  );
  connectedParent: string | CdkDropList | (string | CdkDropList)[];
  public isSyncedAttachment: boolean = true;

  public readonly DOCUMENT_TYPE_QUOTE_ID = documentTypeQuoteId;
  public readonly DOCUMENT_TYPE_INVOICE_ID = documentTypeInvoiceId;
  public readonly ETrudiType = ETrudiType;
  public readonly taskStatusType = TaskStatusType;
  public readonly EMessageMenuOption = EMessageMenuOption;
  public isCategoryType = ECategoryType;
  public emailSignaturePart: string;
  public remainingContent: string;
  public currentMailBoxId: string;
  public currentMailBox: IMailBox;
  public isHiddenPrimary = false;
  public threadId: string = null;
  public isShowDropdownMenu: boolean = false;
  public senderOfMessage: {
    senderName?: string;
    senderRole?: EExcludedUserRole | string;
    pmName?: string;
    pmUserId?: string;
    isSender?: boolean;
  } & IUserParticipant = null;
  public deletingDraft: boolean = false;
  public listItemDropdown = [
    {
      key: EButtonAction.REPLY_ALL,
      icon: 'replyAll',
      text: 'Reply all',
      action: () => {
        if (!this.shouldHandleProcess()) {
          this.isShowDropdownMenu = false;
          return;
        }
        this.handleReplyAll();
        this.isShowDropdownMenu = false;
      },
      hidden: true
    },
    {
      key: EButtonAction.FORWARD,
      icon: 'cornerUpRight',
      text: 'Forward',
      dataE2e: EDataE2EThreeDotsAction.FORWARD,
      action: () => {
        if (!this.shouldHandleProcess()) {
          this.isShowDropdownMenu = false;
          return;
        }
        this.handleReplyForward();
        this.isShowDropdownMenu = false;
      },
      hidden: false
    },
    {
      key: EButtonAction.MARK_AS_UNREAD,
      icon: 'unread',
      text: 'Mark as unread',
      action: () => {
        this.messageReadStatus$.next(true);
        this.isShowDropdownMenu = false;
      },
      hidden: true
    },
    {
      key: EButtonAction.MARK_AS_READ,
      icon: 'read',
      text: 'Mark as read',
      action: () => {
        this.messageReadStatus$.next(false);
        this.isShowDropdownMenu = false;
      },
      hidden: true
    }
  ];
  public countAttachment: number = 0;
  public isShowSendMsgModal: boolean = false;
  public sendMsgModalConfig: any = cloneDeep(defaultConfigsButtonAction);
  public headerTitle: string = '';

  public isTaskType: boolean = false;
  public rawMsg: string = '';
  readonly TaskType = TaskType;
  public readonly typeMessage = ETypeMessage;
  public countMetaDataLength: number = 0;
  public newConversationEmailName: string = '';
  private isPmSend: IMailBox;
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public isDraft: boolean = false;
  public isDraftPage: boolean = false;
  public showMessageHasLinkedTask: boolean = false;
  public listMailBoxes: IMailBox[] = [];
  public mailBoxShared: IUserParticipant;

  constructor(
    public actionLinkService: ActionLinkService,
    public ticketService: TicketService,
    public filesService: FilesService,
    public dropService: DragDropFilesService,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private controlPanelService: ControlPanelService,
    private taskService: TaskService,
    private elr: ElementRef,
    private agencyService: AgencyService,
    public inboxService: InboxService,
    private cdr: ChangeDetectorRef,
    private agencyDateFormatService: AgencyDateFormatService,
    private taskDetailService: TaskDetailService,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService,
    private sharedService: SharedService,
    private router: Router,
    private aiSummaryFacadeService: AISummaryFacadeService,
    private inboxSidebarService: InboxSidebarService,
    private inboxToolbarService: InboxToolbarService,
    private messageLoadingService: MessageLoadingService,
    readonly userProfileDrawerService: UserProfileDrawerService,
    private messageFlowService: MessageFlowService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private PreventButtonService: PreventButtonService,
    private conversationSummaryService: ConverationSummaryService
  ) {}

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  ngAfterViewInit(): void {
    this.htmlContent = mapThreeDotsForMessage({
      message:
        this.updatedMessage ||
        (this.message.message as MessageObject[])[0].value,
      id: this.message.id
    });
    this.showEmailQuote();
    if (
      this.updatedMessage ||
      (this.message.message as MessageObject[])[0].value
    ) {
      this.convertTextToHyperlink();
    }
    this.messageService.addEventForImage(this.elr);
    this.cdr.markForCheck();
  }

  convertTextToHyperlink() {
    if (this.textContain && this.textContain.nativeElement) {
      const paragraph = this.textContain.nativeElement as HTMLElement;
      let message = paragraph;
      let innerHTML = '';
      if (
        paragraph.firstChild &&
        (paragraph.firstChild as HTMLElement).innerHTML
      ) {
        message = paragraph.firstChild as HTMLElement;
        innerHTML = message.innerHTML;
      } else {
        message = document.createElement('span');
        innerHTML = paragraph.firstChild.textContent;
        paragraph.replaceChild(message, paragraph.firstChild);
      }
      message.innerHTML = replaceUrlWithAnchorTag(innerHTML);
      // message.innerHTML = shortenLinkText(message.innerHTML);

      const anchors = paragraph.querySelectorAll('a');
      anchors.forEach((anchor: HTMLAnchorElement) => {
        if (!anchor.getAttribute('target')) {
          anchor.setAttribute('target', '_blank');
        }
      });
    }
  }

  onToggleQuote = (elementQuote, isEmailSignature = false) => {
    if (elementQuote.classList.contains('hide')) {
      elementQuote?.classList.remove('hide');
      isEmailSignature
        ? (this.isShowSignature = true)
        : (this.isShowQuote = true);
    } else {
      elementQuote?.classList.add('hide');
      isEmailSignature
        ? (this.isShowSignature = false)
        : (this.isShowQuote = false);
    }
  };

  showEmailQuote() {
    if (this.elr.nativeElement.querySelector('button.btn-toggle-est')) {
      return;
    }
    // can not use markForCheck, do not remove it.
    this.cdr.detectChanges();
    this.emailQuote = this.elr.nativeElement.querySelector('div.gmail_quote');
    if (this.emailQuote) {
      const content =
        this.elr.nativeElement.querySelector('div.text-value')?.children?.[0];
      this.emailQuote.style.whiteSpace = 'normal';
      this.emailQuote.classList.add('mt-12');
      const divEmpty = document.createElement('div');
      const btnWrapper = document.createElement('button');
      const tooltipElement = document.createElement('span');
      const btnElement = document.createElement('img');

      btnElement.src = '/assets/icon/show-more-icon.svg';
      btnWrapper.classList.add('btn-toggle-est', 'gmail-quote-button');
      tooltipElement.classList.add('tooltip-quote', 'gmail-quote-tooltip');
      tooltipElement.innerHTML = ETooltipQuoteMessage.SHOW_QUOTE;
      btnWrapper.appendChild(btnElement);
      btnWrapper.appendChild(tooltipElement);
      btnWrapper.addEventListener('click', () => {
        this.onToggleQuote(this.emailQuote);
        tooltipElement.innerHTML = this.isShowQuote
          ? ETooltipQuoteMessage.HIDE_QUOTE
          : ETooltipQuoteMessage.SHOW_QUOTE;
      });
      content && content?.parentNode?.insertBefore(divEmpty, content);
      this.emailQuote.parentNode.insertBefore(btnWrapper, this.emailQuote);
      this.emailQuote?.classList.add('hide');
    }
  }

  @HostListener('click', ['$event.target'])
  handleClick(target: HTMLElement) {
    if (target.tagName === 'A') {
      const anchorElem = target as HTMLAnchorElement;
      if (anchorElem.href && anchorElem.target !== '_blank') {
        window.open(anchorElem.href, '_blank');
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { previousValue, currentValue } = changes['message'] || {};
    if (currentValue && currentValue?.options) {
      if ((this.message.message as MessageObject[])[0]) {
        (this.message.message as MessageObject[])[0].value =
          this.replaceRegexEmailUrl(
            (this.message.message as MessageObject[])[0].value,
            this.message.mailMessageId
          );
      }

      this.isError = this.message.isError;
      this.isSending = this.message.isSending;
      this.message.options = this.jsonParse(this.message.options);
      this.originalMessage = (
        this.message.message as MessageObject[]
      )[0]?.value;
      if (this.message.isSending !== this.previousStatusSending) {
        this.cdr.markForCheck();
        this.messageService.addEventForImage(this.elr);
      }
      this.checkEmail();
    }

    if (currentValue) {
      this.fileLists = this.message.files?.fileList?.sort(
        (a, b) => parseInt(b?.size, 10) - parseInt(a?.size, 10)
      );
      this.mediaLists = this.message.files?.mediaList?.filter(
        (media) => !(media.fileType.name.indexOf('audio') > -1)
      );
      this.audioLists = this.message.files?.mediaList?.filter(
        (media) => media.fileType.name.indexOf('audio') > -1
      );
    }

    if (!isEqual(currentValue, previousValue)) {
      this.isDraft = this.message.isDraft;
      this.checkStatusReadOfMessage();
      const { isSyncedAttachment, unhandledAttachmentCount } = this.message;
      this.isSyncedAttachment =
        isSyncedAttachment || unhandledAttachmentCount < 1;

      const messageIds = this.taskService.messageAttachmentUpdateIds?.value;
      if (messageIds?.includes(this.message?.id)) {
        this.taskService.messageAttachmentUpdateIds.next(
          messageIds.filter((id) => id !== this.message?.id)
        );
        this.htmlContent = mapThreeDotsForMessage({
          message:
            this.updatedMessage ||
            (this.message.message as MessageObject[])[0].value,
          id: this.message.id
        });
      }

      this.setSenderOfMessageValue();

      this.countMetaDataLength = this.countMetaData(
        this.message?.emailMetadata
      );
      if (this.countMetaDataLength > 1) {
        this.listItemDropdown.find(
          (item) => item.key === EButtonAction.REPLY_ALL
        ).hidden = false;
      }
      this.countAttachment = this.countAttachmentForMsg(this.message);
      this.expandLastMsg();
    }

    if (currentValue?.message?.[0]?.value) {
      this.showEmailQuote();
    }
    if (
      currentValue?.id &&
      this.conversationSummaryService.triggerSummaryCollapseMessage$.getValue()
        ?.messageId === this.message?.id &&
      this.isCollapseMess
    ) {
      this.isCollapseMess = false;
      this.showEmailQuote();
    }
  }

  setSenderOfMessageValue() {
    if (!this.message.emailMetadata?.from?.length) return;
    this.senderOfMessage = this.message.emailMetadata.from[0];

    if (this.senderOfMessage.userType === EUserPropertyType.MAILBOX) {
      this.senderOfMessage = {
        ...this.senderOfMessage,
        pmName: this.message.firstName || this.message.lastName,
        pmUserId: this.message.userId,
        isSender: true
      };
    }

    const senderOfMessageUserRole =
      this.contactTitleByConversationPropertyPipe.transform(
        this.senderOfMessage as unknown as IParticipantContact,
        {
          isNoPropertyConversation:
            this.currentConversation?.isTemporaryProperty,
          isMatchingPropertyWithConversation:
            this.senderOfMessage?.propertyId ===
            this.currentConversation?.propertyId,
          showOnlyRole: true,
          showFullContactRole: true,
          showCrmStatus: true
        }
      ) as EExcludedUserRole;

    const senderOfMessageUserName =
      this.contactTitleByConversationPropertyPipe.transform(
        this.senderOfMessage as unknown as IParticipantContact,
        {
          isNoPropertyConversation:
            this.currentConversation?.isTemporaryProperty,
          isMatchingPropertyWithConversation:
            this.senderOfMessage?.propertyId ===
            this.currentConversation?.propertyId,
          showOnlyName: true
        }
      );

    this.senderOfMessage = {
      ...this.senderOfMessage,
      senderRole: this.excludedUserRole.includes(senderOfMessageUserRole)
        ? ''
        : senderOfMessageUserRole,
      senderName: senderOfMessageUserName
    };
  }

  countAttachmentForMsg(message) {
    const count =
      message?.files?.fileList?.length +
      message?.files?.mediaList?.length +
      message?.files?.unSupportedList?.length;
    return count;
  }

  checkEmail() {
    return isEmail(this.message?.firstName) || isEmail(this.message?.lastName);
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.isDraftPage = this.router.url.includes(ERouterLinkInbox.MSG_DRAFT);
    this.taskDetailService.triggerShowMsgInfoDropdown.subscribe((item) => {
      if (item !== this.message?.id) {
        this.isShowBoxInfo = false;
      }
    });
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
    this.subscribeCurrentConversation();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((mailBoxId) => {
          if (mailBoxId) {
            this.currentMailBoxId = mailBoxId;
            return this.inboxService.listMailBoxs$;
          } else {
            return of(null);
          }
        })
      )
      .subscribe((listMailBoxs) => {
        if (listMailBoxs.length) {
          this.listMailBoxes = listMailBoxs;
          this.currentMailBox = listMailBoxs.find(
            (mailBox) => mailBox.id === this.currentMailBoxId
          );
        }
      });
    this.dropService.setChildConnector(this.fileList);
    this.connectedParent = [this.dropService.parentConnector];
    this.message.options = this.jsonParse(this.message.options);
    this.removeHighlightSelectedTopic();
    this.conversationService.listConversationByTask
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.conversationTrudiRespone = data.find((item) => item.trudiResponse);
        this.forwardButtons =
          this.conversationTrudiRespone?.trudiResponse?.data &&
          this.conversationTrudiRespone?.trudiResponse?.data[0]?.body?.button;
        this.buttonAction =
          this.conversationTrudiRespone?.trudiResponse?.data &&
          this.conversationTrudiRespone?.trudiResponse?.data[0]?.body?.button?.find(
            (button) => button.action === ForwardButtonAction.sendQuoteLandlord
          );
        this.messageSendQuote = this.buttonAction?.textForward;
      });
    this.conversationService.trudiResponseConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        // Handle after confirming at semi path
        this.conversationTrudiRespone = response;
        // Remove highlight selected topic after confirming
        if (
          this.conversationTrudiRespone?.trudiResponse?.type !==
          ETrudiType.super_happy_path
        ) {
          this.removeHighlightSelectedTopic();
        }
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((task) => {
        if (task) {
          this.headerTitle = task?.property?.streetline || 'No property';
          this.categoryType = task.trudiResponse?.setting?.categoryId;
          this.currentTask = task;
          this.isTaskType = task.taskType === TaskType.TASK;
          if (this.checkClearHighlightText()) {
            (this.message.message as MessageObject[])[0].value =
              this.originalMessage ||
              (this.message.message as MessageObject[])[0]?.value;
            this.removeHighlightSelectedTopic();
          }
          this.showMessageHasLinkedTask = task?.conversations?.some(
            (conversation) =>
              conversation.id === this.currentConversation?.id &&
              !!conversation.linkedTask
          );
        }
      });

    this.conversationService.selectedCategoryId
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((topic) => this.mapTopicToHighlightSelectedTopic(topic));

    this.bindShowContent();
    this.previousStatusSending = this.message.isSending;
    this.expandLastMsg();
    this.isPmSend = this.checkIsPmSend();
    this.messageReadStatus$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((isUnread) => {
          const body = {
            messageId: this.message.id,
            isMarkUnRead: isUnread
          };
          this.messageLoadingService.setLoading(true);
          return this.conversationService.changeMessageReadStatus(body);
        })
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          const { isMarkUnRead, isRead, conversationId, isSeen } = res;
          this.showUnreadButton(!isMarkUnRead);
          this.message.isMarkUnRead = isMarkUnRead;
          this.messageLoadingService.setLoading(false);
          this.conversationService.markCurrentConversationBS.next({
            conversationId,
            isRead,
            isSeen,
            option: isMarkUnRead
              ? EMessageMenuOption.UNREAD
              : EMessageMenuOption.READ
          });
          this.inboxService.setChangeUnreadData({
            currentMessageId: this.message.id,
            isMarkUnRead
          });
        }
      });
    this.collapseMessageItem();
    this.conversationService.markCurrentConversationBS
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        filter(Boolean)
      )
      .subscribe((res) => {
        if (!res) return;
        if (this.currentConversation.id === res.conversationId) {
          this.showUnreadButton(res.isSeen);
        }
      });
  }

  collapseMessageItem() {
    this.conversationSummaryService.triggerSummaryCollapseMessage$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (value?.messageId === this?.message?.id) {
          if (this.isCollapseMess) {
            this.isCollapseMess = false;
            this.showEmailQuote();
          }
        }
      });
  }

  subscribeCurrentConversation() {
    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((conversation) => {
        this.currentConversation = conversation;
        this.newConversationEmailName =
          this.newConversationEmailName &&
          formatNameHasEmail(this.currentConversation?.email);
        this.isHiddenPrimary = [
          EUserPropertyType.TENANT_PROSPECT,
          EUserPropertyType.OWNER_PROSPECT
        ].includes(this.currentConversation?.propertyType as EUserPropertyType);
        this.setSenderOfMessageValue();
      });
  }

  expandLastMsg() {
    this.isCollapseMess = !(this.lastItem || this.needToExpand);
    this.onCollapseMess.emit(this.isCollapseMess);
  }

  updateMessage(isLanguageTranslationDisabled: boolean) {
    const messageContent = this.message?.message as MessageObject[];
    const messageValue = messageContent?.find(
      (mes) => mes.type === 'text'
    )?.value;
    this.updatedMessage = setTranslatedContent(
      this.message?.languageCode,
      isLanguageTranslationDisabled,
      this.message?.messagesTranslate,
      messageValue
    );
  }

  bindShowContent() {
    if (isHtmlContent((this.message.message as MessageObject[])[0].value)) {
      this.isShowIframeContent = true;
    } else {
      this.isShowIframeContent = false;
    }
  }

  jsonParse(value) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  handleShowBoxInfo(msgId) {
    this.isShowBoxInfo = !this.isShowBoxInfo;
    this.taskDetailService.triggerShowMsgInfoDropdown.next(msgId);
  }

  collapseMess() {
    this.isCollapseMess = !this.isCollapseMess;
    this.onCollapseMess.emit(this.isCollapseMess);
    this.isShowBoxInfo = false;
    this.isShowDropdownMenu = false;
    if (!this.isCollapseMess) {
      this.showEmailQuote();
      this.htmlContent = mapThreeDotsForMessage({
        message:
          this.updatedMessage ||
          (this.message.message as MessageObject[])[0].value,
        id: this.message.id
      });
    }
  }

  handleEmitCarousel(event) {
    this.fileOnClicked.emit(event);
  }

  onDraggingText(item: string) {
    this.messageService.onMessageDragging(item);
  }

  onForward(item: FileMessage) {
    let type: IPeopleFromViaEmail['type'] =
      PeopleFromViaEmailType.SEND_LANDLORD;
    if (item.documentTypeId === '34db2b6c-5f88-4323-8dad-f0682838e5f4') {
      type = PeopleFromViaEmailType.SEND_INVOICE;
    }
    this.fileEmit.emit({ ...item, messageType: EMessageType.file });
    this.showSelectPeople.emit({ file: item, type });
  }

  drop(_event: CdkDragDrop<AgentFileProp[]>) {
    this.dropService.detectDropEnded(true);
  }

  mapTopicToHighlightSelectedTopic(topic: string) {
    if (!topic || !topic.length) {
      return;
    }

    const spansHTMLCollection =
      document.getElementsByClassName('highlight-keyword');
    let keywordDataHasTopics: KeywordIntent[] = [];

    this.removeHighlightSelectedTopic();
    this.listKeywordData.forEach((data) => {
      const dataTopic = data.intents.find((intent) => intent.id === topic);
      if (dataTopic) {
        keywordDataHasTopics.push(data);
      }
    });

    for (let i = 0; i < spansHTMLCollection.length; i++) {
      const keywordDataHasTopicIdx = keywordDataHasTopics.findIndex(
        (data) => data.keyword === spansHTMLCollection[i].textContent
      );
      if (keywordDataHasTopicIdx > -1) {
        spansHTMLCollection[i].classList.add('highlight-selected-keyword');
      }
    }
  }

  removeHighlightSelectedTopic() {
    const spansHTMLCollection =
      document.getElementsByClassName('highlight-keyword');
    for (let i = 0; i < spansHTMLCollection.length; i++) {
      spansHTMLCollection[i].classList.remove('highlight-selected-keyword');
    }
  }

  replaceRegexEmailUrl(message: string, id?: string) {
    if (!message) return '';
    const ignoreChar = ['<p', '<ol', '<ul', '<table', '<br', '<div'];
    if (ignoreChar.some((char) => message.includes(char))) return message;
    if (!id) {
      message = message.replace(/<|>/g, '');
    }
    return message;
  }

  getNewTaskAndInsertToList(taskId: string) {
    return this.taskService
      .getTaskById(taskId)
      .pipe(takeUntil(this.unsubscribe));
  }

  getDetectIntent(msg: string) {
    const { id, userId, propertyId } = this.conversationTrudiRespone;
    this.conversationService
      .getTrudiIntents(msg.substring(0, 256), id, userId, propertyId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.controlPanelService.triggerGetTrudiIntents.next(res);
        }
      });
  }

  checkClearHighlightText() {
    return (
      // after doing complete task at semi path flow
      !this.conversationTrudiRespone?.trudiResponse ||
      !this.conversationTrudiRespone?.trudiResponse?.type ||
      (this.currentTask.status === TaskStatusType.completed &&
        this.conversationTrudiRespone?.trudiResponse?.type?.length)
    );
  }

  isDeletedOrArchived(crmStatus: string): boolean {
    return crmStatus === 'DELETED' || crmStatus === 'ARCHIVED';
  }

  messageTrackBy(index: number) {
    return index;
  }

  onResend() {
    if (!this.isShowResendButton) return;

    this.isSending = true;
    this.isError = false;
    this.reSendEmitter.emit();
  }

  handleDropdownVisibleChange(e: boolean) {
    this.isShowDropdownMenu = e;
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowSendMsgModal = false;
        this.resetConfig();
        this.checkDraftMsg(event.data, event.draftMsgId);
        if (
          (event?.type !== ISendMsgType.SCHEDULE_MSG ||
            this.isReplyAction ||
            (event?.data as any).jobReminders[0]?.taskType === TaskType.TASK) &&
          !this.isDraftPage &&
          !event.isDraft
        ) {
          this.toastCustomService.handleShowToastMessSend(event);
        }
        if (
          event?.type === ISendMsgType.SCHEDULE_MSG &&
          (!this.isReplyAction || this.isDraftPage)
        ) {
          this.toastCustomService.handleShowToastForScheduleMgsSend(
            event,
            this.isDraftPage
              ? (event.data as any)?.jobReminders?.[0]?.taskType
              : undefined,
            this.isDraftPage
          );
        }
        this.isReplyAction = false;
        break;
      default:
        break;
    }
  }

  checkDraftMsg(data, draftMessageId) {
    if (
      (data.message?.isDraft && data.message?.replyToMessageId) ||
      (this.message?.isDraft &&
        !data.message?.isDraft &&
        !data.jobReminders?.length) ||
      this.draftMsg
    ) {
      this.updateDraftMsg.emit();
    }
    if (this.message?.isDraft && data.jobReminders?.length) {
      this.removeDraftMsg.emit(this.message.id);
    } else if (data.jobReminders?.length && draftMessageId) {
      this.removeDraftMsg.emit(draftMessageId);
    }
  }

  handleClickMenu() {
    this.aiSummaryFacadeService.setShowAITemplate(false);
  }

  handleReply() {
    if (!this.shouldHandleProcess()) {
      return;
    }
    this.isReplyAction = true;
    this.aiSummaryFacadeService.setShowAITemplate(false);
    if (!this.draftMsg) {
      if (this.isPmSend) {
        this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
          bcc: [],
          cc: [],
          to: this.message?.emailMetadata?.to || []
        };
      } else {
        this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
          bcc: [],
          cc: [],
          to: this.message?.emailMetadata?.from?.length
            ? this.message?.emailMetadata?.from
            : [
                {
                  email: this.message.email,
                  userId: this.message.userId,
                  firstName: this.message.firstName,
                  lastName: this.message.lastName,
                  propertyId:
                    this.currentConversation?.propertyId ||
                    this.currentTask?.property?.id,
                  userType: this.message.userType,
                  name: this.message.name,
                  userPropertyType: this.message.userPropertyType,
                  secondaryEmailId: null
                }
              ]
        };
      }
      this.setupReplyMessageConfig(this.message);
      this.openSendMsgModal();
    } else {
      this.handleEditDraft(this.draftMsg);
    }
  }

  filterCurrentMailBox(listUser) {
    return (
      listUser?.filter(
        (one) => one.email !== this.currentMailBox.emailAddress
      ) || []
    );
  }

  handleReplyAll() {
    this.isReplyAction = true;
    if (!this.draftMsg) {
      if (this.isPmSend) {
        const listPrefillTo = this.message?.emailMetadata?.to || [];
        this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
          bcc: [],
          cc: this.message?.emailMetadata?.cc.filter(
            (one) => !listPrefillTo.some((user) => user.email === one.email)
          ),
          to: listPrefillTo
        };
      } else {
        const listPrefillTo = this.message?.emailMetadata?.from?.length
          ? this.message?.emailMetadata?.from
          : [
              {
                email: this.message.email,
                userId: this.message.userId,
                firstName: this.message.firstName,
                lastName: this.message.lastName,
                propertyId:
                  this.currentConversation?.propertyId ||
                  this.currentTask?.property?.id,
                userType: this.message.userType,
                name: this.message.name,
                userPropertyType: this.message.userPropertyType,
                secondaryEmailId: null
              }
            ];

        const listPrefillCc = this.filterCurrentMailBox([
          ...this.message?.emailMetadata?.cc,
          ...this.message?.emailMetadata?.to
        ]).filter(
          (one) => !listPrefillTo.some((user) => user.email === one.email)
        );

        const listPrefillBcc = this.filterCurrentMailBox(
          this.message?.emailMetadata?.bcc
        ).filter(
          (one) =>
            !listPrefillTo.some((user) => user.email === one.email) &&
            !listPrefillCc.some((user) => user.email === one.email)
        );
        this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
          bcc: listPrefillBcc,
          cc: listPrefillCc,
          to: listPrefillTo
        };
      }
      this.setupReplyMessageConfig(this.message);
      this.isShowDropdownMenu = false;
      this.openSendMsgModal();
    } else {
      this.handleEditDraft(this.draftMsg);
    }
  }

  async openSendMsgModal() {
    const tasks = [
      {
        taskId: this.currentTask?.id,
        propertyId:
          this.currentConversation?.propertyId || this.currentTask?.property?.id
      }
    ];
    this.sendMsgModalConfig['inputs.selectedTasksForPrefill'] = tasks;
    this.sendMsgModalConfig['otherConfigs.disabledAutoSimilarReply'] = [
      EMPTY_MESSAGE,
      ''
    ].includes(this.message.textContent);

    this.handleClearSelected();
    this.isShowSendMsgModal = true;
    this.messageFlowService
      .openSendMsgModal(this.sendMsgModalConfig)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            this.onSent.emit(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.resetConfig();
            break;
        }
      });
  }

  checkIsPmSend() {
    const emailSender = this.senderOfMessage?.email || this.message.email;
    const isPmSend = this.listMailBoxes?.find(
      (item) => item?.emailAddress === emailSender
    );
    return isPmSend;
  }

  getTimestampAndSenderNameForQuote({
    firstName,
    lastName,
    createdAt
  }: IMessage) {
    if (!createdAt || (!firstName && !lastName)) return '';
    const timeStamp = this.agencyDateFormatService.formatTimezoneDate(
      createdAt,
      this.agencyDateFormatService.getDateFormat().DATE_AND_TIME_FORMAT_DAYJS
    );
    return `<p>${timeStamp} from ${combineNames(firstName, lastName)}</p></br>`;
  }

  handleReplyForward() {
    this.isReplyAction = false;
    this.setupForwardMessageConfig();
    this.listOfFiles = [
      ...this.mediaLists,
      ...this.fileLists,
      ...this.audioLists
    ];
    this.rawMsg = '';

    this.contactsList = (
      this.message?.options?.contacts as unknown as ISelectedReceivers[]
    )?.map((item) => ({ ...item, streetLine: item.address }));
    this.sendMsgModalConfig['body.replyQuote'] = `${
      this.getTimestampAndSenderNameForQuote(this.message) +
      (this.message.message as MessageObject[])[0].value
    }`;
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
    this.sendMsgModalConfig['inputs.rawMsg'] = this.rawMsg;
    this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
    this.openSendMsgModal();
  }

  handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
  }

  checkStatusReadOfMessage() {
    combineLatest([this.inboxService.changeUnreadData$])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([changeUnreadData]) => {
        if (!changeUnreadData) {
          this.showUnreadButton();
          return;
        }
        if (changeUnreadData.currentMessageId) {
          if (this.message.id === changeUnreadData?.currentMessageId) {
            this.showUnreadButton(!changeUnreadData.isMarkUnRead);
          }
        } else {
          this.message.isMarkUnRead = false;
          this.showUnreadButton();
        }
      });
  }

  showUnreadButton(showUnread: boolean = true) {
    this.listItemDropdown.forEach((item) => {
      switch (item.key) {
        case EButtonAction.MARK_AS_UNREAD:
          item.hidden = !showUnread;
          break;
        case EButtonAction.MARK_AS_READ:
          item.hidden = showUnread;
          break;
      }
    });
  }

  handleQuit() {
    this.isShowSendMsgModal = false;
    this.resetConfig();
  }

  setupReplyMessageConfig(message) {
    this.mailBoxShared = this.checkReceiverInListMailbox(
      this.listMailBoxes,
      message?.emailMetadata?.to?.concat(message?.emailMetadata?.cc)
    );
    this.rawMsg = '';
    this.sendMsgModalConfig['body.replyQuote'] = `${
      this.getTimestampAndSenderNameForQuote(this.message) +
      (this.message.message as MessageObject[])[0].value
    }`;
    this.sendMsgModalConfig['header.title'] = this.headerTitle;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Re: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['header.hideSelectProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.disabledTitle'] = true;
    this.sendMsgModalConfig['otherConfigs.isForwardConversation'] = true;
    this.sendMsgModalConfig['body.replyToMessageId'] = message.id;
    const toFieldData =
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList']?.to;
    this.sendMsgModalConfig['body.autoGenerateMessage'] = null;
    const companyMailbox = this.listMailBoxes.find(
      (mailbox) =>
        isMailboxCompany(mailbox) && mailbox?.status === EMailBoxStatus.ACTIVE
    );
    this.sendMsgModalConfig['body.prefillSender'] =
      message.userId === trudiUserId
        ? trudiUserId
        : this.mailBoxShared
        ? this.mailBoxShared?.userId
        : message.emailMetadata?.from?.[0]?.userId;
    this.sendMsgModalConfig['body.prefillSenderEmail'] = this.mailBoxShared
      ? this.mailBoxShared?.email
      : message.emailMetadata?.from?.[0]?.email;
    if (!this.isPmSend && toFieldData?.length > 0 && !message.isDraft) {
      this.sendMsgModalConfig['body.autoGenerateMessage'] = {
        receiverIds: toFieldData.map((receiver) => receiver.userId),
        description: ''
      };
    }
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] = this
      .isTaskType
      ? this.currentTask?.property?.isTemporary
        ? this.currentConversation?.propertyId
        : null
      : null;
    const replyMessageInTask = this.getReceiverInListMailbox(
      this.listMailBoxes,
      message?.emailMetadata?.from?.concat(
        message?.emailMetadata?.to,
        message?.emailMetadata?.cc
      )
    )?.map((mailBox) => mailBox?.emailAddress);
    this.sendMsgModalConfig['otherConfigs.replyMessageInTask'] = [
      ...replyMessageInTask,
      companyMailbox?.emailAddress
    ];
    this.sendMsgModalConfig['otherConfigs.replyMessage'] = message;
    this.sendMsgModalConfig['otherConfigs.isAutoPrefillDocument'] =
      this.isReplyAction;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReply'] =
      this.isTaskType || this.showMessageHasLinkedTask ? false : true;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReplyInTask'] =
      this.isTaskType || this.showMessageHasLinkedTask ? true : false;
    this.sendMsgModalConfig['otherConfigs.isShowGreetingContent'] = true;
  }

  checkReceiverInListMailbox(
    listMailBoxes: IMailBox[],
    listReceiver: IUserParticipant[]
  ) {
    return listReceiver?.find((receiver) =>
      listMailBoxes.some((mailBox) => {
        if (this.isTaskType || this.showMessageHasLinkedTask) {
          return (
            mailBox?.emailAddress === receiver?.email &&
            mailBox?.emailAddress === this.currentConversation?.mailBoxAddress
          );
        }
        return mailBox?.emailAddress === receiver?.email;
      })
    );
  }

  getReceiverInListMailbox(
    listMailBoxes: IMailBox[],
    listReceiver: IParticipant[]
  ) {
    return listMailBoxes?.filter((receiver) =>
      listReceiver?.some((mailBox) => mailBox?.email === receiver?.emailAddress)
    );
  }

  setupForwardMessageConfig() {
    this.sendMsgModalConfig = cloneDeep(
      this.isTaskType
        ? taskForwardConfigsButtonAction
        : defaultConfigsButtonAction
    );
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] = this
      .isTaskType
      ? this.currentTask?.property?.isTemporary
        ? this.currentConversation?.propertyId
        : null
      : null;
    this.sendMsgModalConfig['autoGenerateMessage'] = null;
    this.sendMsgModalConfig['header.title'] =
      this.isTaskType && !this.currentTask?.property?.isTemporary
        ? this.headerTitle
        : '';
    this.sendMsgModalConfig['header.hideSelectProperty'] =
      this.isTaskType && !this.currentTask?.property?.isTemporary;
    this.sendMsgModalConfig['header.isPrefillProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.isCreateMessageType'] =
      !this.isTaskType;
    this.sendMsgModalConfig['body.isFromInlineMsg'] = false;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Fwd: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['otherConfigs.isValidSigContentMsg'] = false;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReply'] = this
      .isTaskType
      ? false
      : true;
    this.sendMsgModalConfig['otherConfigs.isShowGreetingContent'] = true;
  }

  resetConfig() {
    this.sendMsgModalConfig = cloneDeep(defaultConfigsButtonAction);
    this.setupConfigContentMessage(this.message);
  }

  handleButton(event: { type: EButtonAction; show: boolean }) {
    this.listOfFiles = [];
    this.contactsList = [];
    if (event.show) {
      switch (event.type) {
        case EButtonAction.REPLY:
          this.handleReply();
          break;
        case EButtonAction.REPLY_ALL:
          this.handleReplyAll();
          break;
        case EButtonAction.FORWARD:
          this.handleReplyForward();
          break;
        default:
          break;
      }
    }
  }

  countMetaData(metaData) {
    return metaData?.to?.length + metaData?.cc?.length + metaData?.bcc?.length;
  }

  setupConfigContentMessage(message, isEditDraft = false) {
    const messageText = (message.message as MessageObject[])[0].value;
    const { msgContent, quote } = extractQuoteAndMessage(
      messageText || messageText === '' ? messageText : message.message || '',
      true
    );
    if (isEditDraft) {
      this.rawMsg = messageText;
      this.sendMsgModalConfig['body.replyQuote'] = null;
    } else {
      this.rawMsg = msgContent;
      this.sendMsgModalConfig['body.replyQuote'] = `${
        this.getTimestampAndSenderNameForQuote(this.message) + quote
      }`;
    }
  }

  handleEditDraft(message) {
    if (!this.shouldHandleProcess()) return;
    this.sendMsgModalConfig = {
      ...this.sendMsgModalConfig,
      'body.draftMessageId': message.id,
      'body.ticketId': this.currentConversation?.ticketId,
      'body.isReplyTicketOfConversation': message.isReplyTicketOfConversation,
      'body.prefillSender':
        message.userId === trudiUserId
          ? trudiUserId
          : message.emailMetadata?.from?.[0]?.userId,
      'body.prefillSenderEmail': message.emailMetadata?.from?.[0]?.email,
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
    this.sendMsgModalConfig['otherConfigs.filterSenderForReplyInTask'] =
      this.isTaskType || this.showMessageHasLinkedTask ? true : false;
    if (message.replyToMessageId) {
      this.isReplyAction = true;
      this.setupReplyMessageConfig(message);
      this.sendMsgModalConfig = {
        ...this.sendMsgModalConfig,
        'body.replyToMessageId': message.replyToMessageId
      };
    } else {
      this.isReplyAction = false;
      this.sendMsgModalConfig = {
        ...this.sendMsgModalConfig,
        'otherConfigs.filterSenderForReply': false,
        'otherConfigs.isCreateMessageType': false,
        'header.title':
          this.isTaskType && !this.currentTask?.property?.isTemporary
            ? this.headerTitle
            : '',
        autoGenerateMessage: null,
        'header.isPrefillProperty': true,
        'body.isFromInlineMsg': true,
        'body.prefillTitle': this.message.title,
        'header.hideSelectProperty':
          this.isTaskType && !this.currentTask?.property?.isTemporary,
        'otherConfigs.conversationPropertyId': this.isTaskType
          ? this.currentTask?.property?.isTemporary
            ? this.currentConversation?.propertyId
            : null
          : this.currentConversation?.propertyId
      };
    }

    this.listOfFiles = [
      ...(message.files?.fileList || []),
      ...(message.files?.mediaList || [])
    ];
    this.setupConfigContentMessage(message, true);

    this.contactsList = (
      message?.options?.contacts as unknown as ISelectedReceivers[]
    )?.map((item) => ({ ...item, streetLine: item.address }));
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
    this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
    this.sendMsgModalConfig['inputs.rawMsg'] = this.rawMsg;
    this.sendMsgModalConfig['otherConfigs.isShowGreetingContent'] = true;
    this.openSendMsgModal();
  }

  handleDeleteDraft() {
    this.deletingDraft = true;
    this.conversationService
      .deleteDraftMsg({
        draftMessageId: this.message.id,
        taskId: this.currentTask.id,
        conversationId: this.message.conversationId,
        isFromDraftFolder: this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT)
      })
      .pipe(finalize(() => (this.deletingDraft = false)))
      .subscribe(() => {
        this.removeDraftMsg.emit(this.message.id);
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailBoxId
        );
      });
  }

  handleClickEmail(item) {
    if (item.userId === trudiUserId || this.message?.userId === trudiUserId) {
      return;
    }
    item.sendFromUserType = this.message?.userType;

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      item as unknown as UserProperty
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    clearTimeout(this.heightCalculationTime);
    this.messageService.removeEventForImage(this.elr);
  }
  @HostListener('keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    if (
      !event.target ||
      !(event.target instanceof Element) ||
      event.target.closest('button')
    ) {
      event.stopPropagation();
    } else {
      this.collapseMess();
    }
  }
}
