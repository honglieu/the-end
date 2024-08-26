import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ConversationService } from '@/app/services/conversation.service';
import { IngoingInspectionService } from '@/app/services/ingoing-inspection.service';
import { LeaseRenewalService } from '@/app/services/lease-renewal.service';
import { LeasingService } from '@/app/services/leasing.service ';
import { LoadingService } from '@/app/services/loading.service';
import { PopupService } from '@/app/services/popup.service';
import { RoutineInspectionService } from '@/app/services/routine-inspection.service';
import { TaskService } from '@/app/services/task.service';
import { UserService } from '@/app/services/user.service';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/sidebar-right/interfaces/widget-calendar-event.interface';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { WIDGET_DESCRIPTION } from '@/app/task-detail/modules/steps/constants/widget.constants';
import { ICalendarEventOption } from '@/app/task-detail/modules/trudi/area-appointment/area-appointment.component';
import { TaskCalendarService } from '@/app/task-detail/services/task-calendar.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CompanyService } from '@services/company.service';
import { CALENDAR_WIDGET_EXPIRED_DAYS } from '@services/constants';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { ECRMId } from '@shared/enum/share.enum';
import { TaskNameId } from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { EWidgetSectionType } from '@shared/enum/widget.enum';
import { AppointmentCard } from '@shared/types/trudi.interface';
import {
  EButtonType,
  EButtonWidget,
  PreventButtonService,
  StepKey
} from '@trudi-ui';
import {
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil
} from 'rxjs';

@Component({
  selector: 'widget-calendar',
  templateUrl: './widget-calendar.component.html',
  styleUrls: ['./widget-calendar.component.scss'],
  providers: [LoadingService]
})
export class WidgetCalendarComponent implements OnInit, OnDestroy {
  @Input() isNoPropertyTask: boolean;
  public appointmentCardArea: AppointmentCard[] = [];
  private appointmentCardResponse: Subscription;
  public trudiType: ETrudiType;
  public paragraph: object = { rows: 0 };
  private unsubscribe = new Subject<void>();
  public taskId: string;
  public propertyId: string;
  public taskTypeId: string;

  public showTaskNoteWidget = false;
  public showBreachNoticeWidget: boolean = false;
  public showBreachNoticeWidgetCalendar: Boolean = false;
  public shareCalendarMsg: string = '';
  public readonly taskNameId = TaskNameId;
  public listEvents: ITaskLinkCalendarEvent[] = [];
  public currentCRMId: string;
  public calenderWidgetExpiredDays: {
    [type: string]: number;
  };
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public readonly WIDGET_DESCRIPTION = WIDGET_DESCRIPTION;
  public readonly EWidgetSectionType = EWidgetSectionType;
  public EButtonType = EButtonType;
  public EButtonWidget = EButtonWidget;
  public isProcessStep: boolean = false;
  public modalId = StepKey.eventStep.calendarEvent;

  constructor(
    public conversationService: ConversationService,
    public popupService: PopupService,
    public userService: UserService,
    public taskService: TaskService,
    public trudiDynamicParameterservice: TrudiDynamicParameterService,
    public leasingService: LeasingService,
    public loadingService: LoadingService,
    private routineInspectionService: RoutineInspectionService,
    private ingoingInspectionService: IngoingInspectionService,
    private leaseRenewalService: LeaseRenewalService,
    private cdr: ChangeDetectorRef,
    private eventCalendarService: EventCalendarService,
    private activatedRoute: ActivatedRoute,
    private rxWebsocketService: RxWebsocketService,
    private inboxService: InboxService,
    private taskEditorApiService: TaskEditorApiService,
    private companyService: CompanyService,
    private PreventButtonService: PreventButtonService,
    public toastCustomService: ToastCustomService,
    private taskCalendarService: TaskCalendarService
  ) {}

