/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { CandyDate, CompatibleValue } from 'ng-zorro-antd/core/time';
import { valueFunctionProp } from 'ng-zorro-antd/core/util';

import {
  DateHelperService,
  NzCalendarI18nInterface,
  NzI18nService
} from 'ng-zorro-antd/i18n';
import { AbstractTable } from './abstract-table';
import { DateBodyRow, DateCell } from './interface';
import { transCompatFormat } from './util';
import { DatePickerService } from '../date-picker.service';
import { Subject, takeUntil } from 'rxjs';
import { TRUDI_DATE_FORMAT } from '../../provider/trudi-config';
import { TrudiDateFormat } from '../../interfaces';

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
  implements OnChanges, OnInit, OnDestroy
{
  @Input() override locale!: NzCalendarI18nInterface;
  private destroy$ = new Subject<void>();
  private eventDate: {
    date: CompatibleValue;
    tooltip: string;
  };
  private today: CandyDate;

  constructor(
    private i18n: NzI18nService,
    private dateHelper: DateHelperService,
    private datePickerService: DatePickerService,
    @Inject(TRUDI_DATE_FORMAT) private trudiDateFormat: TrudiDateFormat
  ) {
    super();
    datePickerService.calendarTypeToShow
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.eventDate = {
          date: event?.date,
          tooltip: event?.eventName || ''
        };
      });
  }

  override ngOnInit(): void {
    this.today = new CandyDate(
      this.trudiDateFormat.initTimezoneToday().nativeDate
    );
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
        ),
        isSelected: false,
        isDisabled: false,
        onClick(): void {},
        onMouseEnter(): void {}
      });
    }
    return weekDays;
  }

  private getVeryShortWeekFormat(): string {
    return 'EEEEE'; // Use extreme short for chinese
  }

  makeBodyRows(): DateBodyRow[] {
    const weekRows: DateBodyRow[] = [];
    const firstDayOfMonth = this.activeDate.calendarStart({
      weekStartsOn: this.dateHelper.getFirstDayOfWeek()
    });
    for (let week = 0; week < this.MAX_ROW; week++) {
      const weekStart = firstDayOfMonth.addDays(week * 7);
      const row: DateBodyRow = {
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
          title,
          cellRender: valueFunctionProp(this.cellRender!, date), // Customized content
          fullCellRender: valueFunctionProp(this.fullCellRender!, date),
          content: `${date.getDate()}`,
          onClick: () => this.changeValueFromInside(date),
          onMouseEnter: () => this.cellHover.emit(date)
        };

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
        [`ant-picker-week-panel-row`]: this.showWeek,
        [`ant-picker-week-panel-row-selected`]: this.showWeek && row.isActive
      };
      weekRows.push(row);
    }
    return weekRows;
  }

  addCellProperty(cell: DateCell, date: CandyDate): void {
    if (this.hasRangeValue() && !this.showWeek) {
      const [startHover, endHover] = this.hoverValue;
      const [startSelected, endSelected] = this.selectedValue;
      // Selected
      if (startSelected?.isSameDay(date)) {
        cell.isSelectedStart = true;
        cell.isSelected = true;
      }

      if (endSelected?.isSameDay(date)) {
        cell.isSelectedEnd = true;
        cell.isSelected = true;
      }

      if (startHover && endHover) {
        cell.isHoverStart = startHover.isSameDay(date);
        cell.isHoverEnd = endHover.isSameDay(date);
        cell.isLastCellInPanel = date.isLastDayOfMonth();
        cell.isFirstCellInPanel = date.isFirstDayOfMonth();
        cell.isInHoverRange =
          startHover.isBeforeDay(date) && date.isBeforeDay(endHover);
      }
      cell.isStartSingle = startSelected && !endSelected;
      cell.isEndSingle = !startSelected && !!endSelected;
      cell.isInSelectedRange =
        startSelected?.isBeforeDay(date) && date.isBeforeDay(endSelected);
      cell.isRangeStartNearHover = startSelected && cell.isInHoverRange;
      cell.isRangeEndNearHover = endSelected && cell.isInHoverRange;
    }

    const dateFormatted = new CandyDate(
      this.trudiDateFormat.initDateTimezoneWithLocal(
        (this.eventDate.date as CandyDate)?.nativeDate
      ).nativeDate
    );
    cell.isToday = date.isSameDay(this.today);
    cell.isSelected = date.isSameDay(this.value);
    cell.isDisabled = !!this.disabledDate?.(date.nativeDate);
    cell.classMap = this.getClassMap(cell);
    cell.isCalendarEvent = date.isSameDay(dateFormatted);
    cell.tooltip = cell.isCalendarEvent ? this.eventDate.tooltip : '';
  }

  override getClassMap(cell: DateCell): { [key: string]: boolean } {
    const date = new CandyDate(cell.value);
    return {
      ...super.getClassMap(cell),
      [`ant-picker-cell-calendar-event`]: cell.isCalendarEvent,
      [`ant-picker-cell-today`]: !!cell.isToday,
      [`ant-picker-cell-in-view`]: date.isSameMonth(this.activeDate)
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
