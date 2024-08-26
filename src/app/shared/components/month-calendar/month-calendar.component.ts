import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  EventEmitter,
  Output,
  HostListener,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { HolidayItem } from '@shared/types/agency.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'month-calendar',
  templateUrl: './month-calendar.component.html',
  styleUrls: ['./month-calendar.component.scss']
})
export class MonthCalendarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title: string;
  @Input() currentYear: number;
  @Input() isCurrentMonth: boolean;
  @Input() dayNumber: number;
  @Input() startDayOfWeek: number;
  @Input() monthValue: number;
  @Input() prevMonth: Month;
  @Input() nextMonth: Month;
  @Input() holidays: HolidayItem[];
  @Input() dayOffsOfWeek: number[];
  @Input() yearCalendarClientRect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  @Input() includeOutOfScopeDay: boolean = false;
  @Output() onSetHoliday = new EventEmitter<Date>();
  @Output() onRemoveHoliday = new EventEmitter<Date>();

  public CURRENT_DAY = new Date().getDate();
  public CURRENT_MONTH = new Date().getMonth() + 1;
  public CURRENT_YEAR = new Date().getFullYear();
  public MAX_DAY_OF_MONTH = 42;
  public daysHTML: any[];
  public selectedDay: Date;
  public popupPosition: string;
  public popupAnchor = PopupAnchor;
  private _destroy$ = new Subject<void>();
  private today = new Date();

  constructor(
    private elementRef: ElementRef,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { holidays, dayOffsOfWeek } = changes;
    if (holidays?.currentValue || dayOffsOfWeek?.currentValue) {
      this.daysHTML = this.generateDayItem();
    }
  }

  ngOnInit(): void {
    this.initData();
  }

  initData() {
    this.agencyDateFormatService.timezone$
      .pipe(takeUntil(this._destroy$))
      .subscribe((timezone) => {
        if (timezone) {
          this.today =
            this.agencyDateFormatService.initTimezoneToday().nativeDate;
          this.daysHTML = this.generateDayItem();
          this.CURRENT_DAY = this.today.getDate();
          this.CURRENT_MONTH = this.today.getMonth() + 1;
          this.CURRENT_YEAR = this.today.getFullYear();
        }
      });
  }

  handleSetHoliday(value: Date) {
    this.onSetHoliday.emit(value);
    this.selectedDay = null;
  }

  handleRemoveHoliday(value: any) {
    this.onRemoveHoliday.emit(value);
    this.selectedDay = null;
  }

  generateDayItem(): any[] {
    const arrDay = [];
    const dayEndOfMonth = this.dayNumber + this.startDayOfWeek - 1;
    for (let i = 1; i <= this.MAX_DAY_OF_MONTH; i++) {
      if (i < this.startDayOfWeek) {
        const dayOfPrevMonth =
          this.prevMonth.dayNumber - this.startDayOfWeek + i + 1;
        const getDayValue = this.getDateFromDay(
          dayOfPrevMonth,
          this.prevMonth.value
        );
        const dayOff = this.dayOffsOfWeek?.includes(getDayValue.getDay());
        arrDay.push({
          value: getDayValue,
          label: dayOfPrevMonth,
          isActive: false,
          isDayOff: false,
          isInThePass: true,
          isDisabled: true,
          isOutOfScopeDay: true,
          dayOff
        });
      } else if (dayEndOfMonth < i) {
        const dayOfNextMonth = i - this.startDayOfWeek - this.dayNumber + 1;
        const getDayValue = this.getDateFromDay(
          dayOfNextMonth,
          this.nextMonth.value
        );
        const dayOff = this.dayOffsOfWeek?.includes(getDayValue.getDay());

        arrDay.push({
          value: getDayValue,
          label: dayOfNextMonth,
          isActive: false,
          isDayOff: false,
          isInThePass: true,
          isDisabled: true,
          isOutOfScopeDay: true,
          dayOff
        });
      } else {
        const dayValue = i - this.startDayOfWeek + 1;
        const isActive =
          dayValue === this.CURRENT_DAY &&
          this.isCurrentMonth &&
          this.currentYear === this.CURRENT_YEAR;
        const localDateString = new Date(
          this.getDateFromDay(dayValue, this.monthValue)
        ).toLocaleDateString();
        const isDayOff =
          this.holidays &&
          this.holidays[localDateString]?.isActive &&
          this.holidays[localDateString] !== undefined;
        const dayOffValue =
          this.holidays &&
          this.holidays[localDateString]?.isActive &&
          this.holidays[localDateString];
        const isInThePass =
          this.getDateFromDay(dayValue, this.monthValue) < this.today;
        const getDayValue = this.getDateFromDay(dayValue, this.monthValue);
        const dayOff = this.dayOffsOfWeek?.includes(getDayValue.getDay());
        arrDay.push({
          value: getDayValue,
          label: dayValue.toString(),
          isActive,
          isDayOff,
          dayOffValue,
          isInThePass,
          isDisabled: false,
          isOutOfScopeDay: false,
          dayOff
        });
      }
    }
    return arrDay;
  }

  getDateFromDay(day: number, month: number) {
    const dateStr = `${month}/${day}/${this.currentYear}`;
    return new Date(dateStr);
  }

  handleSelectDay(value: Date, isDisabled: boolean, event: any) {
    if (this.selectedDay || isDisabled) {
      this.selectedDay = null;
      return;
    }
    const { top, bottom, left, right } = event.target.getBoundingClientRect();
    this.checkPopupPosition(top - 200, bottom + 200, left - 200, right + 200);
    this.selectedDay = value;
  }

  checkPopupPosition(top: number, bottom: number, left: number, right: number) {
    const limit = this.yearCalendarClientRect;
    if (limit.top > top && limit.left > left) {
      this.popupPosition = this.popupAnchor.right;
    } else if (limit.bottom < bottom && limit.left > left) {
      this.popupPosition = this.popupAnchor.rightTop;
    } else if (limit.top > top && limit.right < right) {
      this.popupPosition = this.popupAnchor.left;
    } else if (limit.bottom < bottom && limit.right < right) {
      this.popupPosition = this.popupAnchor.leftTop;
    } else if (limit.top > top) {
      this.popupPosition = this.popupAnchor.bottom;
    } else if (limit.bottom < bottom) {
      this.popupPosition = this.popupAnchor.top;
    } else if (limit.left > left) {
      this.popupPosition = this.popupAnchor.right;
    } else if (limit.right < right) {
      this.popupPosition = this.popupAnchor.left;
    } else {
      this.popupPosition = this.popupAnchor.top;
    }
  }

  handleClosePopup() {
    this.selectedDay = null;
  }

  isShowPopup(date1: Date, date2: Date): boolean {
    if (date1 && date2) {
      const day1: string = date1.toLocaleDateString();
      const day2: string = date2.toLocaleDateString();
      return day1 === day2;
    }
    return false;
  }

  handleClickOnPopup(event) {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.selectedDay = null;
    }
  }
}

enum PopupAnchor {
  right = 'RIGHT',
  rightTop = 'RIGHT-TOP',
  left = 'LEFT',
  leftTop = 'LEFT-TOP',
  bottom = 'BOTTOM',
  top = 'TOP'
}

interface Month {
  name: string;
  value: number;
  dayNumber: number;
  startDayOfWeek: number;
}
