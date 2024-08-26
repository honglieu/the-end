import {
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
  TemplateRef
} from '@angular/core';
import { CandyDate } from '@trudi-ui';
import { FunctionProp, TrudiSafeAny } from '@core';
import { isNonEmptyString, isTemplateRef } from '@core';
import { TrudiCalendarI18nInterface } from '@/app/i18n';
import { DateBodyRow, DateCell } from './interface';
import dayjs from 'dayjs';

@Directive()
export abstract class AbstractTable implements OnInit, OnChanges {
  isTemplateRef = isTemplateRef;
  isNonEmptyString = isNonEmptyString;
  headRow: DateCell[] = [];
  bodyRows: DateBodyRow[] = [];
  MAX_ROW = 6;
  MAX_COL = 7;

  @Input() prefixCls: string = 'trudi-picker';
  @Input() value!: CandyDate;
  @Input() locale!: TrudiCalendarI18nInterface;
  @Input() activeDate: CandyDate = new CandyDate();
  @Input() showWeek: boolean = false;
  @Input() disabledDate?: (d: Date) => boolean;
  @Input() cellRender?:
    | string
    | TemplateRef<Date>
    | FunctionProp<TemplateRef<Date> | string>;
  @Input() fullCellRender?:
    | string
    | TemplateRef<Date>
    | FunctionProp<TemplateRef<Date> | string>;
  @Input() canSelectWeek: boolean = false;
  @Input() showDayOff: boolean = true;

  @Output() readonly valueChange = new EventEmitter<CandyDate>();
  @Output() readonly cellHover = new EventEmitter<CandyDate>(); // Emitted when hover on a day by mouse enter

  protected render(): void {
    if (this.activeDate) {
      this.headRow = this.makeHeadRow();
      this.bodyRows = this.makeBodyRows().map((row) => {
        const customDateCells = row.dateCells.map((cell) => {
          const weekend = [0, 6];
          const day = dayjs(new Date(cell.value)).day();
          return {
            ...cell,
            isWeekend: !!row.isDateRow && weekend.includes(day)
          };
        });
        return {
          ...row,
          dateCells: customDateCells
        };
      });
    }
  }

  trackByBodyRow(_index: number, item: DateBodyRow): TrudiSafeAny {
    return item.trackByIndex;
  }

  trackByBodyColumn(_index: number, item: DateCell): TrudiSafeAny {
    return item.trackByIndex;
  }

  getClassMap(cell: DateCell): { [key: string]: boolean } {
    return {
      [`trudi-picker-cell`]: true,
      [`trudi-picker-cell-in-view`]: true,
      [`trudi-picker-cell-selected`]: cell.isSelected,
      [`trudi-picker-cell-disabled`]: cell.isDisabled,
      [`trudi-picker-cell-in-range`]: !!cell.isInSelectedRange,
      [`trudi-picker-cell-range-start`]: !!cell.isSelectedStart,
      [`trudi-picker-cell-range-end`]: !!cell.isSelectedEnd,
      [`trudi-picker-cell-range-start-single`]: !!cell.isStartSingle,
      [`trudi-picker-cell-range-end-single`]: !!cell.isEndSingle,
      [`trudi-picker-cell-range-hover`]: !!cell.isInHoverRange,
      [`trudi-picker-cell-range-hover-start`]: !!cell.isHoverStart,
      [`trudi-picker-cell-range-hover-end`]: !!cell.isHoverEnd,
      [`trudi-picker-cell-range-hover-edge-start`]: !!cell.isFirstCellInPanel,
      [`trudi-picker-cell-range-hover-edge-end`]: !!cell.isLastCellInPanel,
      [`trudi-picker-cell-range-start-near-hover`]:
        !!cell.isRangeStartNearHover,
      [`trudi-picker-cell-range-end-near-hover`]: !!cell.isRangeEndNearHover
    };
  }

  abstract makeHeadRow(): DateCell[];
  abstract makeBodyRows(): DateBodyRow[];

  ngOnInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeDate'] && !changes['activeDate'].currentValue) {
      this.activeDate = new CandyDate();
    }

    if (
      changes['disabledDate'] ||
      changes['locale'] ||
      changes['showWeek'] ||
      changes['selectWeek'] ||
      this.isDateRealChange(changes['activeDate']) ||
      this.isDateRealChange(changes['value']) ||
      this.isDateRealChange(changes['selectedValue']) ||
      this.isDateRealChange(changes['hoverValue'])
    ) {
      this.render();
    }
  }

  private isDateRealChange(change: SimpleChange): boolean {
    if (change) {
      const previousValue: CandyDate | CandyDate[] = change.previousValue;
      const currentValue: CandyDate | CandyDate[] = change.currentValue;
      if (Array.isArray(currentValue)) {
        return (
          !Array.isArray(previousValue) ||
          currentValue.length !== previousValue.length ||
          currentValue.some((value, index) => {
            const previousCandyDate = previousValue[index];
            return previousCandyDate instanceof CandyDate
              ? previousCandyDate.isSameDay(value)
              : previousCandyDate !== value;
          })
        );
      } else {
        return !this.isSameDate(previousValue as CandyDate, currentValue);
      }
    }
    return false;
  }

  private isSameDate(left: CandyDate, right: CandyDate): boolean {
    return (!left && !right) || (left && right && right?.isSameDay(left));
  }
}
