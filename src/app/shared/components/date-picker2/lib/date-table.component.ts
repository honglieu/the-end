import { DatePickerService } from './../date-picker.service';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { CandyDate } from '@trudi-ui';
import { valueFunctionProp } from '@core';

import {
  DateHelperService,
  TrudiCalendarI18nInterface,
  TrudiI18nService
} from '@/app/i18n';
import { AbstractTable } from './abstract-table';
import { DateBodyRow, DateCell } from './interface';
import { transCompatFormat } from './util';
import { ERepeatType } from '@shared/enum/calendar.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'date-table',
  exportAs: 'dateTable',
  templateUrl: './abstract-table.html'
})
export class DateTableComponent
  extends AbstractTable
  implements OnChanges, OnInit
{
  @Input() override locale!: TrudiCalendarI18nInterface;

  private today: CandyDate;

  constructor(
    private i18n: TrudiI18nService,
    private dateHelper: DateHelperService,
    private datePickerService: DatePickerService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    super();
  }

  override ngOnInit(): void {
    this.today = this.agencyDateFormatService.initTimezoneToday();
    super.ngOnInit();
  }

  private changeValueFromInside(value: CandyDate): void {
    // Only change date not change time
    this.activeDate = this.activeDate
      .setYear(value.getYear())
      .setMonth(value.getMonth())
      .setDate(value.getDate());
    this.valueChange.emit(this.activeDate);

    if (!this.activeDate.isSameMonth(this.value)) {
      this.render();
    }
  }

  makeHeadRow(): DateCell[] {
    const weekDays: DateCell[] = [];
    const start = this.activeDate.calendarStart({
      weekStartsOn: this.dateHelper.getFirstDayOfWeek()
    });
    for (let colIndex = 0; colIndex < this.MAX_COL; colIndex++) {
      const day = start.addDays(colIndex);
      weekDays.push({
        trackByIndex: null,
        value: day.nativeDate,
        title: this.dateHelper.format(day.nativeDate, 'E'), // eg. Tue
        content: this.dateHelper.format(
          day.nativeDate,
          this.getVeryShortWeekFormat()
        ), // eg. Tu,
        isSelected: false,
        isDisabled: false,
        isDueDate: false,
        onClick(): void {},
        onMouseEnter(): void {}
      });
    }
    return weekDays;
  }

  private getVeryShortWeekFormat(): string {
    return this.i18n.getLocaleId().toLowerCase().indexOf('zh') === 0
      ? 'EEEEE'
      : 'EEEEE'; // Use extreme short for chinese
  }

  makeBodyRows(): DateBodyRow[] {
    const weekRows: DateBodyRow[] = [];
    const firstDayOfMonth = this.activeDate.calendarStart({
      weekStartsOn: this.dateHelper.getFirstDayOfWeek()
    });
    const weekNumber = this.activeDate.getWeekCountByMondayStart();
    for (let week = 0; week < weekNumber; week++) {
      const weekStart = firstDayOfMonth.addDays(week * 7);
      const row: DateBodyRow = {
        isDateRow: true,
        isActive: false,
        dateCells: [],
        trackByIndex: week
      };

      for (let day = 0; day < 7; day++) {
        const date = weekStart.addDays(day);
        const dateFormat = transCompatFormat(
          this.i18n.getLocaleData('DatePicker.lang.dateFormat', 'YYYY-MM-DD')
        );
        const title = this.dateHelper.format(date.nativeDate, dateFormat);
        const label = this.dateHelper.format(date.nativeDate, 'dd');
        const cell: DateCell = {
          trackByIndex: day,
          value: date.nativeDate,
          label,
          isSelected: false,
          isDisabled: false,
          isToday: false,
          isDueDate: false,
          dueDateTooltipText: this.datePickerService.dueDateTooltipText,
          title,
          cellRender: valueFunctionProp(this.cellRender!, date), // Customized content
          fullCellRender: valueFunctionProp(this.fullCellRender!, date),
          content: `${date.getDate()}`,
          onClick: () => this.changeValueFromInside(date),
          onMouseEnter: () => this.cellHover.emit(date)
        };

        this.checkDayOff(cell, date);
        const dateFomatted =
          this.agencyDateFormatService.initDateTimezoneWithLocal(
            this.datePickerService.dueDate?.nativeDate
          );
        if (dateFomatted?.isSameDay(date)) {
          cell.isDueDate = true;
        }

        this.addCellProperty(cell, date);

        if (this.showWeek && !row.weekNum) {
          row.weekNum = this.dateHelper.getISOWeek(date.nativeDate);
        }
        if (date.isSameDay(this.value)) {
          row.isActive = date.isSameDay(this.value);
        }
        row.dateCells.push(cell);
      }
      row.classMap = {
        [`trudi-picker-week-panel-row`]: this.canSelectWeek,
        [`trudi-picker-week-panel-row-selected`]:
          this.canSelectWeek && row.isActive
      };
      weekRows.push(row);
    }
    return weekRows;
  }

  checkDayOff(cell: DateCell, date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getYear();
    const monthString = month < 10 ? `0${month}` : `${month}`;
    const keyDay = `${year}-${monthString}-${day}`;
    const keyMonth = `${day}-${ERepeatType.MONTHLY}`;
    const keyYear = `${day}-${monthString}-${ERepeatType.ANNUALLY}`;

    if (this.datePickerService.holidays[keyDay]) cell.isOff = true;
    else if (this.datePickerService.holidays[keyMonth]) {
      cell.isOff =
        keyDay.localeCompare(this.datePickerService.holidays[keyMonth].date) >=
        0;
    } else if (this.datePickerService.holidays[keyYear]) {
      cell.isOff =
        keyDay.localeCompare(this.datePickerService.holidays[keyYear].date) >=
        0;
    }
  }

  addCellProperty(cell: DateCell, date: CandyDate): void {
    cell.isToday = date.isSameDay(this.today);
    cell.isSelected = date.isSameDay(this.value);
    cell.isDisabled = !!this.disabledDate?.(date.nativeDate);
    cell.classMap = this.getClassMap(cell);
  }

  override getClassMap(cell: DateCell): { [key: string]: boolean } {
    const date = new CandyDate(cell.value);
    return {
      ...super.getClassMap(cell),
      [`trudi-picker-cell-off`]: cell.isOff,
      [`trudi-picker-cell-today`]: !!cell.isToday,
      [`trudi-picker-cell-in-view`]: date.isSameMonth(this.activeDate),
      [`trudi-picker-cell-due-date`]: !!cell.isDueDate
    };
  }
}
