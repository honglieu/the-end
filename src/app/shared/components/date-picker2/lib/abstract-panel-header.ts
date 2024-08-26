import {
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CandyDate } from '@trudi-ui';
import { TrudiCalendarI18nInterface } from '@/app/i18n';
import { TrudiDateMode } from '@shared/components/date-picker2/standard-types';
import { PanelSelector } from './interface';

@Directive()
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export abstract class AbstractPanelHeader implements OnInit, OnChanges {
  prefixCls: string = `trudi-picker-header`;
  selectors: PanelSelector[] = [];

  @Input() value!: CandyDate;
  @Input() locale!: TrudiCalendarI18nInterface;
  @Input() showSuperPreBtn: boolean = true;
  @Input() showSuperNextBtn: boolean = true;
  @Input() showPreBtn: boolean = true;
  @Input() showNextBtn: boolean = true;

  @Output() readonly panelModeChange = new EventEmitter<TrudiDateMode>();
  @Output() readonly valueChange = new EventEmitter<CandyDate>();

  abstract getSelectors(): PanelSelector[];

  superPreviousTitle(): string {
    return this.locale.previousYear;
  }

  previousTitle(): string {
    return this.locale.previousMonth;
  }

  superNextTitle(): string {
    return this.locale.nextYear;
  }

  nextTitle(): string {
    return this.locale.nextMonth;
  }

  superPrevious(): void {
    this.changeValue(this.value.addYears(-1));
  }

  superNext(): void {
    this.changeValue(this.value.addYears(1));
  }

  previous(): void {
    this.changeValue(this.value.addMonths(-1));
  }

  next(): void {
    this.changeValue(this.value.addMonths(1));
  }

  changeValue(value: CandyDate): void {
    if (this.value !== value) {
      this.value = value;
      this.valueChange.emit(this.value);
      this.render();
    }
  }

  changeMode(mode: TrudiDateMode): void {
    this.panelModeChange.emit(mode);
  }

  private render(): void {
    if (this.value) {
      this.selectors = this.getSelectors();
    }
  }

  ngOnInit(): void {
    if (!this.value) {
      this.value = new CandyDate(); // Show today by default
    }
    this.selectors = this.getSelectors();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['locale']) {
      this.render();
    }
  }
}
