import { Direction } from '@angular/cdk/bidi';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  CandyDate,
  CompatibleValue,
  NormalizedMode,
  SingleValue
} from '@trudi-ui';
import { FunctionProp } from '@core';
import { TrudiCalendarI18nInterface } from '@/app/i18n';

import { DatePickerService } from './date-picker.service';
import {
  CompatibleDate,
  DisabledDateFn,
  DisabledTimeFn,
  DisabledTimePartial,
  TrudiDateMode,
  PresetRanges,
  RangePartType,
  SupportTimeOptions
} from './standard-types';
import { getTimeConfig, isAllowedDate, PREFIX_CLASS } from './util';

@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'date-range-popup',
  exportAs: 'dateRangePopup',
  template: `
    <ng-container *ngIf="false; else singlePanel"> </ng-container>
    <ng-template #singlePanel>
      <div
        class="{{ prefixCls }}-panel-container {{
          showWeek ? prefixCls + '-week-number' : ''
        }}">
        <div
          class="{{ prefixCls }}-panel"
          [class.trudi-picker-panel-rtl]="dir === 'rtl'"
          tabindex="-1">
          <!-- Single ONLY -->
          <ng-container *ngTemplateOutlet="tplInnerPopup"></ng-container>
          <ng-container *ngTemplateOutlet="tplFooter"></ng-container>
        </div>
      </div>
    </ng-template>

    <ng-template #tplInnerPopup let-partType="partType">
      <div
        class="{{ prefixCls }}-panel"
        [class.trudi-picker-panel-rtl]="dir === 'rtl'">
        <!-- TODO(@wenqi73) [selectedValue] [hoverValue] types-->
        <inner-popup
          [showWeek]="showWeek"
          [endPanelMode]="getPanelMode(endPanelMode, partType)"
          [partType]="partType"
          [locale]="locale!"
          [timeOptions]="getTimeOptions(partType)"
          [panelMode]="getPanelMode(panelMode, partType)"
          (panelModeChange)="onPanelModeChange($event, partType)"
          [activeDate]="getActiveDate(partType)"
          [value]="getValue(partType)"
          [disabledDate]="disabledDate"
          [dateRender]="dateRender"
          [showDayOff]="showDayOff"
          (selectDate)="changeValueFromSelect($event, !showTime)"
          (selectTime)="onSelectTime($event, partType)"
          (headerChange)="onActiveDateChange($event, partType)"
          class="trudi-date-picker-2"></inner-popup>
      </div>
    </ng-template>

    <ng-template #tplFooter>
      <calendar-footer
        *ngIf="hasFooter"
        [locale]="locale!"
        [showToday]="showToday"
        [showNow]="showNow"
        [okDisabled]="!isAllowed($any(datePickerService?.value))"
        [extraFooter]="extraFooter"
        [rangeQuickSelector]="null"
        (clickOk)="onClickOk()"
        (clickToday)="onClickToday($event)"></calendar-footer>
    </ng-template>
  `
})
export class DateRangePopupComponent implements OnInit, OnChanges, OnDestroy {
  @Input() inline: boolean = false;
  @Input() showWeek!: boolean;
  @Input() locale!: TrudiCalendarI18nInterface | undefined;
  @Input() disabledDate?: DisabledDateFn;
  @Input() disabledTime?: DisabledTimeFn; // This will lead to rebuild time options
  @Input() showToday!: boolean;
  @Input() showNow!: boolean;
  @Input() showTime!: SupportTimeOptions | boolean;
  @Input() extraFooter?: TemplateRef<void> | string;
  @Input() dateRender?:
    | string
    | TemplateRef<Date>
    | FunctionProp<TemplateRef<Date> | string>;
  @Input() panelMode!: TrudiDateMode | TrudiDateMode[];
  @Input() defaultPickerValue!: CompatibleDate | undefined | null;
  @Input() dir: Direction = 'ltr';
  @Input() showDayOff: boolean = true;

  @Output() readonly panelModeChange = new EventEmitter<
    TrudiDateMode | TrudiDateMode[]
  >();
  @Output() readonly calendarChange = new EventEmitter<CompatibleValue>();
  @Output() readonly resultOk = new EventEmitter<void>(); // Emitted when done with date selecting

  prefixCls: string = PREFIX_CLASS;
  endPanelMode: TrudiDateMode | TrudiDateMode[] = 'date';
  timeOptions: SupportTimeOptions | SupportTimeOptions[] | null = null;
  checkedPartArr: boolean[] = [false, false];
  destroy$ = new Subject<void>();

  get hasFooter(): boolean {
    return this.showToday || !!this.extraFooter;
  }

  get arrowPosition(): { left?: string; right?: string } {
    return this.dir === 'rtl'
      ? { right: `${this.datePickerService?.arrowLeft}px` }
      : { left: `${this.datePickerService?.arrowLeft}px` };
  }

  constructor(
    public datePickerService: DatePickerService,
    public cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    merge(
      this.datePickerService.valueChange$,
      this.datePickerService.inputPartChange$
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateActiveDate();
        this.cdr.markForCheck();
      });

