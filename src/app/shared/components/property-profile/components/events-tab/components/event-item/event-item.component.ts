import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core/util';
import { EEventStatus, EEventType, TaskType } from '@shared/enum';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';

import { EventsTabService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab.service';
import {
  ELinkTaskStatus,
  EPropertyProfileStep
} from '@shared/components/property-profile/enums/property-profile.enum';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EventsTabApiService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab-api.service';
import { CALENDAR_WIDGET_EXPIRED_DAYS } from '@services/constants';

@Component({
  selector: 'event-item',
  templateUrl: './event-item.component.html',
  styleUrls: ['./event-item.component.scss']
})
export class EventItemComponent {
  @Input() eventItem: ICalendarEvent;
  public isShowDetailEvent: boolean = false;
  public EEventStatus = EEventStatus;
  public EEventType = EEventType;
  public calenderWidgetExpiredDays: {
    [type: string]: number;
  } = CALENDAR_WIDGET_EXPIRED_DAYS;
  public ELinkTaskStatus = ELinkTaskStatus;

  constructor(
    private router: Router,
    public readonly propertyProfileService: PropertyProfileService,
    public readonly eventsTabApiService: EventsTabApiService,
    public readonly eventsTabService: EventsTabService
  ) {}

  onNavigateToTask(taskId) {
    this.router.navigate([stringFormat(AppRoute.TASK_DETAIL, taskId)], {
      queryParams: {
        type: TaskType.TASK
      },
      replaceUrl: true
    });
  }

  openLinkEvent() {
    this.eventsTabService.eventNameDetail$.next(this.eventItem.eventName);
    this.eventsTabService.setEventId(this.eventItem.id);
    this.propertyProfileService.navigateToStep(
      EPropertyProfileStep.EVENT_DETAIL,
      this.eventItem.id
    );
  }
}
