import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { trigger, transition, useAnimation } from '@angular/animations';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, takeUntil, filter } from 'rxjs';
import {
  closeNotification,
  openNotification
} from '@/app/dashboard/animation/triggerNotificationAnimation';
import { CalendarEventService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/services/calendar-event.service';
import {
  IHistoricalEvent,
  LinkedTaskListDataType
} from '@shared/types/calendar.interface';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { TaskService } from '@services/task.service';
import {
  ECurrentTab,
  EEventStatus,
  EEventType,
  EHistoricalEventStatus
} from '@shared/enum/calendar.enum';
import { ChildActivationStart, Router } from '@angular/router';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EPropertyStatus } from '@shared/enum/user.enum';
import { ECRMId } from '@shared/enum/share.enum';
import { TIME_FORMAT, TIME_ZONE_UTC } from '@services/constants';
import { stringFormat } from '@core';
import { AppRoute } from '@/app/app.route';
import { CompanyService } from '@/app/services/company.service';
import { ETypePage } from '@/app/user/utils/user.enum';
import { NotificationService } from '@services/notification.service';

@Component({
  selector: 'linked-tasks',
  templateUrl: './linked-tasks.component.html',
  styleUrls: ['./linked-tasks.component.scss'],
  animations: [
    trigger('openClose', [
      transition(':enter', [useAnimation(openNotification)]),

      transition(':leave', [useAnimation(closeNotification)])
    ])
  ]
})
export class LinkedTasksComponent implements OnInit, OnDestroy, AfterViewInit {
  public calendarEvent: ICalendarEvent;
  public isShowLinkTaskBS;
  public isShowLinkTask: boolean = false;
  public visible: boolean = false;
  public currentTab: ECurrentTab = ECurrentTab.LINKED_TASKS;
  public eventLinkedTaskList: LinkedTaskListDataType;
  public taskStatusType: TaskStatusType;
  public readonly ECurrentTab = ECurrentTab;
  public currentAgencyId: string;
  public destroyRef: () => void;
  public listOfHistoricalEvents: IHistoricalEvent[];
  readonly EHistoricalEventStatus = EHistoricalEventStatus;
  private unsubscribe = new Subject<void>();
  public hasAddAccount: boolean = false;
  public syncMailboxStatus: EMailBoxStatus;
  public typeCRM: ECRMId;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly EEventStatus = EEventStatus;
  readonly EPropertyStatus = EPropertyStatus;
  readonly ECRMId = ECRMId;
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly TIME_ZONE_UTC = TIME_ZONE_UTC;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public isLoading = true;
  public visiblePropertyProfile = false;
  public displayBackButton = true;
  public isShowLinkAfterClickButton = false;
  constructor(
    private calendarEventService: CalendarEventService,
    private taskService: TaskService,
    private router: Router,
    private inboxSidebarService: InboxSidebarService,
    public inboxService: InboxService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    combineLatest([
      this.calendarEventService.getEventLinkedTaskListData$(),
      this.companyService.getCurrentCompany()
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        filter(([task, agency]) => !!task && !!agency)
      )
      .subscribe(([task, agency]) => {
        this.typeCRM = agency?.CRM as ECRMId;
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
        this.isLoading = false;
      });
    this.calendarEventService
      .getHistoricalEventLists()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.listOfHistoricalEvents = res;
      });
    this.subscribeIsShowLinkTask();
    this.checkDisableCreateTask();
    this.subscribeOpenNotification();
  }
  ngAfterViewInit() {
    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((rs) => {
      if (rs instanceof ChildActivationStart) {
        setTimeout(() => {
          this.destroyRef();
        }, 0);
      }
    });
  }
  subscribeIsShowLinkTask() {
    this.isShowLinkTaskBS
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        this.isShowLinkTask = isShow;
      });
  }

  handleClickOutside(): void {
    const checkToShow =
      this.visiblePropertyProfile || this.isShowLinkAfterClickButton;
    this.isShowLinkTaskBS.next(checkToShow);
    this.isShowLinkAfterClickButton = !checkToShow;
  }

  handleAnimationEnd(): void {
    if (!this.isShowLinkTask) this.destroyRef();
  }

  onCreateTask() {
    this.taskService.calendarEventSelected$.next(this.calendarEvent);
  }

  get isEventCancelled() {
    return this.calendarEvent.eventStatus == EEventStatus.CANCELLED;
  }

  get isEventClosed() {
    return this.calendarEvent.eventStatus == EEventStatus.CLOSED;
  }

  onNavigateToTask(taskId) {
    if (!this.hasAddAccount) {
      return;
    }
    this.router.navigate([stringFormat(AppRoute.TASK_DETAIL, taskId)], {
      queryParams: {
        type: TaskType.TASK,
        createFromCalendar: true
      },
      replaceUrl: true
    });
    this.handleClickOutside();
  }

  setCurrentTab(currentTab: ECurrentTab) {
    if (this.currentTab === currentTab) return;
    this.currentTab = currentTab;
  }

  calculateElementHeight(inputHeight: number): string | void {
    if (!inputHeight || inputHeight < 0) return;
    return `calc(100vh - ${inputHeight}px)`;
  }

  checkDisableCreateTask() {
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

  handleOpenPropertyProfile() {
    const { propertyId, propertyStatus } = this.eventLinkedTaskList || {};
    if (propertyStatus === EPropertyStatus.deleted || !propertyId) return;
    this.visiblePropertyProfile = true;
  }

  handleClickBackBtn() {
    this.isShowLinkAfterClickButton = true;
    this.visiblePropertyProfile = false;
    this.isShowLinkTaskBS.next(true);
  }

  subscribeOpenNotification() {
    this.notificationService
      .getIsShowNotification()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        if (isShow) {
          this.visiblePropertyProfile = false;
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  protected readonly ETypePage = ETypePage;
}