    this.ngZone.runOutsideAngular(() => {
      fromEvent(this.host.nativeElement, 'mousedown')
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => event.preventDefault());
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Parse showTime options
    if (changes['showTime'] || changes['disabledTime']) {
      if (this.showTime) {
        this.buildTimeOptions();
      }
    }
    if (changes['panelMode']) {
      this.endPanelMode = this.panelMode;
    }
    if (changes['defaultPickerValue']?.currentValue) {
      this.updateActiveDate();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateActiveDate(): void {
    const activeDate = this.datePickerService.hasValue()
      ? this.datePickerService.value
      : this.datePickerService.makeValue(this.defaultPickerValue!);
    this.datePickerService.setActiveDate(
      activeDate,
      false,
      this.getPanelMode(this.endPanelMode) as NormalizedMode
    );
  }

  onClickOk(): void {
    const inputIndex = { left: 0, right: 1 }[
      this.datePickerService.activeInput
    ];
    const value: CandyDate = this.datePickerService.value as CandyDate;
    this.changeValueFromSelect(value);
    this.resultOk.emit();
  }

  onClickToday(value: CandyDate): void {
    this.changeValueFromSelect(value, !this.showTime);
  }

  onPanelModeChange(mode: TrudiDateMode, partType?: RangePartType): void {
    this.panelMode = mode;
    this.panelModeChange.emit(this.panelMode);
  }

  onActiveDateChange(value: CandyDate, partType: RangePartType): void {
    this.datePickerService.setActiveDate(value);
  }

  onSelectTime(value: CandyDate, partType?: RangePartType): void {
    const newValue = this.overrideHms(
      value,
      this.datePickerService.value as CandyDate
    );
    this.datePickerService.setValue(newValue); // If not select a date currently, use today
    this.datePickerService.inputPartChange$.next();
    this.buildTimeOptions();
  }

  changeValueFromSelect(
    value: CandyDate | string,
    emitValue: boolean = true
  ): void {
    this.datePickerService.setValue(value);
    this.datePickerService.inputPartChange$.next();
    if (emitValue && this.isAllowed(value)) {
      this.datePickerService.emitValue$.next();
    }

    this.buildTimeOptions();
  }

  reversedPart(part: RangePartType): RangePartType {
    return part === 'left' ? 'right' : 'left';
  }

  getPanelMode(
    panelMode: TrudiDateMode | TrudiDateMode[],
    partType?: RangePartType
  ): TrudiDateMode {
    return panelMode as TrudiDateMode;
  }

  // Get single value or part value of a range
  getValue(partType?: RangePartType): CandyDate {
    return this.datePickerService.value as CandyDate;
  }

  getActiveDate(partType?: RangePartType): CandyDate {
    return this.datePickerService.activeDate as CandyDate;
  }

  disabledStartTime: DisabledTimeFn = (value: Date | Date[]) =>
    this.disabledTime && this.disabledTime(value, 'start');

  disabledEndTime: DisabledTimeFn = (value: Date | Date[]) =>
    this.disabledTime && this.disabledTime(value, 'end');

  isOneAllowed(selectedValue: SingleValue[]): boolean {
    const index = this.datePickerService.getActiveIndex();
    const disabledTimeArr = [this.disabledStartTime, this.disabledEndTime];
    return isAllowedDate(
      selectedValue[index]!,
      this.disabledDate,
      disabledTimeArr[index]
    );
  }

  isBothAllowed(selectedValue: SingleValue[]): boolean {
    return (
      isAllowedDate(
        selectedValue[0]!,
        this.disabledDate,
        this.disabledStartTime
      ) &&
      isAllowedDate(selectedValue[1]!, this.disabledDate, this.disabledEndTime)
    );
  }

  isAllowed(value: CompatibleValue | string, isBoth: boolean = false): boolean {
    return isAllowedDate(
      value as CandyDate,
      this.disabledDate,
      this.disabledTime
    );
  }

  getTimeOptions(partType?: RangePartType): SupportTimeOptions | null {
    if (this.showTime && this.timeOptions) {
      return this.timeOptions instanceof Array
        ? this.timeOptions[this.datePickerService.getActiveIndex(partType)]
        : this.timeOptions;
    }
    return null;
  }

  onClickPresetRange(val: PresetRanges[keyof PresetRanges]): void {
    const value = typeof val === 'function' ? val() : val;
    if (value) {
      this.datePickerService.setValue([
        new CandyDate(value[0]),
        new CandyDate(value[1])
      ]);
      this.datePickerService.emitValue$.next();
    }
  }

  getObjectKeys(obj?: PresetRanges): string[] {
    return obj ? Object.keys(obj) : [];
  }

  show(partType: RangePartType): boolean {
    const hide =
      this.showTime && this.datePickerService.activeInput !== partType;
    return !hide;
  }

  private buildTimeOptions(): void {
    if (this.showTime) {
      const showTime = typeof this.showTime === 'object' ? this.showTime : {};
      this.timeOptions = this.overrideTimeOptions(
        showTime,
        this.datePickerService.value as CandyDate
      );
    } else {
      this.timeOptions = null;
    }
  }

  private overrideTimeOptions(
    origin: SupportTimeOptions,
    value: CandyDate,
    partial?: DisabledTimePartial
  ): SupportTimeOptions {
    let disabledTimeFn;
    if (partial) {
      disabledTimeFn =
        partial === 'start' ? this.disabledStartTime : this.disabledEndTime;
    } else {
      disabledTimeFn = this.disabledTime;
    }
    return { ...origin, ...getTimeConfig(value, disabledTimeFn) };
  }

  private overrideHms(
    newValue: CandyDate | null,
    oldValue: CandyDate | null
  ): CandyDate {
    newValue = newValue || new CandyDate();
    oldValue = oldValue || new CandyDate();
    return oldValue.setHms(
      newValue.getHours(),
      newValue.getMinutes(),
      newValue.getSeconds()
    );
  }
}
