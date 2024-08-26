import { EButtonType, EButtonWidget, StepKey } from '@trudi-ui';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { PreventButtonService } from '@trudi-ui';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TaskService } from '@services/task.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'popup-widget-calendar',
  templateUrl: './popup-widget-calendar.component.html',
  styleUrl: './popup-widget-calendar.component.scss'
})
export class PopupWidgetCalendarComponent implements OnInit, OnDestroy {
  public isShowSelectEventPopup: boolean = false;
  public modalId = StepKey.eventStep.calendarEvent;
  private unsubscribe = new Subject<void>();
  public subTitle: string;
  public isConsole: boolean = false;
  public isArchiveMailbox: boolean;
  public taskId: string;

  constructor(
    public sharedService: SharedService,
    public taskService: TaskService,
    private inboxService: InboxService,
    private eventCalendarService: EventCalendarService,
    private agencyDateFormatService: AgencyDateFormatService,
    private toastrService: ToastrService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isArchiveMailbox) => {
        this.isArchiveMailbox = isArchiveMailbox;
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.taskId = res.id;
        }
      });

    this.eventCalendarService.isShowSelectEventPopup
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isShowSelectEventPopup = res;
      });

    this.agencyDateFormatService.timezone$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((tz) => {
        this.subTitle = `Times displayed in ${tz?.abbrev} ${tz?.gmt}`;
      });
  }

  handleSelectEvent() {
    const newEventChecked = this.eventCalendarService.getNewLinkEvent();
    const newEventUnchecked = this.eventCalendarService.getNewUnlinkEvent();
    const linkApi = this.eventCalendarService.linkToEvent({
      taskId: this.taskId,
      calendarEventIds: [...newEventChecked.map((ev) => ev.id)]
    });
    const unlinkApi = this.eventCalendarService.unlinkToEvent({
      taskId: this.taskId,
      calendarEventIds: [...newEventUnchecked.map((ev) => ev.id)]
    });
    let observables = [];

    if (newEventChecked.length) {
      observables.push(linkApi);
    }
    if (newEventUnchecked.length) {
      observables.push(unlinkApi);
    }
    forkJoin(observables).subscribe({
      next: (res) => {
        this.eventCalendarService.refreshListEventCalendarWidget(this.taskId);
      },
      error: () => {
        this.toastrService.error('Please try again');
      }
    });
    this.eventCalendarService.isShowSelectEventPopup.next(false);
    this.preventButtonService.deleteProcess(
      EButtonWidget.CALENDAR,
      EButtonType.WIDGET
    );
  }

  closePopup() {
    this.eventCalendarService.isShowSelectEventPopup.next(false);
    this.preventButtonService.deleteProcess(
      EButtonWidget.CALENDAR,
      EButtonType.WIDGET
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.eventCalendarService.refreshListEventCalendarWidget(null);
  }
}
