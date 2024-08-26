import {
  closeNotification,
  openNotification
} from '@/app/dashboard/animation/triggerNotificationAnimation';
import { transition, trigger, useAnimation } from '@angular/animations';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, filter, switchMap, takeUntil } from 'rxjs';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import {
  IHistoricalEvent,
  LinkedTaskListDataType
} from '@shared/types/calendar.interface';
import {
  ECurrentTab,
  EEventStatus,
  EEventType,
  EMailBoxStatus,
  EPropertyStatus,
  TaskType
} from '@shared/enum';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';
import { Router } from '@angular/router';
import { TaskItemDropdown } from '@shared/types/task.interface';
import { EventsTabApiService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab-api.service';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EventsTabService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab.service';
import { TaskService } from '@services/task.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  EPropertyProfileStep,
  EPropertyProfileTabIndex
} from '@shared/components/property-profile/enums/property-profile.enum';
import { NavigatorService } from '@services/navigator.service';

@Component({
  selector: 'detail-event',
  templateUrl: './detail-event.component.html',
  styleUrls: ['./detail-event.component.scss'],
  animations: [
    trigger('openClose', [
      transition(':enter', [useAnimation(openNotification)]),

      transition(':leave', [useAnimation(closeNotification)])
    ])
  ]
})
export class DetailEventComponent implements OnInit, OnDestroy {
  public calendarEvent: ICalendarEvent;
  public currentTab: ECurrentTab = ECurrentTab.LINKED_TASKS;
  public eventLinkedTaskList: LinkedTaskListDataType;
  public readonly ECurrentTab = ECurrentTab;
  public listOfHistoricalEvents: IHistoricalEvent[];
  private unsubscribe = new Subject<void>();
  public hasAddAccount: boolean = false;
  public syncMailboxStatus: EMailBoxStatus;
  readonly EEventStatus = EEventStatus;
  readonly EPropertyStatus = EPropertyStatus;
  public isLoading = true;
  public selectedEvent: ICalendarEvent;
  public taskNames: TaskItemDropdown[] = [];

  constructor(
    private readonly router: Router,
    private readonly inboxSidebarService: InboxSidebarService,
    private readonly inboxService: InboxService,
    private readonly eventsTabApiService: EventsTabApiService,
    private readonly propertyProfileService: PropertyProfileService,
    public readonly eventsTabService: EventsTabService,
    private readonly cdr: ChangeDetectorRef,
    private agencyService: AgencyService,
    private taskService: TaskService,
    private navigatorService: NavigatorService,
    private _propertyProfileService: PropertyProfileService
  ) {}
  ngOnInit(): void {
    const agency = this.propertyProfileService.getCurrentCompany();
    combineLatest([this.eventsTabApiService.getEventLinkedTaskListData$()])
      .pipe(
        takeUntil(this.unsubscribe),
        filter(([task]) => !!task && !!agency)
      )
      .subscribe(([task]) => {
        this.isLoading = false;

        if (
          task?.eventType === EEventType.ENTRY_NOTICE ||
          task?.eventType === EEventType.ISSUE ||
          task?.eventType === EEventType.CUSTOM_EVENT
        ) {
          if ([EEventType.ENTRY_NOTICE].includes(task?.eventType)) {
            task.eventName = 'Property entry - ' + task?.eventName;
          }
          this.eventLinkedTaskList = { ...task, defaultTime: task.eventDate };
        } else {
          this.eventLinkedTaskList = task;
        }
        this.cdr.markForCheck();
      });

    this.eventsTabApiService
      .getHistoricalEventLists()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.listOfHistoricalEvents = res;
      });

    this.eventsTabApiService
      .getLinkEvent$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.calendarEvent = res;
      });

    this.checkDisableAddToTask();

    this.agencyService.listTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.taskNames = this.taskService.createTaskNameList();
      });

    this.eventsTabApiService.refetchEventDetail$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() =>
          this.eventsTabApiService.getLinkedTaskList(this.calendarEvent.id)
        )
      )
      .subscribe((linked) => {
        this.eventsTabApiService.setEventLinkedTaskListData(linked);
      });
  }

  handleClickBack(): void {
    this.eventsTabService.setEventId(null);
    this.propertyProfileService.setCurrentStep(null);
    this.propertyProfileService.setSelectedTab(2);
  }

  onAddToTask() {
    this.taskService.calendarEventSelected$.next(this.calendarEvent);
    this.selectedEvent = this.calendarEvent;
  }

  get isEventCancelled() {
    return this.calendarEvent?.eventStatus == EEventStatus.CANCELLED;
  }

  get isEventClosed() {
    return this.calendarEvent?.eventStatus == EEventStatus.CLOSED;
  }

  onNavigateToTask(taskId) {
    if (!this.hasAddAccount) {
      return;
    }

    this.navigatorService.setReturnUrl(this.router.url);
    this.router.navigate([stringFormat(AppRoute.TASK_DETAIL, taskId)], {
      queryParams: {
        type: TaskType.TASK,
        keepReturnUrl: true
      },
      replaceUrl: true
    });
  }

  handleClickAddress() {
    if (this.eventLinkedTaskList?.propertyStatus === EPropertyStatus.deleted)
      return;

    this._propertyProfileService.setSelectedTab(
      EPropertyProfileTabIndex.DETAILS
    );
    this._propertyProfileService.navigateToStep(
      EPropertyProfileStep.PROPERTY_DETAIL,
      this.eventLinkedTaskList.propertyId
    );
  }

  setCurrentTab(currentTab: ECurrentTab) {
    if (this.currentTab === currentTab) return;
    this.currentTab = currentTab;
  }

  checkDisableAddToTask() {
    combineLatest([
      this.inboxSidebarService.getAccountAdded(),
      this.inboxService.getSyncMailBoxStatus()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([accountAdded, syncMailboxStatus]) => {
        this.hasAddAccount = accountAdded;
        this.syncMailboxStatus = syncMailboxStatus;
      });
  }

  handleCloseModal() {
    this.selectedEvent = null;
    this.taskService.calendarEventSelected$.next(null);
  }

  ngOnDestroy() {
    this.eventsTabApiService.clearDetailEventdata();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
