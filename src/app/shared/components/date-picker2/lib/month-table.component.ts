import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { CandyDate } from '@trudi-ui';
import { valueFunctionProp } from '@core';
import { DateHelperService } from '@/app/i18n';
import { AbstractTable } from './abstract-table';
import { DateBodyRow, DateCell } from './interface';

@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'month-table',
  exportAs: 'monthTable',
  templateUrl: 'abstract-table.html'
})
export class MonthTableComponent
  extends AbstractTable
  implements OnChanges, OnInit
{
  override MAX_ROW = 4;
  override MAX_COL = 3;

  constructor(private dateHelper: DateHelperService) {
    super();
  }

  makeHeadRow(): DateCell[] {
    return [];
  }

  makeBodyRows(): DateBodyRow[] {
    const months: DateBodyRow[] = [];
    let monthValue = 0;

    for (let rowIndex = 0; rowIndex < this.MAX_ROW; rowIndex++) {
      const row: DateBodyRow = {
        dateCells: [],
        trackByIndex: rowIndex,
        classMap: {
          ['trudi-picker-month-row']: true
        }
      };

      for (let colIndex = 0; colIndex < this.MAX_COL; colIndex++) {
        const month = this.activeDate.setMonth(monthValue);
        const isDisabled = this.isDisabledMonth(month);
        const content = this.dateHelper.format(month.nativeDate, 'MMM');
        const cell: DateCell = {
          trackByIndex: colIndex,
          value: month.nativeDate,
          isDisabled,
          isSelected: month.isSameMonth(this.value),
          content,
          title: content,
          classMap: {},
          cellRender: valueFunctionProp(this.cellRender!, month), // Customized content
          fullCellRender: valueFunctionProp(this.fullCellRender!, month),
          onClick: () => this.chooseMonth(cell.value.getMonth()), // don't use monthValue here,
          onMouseEnter: () => this.cellHover.emit(month)
        };

        this.addCellProperty(cell, month);
        row.dateCells.push(cell);
        monthValue++;
      }
      months.push(row);
    }
    return months;
  }

  private isDisabledMonth(month: CandyDate): boolean {
    if (!this.disabledDate) {
      return false;
    }

    const firstOfMonth = month.setDate(1);

    for (
      let date = firstOfMonth;
      date.getMonth() === month.getMonth();
      date = date.addDays(1)
    ) {
      if (!this.disabledDate(date.nativeDate)) {
        return false;
      }
    }

    return true;
  }

  private addCellProperty(cell: DateCell, month: CandyDate): void {
    if (month.isSameMonth(this.value)) {
      cell.isSelected = true;
    }
    cell.classMap = this.getClassMap(cell);
  }

  private chooseMonth(month: number): void {
    this.value = this.activeDate.setMonth(month);
    this.valueChange.emit(this.value);
  }
}
