import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { NavigationEnd, Params, Router } from '@angular/router';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  Overlay,
  ScrollStrategy
} from '@angular/cdk/overlay';
import { TaskService } from '@services/task.service';
import { TaskType } from '@shared/enum/task.enum';
import { Subject, filter, combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '@services/shared.service';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import {
  EReminderFilterParam,
  ReminderMessageType,
  StatusReminder
} from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { IMessageReminder } from '@/app/dashboard/modules/inbox/interfaces/reminder-message.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { MessageApiService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-api.service';
import { defaultConfigsButtonAction } from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { cloneDeep } from 'lodash-es';
import { EPropertyStatus } from '@shared/enum';
import {
  ListReminderDay,
  listSelectReminderMe
} from '@shared/types/reminders.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { trudiUserId } from '@services/constants';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';

@Component({
  selector: 'message-reminder',
  templateUrl: './message-reminder.component.html',
  styleUrls: ['./message-reminder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageReminderComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(CdkConnectedOverlay) cdkConnectedOverlay: CdkConnectedOverlay;
  @ViewChild(CdkOverlayOrigin) triggerReminderMe: CdkOverlayOrigin;
  @Input() message: IMessageReminder;
  @Input() isShowSendMsgModal: boolean = false;
  @Input() selectedTasks: ITasksForPrefillDynamicData[] = [];
  @Input() queryParam: Params;
  @Input() isIgnore: boolean;
  @Input() indexMessage: number;
  public sendMsgModalConfig: any = cloneDeep(defaultConfigsButtonAction);

  readonly TaskType = TaskType;
  readonly ReminderMessageType = ReminderMessageType;
  readonly StatusReminder = StatusReminder;
  readonly EPropertyStatus = EPropertyStatus;

  public isConsole: boolean;
  public unsubscribe = new Subject<void>();
  public isRmEnvironment: boolean = false;
  public senderOfMessage: IUserParticipant = null;
  public currentMailBoxId: string;
  public currentMailBox: IMailBox;
  public scrollStrategy: ScrollStrategy;
  public search: string = '';
  public listReceiver = [];
  public isDisconnected: boolean = false;
  public teamMembers: number = 0;

  private isPmSend: boolean = false;
  private timeoutRef: NodeJS.Timeout = null;
  private timeoutRef2: NodeJS.Timeout = null;
  public draftMsg = null;
  public isLoadingQuickReply: boolean = false;
  public isShowDropdown: boolean = false;
  public listReminderMe: ListReminderDay[] = listSelectReminderMe;
  public maxWidthInfo = 0;
  public draftUpdating: boolean = false;
  public listMailBoxes: IMailBox[] = [];
  public mailBoxShared: IUserParticipant;

  constructor(
    public taskService: TaskService,
    public readonly sharedService: SharedService,
    private inboxService: InboxService,
    private companyService: CompanyService,
    private agencyService: AgencyService,
    private router: Router,
    private reminderMessageService: ReminderMessageService,
    private toastCustomService: ToastCustomService,
    private toastService: ToastrService,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    public mailboxSettingService: MailboxSettingService,
    private messageApiService: MessageApiService,
    private elr: ElementRef
  ) {
    this.router.events
      .pipe(
        takeUntil(this.unsubscribe),
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        if (this.isOpen) {
          this.isOpen = false;
        }
      });
    this.scrollStrategy = this.overlay.scrollStrategies.close();
  }

  isOpen = false;
  private isHoveringOverlay = false;

  openPopoverMessage() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    this.timeoutRef2 = setTimeout(() => {
      if (!this.isOpen) {
        this.isOpen = true;
        this.cdr.markForCheck();
      }
    }, 500);
  }

  overlayEnter() {
    this.isHoveringOverlay = true;
  }

  overlayLeave() {
    this.isHoveringOverlay = false;
    this.maybeCloseOverlay();
  }

  maybeCloseOverlay() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    this.timeoutRef = setTimeout(() => {
      if (!this.isHoveringOverlay) {
        clearTimeout(this.timeoutRef2);
        this.isOpen = false;
        this.cdr.markForCheck();
      }
    }, 10);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']?.currentValue) {
      this.senderOfMessage = this.message.emailMetaData?.from?.[0];
      this.message = {
        ...this.message,
        id: this.message.taskId
      };
      this.listReceiver = this.message.emailMetaData?.to?.concat(
        this.message?.emailMetaData?.cc,
        this.message?.emailMetaData?.bcc
      );
    }

    if (changes['queryParam']?.currentValue) {
      this.search = this.queryParam[EReminderFilterParam.SEARCH];
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((agency) => {
        if (agency) {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(agency);
        }
      });
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
    this.isPmSend = this.checkIsPmSend();
    this.subscribeMailboxSettings();
    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.sendMsgModalConfig['footer.buttons.disableSendBtn'] = [
          isArchiveMailbox,
          isDisconnectedMailbox
        ].includes(true);
      });
    this.setWidthPopover();
  }

  setWidthPopover() {
    const width =
      this.elr.nativeElement.querySelector('.msg-reminder-item-block')
        ?.clientWidth || 0;
    this.maxWidthInfo = (width / 100) * 60;
  }

  public getDraftMsg() {
    return this.messageApiService.getDraftMessage(this.message.messageId).pipe(
      takeUntil(this.unsubscribe),
      switchMap((draftMsg) => {
        return draftMsg ? of(draftMsg) : of(null);
      })
    );
  }

  subscribeMailboxSettings() {
    this.mailboxSettingService.mailboxSetting$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailboxSettings) => {
        this.teamMembers = mailboxSettings?.teamMembers;
      });
  }

  checkIsPmSend(): boolean {
    const emailSender = this.senderOfMessage?.email;
    const isPmSend = this.currentMailBox?.emailAddress === emailSender;
    return isPmSend;
  }

  handleToggleIgnore(value?: ListReminderDay) {
    if (this.isShowDropdown) {
      this.isShowDropdown = false;
    }
    const payload = {
      messageId: this.message.messageId,
      status: this.message.isIgnoreMessage
        ? StatusReminder.UN_IGNORE
        : StatusReminder.IGNORE,
      ignoreTime: !this.message.isIgnoreMessage
        ? value
          ? value?.minutes
          : 0
        : undefined
    };
    const templateIndex = this.indexMessage;
    const messageItem = this.message;
    this.reminderMessageService
      .updateStatusMessageReminder(payload)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((statusMessageReminder) => {
        if (!statusMessageReminder) return;
        this.reminderMessageService.triggerIgnoreMessage$.next({
          messageItem: messageItem,
          undoMessage: false
        });
        let dataToastUndoReminder = {
          title: 'Reminder ignored'
        };
        if (this.isIgnore) {
          dataToastUndoReminder = {
            title: this.message.isIgnoreMessage
              ? 'Reminder unignored'
              : 'Reminder ignored'
          };
        }
        this.toastCustomService.setDataUndoReminderMsg({
          messageItem: messageItem,
          isIgnore: this.isIgnore,
          indexMessage: templateIndex,
          ignoreTime: messageItem?.ignoreTime ?? 0,
          ignoreDate: messageItem?.ignoreDate
        });
        this.toastService.clear();
        this.toastCustomService.openToastCustom(
          dataToastUndoReminder,
          true,
          EToastCustomType.SUCCESS_WITH_UNDO_BTN_REMINDER
        );
      });
  }

  navigateToMessageDetail() {
    if (this.message.taskType === TaskType.MESSAGE) {
      this.router.navigate([], {
        queryParams: {
          taskId: this.message.taskId,
          conversationId: this.message.conversationId,
          reminderType: null
        },
        queryParamsHandling: 'merge'
      });
      this.reminderMessageService.triggerGoToMessage$.next(true);
    }
    if (this.message.taskType === TaskType.TASK) {
      this.router.navigate(
        ['dashboard', 'inbox', 'detail', this.message.taskId],
        {
          queryParams: {
            type: 'TASK',
            conversationId: this.message.conversationId,
            ...this.queryParam,
            tab: null
          },
          queryParamsHandling: 'merge'
        }
      );
    }
  }

  setupReplyMessageConfig(message) {
    this.sendMsgModalConfig['body.replyQuote'] = this.message?.hasDraftMessage
      ? message.message
      : message?.textContent;
    this.sendMsgModalConfig['header.title'] =
      message?.property?.streetline || 'No property';
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Re: ' +
      (!this.message?.hasDraftMessage
        ? message?.title || ''
        : message?.conversationTitle || '');
    this.sendMsgModalConfig['header.hideSelectProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.disabledTitle'] = true;
    this.sendMsgModalConfig['header.isPrefillProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] =
      message?.property?.id;
    this.sendMsgModalConfig['otherConfigs.isForwardConversation'] = true;
    this.sendMsgModalConfig['body.replyToMessageId'] = message?.messageId;
    this.sendMsgModalConfig['body.replyConversationId'] =
      this.message.conversationId;
    this.sendMsgModalConfig['body.taskReplyId'] = this.message.taskId;
    const toFieldData =
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList']?.to;
    this.sendMsgModalConfig['body.autoGenerateMessage'] = null;
    if (!this.message.hasDraftMessage && toFieldData?.length > 0) {
      this.sendMsgModalConfig['body.autoGenerateMessage'] = {
        receiverIds: toFieldData.map((receiver) => receiver.userId),
        description: '',
        isFollowUpReply:
          this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
          ReminderMessageType.FOLLOW_UP
      };
    }
    const mailBoxShared = this.checkReceiverInListMailbox(
      this.listMailBoxes,
      message?.emailMetadata?.to
    );
    const isTaskType = this.message?.taskType === TaskType.TASK;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReply'] = isTaskType
      ? false
      : true;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReplyInTask'] =
      isTaskType ? true : false;
    this.sendMsgModalConfig['body.prefillSender'] =
      message.userId === trudiUserId
        ? trudiUserId
        : mailBoxShared
        ? mailBoxShared?.userId
        : message.emailMetadata?.from?.[0]?.userId;
    this.sendMsgModalConfig['body.prefillSenderEmail'] = mailBoxShared
      ? mailBoxShared?.email
      : message.emailMetadata?.from?.[0]?.email;
    this.sendMsgModalConfig['body.typeSendMsg'] =
      message?.sendOptions?.type || SendOption.Send;
    this.sendMsgModalConfig['otherConfigs.scheduleDraft'] =
      message?.sendOptions?.time;
  }

  checkReceiverInListMailbox(
    listMailBoxes: IMailBox[],
    listReceiver: IUserParticipant[]
  ) {
    return listReceiver?.find((receiver) =>
      listMailBoxes.some((mailBox) => mailBox?.emailAddress === receiver?.email)
    );
  }

  setupPrefillSenderReceiver() {
    if (this.isPmSend) {
      const listPrefillTo = this.message?.emailMetaData?.to || [];
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
        bcc: [],
        cc: this.message?.emailMetaData?.cc.filter(
          (one) => !listPrefillTo.some((user) => user.email === one.email)
        ),
        to: listPrefillTo
      };
    } else {
      const listPrefillTo = this.message?.emailMetaData?.from?.length
        ? this.message?.emailMetaData?.from
        : [];

      const listPrefillCc = this.filterCurrentMailBox([
        ...(this.message?.emailMetaData?.cc || []),
        ...(this.message?.emailMetaData?.to || [])
      ]).filter(
        (one) => !listPrefillTo.some((user) => user.email === one.email)
      );

      const listPrefillBcc = this.filterCurrentMailBox(
        this.message?.emailMetaData?.bcc
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
    this.sendMsgModalConfig = cloneDeep(this.sendMsgModalConfig);
    this.setupReplyMessageConfig(this.message);
  }

  handleReplyMsg() {
    this.draftUpdating = true;
    this.isLoadingQuickReply = true;
    this.getDraftMsg()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.draftUpdating = false;
        this.isOpen = false;
        this.isLoadingQuickReply = false;
        this.cdr.markForCheck();
        if (!res) {
          this.setupPrefillSenderReceiver();
        } else {
          this.handleEditDraft2(res);
        }
        this.reminderMessageService.triggerMessageItemReminder$.next({
          messageReminder: this.message,
          messageDraft: res,
          sendMsgModalConfig: this.sendMsgModalConfig
        });
      });
  }

  handleEditDraft2(message) {
    this.sendMsgModalConfig = {
      ...this.sendMsgModalConfig,
      'body.draftMessageId': message.id,
      'body.prefillSender':
        message.userId === trudiUserId
          ? trudiUserId
          : message.emailMetadata?.from?.[0]?.userId,
      'body.prefillToCcBccReceiversList': {
        bcc: message?.emailMetadata.bcc,
        cc: message?.emailMetadata.cc,
        to: message?.emailMetadata.to
      },
      'otherConfigs.scheduleDraft': message?.sendOptions?.time,
      'body.typeSendMsg': message?.sendOptions?.type || SendOption.Send
    };
    if (message.replyToMessageId) {
      this.setupReplyMessageConfig(message);
      this.sendMsgModalConfig = {
        ...this.sendMsgModalConfig,
        'body.replyToMessageId': message.replyToMessageId
      };
    }
    const contactsList = message?.options
      ?.contacts as unknown as ISelectedReceivers[];
    this.sendMsgModalConfig['inputs.listOfFiles'] = [...message.file];
    this.sendMsgModalConfig['inputs.listContactCard'] = contactsList;
    this.sendMsgModalConfig['inputs.rawMsg'] = message.message;
  }

  filterCurrentMailBox(listUser) {
    return (
      listUser?.filter(
        (one) => one.email !== this.currentMailBox.emailAddress
      ) || []
    );
  }

  updateUI() {
    this.cdr.markForCheck();
  }

  handleAssignAgentsSelectedClick(value) {
    this.reminderMessageService.assignToAgentMessageReminder$.next(value?.task);
  }

  recalculatePosition() {
    if (this.cdkConnectedOverlay && this.cdkConnectedOverlay.overlayRef) {
      this.cdkConnectedOverlay.overlayRef.updatePosition();
    }
  }

  overlayOutsideClick(event: MouseEvent) {
    const buttonElement = this.triggerReminderMe.elementRef
      .nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (!buttonElement.contains(targetElement)) {
      this.isShowDropdown = false;
    }
  }

  handleDestroyPopover() {
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    if (this.timeoutRef2) {
      clearTimeout(this.timeoutRef2);
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
