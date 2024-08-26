import { TemplateRef } from '@angular/core';
import { TrudiSafeAny } from '@core';
export interface PanelSelector {
  className: string;
  title?: string;
  label: string;
  onClick(): void;
}

export interface DateCell {
  trackByIndex: TrudiSafeAny;
  value: Date;
  content: TemplateRef<Date> | string;
  onClick(): void;
  onMouseEnter(): void;
  isDisabled: boolean;
  isSelected: boolean;
  label?: string;
  title?: string;
  cellRender?: TemplateRef<Date> | string;
  fullCellRender?: TemplateRef<Date> | string;
  isToday?: boolean;
  classMap?: object;
  isStartSingle?: boolean;
  isEndSingle?: boolean;
  isSelectedStart?: boolean;
  isSelectedEnd?: boolean;
  isHoverStart?: boolean;
  isHoverEnd?: boolean;
  isInHoverRange?: boolean;
  isInSelectedRange?: boolean;
  isRangeStartNearHover?: boolean;
  isRangeEndNearHover?: boolean;
  isFirstCellInPanel?: boolean;
  isLastCellInPanel?: boolean;
  isOff?: boolean;
  isDueDate?: boolean;
  dueDateTooltipText?: string;
}

export interface DateBodyRow {
  trackByIndex: TrudiSafeAny;
  dateCells: DateCell[];
  isActive?: boolean; // Is the week that current setting date stays in
  weekNum?: number; // Is the week that show number
  classMap?: object;
  isDateRow?: boolean;
}

export interface DecadeCell extends DateCell {
  isBiggerThanEnd?: boolean;
  isLowerThanStart?: boolean;
}

export interface YearCell extends DateCell {
  isSameDecade?: boolean;
}
