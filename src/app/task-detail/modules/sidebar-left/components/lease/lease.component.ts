import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';
import { Subject } from 'rxjs';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'app-lease-tab',
  templateUrl: './lease.component.html',
  styleUrls: ['./lease.component.scss']
})
export class LeaseComponent implements OnInit, OnDestroy {
  @Input() startDate: string;
  @Input() endDate: string;
  @Input() dayRemaining: number;
  @ViewChild('tenant') tenant: ElementRef;
  private unsubscribe = new Subject<void>();
  public isLoading = false;
  public endDay: string;
  public endMonthYear: string;
  public leaseTerm: string;
  public firstName: string;
  public lastName: string;
  public dateFormatDay =
    this.agencyDateFormatService.dateFormat$.getValue().DATE_FORMAT_DAYJS;
  endLeaseDay: string;
  startLeaseDay: string;
  dateDuration: number;
  daysInProgress: number;
  dayRemain: number;
  progress: number;
  timeOfLease = '';

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit() {
    this.endLeaseDay = this.endDate
      ? dayjs(this.endDate).format(this.dateFormatDay)
      : '- -/- -/- -';
    this.startLeaseDay = this.startDate
      ? dayjs(this.startDate).format(this.dateFormatDay)
      : '- -/- -/- -';
    this.dateDuration = dayjs(this.endDate).diff(dayjs(this.startDate), 'days');
    this.daysInProgress =
      dayjs(new Date()) > dayjs(this.endDate)
        ? this.dateDuration
        : dayjs(new Date()).diff(dayjs(this.startDate), 'days');
    // const dayRemaining = this.daysInProgress < 0 ? this.dateDuration : this.dateDuration - this.daysInProgress;
    // this.dayRemain = dayRemaining;
    // if (dayRemaining !== NaN && this.endDate && dayjs(this.endDate) >= dayjs(this.startDate) && dayjs(this.endDate) >= dayjs(today)) {
    //   this.dayRemain = dayRemaining + 1;
    // }
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
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /*addNewLease() {
    const agencyId = this.agencyService.currentAgencyId.getValue();
    const options = [`add-new-lease/${agencyId}/${this.currentProperty.id}/new`];
    this.router.navigate(options);
  }

  agoToSummaryLease() {
    const agencyId = this.agencyService.currentAgencyId.getValue();
    this.router.navigate([`lease-summary/${agencyId}/${this.currentProperty.id}/${this.isLeaseExist}`]);
  }*/
}
