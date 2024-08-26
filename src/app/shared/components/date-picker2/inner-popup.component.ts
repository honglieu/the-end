import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';

import { CandyDate } from '@trudi-ui';
import { FunctionProp } from '@core';
import { TrudiCalendarI18nInterface } from '@/app/i18n';

import {
  DisabledDateFn,
  TrudiDateMode,
  RangePartType,
  SupportTimeOptions
} from './standard-types';
import { PREFIX_CLASS } from './util';

@Component({
  selector: 'inner-popup',
  exportAs: 'innerPopup',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="{{ prefixCls }}-{{ panelMode }}-panel">
        <ng-container [ngSwitch]="panelMode">
          <ng-container *ngSwitchCase="'decade'">
            <decade-header
              [(value)]="activeDate"
              [locale]="locale"
              [showSuperPreBtn]="enablePrevNext('prev', 'decade')"
              [showSuperNextBtn]="enablePrevNext('next', 'decade')"
              [showNextBtn]="false"
              [showPreBtn]="false"
              (panelModeChange)="panelModeChange.emit($event)"
              (valueChange)="headerChange.emit($event)"></decade-header>
            <div class="{{ prefixCls }}-body">
              <decade-table
                [activeDate]="activeDate"
                [value]="value"
                [locale]="locale"
                [showDayOff]="showDayOff"
                (valueChange)="onChooseDecade($event)"
                [disabledDate]="disabledDate"></decade-table>
            </div>
          </ng-container>
          <ng-container *ngSwitchCase="'year'">
            <year-header
              [(value)]="activeDate"
              [locale]="locale"
              [showSuperPreBtn]="enablePrevNext('prev', 'year')"
              [showSuperNextBtn]="enablePrevNext('next', 'year')"
              [showNextBtn]="false"
              [showPreBtn]="false"
              (panelModeChange)="panelModeChange.emit($event)"
              (valueChange)="headerChange.emit($event)"></year-header>
            <div class="{{ prefixCls }}-body">
              <year-table
                [activeDate]="activeDate"
                [value]="value"
                [locale]="locale"
                [disabledDate]="disabledDate"
                [showDayOff]="showDayOff"
                (valueChange)="onChooseYear($event)"
                (cellHover)="cellHover.emit($event)"></year-table>
            </div>
          </ng-container>
          <ng-container *ngSwitchCase="'month'">
            <month-header
              [(value)]="activeDate"
              [locale]="locale"
              [showSuperPreBtn]="enablePrevNext('prev', 'month')"
              [showSuperNextBtn]="enablePrevNext('next', 'month')"
              [showNextBtn]="false"
              [showPreBtn]="false"
              (panelModeChange)="panelModeChange.emit($event)"
              (valueChange)="headerChange.emit($event)"></month-header>
            <div class="{{ prefixCls }}-body">
              <month-table
                [value]="value"
                [activeDate]="activeDate"
                [locale]="locale"
                [disabledDate]="disabledDate"
                [showDayOff]="showDayOff"
                (valueChange)="onChooseMonth($event)"
                (cellHover)="cellHover.emit($event)"></month-table>
            </div>
          </ng-container>
          <ng-container *ngSwitchDefault>
            <date-header
              [(value)]="activeDate"
              [locale]="locale"
              [showSuperPreBtn]="
                panelMode === 'week'
                  ? enablePrevNext('prev', 'week')
                  : enablePrevNext('prev', 'date')
              "
              [showSuperNextBtn]="
                panelMode === 'week'
                  ? enablePrevNext('next', 'week')
                  : enablePrevNext('next', 'date')
              "
              [showPreBtn]="
                panelMode === 'week'
                  ? enablePrevNext('prev', 'week')
                  : enablePrevNext('prev', 'date')
              "
              [showNextBtn]="
                panelMode === 'week'
                  ? enablePrevNext('next', 'week')
                  : enablePrevNext('next', 'date')
              "
              (panelModeChange)="panelModeChange.emit($event)"
              (valueChange)="headerChange.emit($event)"></date-header>
            <div class="{{ prefixCls }}-body">
              <date-table
                [locale]="locale"
                [showWeek]="showWeek"
                [value]="value"
                [activeDate]="activeDate"
                [disabledDate]="disabledDate"
                [cellRender]="dateRender"
                [canSelectWeek]="panelMode === 'week'"
                [showDayOff]="showDayOff"
                (valueChange)="onSelectDate($event)"
                (cellHover)="cellHover.emit($event)"></date-table>
            </div>
          </ng-container>
        </ng-container>
      </div>
    </div>
  `
})
export class InnerPopupComponent implements OnChanges {
  @Input() activeDate!: CandyDate;
  @Input() endPanelMode!: TrudiDateMode;
  @Input() panelMode!: TrudiDateMode;
  @Input() showWeek!: boolean;
  @Input() locale!: TrudiCalendarI18nInterface;
  @Input() timeOptions!: SupportTimeOptions | null;
  @Input() disabledDate?: DisabledDateFn;
  @Input() dateRender?:
    | string
    | TemplateRef<Date>
    | FunctionProp<TemplateRef<Date> | string>;
  @Input() value!: CandyDate;
  @Input() partType!: RangePartType;
  @Input() showDayOff: boolean = true;

  @Output() readonly panelModeChange = new EventEmitter<TrudiDateMode>();
  // TODO: name is not proper
  @Output() readonly headerChange = new EventEmitter<CandyDate>(); // Emitted when user changed the header's value
  @Output() readonly selectDate = new EventEmitter<CandyDate>(); // Emitted when the date is selected by click the date panel
  @Output() readonly selectTime = new EventEmitter<CandyDate>();
  @Output() readonly cellHover = new EventEmitter<CandyDate>(); // Emitted when hover on a day by mouse enter

  prefixCls: string = PREFIX_CLASS;

  /**
   * Hide "next" arrow in left panel,
   * hide "prev" arrow in right panel
   *
   * @param direction
   * @param panelMode
   */
  enablePrevNext(
    direction: 'prev' | 'next',
    panelMode: TrudiDateMode
  ): boolean {
    return !(
      panelMode === this.endPanelMode &&
      ((this.partType === 'left' && direction === 'next') ||
        (this.partType === 'right' && direction === 'prev'))
    );
  }

  onSelectTime(date: Date): void {
    this.selectTime.emit(new CandyDate(date));
  }

  // The value real changed to outside
  onSelectDate(date: CandyDate | Date): void {
    const value = date instanceof CandyDate ? date : new CandyDate(date);
    const timeValue =
      this.timeOptions && this.timeOptions.trudiDefaultOpenValue;

    // Display timeValue when value is null
    if (!this.value && timeValue) {
      value.setHms(
        timeValue.getHours(),
        timeValue.getMinutes(),
        timeValue.getSeconds()
      );
    }

    this.selectDate.emit(value);
  }

  onChooseMonth(value: CandyDate): void {
    this.activeDate = this.activeDate.setMonth(value.getMonth());
    if (this.endPanelMode === 'month') {
      this.value = value;
      this.selectDate.emit(value);
    } else {
      this.headerChange.emit(value);
      this.panelModeChange.emit(this.endPanelMode);
    }
  }

  onChooseYear(value: CandyDate): void {
    this.activeDate = this.activeDate.setYear(value.getYear());
    if (this.endPanelMode === 'year') {
      this.value = value;
      this.selectDate.emit(value);
    } else {
      this.headerChange.emit(value);
      this.panelModeChange.emit(this.endPanelMode);
    }
  }

  onChooseDecade(value: CandyDate): void {
    this.activeDate = this.activeDate.setYear(value.getYear());
    if (this.endPanelMode === 'decade') {
      this.value = value;
      this.selectDate.emit(value);
    } else {
      this.headerChange.emit(value);
      this.panelModeChange.emit('year');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeDate'] && !changes['activeDate']?.currentValue) {
      this.activeDate = new CandyDate();
    }
    // New Antd vesion has merged 'date' ant 'time' to one panel,
    // So there is not 'time' panel
    if (changes['panelMode'] && changes['panelMode']?.currentValue === 'time') {
      this.panelMode = 'date';
    }
  }
}
