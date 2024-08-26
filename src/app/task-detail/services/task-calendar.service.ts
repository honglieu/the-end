import { BreachNoticeApiService } from '@/app/breach-notice/services/breach-notice-api.service';
import {
  BreachNoticeRequestButtonAction,
  BreachNoticeStepIndex
} from '@/app/breach-notice/utils/breach-notice.enum';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { TaskService, TrudiService } from '@/app/services';
import {
  BreachNoticeTrudiResponse,
  EEventType,
  TaskNameId,
  TaskType,
  TrudiButtonEnumStatus,
  TrudiResponseVariable
} from '@/app/shared';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, take } from 'rxjs';
import { EventCalendarService } from '../modules/sidebar-right/services/event-calendar.service';
import {
  ECalendarOption,
  ICalendarEventOption
} from '../modules/trudi/area-appointment/area-appointment.component';

@Injectable({
  providedIn: 'root'
})
export class TaskCalendarService {
  sendMsgConfigs$ = new BehaviorSubject<Record<string, unknown>>({
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'otherConfigs.calendarEvent.sendCalendarEvent': true,
    'header.hideSelectProperty': true,
    'header.title': null,
    'header.showDropdown': false,
    'body.prefillReceivers': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'footer.buttons.disableSendBtn': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_HEADER,
    'inputs.appendBody': true,
    'inputs.openFrom': TaskType.SHARE_CALENDAR_INVITE
  });
  shareCalendarMsg: string;

  constructor(
    private messageFlowService: MessageFlowService,
    public taskService: TaskService,
    private eventCalendarService: EventCalendarService,
    private toastrService: ToastrService,
    private breachNoticeApiService: BreachNoticeApiService,
    public toastCustomService: ToastCustomService,
    private trudiBreachNoticeService: TrudiService<BreachNoticeTrudiResponse>
  ) {}

  patchSendMsgConfigs(configs: Object) {
    this.sendMsgConfigs$.next({
      ...this.sendMsgConfigs$.value,
      ...configs
    });
  }

  handleCalendarEvent(option: ICalendarEventOption) {
    const currentTask = this.taskService.currentTask$.getValue();
    const tasks = [
      {
        taskId: currentTask.id,
        propertyId: currentTask.property?.id
      }
    ];
    if (option.calendarOption === ECalendarOption.SHARE_CALENDAR_INVITE) {
      let sendMsgConfigs: Record<string, unknown> = {
        ...this.sendMsgConfigs$.value,
        'header.title':
          this.taskService.currentTask$?.getValue()?.property?.streetline ||
          'No property',
        ['body.prefillTitle']: option.calendarEvent.title,
        ['otherConfigs.calendarEvent.calendarEventId']: option.calendarEvent.id
      };
      const prefillVariables: Record<string, string> | TrudiResponseVariable = {
        '{event_name}': option.calendarEvent.eventName,
        '{event_date}': option.calendarEvent.eventDate,
        '{event_time}': option.calendarEvent.eventTime
          ? `, ${option.calendarEvent.eventTime}`
          : ''
      };
      const calendarEventFiles = [
        {
          name: option.calendarEvent.eventName + '.ics',
          size: 1024,
          isHideRemoveIcon: true,
          extension: '.ics',
          icsFile: true
        }
      ];

      sendMsgConfigs = {
        ...sendMsgConfigs,
        'inputs.selectedTasksForPrefill': tasks,
        'inputs.prefillVariables': prefillVariables,
        'inputs.listOfFiles': calendarEventFiles
      };

      this.messageFlowService
        .openSendMsgModal(sendMsgConfigs)
        .pipe(take(1))
        .subscribe((rs) => {
          this.onSendMsg(rs.data);
        });
    } else {
      this.eventCalendarService
        .unlinkToEvent({
          taskId: this.taskService.currentTask$.value.id,
          calendarEventIds: [option.calendarEvent.id]
        })
        .subscribe({
          next: () => {
            this.eventCalendarService.refreshListEventCalendarWidget(
              this.taskService.currentTask$.value.id
            );
            if (
              option.calendarEvent?.eventType === EEventType.BREACH_REMEDY &&
              option.calendarEvent?.id ===
                this.trudiBreachNoticeService.getTrudiResponse.value?.variable
                  ?.breachRemedyEventId &&
              this.taskService.currentTask$.value?.taskNameRegion
                ?.taskNameId === TaskNameId.breachNotice
            ) {
              const listEvents = this.eventCalendarService.listEvents.map(
                (it) => ({ ...it, isShowDropdown: false })
              );
              if (listEvents?.length) {
                const updatedEvents = listEvents.filter(
                  (eventItem) => eventItem.id !== option.calendarEvent.id
                );
                this.eventCalendarService.setListEvents(updatedEvents);
              }
              this.breachNoticeApiService
                .updateButtonStatus(
                  BreachNoticeRequestButtonAction.add_details_of_breach_of_contract,
                  TrudiButtonEnumStatus.PENDING,
                  BreachNoticeStepIndex.GENERAL_STEP
                )
                .pipe(take(1))
                .subscribe((res) => {
                  if (res) {
                    this.trudiBreachNoticeService.updateTrudiResponse = res;
                  }
                });
            }
          },
          error: () => {
            this.toastrService.error('Please try again');
          }
        });
    }
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (!event.isDraft) {
          this.toastCustomService.handleShowToastMessSend(event);
        }
        break;
      default:
        break;
    }
  }
}
