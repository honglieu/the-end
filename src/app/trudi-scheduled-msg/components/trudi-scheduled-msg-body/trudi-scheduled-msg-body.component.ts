import { TrudiSendMsgUserService } from './../../../trudi-send-msg/services/trudi-send-msg-user.service';
import {
  Component,
  Host,
  Input,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil
} from 'rxjs/operators';
import { DEBOUNCE_SOCKET_TIME } from '@services/constants';
import { UserService } from '@services/user.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import {
  EToolTipTrudiScheduledMsg,
  ITrudiScheduledMsgInfo
} from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { ConversationService } from '@services/conversation.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SocketType } from '@shared/enum/socket.enum';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { TaskService } from '@services/task.service';
import { TrudiScheduledMsgComponent } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.component';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';

@Component({
  selector: 'trudi-scheduled-msg-body',
  templateUrl: './trudi-scheduled-msg-body.component.html',
  styleUrls: ['./trudi-scheduled-msg-body.component.scss']
})
export class TrudiScheduledMsgBodyComponent implements OnInit, OnDestroy {
  @Input() listModalScheduleMsg: ITrudiScheduledMsgInfo[] = [];

  TOOLTIP_SCHEDULED_MSG_TEXT = EToolTipTrudiScheduledMsg;
  receiver: ISelectedReceivers[];
  listOfReceivers: ISelectedReceivers[];
  private unsubscribe = new Subject<void>();
  propertyId: string;
  agencyId: string;
  iconStyle = {
    'width.px': 16,
    'height.px': 16,
    'marginTop.px': 1
  };
  disableBtn: boolean = false;
  constructor(
    @Host() @Optional() private trudiScheduledMsg: TrudiScheduledMsgComponent,
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private userService: UserService,
    private conversationsService: ConversationService,
    private webSocketService: RxWebsocketService,
    private trudiSendMsgService: TrudiSendMsgService,
    private taskService: TaskService,
    private agencyDateFormatService: AgencyDateFormatService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private trudiSendMsgUserService: TrudiSendMsgUserService
  ) {}

  get popupState() {
    return this.trudiScheduledMsgService.getPopupState();
  }

  ngOnInit(): void {
    const { propertyId, agencyId } =
      this.trudiScheduledMsgService.getIDsFromOtherService();
    this.conversationsService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((conversation) => {
        this.propertyId = [
          EUserPropertyType.SUPPLIER,
          EUserPropertyType.OTHER,
          EUserPropertyType.AGENT,
          EUserPropertyType.LANDLORD_PROSPECT,
          EUserPropertyType.OWNER_PROSPECT,
          EUserPropertyType.EXTERNAL,
          EUserPropertyType.UNIDENTIFIED
        ].includes(conversation.propertyType as EUserPropertyType)
          ? null
          : propertyId;
      });
    this.agencyId = agencyId;
    this.webSocketService.onSocketJob
      .pipe(
        filter((res) =>
          Boolean(res && res.taskId === this.taskService.currentTask$.value?.id)
        ),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        switch (res.type) {
          case SocketType.completeJob:
          case SocketType.forceCompleteJob:
          case SocketType.removedJob:
            const data =
              this.trudiScheduledMsgService.listScheduledMsg.value.filter(
                (msg) => msg.id !== res.jobId
              );
            this.trudiScheduledMsgService.listScheduledMsg.next(data);
            this.trudiScheduledMsgService.setPopupState({
              scheduledMessage:
                this.trudiScheduledMsgService.listScheduledMsg.value.length > 0
            });
            this.trudiScheduledMsgService.scheduleMessageCount.next({
              count: data?.length || 0,
              conversationId: res.conversationId ?? null
            });
            break;

          case SocketType.updatedJob:
            this.updateReminderTimeRescheduledMsg(res.jobId, res.reminderTime);
            break;

          case SocketType.newScheduleJob:
            res.conversationIds?.forEach((id) =>
              this.handleNewScheduleJob(res.taskId, id)
            );
            break;

          default:
            break;
        }
      });
    this.userService
      .checkIsPortalUser()
      .then((isPortalUser) => (this.disableBtn = !isPortalUser));
  }

  handleNewScheduleJob(taskId: string, conversationId: string) {
    this.trudiScheduledMsgService
      .getListScheduledMsg(taskId, conversationId)
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }

  updateReminderTimeRescheduledMsg(jobId: string, reminderTime: string) {
    const data = this.trudiScheduledMsgService.listScheduledMsg.value.map(
      (msg) => {
        if (msg.id === jobId) {
          return {
            ...msg,
            time: reminderTime
          };
        }
        return msg;
      }
    );
    this.trudiScheduledMsgService.listScheduledMsg.next(data);
  }

  handleSendNowMsg(value: ITrudiScheduledMsgInfo) {
    this.trudiScheduledMsgService.setSelectedScheduledMsg(value);
    this.trudiScheduledMsgService.setPopupState({
      sendNowMessage: true,
      scheduledMessage: false
    });
  }

  handleDeleteScheduledMsg(value: ITrudiScheduledMsgInfo) {
    this.trudiScheduledMsgService.setSelectedScheduledMsg(value);
    this.trudiScheduledMsgService.setPopupState({
      deleteScheduledMessage: true,
      scheduledMessage: false
    });
  }

  handleEditScheduledMsg(value: ITrudiScheduledMsgInfo) {
    const userDetails =
      value.data.receiverIds.map((id) => {
        return {
          id,
          propertyId: this.propertyId
        };
      }) || [];
    this.trudiSendMsgUserService.fetchMore({
      propertyId: this.propertyId,
      limit: 20,
      page: 1,
      search: '',
      email_null: true,
      userDetails: userDetails
    });
    this.handlePrefillReceiver(value);
  }

  handlePrefillReceiver(value) {
    this.trudiSendMsgUserService
      .getListUser()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((users) => {
        if (users) {
          this.listOfReceivers = users;
          this.trudiScheduledMsgService.setSelectedScheduledMsg(value);
          this.trudiScheduledMsgService.setPopupState({
            editScheduledMessage: true,
            scheduledMessage: false
          });
          const user = this.listOfReceivers?.filter(
            (data) =>
              data.id === value.data.receiverIds[0] &&
              (this.isCheckUserPropertyType(
                data.type,
                data.propertyId,
                this.propertyId
              ) ||
                data.propertyId === null)
          );
          this.trudiScheduledMsgService.setSelectedReceiver(user);
          this.trudiScheduledMsgService.setSelectedScheduledMsg(value);
          this.trudiSendMsgFormService.setSelectedContactCard(
            value?.data?.options?.contacts
          );
        }
      });
  }

  isCheckUserPropertyType(
    type: string,
    dataPropertyId: string,
    propertyId: string
  ) {
    return type === EUserPropertyType.TENANT ||
      type === EUserPropertyType.LANDLORD
      ? dataPropertyId === propertyId
      : true;
  }

  handleRescheduleMsg(value: ITrudiScheduledMsgInfo) {
    this.trudiScheduledMsgService.setSelectedScheduledMsg(value);
    this.trudiScheduledMsg.scheduleSpecialFlowDate();
    this.trudiScheduledMsgService.setPopupState({
      rescheduleMsg: true,
      scheduledMessage: false
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
