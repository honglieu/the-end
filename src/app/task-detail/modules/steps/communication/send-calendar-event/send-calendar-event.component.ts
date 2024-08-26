import { StepBaseComponent } from './../step-base/step-base.component';
import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { PropertiesService } from '@services/properties.service';
import { UserService } from '@services/user.service';
import {
  ICalendarEventResponse,
  ITaskLinkCalendarEvent
} from '@/app/task-detail/modules/steps/communication/interfaces/calendar-event.interface';
import { LoadingService } from '@services/loading.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { takeUntil } from 'rxjs';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import dayjs from 'dayjs';
import { TIME_FORMAT } from '@services/constants';
import { ChatGptService } from '@services/chatGpt.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { DynamicParameterType } from '@/app/trudi-send-msg/utils/dynamic-parameter';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { mapEventCalendarWidget } from '@/app/task-detail/modules/steps/constants/constants';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { ICalendarEvent } from '@/app/task-detail/modules/steps/utils/schedule-reminder.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

interface StepPopupType {
  trudiSendMessage: boolean;
  eventSelect: boolean;
}

@Component({
  selector: 'send-calendar-event',
  templateUrl: './send-calendar-event.component.html'
})
export class SendCalendarEventComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public agencyService: AgencyService,
    public propertyService: PropertiesService,
    public userService: UserService,
    public eventCalendarService: EventCalendarService,
    public loadingService: LoadingService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    private agencyDateFormatService: AgencyDateFormatService,
    private PreventButtonService: PreventButtonService,
    public override toastCustomService: ToastCustomService
  ) {
    super(
      taskService,
      trudiService,
      sendMessageService,
      conversationService,
      toastService,
      filesService,
      stepService,
      chatGptService,
      trudiDynamicParameterService,
      toastCustomService
    );
  }

  public newLinkEvent: ICalendarEvent[] = [];
  public newUnlinkEvent: ICalendarEvent[] = [];
  public listEvents: ICalendarEventResponse[] = [];
  public calendarEventFiles = [];
  public selectedEvent: ICalendarEvent = null;

  public stepPopupState: StepPopupType = {
    trudiSendMessage: false,
    eventSelect: false
  };
  public isRequired: boolean = false;
  public isSubmit: boolean = false;
  public buttonKey = EButtonStepKey.SEND_CALENDAR_EVENT;
  public modalId = StepKey.communicationStep.sendCalendarEvent;

  override ngOnInit(): void {
    super.ngOnInit();
    this.sendMessageConfigs = {
      ...this.sendMessageConfigs,
      'footer.buttons.nextTitle': 'Send',
      'otherConfigs.calendarEvent.sendCalendarEvent': true,
      'otherConfigs.calendarEvent.calendarEventId': null,
      trudiButton: this.model
    };
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.isRequired = false;
      this.handlePopupState({ eventSelect: false, trudiSendMessage: false });
      this.resetPopupState();
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    this.resetEventData();
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    this.eventCalendarService
      .getListEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          let eventCalendar = [];
          eventCalendar = res.filter(
            (item: ICalendarEvent, _) =>
              (mapEventCalendarWidget[item.eventType] ===
                this.model?.fields?.customControl?.event ||
                item.eventType === this.model?.fields?.customControl?.event) &&
              ![EEventStatus.CLOSED, EEventStatus.CANCELLED].includes(
                item?.eventStatus
              )
          );
          this.listEvents = this.groupEventsByDate(eventCalendar);
        }
      });

    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        ignoreProperties: [
          DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE,
          DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE,
          DynamicParameterType.CALENDAR_EVENT_CUSTOM
        ],
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.eventSelect);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }

    this.handlePopupState({ eventSelect: true });
  }

  groupEventsByDate(
    events: ITaskLinkCalendarEvent[]
  ): ICalendarEventResponse[] {
    const groupedEvents = {};
    for (const event of events) {
      const eventDate = event.eventDate.split('T')[0];
      if (!groupedEvents[eventDate]) {
        groupedEvents[eventDate] = {
          date: eventDate,
          events: []
        };
      }
      groupedEvents[eventDate].events.push(event);
    }
    return Object.values(groupedEvents);
  }

  prefillMsgBody() {
    this.textForwardMessg = this.model?.fields?.msgBody;
    this.trudiDynamicParameterService.setDynamicParametersCalendarEvent(
      this.selectedEvent
    );
    this.trudiDynamicParameterService.setDynamicParametersCalendarEventWidget(
      this.selectedEvent
    );
    let { eventDate, eventName, startTime, endTime, eventType } =
      this.selectedEvent || {};

    startTime = startTime || eventDate;
    let eventTime = '';
    if (
      !!endTime ||
      !dayjs.utc(startTime).startOf('day').isSame(dayjs.utc(startTime))
    ) {
      const arr = [];
      if (startTime) {
        arr.push(dayjs.utc(startTime).format(TIME_FORMAT));
      }
      if (endTime) {
        arr.push(dayjs.utc(endTime).format(TIME_FORMAT));
      }
      eventTime = arr.join(' - ');
    }
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();

    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        selectedEvent: {
          eventDate:
            dayjs(eventDate).format(DATE_FORMAT_DAYJS) + ' ' + eventTime,
          eventType: eventType,
          eventName: eventName
        }
      }
    };
  }

  handleCloseSendMsg() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.resetPopupState();
    this.resetData();
  }

  handleBackSendMsg() {
    const events = this.listEvents.map((x) => x.events).flat();
    const event = events.find((x) => x.id === this.selectedEvent?.id);
    if (event) event.isChecked = true;
    this.handlePopupState({ eventSelect: true, trudiSendMessage: false });
  }

  handleEventChangeOption(event: {
    isChecked: boolean;
    eventDataRow: ICalendarEvent;
  }) {
    this.isSubmit = false;
    if (event.isChecked) {
      this.isRequired = false;
      this.selectedEvent = event.eventDataRow;
      this.listEvents
        .map((x) => x.events)
        .flat()
        .forEach((x) => {
          if (x.id !== event.eventDataRow.id) {
            x.isChecked = false;
          } else {
            x.isChecked = true;
          }
        });

      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'otherConfigs.calendarEvent.calendarEventId': event.eventDataRow.id
      };
    } else {
      this.isRequired = true;
      this.selectedEvent = null;
      this.listEvents
        .map((x) => x.events)
        .flat()
        .forEach((x) => {
          x.isChecked = false;
        });
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'otherConfigs.calendarEvent.calendarEventId': null
      };
    }
  }

  handleConfirmEventModal() {
    this.isRequired = !this.selectedEvent;
    this.isSubmit = true;
    if (!this.selectedEvent) return;
    this.calendarEventFiles = this.selectedEvent
      ? [
          {
            name: this.selectedEvent.eventName + '.ics',
            size: 1024,
            isHideRemoveIcon: true,
            icsFile: true
          }
        ]
      : null;
    const dynamicFiles = this.mapDynamicFiles();
    this.calendarEventFiles = [...this.calendarEventFiles, ...dynamicFiles];
    this.prefillMsgBody();
    this.handlePopupState({ eventSelect: false, trudiSendMessage: true });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  handleCloseEventModal() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.resetData();
    this.isRequired = false;
    this.isSubmit = false;
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.calendarEventFiles,
      rawMsg: this.textForwardMessg,
      prefillVariables: this.prefillVariable
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.handleBackSendMsg();
            this.PreventButtonService.setCurrentModalActive(this.buttonKey);
            break;
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            break;
          case ESendMessageModalOutput.Quit:
            this.handleCloseSendMsg();
            break;
        }
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.modelData = this.model;
    }
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({ trudiSendMessage: false, eventSelect: false });
        this.resetData();
        if (event.isDraft) {
          return;
        }
        this.complete(event);
        this.handleSendMsgToast(event);
        break;
      default:
        break;
    }
  }

  resetEventData() {
    this.selectedEvent = null;
    this.listEvents
      .map((x) => x.events)
      .flat()
      .forEach((x) => {
        x.isChecked = false;
      });
  }

  override handlePopupState(state: {}) {
    this.stepPopupState = { ...this.stepPopupState, ...state };
  }

  override resetPopupState() {
    for (const key in this.stepPopupState) {
      if (Object.prototype.hasOwnProperty.call(this.stepPopupState, key)) {
        this.stepPopupState[key] = false;
      }
    }
  }

  override resetData() {
    this.resetEventData();
    this.resetPopupState();
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }
}