  ngOnInit(): void {
    this.loadingService.onLoading();
    this.getEventLinkedTask();
    this.rxWebsocketService.onSocketServiceIssue
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(200),
        distinctUntilChanged(),
        filter((res) => {
          return (
            res &&
            res.data &&
            res.data.taskId === this.taskService.currentTaskId$.value
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (
            res &&
            res.data &&
            res.data.syncStatus === ESyncStatus.COMPLETED
          ) {
            this.getEventLinkedTask();
          }
        }
      });
    this.eventCalendarService
      .getListEvents()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((filteredEvents) => {
        if (filteredEvents) {
          this.listEvents = filteredEvents.map((it) => ({
            ...it,
            isShowDropdown: false
          }));
        }
      });
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          const isTaskChanged = this.taskId !== res.id;
          const isPropertyChange = this.propertyId !== res.id;
          this.taskId = res.id;
          this.propertyId = res.property.id;
          this.taskTypeId = res.trudiResponse?.setting?.taskNameId;
          if (isTaskChanged || isPropertyChange) {
            this.eventCalendarService.refreshListEventCalendarWidget(res.id);
          }
          if (
            res &&
            (!this.appointmentCardResponse || isTaskChanged || isPropertyChange)
          ) {
            this.appointmentCardArea = [];
            this.appointmentCardResponse =
              this.subscribeAppointmentCardResponse(
                res.taskNameRegion?.taskNameId
              );
          }
        }
      });
    this.getCalenderWidgetExpiredDays();
    this.eventCalendarService.refreshCalendarEventS
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.getEventLinkedTask();
      });
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonWidget.CALENDAR,
      EButtonType.WIDGET
    );
  }

  trackEvents(_, item: ITaskLinkCalendarEvent) {
    return item.id;
  }

  getCalenderWidgetExpiredDays() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((company) => Boolean(company?.CRM)),
        switchMap((company) => {
          this.currentCRMId = company?.CRM;
          return this.taskEditorApiService.getCalendarEvent(company?.CRM);
        })
      )
      .subscribe((events) => {
        switch (this.currentCRMId) {
          case ECRMId.PROPERTY_TREE:
            this.calenderWidgetExpiredDays = CALENDAR_WIDGET_EXPIRED_DAYS;
            break;
          case ECRMId.RENT_MANAGER:
            const inspectionEvents = events?.reduce((obj, event) => {
              if (event?.label?.includes('inspection')) {
                return {
                  ...obj,
                  [event.value]: 3
                };
              }
              return obj;
            }, Object.create(null));
            this.calenderWidgetExpiredDays = {
              ...CALENDAR_WIDGET_EXPIRED_DAYS,
              ...inspectionEvents
            };
            break;
        }
      });
  }

  getEventLinkedTask(): void {
    this.eventCalendarService
      .getListEventCalendarWidget(
        this.taskService.currentTaskId$.getValue() ||
          this.activatedRoute.snapshot.params['taskId'] ||
          ''
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.eventCalendarService.setListEvents(res?.events);
          this.taskCalendarService.patchSendMsgConfigs({
            'inputs.rawMsg': res.message ?? ''
          });
        },
        error: (res) => {}
      });
  }
  onShowSelectEventPopup(e: Event): void {
    e.stopPropagation();
    if (!this.isNoPropertyTask) {
      this.eventCalendarService.isShowSelectEventPopup.next(true);
    }
  }

  handleCalendarEvent(option: ICalendarEventOption) {
    this.taskCalendarService.handleCalendarEvent(option);
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

  subscribeAppointmentCardResponse(taskNameId: string) {
    this.showBreachNoticeWidget = false;
    switch (taskNameId) {
      case TaskNameId.routineInspection:
        return this.routineInspectionService.routineInspectionResponse
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res) {
              this.appointmentCardArea = [];
              this.trudiType = ETrudiType.routine_inspection;
              this.appointmentCardArea = [
                {
                  taskName: ETrudiType.routine_inspection,
                  title: res.routineInspectionCard.title,
                  expiresDate: [...res.routineInspectionCard.inspectionDate]
                }
              ];
            }
            this.cdr.markForCheck();
            this.loadingService.stopLoading();
          });
      case TaskNameId.leaseRenewal:
        return this.leaseRenewalService.leaseRenewalRequestResponse
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            let leaseRenewalCard = null;
            if (res && res?.leaseRenewalCard) {
              leaseRenewalCard = res.leaseRenewalCard;
            } else {
              if (res && res?.data[0] && res?.data[0].leaseRenewalSync) {
                const { leaseStart, leaseEnd } = res.data[0].leaseRenewalSync;
                if (!!leaseEnd || !!leaseStart) {
                  leaseRenewalCard = {
                    title: 'Lease End Date',
                    expiresDate: [
                      {
                        active: true,
                        startTime: leaseStart,
                        endTime: leaseEnd
                      }
                    ]
                  };
                }
              }
            }

            if (leaseRenewalCard) {
              this.appointmentCardArea = [];
              this.appointmentCardArea = [
                { ...leaseRenewalCard, taskName: ETrudiType.lease_renewal }
              ];
            }
            this.loadingService.stopLoading();
            this.cdr.markForCheck();
          });
      case TaskNameId.leasing:
        return this.leasingService.leasingRequestResponse
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res) {
              this.ingoingInspectionService.ingoingInspectionResponse.next(res);
            }

            if (
              res &&
              res?.leaseStartCard &&
              res?.leaseStartCard?.leaseStart?.length
            ) {
              this.appointmentCardArea = [
                {
                  taskName: ETrudiType.leasing,
                  title: res.leaseStartCard.title,
                  expiresDate: res.leaseStartCard.leaseStart.map((l) => ({
                    active: l.active,
                    startTime: l.startDate
                  }))
                }
              ];
            }

            this.ingoingInspectionService.ingoingInspectionResponse
              .pipe(takeUntil(this.unsubscribe))
              .subscribe((res) => {
                if (res && res.inspectionStatus) {
                  this.trudiType = ETrudiType.ingoing_inspection;
                  this.appointmentCardArea = this.appointmentCardArea.filter(
                    (a) => a.taskName != ETrudiType.ingoing_inspection
                  );
                  this.appointmentCardArea.push({
                    taskName: ETrudiType.ingoing_inspection,
                    title: res.ingoingInspectionCard.title,
                    expiresDate: [...res.ingoingInspectionCard.inspectionDate]
                  });
                }
                this.loadingService.stopLoading();
                this.cdr.markForCheck();
              });
          });
      default:
        this.loadingService.stopLoading();
        this.cdr.markForCheck();
        return null;
    }
  }

  setCurrentEventIndex(index: number) {
    this.listEvents = this.listEvents.map((event, idx) => {
      if (idx === index) {
        return {
          ...event,
          isShowDropdown: !event.isShowDropdown
        };
      }
      return {
        ...event,
        isShowDropdown: false
      };
    });
  }

  ngOnDestroy() {
    this.appointmentCardResponse && this.appointmentCardResponse.unsubscribe();
    this.appointmentCardArea = [];
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.eventCalendarService.refreshListEventCalendarWidget(null);
    this.eventCalendarService.setListEvents(null);
  }
}
