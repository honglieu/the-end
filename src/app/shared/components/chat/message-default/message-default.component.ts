import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { trudiUserId } from '@services/constants';
import { UserService } from '@services/user.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import {
  replaceUrlWithAnchorTag,
  setTranslatedContent
} from '@shared/feature/function.feature';
import { MessageService } from '@services/message.service';
import { Subject, combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { EExcludedUserRole, EUserPropertyType } from '@shared/enum/user.enum';
import { EButtonAction } from '@/app/task-detail/interfaces/task-detail.interface';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskService } from '@services/task.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import { MessageObject } from '@shared/types/message.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import { ConversationService } from '@services/conversation.service';
import { TaskItem } from '@shared/types/task.interface';
import {
  defaultConfigsButtonAction,
  taskForwardConfigsButtonAction
} from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { SendMesagePopupOpenFrom } from '@shared/enum/share.enum';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { cloneDeep } from 'lodash-es';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonCommonKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { EConversationType, EMessageComeFromType } from '@shared/enum';

enum MessageType {
  text = 'text',
  url = 'url'
}

@Component({
  selector: 'app-message-default',
  templateUrl: './message-default.component.html',
  styleUrls: ['./message-default.component.scss']
})
export class MessageDefaultComponent
  implements OnChanges, OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('textContain') private textContain: ElementRef;
  public trudiUserId = trudiUserId;
  @Input()
  public message: any | null = null;
  @Input() public isSending: boolean = false;
  @Input() isExternalPropertyContact: boolean = false;
  @Input() showAvatar: boolean = true;
  @Output() updateDraftMsg = new EventEmitter();
  public messageType = MessageType;
  private destroy$ = new Subject<void>();
  updatedMessage: string;
  isLanguageTranslationDisabled: boolean = false;
  readonly EUserPropertyType = EUserPropertyType;
  public isShowDropdownMenu: boolean = false;
  public headerTitle: string = '';
  public listItemDropdown = [
    {
      key: EButtonAction.REPLY,
      icon: 'replyTextEditor',
      text: 'Reply',
      action: () => {
        if (!this.shouldHandleProcess()) return;
        this.handleReply();
      },
      hidden: false
    },
    {
      key: EButtonAction.FORWARD,
      icon: 'cornerUpRight',
      text: 'Forward',
      action: () => {
        if (!this.shouldHandleProcess()) return;
        this.handleReplyForward();
      },
      hidden: false
    }
  ];
  public sendMsgModalConfig: any = JSON.parse(
    JSON.stringify(defaultConfigsButtonAction)
  );
  public currentTask: TaskItem;
  public isShowSendMsgModal: boolean = false;
  readonly TaskType = TaskType;
  public readonly typeMessage = ETypeMessage;
  public readonly taskStatusType = TaskStatusType;
  public currentMailBoxId: string;
  public currentMailBox: IMailBox;
  public currentConversation: UserConversation;
  public isTrudiSender: boolean;
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public senderOfMessage: IUserParticipant;
  public excludedUserRole = [
    EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
    EExcludedUserRole.UNRECOGNIZED,
    EExcludedUserRole.EMPTY
  ];
  public visibleMessageText = true;
  public triggerAddPolicy = false;

  constructor(
    private userService: UserService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private messageService: MessageService,
    private elementRef: ElementRef,
    private taskService: TaskService,
    public inboxService: InboxService,
    private conversationService: ConversationService,
    private messageFlowService: MessageFlowService,
    private PreventButtonService: PreventButtonService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly voicemailInboxService: VoiceMailService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.message.options = this.jsonParse(this.message.options);
    if (changes['message']?.currentValue) {
      this.setSenderOfMessageValue();
    }
  }

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.destroy$),
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
        if (listMailBoxs?.length) {
          this.currentMailBox = listMailBoxs.find(
            (mailBox) => mailBox.id === this.currentMailBoxId
          );
        }
      });
    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((task) => {
        if (task) {
          this.headerTitle = task?.property?.streetline || 'No property';
          this.currentTask = task;
        }
      });
    this.subscribeCurrentConversation();
    this.sendMsgModalConfig['body.replyQuote'] = `${
      (this.message.message as MessageObject[])[0].value
    }`;
    this.setVisibleMessageText();
  }

  subscribeCurrentConversation() {
    combineLatest([
      this.conversationService.currentConversation,
      this.voicemailInboxService.currentVoicemailConversation$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([conversation, currentVoicemailConversation]) => {
        this.currentConversation = currentVoicemailConversation || conversation;
        this.checkIsFromAppMessageLogOrVoiceMail(this.currentConversation);
        this.setSenderOfMessageValue();
      });
  }

  checkIsFromAppMessageLogOrVoiceMail(conversation: UserConversation) {
    this.triggerAddPolicy =
      !(conversation?.conversationType === EConversationType.VOICE_MAIL) &&
      this.message?.userId !== trudiUserId;
  }

  jsonParse(value) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  ngAfterViewInit() {
    const phoneNumbers = document.getElementsByClassName('phone-number');
    for (var i = 0; i < phoneNumbers.length; i++) {
      let html = phoneNumbers[i].innerHTML;
      if (html && html.length) {
        html = this.phoneNumberFormatPipe.transform(html);
        phoneNumbers[i].innerHTML = html;
      }
    }

    this.convertTextToHyperlink();
    this.messageService.addEventForImage(this.elementRef);
  }

  handleDropdownVisibleChange(e: boolean) {
    this.isShowDropdownMenu = e;
  }

  handleReply() {
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
              userPropertyType: this.message.userPropertyType
            }
          ]
    };
    this.setupReplyMessageConfig();
    this.openSendMsgModal();
  }

  handleReplyForward() {
    const isTaskType = this.currentTask?.taskType === TaskType.TASK;
    this.sendMsgModalConfig = cloneDeep(
      isTaskType ? taskForwardConfigsButtonAction : defaultConfigsButtonAction
    );
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] = isTaskType
      ? this.currentTask?.property?.isTemporary
        ? this.currentConversation?.propertyId
        : null
      : null;
    this.sendMsgModalConfig['autoGenerateMessage'] = null;
    this.sendMsgModalConfig['header.title'] =
      isTaskType && !this.currentTask?.property?.isTemporary
        ? this.headerTitle
        : '';
    this.sendMsgModalConfig['header.hideSelectProperty'] =
      isTaskType && !this.currentTask?.property?.isTemporary;
    this.sendMsgModalConfig['header.isPrefillProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.isCreateMessageType'] = !isTaskType;
    this.sendMsgModalConfig['body.isFromInlineMsg'] = false;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Fwd: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['otherConfigs.isValidSigContentMsg'] = false;
    this.sendMsgModalConfig['body.replyQuote'] = `${
      (this.message.message as MessageObject[])[0].value
    }`;
    this.openSendMsgModal();
  }

  handleQuit() {
    this.isShowSendMsgModal = false;
    this.resetConfig();
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.resetConfig();
        this.checkDraftMsg(event.data);
        this.isShowSendMsgModal = false;
        break;
      default:
        break;
    }
  }

  checkDraftMsg(data) {
    if (data.message?.isDraft) {
      this.updateDraftMsg.emit();
    }
  }

  resetConfig() {
    this.sendMsgModalConfig = JSON.parse(
      JSON.stringify(defaultConfigsButtonAction)
    );
    this.sendMsgModalConfig['body.replyQuote'] = `${
      (this.message.message as MessageObject[])[0].value
    }`;
  }

  setupReplyMessageConfig() {
    const isTaskType = this.currentTask?.taskType === TaskType.TASK;
    const toFieldData =
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList']?.to;
    this.sendMsgModalConfig['header.title'] = this.headerTitle;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Re: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['header.hideSelectProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.disabledTitle'] = true;
    this.sendMsgModalConfig['otherConfigs.isForwardConversation'] = true;
    this.sendMsgModalConfig['body.replyToMessageId'] = this.message.id;
    this.sendMsgModalConfig['body.autoGenerateMessage'] = null;
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] = isTaskType
      ? this.currentTask?.property?.isTemporary
        ? this.currentConversation?.propertyId
        : null
      : null;
    if (toFieldData?.length > 0) {
      this.sendMsgModalConfig['body.autoGenerateMessage'] = {
        receiverIds: toFieldData.map((receiver) => receiver.userId),
        description: ''
      };
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
    this.messageFlowService
      .openSendMsgModal(this.sendMsgModalConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.resetConfig();
            break;
        }
      });
  }

  updateMessage(isLanguageTranslationDisabled: boolean, messageValue: string) {
    this.updatedMessage = setTranslatedContent(
      this.message?.languageCode,
      isLanguageTranslationDisabled,
      this.message?.messagesTranslate,
      messageValue
    );
  }

  convertTextToHyperlink() {
    if (this.textContain && this.textContain.nativeElement) {
      const paragraph = this.textContain.nativeElement as HTMLParagraphElement;

      paragraph.innerHTML = replaceUrlWithAnchorTag(paragraph.innerHTML);
      // paragraph.innerHTML = shortenLinkText(paragraph.innerHTML);

      const anchors = paragraph.querySelectorAll('a');
      anchors.forEach((anchor: HTMLAnchorElement) => {
        if (!anchor.getAttribute('target')) {
          anchor.setAttribute('target', '_blank');
        }
      });
    }
  }

  getAvatar(userType: string, userId: string) {
    if (
      userType === 'AGENT' ||
      userId === this.userService.selectedUser.value.id
    ) {
      return userId === this.trudiUserId ? 'trudi-avatar' : 'admin-avatar';
    } else {
      return 'user-avatar';
    }
  }

  openWebsite(link: string) {
    if (!link) {
      return;
    }
    window.open(link, '_blank');
  }

  onClickMsg(event) {
    const e = event as PointerEvent;
    if (e && e.target && e.target) {
      const target = e.target as HTMLDivElement;
      const targetClass = target.className;
      if (targetClass && targetClass.length && targetClass === 'website') {
        target.addEventListener('click', (e: Event) => {
          e.stopPropagation();
          this.openWebsite(target.textContent?.toString().toLowerCase());
        });
        target.click();
      }
    }
  }

  messageTrackBy(index: number) {
    return index;
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonCommonKey.EMAIL_ACTIONS,
      EButtonType.COMMON
    );
  }

  setSenderOfMessageValue() {
    this.message.options = this.jsonParse(this.message.options);

    const {
      emailMetadata,
      email,
      userId,
      firstName,
      lastName,
      userType,
      name,
      userPropertyType,
      senderType
    } = this.message || {};

    const { propertyId } = this.currentConversation || {};

    this.senderOfMessage = emailMetadata?.from?.length
      ? emailMetadata.from[0]
      : ({
          email,
          userId,
          firstName,
          lastName,
          propertyId,
          userType,
          name,
          userPropertyType
        } as unknown as IUserParticipant);

    this.isTrudiSender = senderType === SendMesagePopupOpenFrom.trudi;
  }

  handleClickAvatar(event: MouseEvent) {
    event.stopPropagation();
    const { userType: senderUserType, email: senderEmail } =
      this.senderOfMessage || {};
    const {
      createdFrom,
      fromPhoneNumber,
      creator,
      userType: messageUserType
    } = this.message || {};
    const { email: conversationEmail } = this.currentConversation || {};

    const dataUser = {
      ...this.senderOfMessage,
      email: senderEmail || creator?.email || conversationEmail,
      createdFrom: createdFrom,
      fromPhoneNumber: fromPhoneNumber,
      userType: senderUserType || messageUserType
    };

    const isMailboxOrLeadType = [
      EUserPropertyType.LEAD,
      EUserPropertyType.MAILBOX
    ].includes((senderUserType || messageUserType) as EUserPropertyType);

    if (
      isMailboxOrLeadType &&
      [EMessageComeFromType.APP].includes(createdFrom)
    ) {
      dataUser.email = creator?.email;
      dataUser.userId = creator?.id;
    }

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
  setVisibleMessageText() {
    const message = this.message?.message;
    const isDefaultMessage =
      (message.length === 1 && message[0].value === '<p></p>') ||
      message.length < 1;
    this.visibleMessageText = !(
      isDefaultMessage && !this.message.messagesTranslate
    );
  }
  ngOnDestroy() {
    this.messageService.removeEventForImage(this.elementRef);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
