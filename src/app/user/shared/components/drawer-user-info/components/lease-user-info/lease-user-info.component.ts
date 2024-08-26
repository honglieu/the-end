import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { TENANCY_STATUS } from '@services/constants';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { ECrmStatus } from '@/app/user/utils/user.enum';
import {
  IUserPropertyGroup,
  IUserPropertyGroupLeases,
  IUserPropertyV2,
  RMDisplayStatus
} from '@/app/user/utils/user.type';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import dayjs from 'dayjs';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lease-user-info',
  templateUrl: './lease-user-info.component.html',
  styleUrls: ['./lease-user-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaseUserInfoComponent implements OnInit, OnChanges, OnDestroy {
  @Input() userProperty: IUserPropertyV2;
  public isRmSystem: boolean;
  public userLeaseCard: IUserPropertyGroup;
  public leaseGroup: IUserPropertyGroupLeases;
  public subscriber = new Subject<void>();
  public readonly EUserPropertyType = EUserPropertyType;
  public readonly ECrmSystemId = ECrmSystemId;
  public isShowOriginLease: boolean;
  public isShowStartLease: boolean;
  public tenancyStatus = TENANCY_STATUS;
  public rmDisplayStatus = RMDisplayStatus;
  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    private userAgentService: UserAgentService,
    private agencyService: AgencyService,
    private companyService: CompanyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userProperty']?.currentValue) {
      this.getLeaseCard();
    }
  }

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.subscriber))
      .subscribe((company) => {
        this.isRmSystem = this.agencyService.isRentManagerCRM(company);
      });
  }

  getLeaseCard() {
    if (!this.userProperty?.userPropertyGroup) return;
    this.userLeaseCard = this.userProperty.userPropertyGroup;
    this.leaseGroup = { ...this.userProperty.userPropertyGroup.lease };

    this.leaseGroup.frequency = this.userAgentService.formatLeaseFequency(
      this.leaseGroup.frequency
    );
    this.userLeaseCard.status = this.handleStatus(this.userLeaseCard?.status);

    if (this.userLeaseCard?.type === EUserPropertyType.TENANCY) {
      this.leaseGroup.formatStartDate = this.formatDateDayJS(
        this.leaseGroup?.startDate
      );
      this.leaseGroup.formatEndDate = this.formatDateDayJS(
        this.leaseGroup?.endDate
      );
    } else {
      this.userProperty.property.authorityStartDate = this.formatDateCharacter(
        this.userProperty.property.authorityStartDate
      );
      this.userProperty.property.authorityEndDate = this.formatDateCharacter(
        this.userProperty.property.authorityEndDate
      );
    }

    const endDateDayJs = dayjs(this.leaseGroup?.endDate).startOf('day');
    const startDateDayJs = dayjs(this.leaseGroup?.startDate).startOf('day');
    const originalLeaseStartDateDayJs = dayjs(
      this.leaseGroup?.originalLeaseStartDat
    ).startOf('day');
    const today = dayjs().startOf('day');
    const startDate = today.isSameOrAfter(startDateDayJs)
      ? today
      : startDateDayJs;
    const remainDate = this.leaseGroup?.endDate
      ? endDateDayJs.diff(startDate, 'days')
      : 0;

    this.leaseGroup.dayRemaining = remainDate > 0 ? remainDate + 1 : 0;

    this.isShowOriginLease = today.isSameOrAfter(originalLeaseStartDateDayJs);
    this.isShowStartLease = today.isSameOrAfter(startDateDayJs);

    this.leaseGroup.originalLeaseStartFormat = this.formatDateCharacter(
      this.leaseGroup.originalLeaseStartDat
    );
    this.leaseGroup.formatLeaseStartDate = this.formatDateCharacter(
      this.leaseGroup.startDate
    );

    this.leaseGroup.rentedDate = this.getDateDiff(
      originalLeaseStartDateDayJs,
      today
    );
    this.leaseGroup.rentedStartDate = this.getDateDiff(startDateDayJs, today);

    if (
      !this.leaseGroup.startDate ||
      !this.leaseGroup.endDate ||
      today.isBefore(startDateDayJs)
    ) {
      this.leaseGroup.progress = 0;
    } else if (today.isAfter(endDateDayJs)) {
      this.leaseGroup.progress = 100;
    } else {
      const dateDuration = endDateDayJs.diff(startDateDayJs, 'days');
      const dateInProgress = today.diff(startDateDayJs, 'days');
      this.leaseGroup.progress = (dateInProgress / dateDuration) * 100;
    }
    this.leaseGroup.paidTo = this.formatDateDayJS(this.leaseGroup.paidTo);
  }

  formatDateDayJS(date: string) {
    return date
      ? this.agencyDateFormatService.formatTimezoneDate(
          date,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        )
      : '- -/- -/- -';
  }

  formatDateCharacter(date: string) {
    return dayjs(date).isValid()
      ? this.agencyDateFormatService.formatTimezoneDate(
          date,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_CHARECTOR
        )
      : '- -/- -/- -';
  }

  getDateDiff(start: dayjs.Dayjs, end: dayjs.Dayjs) {
    const years = end.diff(start, 'years');
    start = start.add(years, 'years');
    const months = end.diff(start, 'months');
    start = start.add(months, 'months');
    const days = end.diff(start, 'days');

    const yearStr = years > 1 || years == 0 ? 'years' : 'year';
    const monthStr = months > 1 || months == 0 ? 'months' : 'month';
    const dayStr = days > 1 || days == 0 ? 'days' : 'day';
    let rentedString = '';
    if (years > 0) {
      rentedString += `${years} ${yearStr} `;
    }
    if (months > 0) {
      rentedString += `${months} ${monthStr} `;
    }
    if (days > 0) {
      rentedString += `${days} ${dayStr}`;
    }
    return rentedString.trim();
  }

  handleStatus(status: string) {
    if (this.isRmSystem) {
      return this.rmDisplayStatus[status] || status;
    }

    const vacateDate = this.userProperty?.userPropertyGroup?.lease?.vacateDate;
    if (status === ECrmStatus.ACTIVE && dayjs(vacateDate).isValid()) {
      if (dayjs().isAfter(dayjs(vacateDate))) {
        return this.tenancyStatus.vacated;
      }
      return this.tenancyStatus.vacating;
    }

    return status;
  }

  ngOnDestroy() {
    this.subscriber.next();
    this.subscriber.complete();
  }
}
