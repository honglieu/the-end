import { Component, Input } from '@angular/core';
import { ECalendarEvent } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';

@Component({
  selector: 'calendar-event-step',
  templateUrl: './calendar-event.component.html',
  styleUrls: ['./calendar-event.component.scss']
})
export class CalendarEventComponent {
  @Input() model: TrudiStep;
  public readonly calendarEventType = ECalendarEvent;
}
