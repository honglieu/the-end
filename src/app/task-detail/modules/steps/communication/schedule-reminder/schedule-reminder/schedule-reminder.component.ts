import { takeUntil } from 'rxjs';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import {
  ICalendarEvent,
  ITaskLinkCalendarEvent
} from '@/app/task-detail/modules/steps/utils/schedule-reminder.interface';
import {
  EFooterButtonType,
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ITrudiSendMsgFormValue
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import dayjs from 'dayjs';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { dropdownList } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TIME_FORMAT } from '@services/constants';
import { ChatGptService } from '@services/chatGpt.service';
import { mapEventCalendarWidget } from '@/app/task-detail/modules/steps/constants/constants';
import { EReminderTimelineValue } from '@trudi-ui';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { DynamicParameterType } from '@/app/trudi-send-msg/utils/dynamic-parameter';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { ICalendarEventResponse } from '@/app/task-detail/modules/steps/communication/interfaces/calendar-event.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { UppercaseFirstLetterPipe } from '@shared/pipes/uppercase-first-letter';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'schedule-reminder',
  templateUrl: './schedule-reminder.component.html',
  providers: [UppercaseFirstLetterPipe]
})
export class ScheduleReminderComponent
  extends StepBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  public listScheduleDate: string[] = [];
  public currentBody;
  public eventSchedule;
  public listEvents: ICalendarEventResponse[] = [];
  public selectedEvent: ICalendarEvent = null;
  public isRequired: boolean = false;
  public buttonKey = EButtonStepKey.SCHEDULE_REMINDER;
  public modalId = StepKey.communicationStep.scheduleReminder;

  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public override chatGptService: ChatGptService,
    private eventCalendarService: EventCalendarService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    private agencyDateFormatService: AgencyDateFormatService,
    private uppercaseFirstLetterPipe: UppercaseFirstLetterPipe,
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        trudiButton: this.model,
        'body.prefillReceiversList': [],
        'body.prefillReceivers': true,
        'body.prefillTitle': this.model?.fields?.msgTitle,
        'footer.buttons.showBackBtn': true,
        'footer.buttons.nextButtonType': EFooterButtonType.DROPDOWN,
        'footer.buttons.dropdownList': dropdownList,
        'body.tinyEditor.attachBtn.disabled': false,
        'body.timeSchedule': ''
      };
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.eventCalendarService
      .getListEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filteredEvents) => {
        if (filteredEvents) {
          let eventSchedules = [];
          eventSchedules = filteredEvents.filter(
            (item: ICalendarEvent, _) =>
              (mapEventCalendarWidget[item.eventType] ===
                this.model?.fields?.customControl?.event ||
                item.eventType === this.model?.fields?.customControl?.event) &&
              ![EEventStatus.CLOSED, EEventStatus.CANCELLED].includes(
                item?.eventStatus
              )
          );
          this.listEvents = this.groupEventsByDate(eventSchedules);
        }
      });
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

  handleBackSendMsg() {
    const events = this.listEvents.map((x) => x.events).flat();
    const event = events.find((x) => x.id === this.selectedEvent?.id);
    if (event) event.isChecked = true;
    this.sendMessageConfigs = {
      ...this.sendMessageConfigs,
      ['body.timeSchedule']: '',
      ['body.prefillReceiversList']: []
    };
    this.handlePopupState({ selectEvent: true, isTrudiSendMessage: false });
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.isRequired = false;
      this.resetData();
      this.handlePopupState({ selectEvent: false, isTrudiSendMessage: false });
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
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
      this.subscribeConfirmEssential(EPopupType.selectEvent);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ selectEvent: true });
  }

  onNextEvent() {
    this.isRequired = !this.selectedEvent;
    if (!this.selectedEvent) return;
    let scheduleDatetime = {
      scheduleDate: null,
      scheduleTime: null
    };
    this.trudiDynamicParameterService.setDynamicParametersCalendarEventWidget(
      this.selectedEvent
    );
    this.handlePopupState({ selectEvent: false, isTrudiSendMessage: true });
    const { timeline, reminderTime, day, event } =
      this.model?.fields?.customControl ?? {};
    let { eventDate } = this.selectedEvent;
    const value = timeline === EReminderTimelineValue.after ? day : -day;
    eventDate = dayjs(eventDate).add(value, 'day').toString();
    scheduleDatetime.scheduleDate = eventDate;
    scheduleDatetime.scheduleTime = reminderTime;

    this.trudiDynamicParameterService.setDynamicParametersScheduleReminder(
      this.selectedEvent,
      scheduleDatetime
    );
    this.sendMessageConfigs = {
      ...this.sendMessageConfigs,
      ['body.timeSchedule']: '',
      ['body.prefillReceiversList']: [],
      ['body.otherConfigs.calendarEvent']: {
        date: dayjs(this.selectedEvent.eventDate).toDate().getTime(),
        eventName: this.uppercaseFirstLetterPipe.transform(
          this.selectedEvent?.eventName || ''
        )
      }
    };
    this.prefillMsgBody();
    this.eventSchedule = {
      ...this.eventSchedule,
      eventType: event
    };
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  prefillMsgBody() {
    this.textForwardMessg = this.model?.fields?.msgBody;
    const { eventDate, eventName, startTime, endTime, eventType, eventStatus } =
      this.selectedEvent || {};
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.value;
    let eventTime = '';
    if (!!startTime || !!endTime) {
      const startTimeFormatted =
        !!startTime &&
        this.agencyDateFormatService.formatTimezoneDate(startTime, TIME_FORMAT);
      const endTimeFormatted =
        !!endTime &&
        this.agencyDateFormatService.formatTimezoneDate(endTime, TIME_FORMAT);

      eventTime =
        startTimeFormatted && endTimeFormatted
          ? `${startTimeFormatted} - ${endTimeFormatted}`
          : startTimeFormatted || endTimeFormatted;
    }

    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        selectedEvent: {
          eventDateValue: eventDate,
          eventDate: `${dayjs(eventDate).format(
            DATE_FORMAT_DAYJS
          )} ${eventTime}`?.trim(),
          eventType,
          eventName,
          eventStatus
        }
      }
    };
  }

  handleEventChangeOption(event: {
    isChecked: boolean;
    eventDataRow: ITaskLinkCalendarEvent;
  }) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.value;
    const eventDate = event.eventDataRow?.eventDate
      ? dayjs(event.eventDataRow?.eventDate).utc().format(DATE_FORMAT_DAYJS)
      : '';
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
    } else {
      this.isRequired = true;
      this.selectedEvent = null;
      this.listEvents
        .map((x) => x.events)
        .flat()
        .forEach((x) => {
          x.isChecked = false;
        });
    }
    this.eventSchedule = {
      eventDate: eventDate
    };
  }

  handleClose() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.isRequired = false;
    this.handlePopupState({ selectEvent: false, isTrudiSendMessage: false });
    this.resetData();
  }

  handleNextBtnDropdown(msgBody: ITrudiSendMsgFormValue) {
    const body = {
      categoryMessage: msgBody.msgTitle,
      listOfFiles: msgBody.listOfFiles,
      isResolveConversation: msgBody.isResolveConversation,
      message: msgBody.msgContent,
      userId: msgBody.selectedSender.id,
      users: msgBody.selectedReceivers
    };
    this.currentBody = body;
    this.sendMessageConfigs = {
      ...this.sendMessageConfigs,
      'body.prefillTitle': msgBody.msgTitle,
      'body.prefillReceiversList': msgBody.selectedReceivers
    };
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.model?.fields?.files,
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
            this.onQuit();
            break;
        }
      });
  }

  stopProcess() {
    this.handlePopupState({ selectEvent: false, isTrudiSendMessage: false });
    this.listScheduleDate = [];
    this.resetData();
  }

  onBackScheduleMsg() {
    this.handlePopupState({ selectEvent: false, isTrudiSendMessage: true });
    this.openSendMsgModal();
    this.listScheduleDate = [];
  }

  onQuit() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({ selectEvent: false, isTrudiSendMessage: false });
    this.sendMessageConfigs = {
      ...this.sendMessageConfigs,
      ['body.timeSchedule']: '',
      ['body.prefillReceiversList']: []
    };
    this.resetData();
  }

  override resetData() {
    this.resetEventData();
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

  onNextScheduleMsg(event: string[]) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.value;
    this.listScheduleDate = event;
    this.handlePopupState({ selectEvent: false, isTrudiSendMessage: true });
    this.sendMessageConfigs = {
      ...this.sendMessageConfigs,
      ['body.timeSchedule']: dayjs(...this.listScheduleDate)
        .locale('en')
        .format('hh:mm A, ' + DATE_FORMAT_DAYJS),
      ['body.typeSendMsg']: 'Schedule for send',
      ['body.prefillReceiversList']: this.currentBody.users || []
    };
    this.openSendMsgModal();
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({
          selectEvent: false,
          isTrudiSendMessage: false
        });
        this.resetData();
        if (event.isDraft) {
          return;
        }
        this.complete(event);
        this.handleSendMsgToast(event);
        break;
      case ESentMsgEvent.COMPLETED:
        this.complete();
        this.resetData();
        break;
      default:
        break;
    }
  }
}
