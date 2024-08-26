import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, distinctUntilChanged, finalize, takeUntil } from 'rxjs';

import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EMAIL_FORMAT_REGEX } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { UserService } from '@services/user.service';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { SyncPropertyDocumentStatus } from '@shared/types/socket.interface';
import { UserProperties } from '@shared/types/user.interface';
import {
  CheckedUser,
  SecondaryEmail,
  SecondaryPhone,
  UserProperty
} from '@shared/types/users-by-property.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { EActionUserType } from '@/app/user/utils/user.enum';

@Component({
  selector: 'app-common-agent-user-component',
  templateUrl: './common-agent-user-component.component.html',
  styleUrls: ['./common-agent-user-component.component.scss']
})
export class AppCommonAgentUserComponent implements OnInit {
  @Output() refreshListData = new EventEmitter<Boolean>();
  private unsubscribe = new Subject<void>();
  public eUserPropertyType = EUserPropertyType;
  public typeMessage = ETypeMessage;
  public userProperties: UserProperties;
  public addEmailErr: string = '';
  public emailOnOption: SecondaryEmail;
  public phoneOnOption: SecondaryPhone;
  public detectActionType: EActionUserType;
  readonly ACTION_TYPE = EActionUserType;
  private successMsgTimeOut: NodeJS.Timeout = null;
  public selectedUser: UserProperty[] = [];
  public popupStateCommon = {
    isShowSendMessageModal: false,
    isShowSuccessMessageModal: false,
    showAddEmail: false,
    isShowConfirmModal: false,
    isSendInvite: false
  };
  public textConfirm = {
    title: '',
    contentText: ''
  };

  public createNewConversationConfigs = {
    'footer.buttons.nextTitle': 'Send',
    'header.viewRecipients': true,
    'header.showDropdown': true,
    'footer.buttons.showBackBtn': false,
    'footer.buttons.sendType': ISendMsgType.BULK_EVENT,
    'body.prefillReceivers': false,
    'otherConfigs.isCreateMessageType': true,
    'body.prefillReceiversList': [],
    'body.tinyEditor.isShowDynamicFieldFunction': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.CONTACT,
    'header.title': 'Bulk send email',
    'header.icon': 'energy',
    'header.isPrefillProperty': false,
    'header.isChangeHeaderText': true,
    'inputs.openFrom': EUserPropertyType.LANDLORD,
    'inputs.typeMessage': ETypeMessage.SCRATCH,
    'otherConfigs.isProspect': false,
    'otherConfigs.isShowGreetingContent': true
  };

  public usersHaveInvalidEmail: UserProperty[] = [];
  public sentUsersCount = 0;

  constructor(
    public toastService: ToastrService,
    public userService: UserService,
    private userAgentService: UserAgentService,
    public cdr: ChangeDetectorRef,
    private websocketService: RxWebsocketService,
    private agencyService: AgencyService,
    private syncResolveMessageService: SyncResolveMessageService,
    private conversationService: ConversationService,
    private toastCustomService: ToastCustomService,
    private messageFlowService: MessageFlowService
  ) {}

  ngOnInit(): void {
    this.subscribeToSocketNotifySendBulkMessageDone();
  }

  filterInvalidEmailUsers(users) {
    const regExp = EMAIL_FORMAT_REGEX;
    return users.filter((user) => !regExp.test(user?.email));
  }

