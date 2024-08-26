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
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskService } from '@services/task.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import {
  IPeopleFromViaEmail,
  MessageObject
} from '@shared/types/message.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import { ConversationService } from '@services/conversation.service';
import { TaskItem } from '@shared/types/task.interface';
import { defaultConfigsButtonAction } from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { SendMesagePopupOpenFrom } from '@shared/enum/share.enum';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { EButtonCommonKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { EMessageComeFromType, EMessageType } from '@shared/enum';

enum MessageType {
  text = 'text',
  url = 'url'
}

@Component({
  selector: 'sms-message-default',
  templateUrl: './sms-message-default.component.html',
  styleUrl: './sms-message-default.component.scss'
})
export class SmsMessageDefaultComponent
  implements OnChanges, OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('textContain') private textContain: ElementRef;
  public trudiUserId = trudiUserId;
  @Input()
  public message: any | null = null;
  @Input() public isSending: boolean = false;
  @Input() isFromAIAssistant: boolean = false;
  @Input() isExternalPropertyContact: boolean = false;
  @Input() userVerified: boolean = false;
  @Output() updateDraftMsg = new EventEmitter();
  @Output() showSelectPeople = new EventEmitter<IPeopleFromViaEmail>();
  @Output() fileEmit = new EventEmitter();
  public messageType = MessageType;
  private destroy$ = new Subject<void>();
  updatedMessage: string;
  isLanguageTranslationDisabled: boolean = false;
  readonly EUserPropertyType = EUserPropertyType;
  public isShowDropdownMenu: boolean = false;
  public headerTitle: string = '';
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
  @Input() visibleMessageText = true;
  public isSelectionAddPolicy = false;
  public isFileType: boolean;

  constructor(
    private userService: UserService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private messageService: MessageService,
    private elementRef: ElementRef,
    private taskService: TaskService,
    public inboxService: InboxService,
    private conversationService: ConversationService,
    private PreventButtonService: PreventButtonService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly voicemailInboxService: VoiceMailService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.message.options = this.jsonParse(this.message.options);
    if (changes['message']?.currentValue) {
      this.handlePrefillMessage(changes['message']?.currentValue);
    }
  }

  checkToShowAddPolicy(message) {
    this.isSelectionAddPolicy =
      message.userId !== this.trudiUserId &&
      message.messageType === EMessageType.defaultText;
  }

  handlePrefillMessage(message) {
    this.checkToShowAddPolicy(message);
    switch (this.message.messageType) {
      case EMessageType.file:
        this.visibleMessageText === true;
        this.updatedMessage = this.generateTemplateShortLinkAttachment(message);
        this.isFileType = true;
        break;
      default:
        this.formatMessageTranslateHasLink();
        this.setSenderOfMessageValue();
        this.isFileType = false;
        break;
    }
  }

  generateTemplateShortLinkAttachment(message) {
    const link = message?.file?.shortLink || message?.file?.mediaLink;
    return link ? `<a target="_blank" href="${link}">${link}</a>` : '';
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

  formatStringLink(input: string): string {
    if (!input) return '';
    const urlRegex =
      /(?<!<a\s+href="[^"]*">[^<]*)(https?:\/\/(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(?:\/[^#\s<]+)?)(?![^<]*<\/a>)(?<!\.)/g;
    const anchorTagRegex = /<a\s+(?:[^>]*?\s+)?href="/i;

    return input.replace(urlRegex, function (url) {
      // Check if the URL is already inside an <a> tag
      // If it's already an <a> tag, keep it as is
      if (anchorTagRegex.test(url)) {
        return url;
      }

      let leftParen = '',
        rightParen = '';
      if (url.startsWith('(') && url.endsWith(')')) {
        leftParen = '(';
        rightParen = ')';
        url = url.slice(1, -1);
      }

      return `${leftParen}<a href="${url}" target="_blank">${url}</a>${rightParen}`;
    });
  }

  formatMessageTranslateHasLink() {
    this.message = {
      ...this.message,
      message: this.message?.message?.map((item) => {
        return {
          ...item,
          value: this.formatStringLink(item?.value)
        };
      })
    };

    this.updatedMessage = this.formatStringLink(this.updatedMessage);
  }

  subscribeCurrentConversation() {
    combineLatest([
      this.conversationService.currentConversation,
      this.voicemailInboxService.currentVoicemailConversation$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([conversation, currentVoicemailConversation]) => {
        this.currentConversation = currentVoicemailConversation || conversation;
        this.setSenderOfMessageValue();
      });
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

  updateMessage(isLanguageTranslationDisabled: boolean, messageValue: string) {
    this.updatedMessage = setTranslatedContent(
      this.message?.languageCode,
      isLanguageTranslationDisabled,
      this.message?.messagesTranslate,
      messageValue
    );
    this.updatedMessage = this.formatStringLink(this.updatedMessage);
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
