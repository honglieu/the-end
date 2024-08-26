import { EEventTypes, ERMEvents } from '@shared/enum';
import { IHistoricalEvent } from '@shared/types/calendar.interface';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { EHistoricalEventStatus } from '@shared/enum/calendar.enum';

@Component({
  selector: 'historical-event',
  templateUrl: './historical-event.component.html',
  styleUrls: ['./historical-event.component.scss']
})
export class HistoricalEventComponent implements OnInit {
  @Input() isEventLatest: boolean = false;
  @Input() event: IHistoricalEvent;
  @Input() eventName: ERMEvents | EEventTypes;
  public startTime: string;
  public endTime: string;
  public status: EHistoricalEventStatus;
  public readonly EHistoricalEventStatus = EHistoricalEventStatus;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    switch (this.eventName) {
      case ERMEvents.ISSUE: {
        this.startTime = this.event?.eventDate;
        this.endTime = null;
        break;
      }
      case 'Routine Inspection' as EEventTypes: {
        this.startTime = this.event?.startTime;
        this.endTime = this.event?.endTime;
        const status = this.event?.status;
        this.status =
          status === EHistoricalEventStatus.CANCEL
            ? EHistoricalEventStatus.CANCELLED
            : status;
        break;
      }
      default:
        this.startTime = this.event?.startTime;
        this.endTime = this.event?.endTime;
        this.status = this.event?.status;
    }
  }
}
