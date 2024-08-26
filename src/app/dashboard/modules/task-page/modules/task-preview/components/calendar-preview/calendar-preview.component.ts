import { TaskPreviewService } from '@/app/dashboard/modules/task-page/modules/task-preview/services/task-preview.service';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { ITaskPreviewCalender } from '@shared/types/task.interface';

@Component({
  selector: 'calendar-preview',
  templateUrl: './calendar-preview.component.html',
  styleUrls: ['./calendar-preview.component.scss']
})
export class CalendarPreviewComponent implements OnInit, OnChanges {
  @Input() calendarEvents: ITaskPreviewCalender[] = [];
  @Input() taskId: string = '';
  @Input() displayLabel: boolean = true;
  @Input() icon: string = 'calendar2';
  @Input() calenderWidgetExpiredDays: {
    [type: string]: number;
  };
  public EEventStatus = EEventStatus;
  public isNotValidToRender: boolean;
  public notOpenStatus = {
    [EEventStatus.CANCELLED]: 'cancelled',
    [EEventStatus.CLOSED]: 'closed'
  };

  constructor(
    private router: Router,
    private taskPreviewService: TaskPreviewService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.['calendarEvents'] &&
      changes?.['calendarEvents'].currentValue
    ) {
      // if the list has no calendarEvent than render calendarTemplate (html)
      this.isNotValidToRender = this.calendarEvents.every(
        (item) => !item.calendarEvent
      );
      this.calendarEvents = this.calendarEvents?.sort(
        (a, b) =>
          new Date(a?.calendarEvent?.eventDate).getTime() -
          new Date(b?.calendarEvent?.eventDate).getTime()
      );
    }
  }

  ngOnInit(): void {}

  navigateToTaskDetail() {
    this.taskPreviewService.setTriggerOpenTaskFormCalender(true);
    this.router.navigate(['dashboard', 'inbox', 'detail', this.taskId], {
      queryParams: {
        type: 'TASK'
      },
      queryParamsHandling: 'merge'
    });
  }
}
