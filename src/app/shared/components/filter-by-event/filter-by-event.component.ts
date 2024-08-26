import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { ICalendarEventFilterTask } from '@shared/types/calendar.interface';
import { Subject } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SHORT_ISO_DATE } from '@services/constants';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';

@Component({
  selector: 'filter-by-event',
  templateUrl: './filter-by-event.component.html',
  styleUrls: ['./filter-by-event.component.scss']
})
export class FilterByEventComponent implements OnInit, OnDestroy {
  constructor(
    private formBuilder: FormBuilder,
    private agencyDateFormatService: AgencyDateFormatService,
    private router: Router,
    private titleCasePipe: TrudiTitleCasePipe,
    private inboxFilterService: InboxFilterService
  ) {}
  public formFilterEvent: FormGroup;
  public isShowRangePicker: boolean = false;
  public rangeDateHasValue: boolean = false;
  public readonly datePickerFormatPipe$ =
    this.agencyDateFormatService.dateFormatPipe$;
  @Input() disabled: boolean;
  @Input() calendarEventList: ICalendarEventFilterTask[] = [];
  @Input() popoverPlacement: string;
  @Input() prefixIcon: string;

  private _destroy$ = new Subject<void>();

  public rangeDate = [null, null];

  ngOnInit() {
    this.buildFromCalendarEventFilter(
      this.inboxFilterService.getSelectedCalendarEventCurrentId().getValue()
    );

    this.formFilterEvent.valueChanges.subscribe((valueFrom) => {
      let valueSelectedCalendar = {
        eventType: valueFrom['eventType'],
        startDate: valueFrom['startDate']
          ? dayjs(valueFrom['startDate']).format(SHORT_ISO_DATE)
          : null,
        endDate: valueFrom['endDate']
          ? dayjs(valueFrom['endDate']).format(SHORT_ISO_DATE)
          : null
      };
      if (!this.formFilterEvent.getError('dateRangeError')) {
        this.router.navigate([], {
          queryParams: {
            ...valueSelectedCalendar,
            taskId: ''
          },
          queryParamsHandling: 'merge'
        });
        this.inboxFilterService.setSelectedCalendarEventId(
          valueSelectedCalendar
        );
      }
    });
  }

  ngOnChanges() {
    if (this.calendarEventList.length) {
      this.calendarEventList = this.calendarEventList.map((item) => {
        return {
          ...item,
          title: this.titleCasePipe.transform(item.title)
        };
      });
    }
  }

  handleClearValue() {
    this.formFilterEvent.reset();
    this.rangeDate = [null, null];
    this.rangeDateHasValue = false;
  }

  buildFromCalendarEventFilter(fromValue) {
    let isBuildFromcalendarEvent = Object.keys(fromValue).some(
      (key) => fromValue[key] !== null && fromValue[key] !== undefined
    );

    if (isBuildFromcalendarEvent) {
      this.rangeDate = [fromValue['startDate'], fromValue['endDate']];
      this.rangeDateHasValue = !!this.rangeDate[0] || !!this.rangeDate[1];
      this.formFilterEvent = this.formBuilder.group({
        eventType: [fromValue['eventType']],
        startDate: [fromValue['startDate']],
        endDate: [fromValue['endDate']]
      });
    } else {
      this.formFilterEvent = this.formBuilder.group({
        eventType: [],
        startDate: [null],
        endDate: [null]
      });
    }
  }

  handleChangeValue(value) {
    this.rangeDateHasValue = !!value[0] || !!value[1];
  }

  handleCalendarChange(event) {
    const customDate = (dateTime) => {
      return this.agencyDateFormatService
        .agencyDayJs(dateTime)
        .format(SHORT_ISO_DATE);
    };
    this.formFilterEvent.get('startDate').patchValue(customDate(event[0]));
    this.formFilterEvent.get('endDate').patchValue(customDate(event[1]));
  }

  handleCancel() {
    this.rangeDate = [
      this.formFilterEvent.get('startDate').value,
      this.formFilterEvent.get('endDate').value
    ];
    this.rangeDateHasValue = !!this.rangeDate[0] || !!this.rangeDate[1];
  }

  trackByFn(_: number, item: ICalendarEventFilterTask) {
    return item.eventType;
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
