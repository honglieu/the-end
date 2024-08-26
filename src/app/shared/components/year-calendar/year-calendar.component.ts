import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  AfterViewInit
} from '@angular/core';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { HolidayItem } from '@shared/types/agency.interface';
@Component({
  selector: 'year-calendar',
  templateUrl: './year-calendar.component.html',
  styleUrls: ['./year-calendar.component.scss']
})
export class YearCalendarComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() height: string = '100vh';
  @Input() holidayData: HolidayItem[];
  @Input() dayOffsOfWeek: number[];
  @Output() onSetHoliday = new EventEmitter<Date>();
  @Output() onRemoveHoliday = new EventEmitter<Date>();
  @Output() onChangeYear = new EventEmitter<Number>();
  @ViewChild('yearCalendar') yearCalenderEl: ElementRef<HTMLDivElement>;

  public CURREN_DATE = new Date();
  public CURRENT_MONTH = this.CURREN_DATE.getMonth() + 1;
  public CURRENT_YEAR = this.CURREN_DATE.getFullYear();
  public months: Month[];
  public yearNumber: number = this.CURRENT_YEAR;
  public holidays: any;
  public yearStatusChanges = yearStatusChanges;
  public yearCalendarClientRect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  public resizeObservable$: Observable<Event>;
  public resizeSubscription$: Subscription;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    const { holidayData } = changes;
    if (holidayData?.currentValue) {
      this.holidays = this.handleFormatHoliday(this.holidayData);
      this.getYearCalendarClientRect();
    }
  }

  ngOnInit(): void {
    this.months = this.getMonthFromYear(this.yearNumber);
    this.onWindowResized();
  }

  ngAfterViewInit() {
    this.getYearCalendarClientRect();
  }

  getYearCalendarClientRect() {
    const boundingClientRect =
      this.yearCalenderEl?.nativeElement?.getBoundingClientRect();
    if (boundingClientRect) {
      const { top, bottom, left, right } = boundingClientRect;
      this.yearCalendarClientRect = { top, bottom, left, right };
    }
  }

  isLeapYear(year: number): boolean {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
  }

  getStartDayOfWeek(month: number, year: number): number {
    const dateStr: string = `${month}/01/${year}`;
    const result = new Date(dateStr).getDay();
    return result && result > 0 ? result : 7;
  }

  getMonthValue(month: number, year: number): Month {
    const monthData = {
      1: {
        name: 'January',
        value: 1,
        dayNumber: 31,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      2: {
        name: 'February',
        value: 2,
        dayNumber: this.isLeapYear(year) ? 29 : 28,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      3: {
        name: 'March',
        value: 3,
        dayNumber: 31,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      4: {
        name: 'April',
        value: 4,
        dayNumber: 30,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      5: {
        name: 'May',
        value: 5,
        dayNumber: 31,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      6: {
        name: 'June',
        value: 6,
        dayNumber: 30,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      7: {
        name: 'July',
        value: 7,
        dayNumber: 31,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      8: {
        name: 'August',
        value: 8,
        dayNumber: 31,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      9: {
        name: 'September',
        value: 9,
        dayNumber: 30,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      10: {
        name: 'October',
        value: 10,
        dayNumber: 31,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      11: {
        name: 'November',
        value: 11,
        dayNumber: 30,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      },
      12: {
        name: 'December',
        value: 12,
        dayNumber: 31,
        startDayOfWeek: this.getStartDayOfWeek(month, year)
      }
    };

    if (month && year) {
      return monthData[month];
    }

    return null;
  }

  getMonthFromYear(year: number): Month[] {
    const months: Month[] = [];
    for (let i = 1; i <= 12; i++) {
      months.push(this.getMonthValue(i, year));
    }
    return months;
  }

  getPrevMonth(monthNumber: number): Month {
    if (monthNumber === 1) {
      const months = this.getMonthFromYear(this.CURRENT_YEAR - 1);
      return months[11];
    }
    return this.months[monthNumber - 2];
  }

  getNextMonth(monthNumber: number): Month {
    if (monthNumber === 12) {
      const months = this.getMonthFromYear(this.CURRENT_YEAR + 1);
      return months[0];
    }
    return this.months[monthNumber];
  }

  handleChangeYear(value: number): void {
    const upLimit = this.CURRENT_YEAR + 3;
    const downLimit = this.CURRENT_YEAR - 3;
    if (
      this.yearNumber < upLimit - value &&
      this.yearNumber > downLimit - value
    ) {
      this.yearNumber = this.yearNumber + value;
      this.months = this.getMonthFromYear(this.yearNumber);
      this.onChangeYear.emit(this.yearNumber);
    }
  }

  goToday(): void {
    this.yearNumber = this.CURRENT_YEAR;
    this.onChangeYear.emit(this.yearNumber);
    this.months = this.getMonthFromYear(this.yearNumber);
  }

  handleFormatHoliday(holidaysData: any[]): any {
    const holidayFormat = {};
    if (holidaysData.length > 0) {
      holidaysData.forEach((holiday) => {
        if (holiday.date) {
          const localDateString = new Date(holiday.date).toLocaleDateString();
          if (holiday.isActive) {
            holidayFormat[localDateString] = holiday;
          }
        }
      });
    }

    return holidayFormat;
  }

  handleSetHoliday(value: Date): void {
    this.onSetHoliday.emit(value);
  }

  handleRemoveHoliday(value: any): void {
    this.onRemoveHoliday.emit(value);
  }

  onWindowResized() {
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$.subscribe((e) => {
      const { top, bottom, left, right } =
        this.yearCalenderEl.nativeElement.getBoundingClientRect();
      this.yearCalendarClientRect = { top, bottom, left, right };
    });
  }

  ngOnDestroy() {
    if (this.resizeSubscription$) {
      this.resizeSubscription$.unsubscribe();
    }
  }
}
interface Month {
  name: string;
  value: number;
  dayNumber: number;
  startDayOfWeek: number;
}

enum yearStatusChanges {
  INCREASE = 1,
  DECREASE = -1
}
