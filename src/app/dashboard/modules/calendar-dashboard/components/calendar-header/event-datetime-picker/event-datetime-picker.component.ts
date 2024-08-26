import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  Component,
  forwardRef,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  durationOfPicker,
  EEventDatetimePicker,
  EventDatetimePicker,
  EventDatetimePickerOptions,
  EventDatetimePickerType
} from './event-datetime-picker.enums';
import { IEventDatetimePicker } from './event-datetime-picker.interface';
import { CompatibleDate, TrudiSingleRangePickerComponent } from '@trudi-ui';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';

const UnitDiff = 'month';
@Component({
  selector: 'event-datetime-picker',
  templateUrl: './event-datetime-picker.component.html',
  styleUrls: ['./event-datetime-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EventDatetimePickerComponent),
      multi: true
    }
  ]
})
export class EventDatetimePickerComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('datePicker') datePicker!: TrudiSingleRangePickerComponent;
  @Input() customTime: boolean;

  public EventDatetimePicker = Object.entries(EventDatetimePicker).map(
    (options) => {
      return {
        label: options[1],
        value: options[0]
      };
    }
  );
  public readonly datePickerFormatPipe$ =
    this.agencyDateFormatService.dateFormatPipe$;

  public _picker: IEventDatetimePicker = {
    value: [
      this.generateDate(),
      this.generateDate(
        EventDatetimePickerOptions[EEventDatetimePicker.NextSixMonths]
      )
    ],
    type: EEventDatetimePicker.NextSixMonths
  };

  public isDisable: boolean = false;
  public onCustomRange: boolean = false;

  public formatDate: string = null;
  public customTitle: string = null;

  private currentEventId: string = null;
  private prevTypeValue: IEventDatetimePicker = {
    value: [
      this.generateDate(),
      this.generateDate(
        EventDatetimePickerOptions[EEventDatetimePicker.NextSixMonths]
      )
    ],
    type: EEventDatetimePicker.NextSixMonths
  };

  public onChange(_data: Date[]): void {}
  public onTouched: () => void;

  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    private calendarFilterService: CalendarFilterService
  ) {
    this.agencyDateFormatService.dateFormatDayJS$
      .pipe(takeUntil(this.destroy$))
      .subscribe((format) => {
        this.formatDate = format;
      });

    this.calendarFilterService
      .getEventId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((eventId) => {
        this.currentEventId = eventId;
      });
  }

  private getDurationOfPicker(dates: Date[]): EEventDatetimePicker {
    if (this.customTime) {
      return EEventDatetimePicker.CustomRange;
    }
    const firstDate = dayjs(dates[0]).startOf('day');
    const secondDate = dayjs(dates[1]).startOf('day');
    const today = dayjs().startOf('day');
    let duration = secondDate.diff(firstDate, UnitDiff);

    const remainingDays = secondDate.diff(
      firstDate.add(duration, 'month'),
      'day'
    );

    if (remainingDays > 0) {
      duration += 1;
    }

    if (firstDate.isBefore(today)) {
      duration = -duration;
    }

    if (durationOfPicker.includes(duration)) {
      return EventDatetimePickerType[duration.toString()];
    }
    return EEventDatetimePicker.CustomRange;
  }

  private generateDate(month?: number): Date {
    let currentMonth = dayjs().month();
    if (month) {
      currentMonth = currentMonth + month;
    }
    return dayjs().set('month', currentMonth).toDate();
  }

  private formatDateToShow(dates: Date[]): string {
    if (!dayjs(dates[0]).isValid() || !dayjs(dates[1]).isValid()) {
      this.customTitle = null;
      return null;
    }
    return `${dayjs(dates[0]).format(this.formatDate)} - ${dayjs(
      dates[1]
    ).format(this.formatDate)}`;
  }
  writeValue(value: Date[]): void {
    this.customTitle = null;
    if (!value || !Array.isArray(value)) {
      return;
    }
    const duration = this.getDurationOfPicker(value);

    this._picker.type = duration;
    switch (duration) {
      case EEventDatetimePicker.CustomRange:
        this._picker = {
          ...this._picker,
          value
        };
        break;
      default:
        this._picker = {
          ...this._picker,
          value: [
            value[0] || this.generateDate(),
            value[1] || this.generateDate(EventDatetimePickerOptions[duration])
          ]
        };
        break;
    }
    const firstDate = dayjs(value[0]);
    const secondDate = dayjs(value[1]);
    if (
      Number(EventDatetimePickerOptions[duration]) < 0 ||
      firstDate.isAfter(secondDate)
    ) {
      this._picker.value.reverse();
    }
    this.prevTypeValue = cloneDeep(this._picker);

    if (duration === EEventDatetimePicker.CustomRange) {
      this.customTitle = this.formatDateToShow(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisable = isDisabled;
  }

  onChangePicker(duration: EEventDatetimePicker): void {
    if (duration !== EEventDatetimePicker.CustomRange) {
      this.customTitle = null;
      this._picker = {
        ...this._picker,
        value: [
          this.generateDate(),
          this.generateDate(EventDatetimePickerOptions[duration])
        ]
      };
      this.prevTypeValue = cloneDeep(this._picker);
      this.closeAllPanels();
      this.customTime = false;
      this.calendarFilterService.setCustomTime(this.customTime);
      return;
    } else {
      this.customTime = true;
      this.calendarFilterService.setCustomTime(this.customTime);
    }
    this.onCustomRange = true;
  }

  public handleRangeChange(event: CompatibleDate): void {
    if (!Array.isArray(event)) {
      return;
    }

    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$?.value;
    const value = event.map((date) => {
      return dayjs(
        dayjs(
          dayjs(date).tz(
            this.agencyDateFormatService.getCurrentTimezone()?.value
          )
        ).format(DATE_FORMAT_DAYJS),
        DATE_FORMAT_DAYJS
      ).toDate();
    });

    this._picker = {
      ...this._picker,
      value
    };
    this.prevTypeValue = cloneDeep(this._picker);
    this.closeAllPanels();
  }

  handleCancel(): void {
    this._picker = cloneDeep(this.prevTypeValue);
    this.closeAllPanels();
  }

  closeAllPanels(): void {
    if (this.currentEventId) {
      this.calendarFilterService.setEventId(null);
    }
    if (this.onCustomRange) {
      this.onCustomRange = false;
    }
    this.onChange(this._picker.value);
  }
  ngOnDestroy(): void {
    this.prevTypeValue = null;
    this.customTitle = null;

    this.destroy$.next();
    this.destroy$.complete();
  }
}
