import { Component, Input, SimpleChanges } from '@angular/core';
import { TIME_FORMAT } from '@services/constants';
import { EHistoricalEventStatus } from '@shared/enum/calendar.enum';
import { EEventTypes, ERMEvents } from '@shared/enum/share.enum';
import { IHistoricalEvent } from '@shared/types/calendar.interface';
import { AgencyDateFormatService } from './../../../../../../services/agency-date-format.service';

@Component({
  selector: 'historical-event',
  templateUrl: './historical-event.component.html',
  styleUrls: ['./historical-event.component.scss']
})
export class HistoricalEventComponent {
  readonly TIME_FORMAT = TIME_FORMAT;
  @Input() isEventLatest: boolean = false;
  @Input() event: IHistoricalEvent;
  @Input() eventName: ERMEvents | EEventTypes;
  public startTime: string;
  public endTime: string;
  public status: EHistoricalEventStatus;
  public readonly EHistoricalEventStatus = EHistoricalEventStatus;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
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
