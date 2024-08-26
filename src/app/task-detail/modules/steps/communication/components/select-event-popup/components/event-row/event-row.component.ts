import { Component, Input, Output, EventEmitter } from '@angular/core';
import { EEventType } from '@shared/enum/calendar.enum';
import {
  ICalendarEvent,
  ITaskLinkCalendarEvent,
  ITaskLinkCalendarEventResponse
} from '@/app/task-detail/modules/steps/communication/interfaces/calendar-event.interface';
@Component({
  selector: 'event-row',
  templateUrl: './event-row.component.html',
  styleUrls: ['./event-row.component.scss']
})
export class EventRowComponent {
  @Input() rowData: ITaskLinkCalendarEventResponse;
  @Input() lastRowData: boolean;
  @Input() checked: boolean;
  @Output() onOptionChange = new EventEmitter();

  public readonly EEventType = EEventType;
  ngOnInit() {}
  handleChangeSelected(event: Event, dataRow: ICalendarEvent) {
    this.onOptionChange.emit({ isChecked: event, eventDataRow: dataRow });
  }
  trackByListEvent(_, row: ITaskLinkCalendarEvent) {
    return row.id;
  }
}
