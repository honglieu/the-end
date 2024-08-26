import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  ICalendarEvent,
  PopUpBulkCreateTasks
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { Subject, takeUntil } from 'rxjs';
import { EEventType } from '@shared/enum/calendar.enum';
import uuidv4 from 'uuid4';
import {
  CalendarEventBulkCreateTaskSuccess,
  CalendarEventBulkTasksCreated,
  TaskCreate,
  TaskTemplate
} from '@shared/types/task.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { Store } from '@ngrx/store';
import { calendarDashboardActions } from '@core/store/calendar-dashboard/actions/calendar-dashboard.actions';

@Component({
  selector: 'bulk-create-tasks',
  templateUrl: './bulk-create-tasks.component.html',
  styleUrls: ['./bulk-create-tasks.component.scss']
})
export class BulkCreateTasksComponent implements OnInit, OnDestroy {
  @Input() listEvents: ICalendarEvent[];
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onCompleteCreateTasks: EventEmitter<void> =
    new EventEmitter<void>();
  @Output() onCompleteSendMessages: EventEmitter<void> =
    new EventEmitter<void>();
  public readonly typePopup = PopUpBulkCreateTasks;
  private destroy$: Subject<void> = new Subject<void>();
  public listGetEvents: ICalendarEvent[];
  public statePopup: PopUpBulkCreateTasks;
  public confirmTypeEvent: EEventType;
  public sessionId: string = uuidv4();
  public dataFormCreateTask: TaskCreate;
  public agencyId: string;
  public taskTemplate: TaskTemplate;
  public listEventsSuccessBulkCreateTask: ICalendarEvent[] = [];
  public onStepBeforeBulkCreateTasks: boolean = false;
  public onStepBulkCreateTasks: boolean = false;
  public onStepSendMessage: boolean = false;
  public hasMultiEventType: boolean = false;
  public hasLinkedTask: boolean = false;
  public showBackButtonModalCreateTask: boolean = false;
  public listEventCheckingDuplicate: ICalendarEvent[] = [];
  public listFinalEventCreateTask: ICalendarEvent[] = [];
  public tasksCreated: CalendarEventBulkTasksCreated[] = [];
  private isAgencyRM: boolean = false;

  constructor(
    private _calendarService: CalendarService,
    private _agencyService: AgencyService,
    private readonly store: Store,
    private _companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this._companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.isAgencyRM = this._agencyService.isRentManagerCRM(res);
        }
      });

    this.listGetEvents = this.isAgencyRM
      ? this.listEvents
      : this.listEvents.map((event) => ({
          ...event,
          eventType: this.mapEventType(event.eventType)
        }));

    if (this.listGetEvents.length > 0) {
      this.confirmTypeEvent = this.listGetEvents[0].eventType;
    }
    this.hasMultiEventType = this.listGetEvents.some(
      (item) => item.eventType !== this.confirmTypeEvent
    );
    this.refreshFilterListEvents();
    this._calendarService
      .getPopupBulkCreateTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.statePopup = res;
        this.refreshStepPopup();
      });
    this._calendarService.setPopupBulkCreateTasks(
      this.hasMultiEventType
        ? PopUpBulkCreateTasks.CONFIRM_EVENT_TYPE
        : this.hasLinkedTask
        ? PopUpBulkCreateTasks.CHECKING_FOR_DUPLICATES
        : PopUpBulkCreateTasks.CREATE_TASKS
    );
  }

  private refreshStepPopup() {
    this.onStepBeforeBulkCreateTasks =
      this.statePopup === PopUpBulkCreateTasks.CONFIRM_EVENT_TYPE ||
      this.statePopup === PopUpBulkCreateTasks.CHECKING_FOR_DUPLICATES ||
      this.statePopup === PopUpBulkCreateTasks.CREATE_TASKS;
    this.onStepBulkCreateTasks =
      this.statePopup === PopUpBulkCreateTasks.BULK_TASKS_IS_CREATING ||
      this.statePopup === PopUpBulkCreateTasks.FAILED_TO_CREATE_TASK;
    this.onStepSendMessage =
      this.statePopup === PopUpBulkCreateTasks.SELECT_OPTION_FOR_SEND_MESSAGE ||
      this.statePopup === PopUpBulkCreateTasks.SEND_MESSAGE ||
      this.statePopup === PopUpBulkCreateTasks.VIEW_TASKS;
  }

  private refreshFilterListEvents() {
    this.hasLinkedTask = this.listGetEvents.some(
      (item) =>
        item.eventType === this.confirmTypeEvent && item.totalLinkedTask > 0
    );
    this.showBackButtonModalCreateTask =
      this.hasMultiEventType || this.hasLinkedTask;
    this.listEventCheckingDuplicate = this.listGetEvents.filter(
      (item) => item.eventType === this.confirmTypeEvent
    );
    this.listFinalEventCreateTask = this.listGetEvents.filter(
      (item) =>
        item.eventType === this.confirmTypeEvent &&
        (item.totalLinkedTask == 0 || item.isDuplicateCreateTask)
    );
  }

  public onNextConfirmEventType(selected: EEventType) {
    this.confirmTypeEvent = selected;
    this.refreshFilterListEvents();
    this._calendarService.setPopupBulkCreateTasks(
      this.hasLinkedTask
        ? PopUpBulkCreateTasks.CHECKING_FOR_DUPLICATES
        : PopUpBulkCreateTasks.CREATE_TASKS
    );
  }

  public onNextCheckingDuplicates() {
    this.refreshFilterListEvents();
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.CREATE_TASKS
    );
  }

  public onBackCreateTasks() {
    if (this.hasLinkedTask) {
      this._calendarService.setPopupBulkCreateTasks(
        PopUpBulkCreateTasks.CHECKING_FOR_DUPLICATES
      );
    } else {
      this._calendarService.setPopupBulkCreateTasks(
        PopUpBulkCreateTasks.CONFIRM_EVENT_TYPE
      );
    }
  }

  public onNextCreateTasks(data: TaskCreate) {
    this.dataFormCreateTask = data;
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.BULK_TASKS_IS_CREATING
    );
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  public handleCancelModalCreateTasks() {
    if (this.statePopup === PopUpBulkCreateTasks.CREATE_TASKS) {
      this.onCancel.emit();
    }
  }

  public handleCompleteCreateTasks(data: CalendarEventBulkCreateTaskSuccess) {
    if (data) {
      this.taskTemplate = data.template;
      this.listEventsSuccessBulkCreateTask = data.events;
      this.tasksCreated = data.tasks;
      this.handleUpdateLinkTask();
    }
    this.onCompleteCreateTasks.emit();
  }

  handleUpdateLinkTask() {
    const listEventId = this.listEventsSuccessBulkCreateTask.map((e) => e?.id);
    this.updateCalendarDashboard(listEventId);
  }

  updateCalendarDashboard(listEventId) {
    this.store.dispatch(
      calendarDashboardActions.increaseTotalLinkedTask({ listEventId })
    );
  }

  public handleCompleteSendMessages() {
    this.onCompleteSendMessages.emit();
  }

  private mapEventType(type: EEventType): EEventType {
    switch (type) {
      case EEventType.GENERAL_EXPIRY:
      case EEventType.SMOKE_ALARM_EXPIRY:
        return EEventType.COMPLIANCE_EXPIRY;
      case EEventType.SMOKE_ALARM_NEXT_SERVICE:
      case EEventType.GENERAL_NEXT_SERVICE:
        return EEventType.COMPLIANCE_NEXT_SERVICE;
      default:
        return type;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