  handleSendMsgFlow() {
    this.messageFlowService
      .openSendMsgModal(this.createNewConversationConfigs)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Quit:
            this.handleCloseModal(this.ACTION_TYPE.SEND_MSG);
            break;
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            break;
        }
      });
  }

  handleSendInviteOrSendMsgAction(type: EActionUserType) {
    this.usersHaveInvalidEmail = this.filterInvalidEmailUsers(
      this.selectedUser
    );
    if (
      type === EActionUserType.SEND_MSG &&
      this.usersHaveInvalidEmail.length
    ) {
      this.handlePopupStateCommon({ isSendInvite: true });
      return;
    }
    const regExp = EMAIL_FORMAT_REGEX;
    if (type === EActionUserType.SEND_MSG) {
      this.createNewConversationConfigs = {
        ...this.createNewConversationConfigs,
        'body.prefillReceiversList': this.selectedUser
          .filter(({ email }) => email && regExp.test(email))
          .map(({ userId, propertyId = null }) => ({
            id: userId,
            propertyId: propertyId
          }))
      };
      this.handleSendMsgFlow();
    }
  }

  handleSuccessConfirmSendInvite(item: CheckedUser) {
    const regExp = EMAIL_FORMAT_REGEX;
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      'body.prefillReceiversList': this.selectedUser
        .filter(({ email }) => email && regExp.test(email))
        .map(({ userId, propertyId = null }) => ({
          id: userId,
          propertyId: propertyId
        }))
    };
    this.handlePopupStateCommon({
      isSendInvite: false
    });
    this.handleSendMsgFlow();
  }

  handleSendInvite() {
    const body = {
      userProperties: []
    };
    body.userProperties = this.selectedUser.map((el) => {
      return {
        userId: el.userId,
        propertyId: el.propertyId
      };
    });
    this.userAgentService.resetCollection$.next(true);
    this.userService
      .sendBulkAppInvite(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (res?.message?.message) {
            this.toastService.clear();
          }
          this.userAgentService.resetCollection$.next(true);
        },
        error: (_) => {
          this.toastService.clear();
        }
      });
  }

  handleCloseModal(type: EActionUserType) {
    switch (type) {
      case EActionUserType.ADD_MAIL:
        this.handlePopupStateCommon({ showAddEmail: false });
        break;
      case EActionUserType.APP_INVITE:
        this.handlePopupStateCommon({ isSendInvite: false });
        break;
      case EActionUserType.SEND_MSG:
        this.handlePopupStateCommon({ isShowSendMessageModal: false });
        break;
      case EActionUserType.DELETE_SECONDARY_PHONE:
      case EActionUserType.DELETE_SECONDARY_EMAIL:
        this.handlePopupStateCommon({ isShowConfirmModal: false });
        break;
    }
    this.cdr.markForCheck();
  }

  handlePopupStateCommon(state: {}) {
    this.popupStateCommon = { ...this.popupStateCommon, ...state };
  }

  handleOpenModal(type: EActionUserType) {
    switch (type) {
      case EActionUserType.ADD_MAIL:
        this.handlePopupStateCommon({ showAddEmail: true });
        break;
      case EActionUserType.APP_INVITE:
        this.handleSendInviteOrSendMsgAction(EActionUserType.APP_INVITE);
        break;
      case EActionUserType.SEND_MSG:
        this.handleSendInviteOrSendMsgAction(EActionUserType.SEND_MSG);
        break;
      case EActionUserType.DELETE_SECONDARY_EMAIL:
        this.handlePopupStateCommon({ isShowConfirmModal: true });
        break;
      case EActionUserType.DELETE_SECONDARY_PHONE:
        this.handlePopupStateCommon({ isShowConfirmModal: true });
        break;
    }
    this.cdr.markForCheck();
  }

  onDeleteConfirm() {
    switch (this.detectActionType) {
      case EActionUserType.DELETE_SECONDARY_PHONE:
        this.userService
          .deleteSecondaryPhone(this.phoneOnOption.id)
          .pipe(
            takeUntil(this.unsubscribe),
            finalize(() => {
              this.userAgentService.setTriggerActionFilter = {
                isTrigger: true
              };
              this.userAgentService.resetCollection$.next(true);
            })
          )
          .subscribe((res) => {
            if (!res) return;
            this.handlePopupStateCommon({ isShowConfirmModal: false });
            this.refreshListData.emit(true);
            // this.mapListAgency('secondaryPhones', this.phoneOnOption);
          });
        break;

      case EActionUserType.DELETE_SECONDARY_EMAIL:
        this.userService
          .deleteSecondaryEmail(this.emailOnOption.id)
          .pipe(
            takeUntil(this.unsubscribe),
            finalize(() => {
              this.userAgentService.setTriggerActionFilter = {
                isTrigger: true
              };
              this.userAgentService.resetCollection$.next(true);
            })
          )
          .subscribe((res) => {
            if (!res) return;
            this.handlePopupStateCommon({ isShowConfirmModal: false });
            this.refreshListData.emit(true);
            // this.mapListAgency('secondaryEmails', this.emailOnOption);
          });
        break;
    }
  }

  subscribeToSocketNotifySendBulkMessageDone() {
    this.websocketService.onSocketNotifySendBulkMessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        let messageLabel = '';
        if (data?.messages?.[0]?.isDraft) return;
        if (data.status === SyncPropertyDocumentStatus.SUCCESS) {
          if (data.messageSended === 1) {
            const dataForToast = {
              conversationId: data.messages[0].conversationId,
              taskId: data.messages[0].taskId,
              isShowToast: true,
              type: SocketType.newTask,
              mailBoxId: data.mailBoxId,
              taskType: data.taskType || TaskType.MESSAGE,
              pushToAssignedUserIds: [],
              status: data.messages[0].status
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
          } else {
            messageLabel = `${data.messageSended} messages sent`;
            this.toastService.success(messageLabel);
          }
        } else {
          let messageFailed = data.totalMessage - data.messageSended;
          messageLabel = `${messageFailed} ${
            messageFailed === 1 ? 'message' : 'messages'
          }`;
          this.toastService.error(
            `${data.totalMessage - data.messageSended} failed to send`
          );
        }
      });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event.type === ISendMsgType.SCHEDULE_MSG) {
          if (event.receivers?.length === 1) {
            const dataForToast = {
              conversationId:
                event.data?.[0]?.conversationId ||
                (event.data as ISendMsgResponseV2)?.conversation?.id ||
                (event.data as any)?.jobReminders?.[0]?.conversationId,
              taskId:
                event.data?.[0]?.taskId ||
                (event.data as ISendMsgResponseV2)?.task?.id ||
                (event.data as any)?.jobReminders?.[0]?.taskId,
              isShowToast: true,
              type: SocketType.newTask,
              mailBoxId: event.mailBoxId || (event.data as any)?.mailBoxId,
              taskType: TaskType.MESSAGE,
              pushToAssignedUserIds: [],
              status: TaskStatusType.inprogress
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
          } else if (event.receivers?.length > 1) {
            const messageLabel = `${event.receivers.length} messages sent`;
            this.toastService.success(messageLabel);
          }
        }
        this.sentUsersCount = event.receivers?.length || 0;
        this.handlePopupStateCommon({ isShowSendMessageModal: false });
        this.handlePopupStateCommon({ isShowSuccessMessageModal: true });
        this.successMsgTimeOut = setTimeout(() => {
          this.handlePopupStateCommon({ isShowSuccessMessageModal: false });
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        }, 2000);
        this.refreshListData.emit(true);
        this.userAgentService.resetCollection$.next(true);
        this.userAgentService.setTriggerActionFilter = { isTrigger: true };
        break;
      case ESentMsgEvent.ERR:
        this.userAgentService.resetCollection$.next(true);
        this.userAgentService.setTriggerActionFilter = { isTrigger: true };
        break;
      default:
        break;
    }
  }

  handleAddNewEmail($event) {
    this.addEmailErr = '';
    this.userService
      .addSecondaryEmailToContact(
        this.userProperties.userId,
        $event,
        this.userProperties.propertyId || null
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (res) {
            this.handlePopupStateCommon({ showAddEmail: false });
          }
          this.refreshListData.emit(true);
        },
        error: (err) => {
          this.addEmailErr = err?.error?.message;
        }
      });
  }

  ngOnDestroy(): void {
    clearTimeout(this.successMsgTimeOut);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
