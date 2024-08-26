import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';
import dayjs from 'dayjs';
import { FrequencyRental } from '@shared/types/trudi.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { diffDaysUTCByLocalDate } from '@core';

@Component({
  selector: 'app-lease-share',
  templateUrl: './lease-share.component.html',
  styleUrls: ['./lease-share.component.scss']
})
export class LeaseShareComponent implements OnInit, OnDestroy {
  @Input() startDate: string;
  @Input() endDate: string;
  @Input() dayRemaining: number;
  @Input() rentAmount: number;
  @Input() frequency: string;
  @Input() crmSystemId: string;
  @Input() paidDate: string;
  @Input() forceShowRentAmount: boolean = false;
  @ViewChild('tenant') tenant: ElementRef;
  public isLoading = false;
  public endDay: string;
  public endMonthYear: string;
  public leaseTerm: string;
  public firstName: string;
  public lastName: string;
  endLeaseDay: string;
  startLeaseDay: string;
  paidLeaseDay: string;
  dateDuration: number;
  daysInProgress: number;
  dayRemain: number;
  progress: number;
  timeOfLease = '';
  leaseFequency: string;
  public readonly ECrmSystemId = ECrmSystemId;
  private unsubscribe = new Subject<void>();

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit() {
    this.leaseFequency = this.formatLeaseFequency(this.frequency);
    const tz = this.agencyDateFormatService.getCurrentTimezone();
    this.endLeaseDay = this.endDate
      ? this.agencyDateFormatService.formatTimezoneDate(
          this.endDate,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        )
      : '- -/- -/- -';
    this.startLeaseDay = this.startDate
      ? this.agencyDateFormatService.formatTimezoneDate(
          this.startDate,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        )
      : '- -/- -/- -';
    this.paidLeaseDay = this.paidDate
      ? this.agencyDateFormatService.formatTimezoneDate(
          this.paidDate,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        )
      : '- -/- -/- -';
    try {
      this.dateDuration = diffDaysUTCByLocalDate(
        this.startDate,
        this.endDate,
        tz.value
      );
    } catch (err) {
      this.dateDuration = 0;
    }
    this.daysInProgress =
      dayjs().utc() > dayjs(this.endDate)
        ? this.dateDuration
        : diffDaysUTCByLocalDate(
            this.startDate,
            dayjs().utc().toISOString(),

            tz.value
          );

    this.dayRemain = this.dayRemaining;

    if (!this.endDate && !this.startDate) {
      this.timeOfLease = '- - Lease';
      this.progress = 0;
    } else if (this.endLeaseDay === this.startLeaseDay) {
      this.progress = 100;
    }

    if (this.startDate && !this.endDate) {
      this.dayRemain = -1;
      this.progress = 0;
    }

    if (this.dateDuration && this.daysInProgress && this.daysInProgress >= 0) {
      this.progress = (this.daysInProgress / this.dateDuration) * 100;
    }
    if (dayjs(this.startDate) > dayjs().utc()) {
      this.progress = 0;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private formatLeaseFequency(frequency) {
    switch (frequency) {
      case FrequencyRental.DAILY:
        return '/ day';
      case FrequencyRental.WEEKLY:
        return '/ week';
      case FrequencyRental.FORTNIGHT:
        return '/ fortnight';
      case FrequencyRental.MONTHLY:
        return '/ month';
      case FrequencyRental.QUARTERLY:
        return '/ quarter';
      case 'YEARLY':
        return '/ year';
      default:
        return '';
    }
  }
}
