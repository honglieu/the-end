import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'app-time-detail-routine',
  templateUrl: './time-detail-routine.component.html',
  styleUrls: ['./time-detail-routine.component.scss']
})
export class TimeDetailRoutineComponent implements OnInit {
  @Input() reminderTime: Date;
  @Input() scheduleDate: Date;
  @Input() specialStringDue: string;
  @Input() additionalInfo: string;
  @Input() isDateUnknown: boolean = false;

  formatDate: Date;
  numberOfDate: string;
  timePrefix: string;
  tz = this.agencyDateFormatService.getCurrentTimezone();
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnChanges(changes: SimpleChanges) {
    const scheduleDate = dayjs(this.scheduleDate);
    const reminderTime = dayjs(this.reminderTime).startOf('day');

    this.formatDate =
      dayjs(this.scheduleDate).tz(this.tz?.value).toDate() ||
      this.agencyDateFormatService.initTimezoneToday().nativeDate;
    const diffDay = scheduleDate.startOf('day').diff(reminderTime, 'day');

    this.timePrefix =
      this.specialStringDue === 'Routine Inspection'
        ? 'before'
        : diffDay >= 0
        ? 'before'
        : 'after';

    if (Math.abs(diffDay) > 0 && Math.abs(diffDay) < 10)
      this.numberOfDate = '0' + (diffDay < 0 ? diffDay * -1 : diffDay);
    else this.numberOfDate = (diffDay < 0 ? diffDay * -1 : diffDay).toString();
  }

  ngOnInit(): void {}
}
