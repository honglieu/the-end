import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import { CandyDate } from '@trudi-ui';
import { valueFunctionProp } from '@core';
import { DateHelperService } from '@/app/i18n';
import { AbstractTable } from './abstract-table';
import { DateBodyRow, DateCell, YearCell } from './interface';

@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'year-table',
  exportAs: 'yearTable',
  templateUrl: 'abstract-table.html'
})
export class YearTableComponent extends AbstractTable {
  override MAX_ROW = 4;
  override MAX_COL = 3;

  constructor(private dateHelper: DateHelperService) {
    super();
  }

  makeHeadRow(): DateCell[] {
    return [];
  }

  makeBodyRows(): DateBodyRow[] {
    const currentYear = this.activeDate && this.activeDate.getYear();
    const startYear = parseInt(`${currentYear / 10}`, 10) * 10;
    const endYear = startYear + 9;
    const previousYear = startYear - 1;
    const years: DateBodyRow[] = [];
    let yearValue = 0;

    for (let rowIndex = 0; rowIndex < this.MAX_ROW; rowIndex++) {
      const row: DateBodyRow = {
        dateCells: [],
        trackByIndex: rowIndex,
        classMap: {
          ['trudi-picker-month-row']: true
        }
      };
      for (let colIndex = 0; colIndex < this.MAX_COL; colIndex++) {
        const yearNum = previousYear + yearValue;
        const year = this.activeDate.setYear(yearNum);
        const content = this.dateHelper.format(year.nativeDate, 'yyyy');
        const isDisabled = this.isDisabledYear(year);
        const cell: YearCell = {
          trackByIndex: colIndex,
          value: year.nativeDate,
          isDisabled,
          isSameDecade: yearNum >= startYear && yearNum <= endYear,
          isSelected: yearNum === (this.value && this.value.getYear()),
          content,
          title: content,
          classMap: {},
          isLastCellInPanel: year.getYear() === endYear,
          isFirstCellInPanel: year.getYear() === startYear,
          cellRender: valueFunctionProp(this.cellRender!, year), // Customized content
          fullCellRender: valueFunctionProp(this.fullCellRender!, year),
          onClick: () => this.chooseYear(cell.value.getFullYear()), // don't use yearValue here,
          onMouseEnter: () => this.cellHover.emit(year)
        };

        this.addCellProperty(cell, year);
        row.dateCells.push(cell);
        yearValue++;
      }
      years.push(row);
    }
    return years;
  }

  override getClassMap(cell: YearCell): { [key: string]: boolean } {
    return {
      ...super.getClassMap(cell),
      [`trudi-picker-cell-in-view`]: !!cell.isSameDecade
    };
  }

  private isDisabledYear(year: CandyDate): boolean {
    if (!this.disabledDate) {
      return false;
    }

    const firstOfMonth = year.setMonth(0).setDate(1);

    for (
      let date = firstOfMonth;
      date.getYear() === year.getYear();
      date = date.addDays(1)
    ) {
      if (!this.disabledDate(date.nativeDate)) {
        return false;
      }
    }

    return true;
  }

  private addCellProperty(cell: DateCell, year: CandyDate): void {
    if (year.isSameYear(this.value)) {
      cell.isSelected = true;
    }
    cell.classMap = this.getClassMap(cell);
  }

  private chooseYear(year: number): void {
    this.value = this.activeDate.setYear(year);
    this.valueChange.emit(this.value);
    this.render();
  }
}
