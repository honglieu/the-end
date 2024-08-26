import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl
} from '@angular/forms';
import {
  debounceTime,
  filter,
  fromEvent,
  Subject,
  Subscription,
  takeUntil
} from 'rxjs';
import { IntegerRegex, POSITION_MAP, TimeRegex } from '@services/constants';
import {
  hmsToSecondsOnly,
  initTime,
  mapTime,
  sortTimesStartingFrom
} from '@shared/components/date-picker2/util';
import { DropdownMenuComponent } from '@shared/components/dropdown-menu/dropdown.component';
import { AgencyDateFormatService } from './../../../dashboard/services/agency-date-format.service';
import { ETimePrevios, EventListener, IHourd } from './time-picker';
import { ITimezone } from '@core';

@Component({
  selector: 'time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true
    }
  ]
})
export class TimePickerComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit, ControlValueAccessor
{
  @ViewChild('dropdownBtn') dropdownBtn: ElementRef<HTMLElement>;
  @ViewChild('dropdown') dropdown: DropdownMenuComponent;
  @ViewChild('input') input: ElementRef<HTMLInputElement>;
  @ViewChild('dropdownListElement', { static: false })
  dropdownListElement!: ElementRef<HTMLElement>;

  @Input() isHiddenDisableTime: boolean = false;
  @Input() minuteControl: number = 15;
  @Input() hours: IHourd[];
  @Input() readonly: boolean = true;
  @Input() label: string;
  @Input() validate: boolean;
  @Input() hasError: boolean = false;
  @Input() isDefault: boolean;
  @Input() isFrom: boolean;
  @Input() isTo: boolean;
  @Input() rangeFrom: number;
  @Input() rangeTo: number;
  @Input() startHourdError: boolean = false;
  @Input() endHourdError: boolean = false;
  @Input() disableTimeChange: boolean = false;
  @Input() customClass: string;
  @Input() position = POSITION_MAP.bottom;
  @Input() disabled: boolean = false;
  @Input() rangeStartTime: number = 0;
  @Input() valueChangeDependentOnResetRangeTime: any;
  @Input() isShowTimezoneAbbrev: boolean = true;
  @Input() isShowIconSchedule: boolean = false;

  @Output() isFocus = new EventEmitter<boolean>();
  @Output() triggerEventInput = new EventEmitter<string>();
  @Output() onChangeHour = new EventEmitter<string | number>();
  @Output() onError = new EventEmitter<boolean>();

  private unsubscribe = new Subject<void>();
  public _label: string = '';
  public _originalLabel: string = '';
  private _value: string | number;
  public error: boolean = false;
  public defaultHours: IHourd[];
  public init: boolean = true;
  private optionElement: HTMLElement;
  public disabledTrigger: boolean = false;
  public resettingValue: boolean = false;
  private ngControl: NgControl;
  public isOpenDropdown: boolean = false;
  private indexItemDropdown: number = 0;
  private isHitKeyUpAndDown: boolean = false;
  private isDropdownVisible = false;
  private keyupSubscription: Subscription;
  private clickSubscription: Subscription;
  private keydownSubscription: Subscription;
  private isFirstKeyUpAfterDropdownShow: boolean = true;
  public timeZone = {} as ITimezone;

  constructor(
    protected cdr: ChangeDetectorRef,
    private injector: Injector,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  get getError(): boolean {
    return (
      this.endHourdError ||
      this.startHourdError ||
      this.error ||
      this.hasError ||
      (this.control?.dirty && this.control?.touched && !!this.control.errors)
    );
  }

  get inputElement() {
    return this.input?.nativeElement;
  }

  get dropdownElement() {
    return this.dropdownListElement?.nativeElement;
  }

  get control() {
    return this.ngControl?.control;
  }

  get value() {
    return this?._value ?? null;
  }

  set value(val: string | number) {
    if (val) this._value = val;
  }

  onChange: (_: string) => void = () => {};

  onTouched: () => void = () => {};

  registerOnChange(fn): void {
    this.onChange = fn;
  }

  registerOnTouched(fn): void {
    this.onTouched = fn;
  }

  writeValue(value: string | number): void {
    this._value = value?.toString() ?? null;
    const time = this.value && mapTime(hmsToSecondsOnly(this._value));
    const formattedValue = this.isShowTimezoneAbbrev
      ? `${time?.label} (${this.timeZone?.abbrev})`
      : time?.label;
    this._originalLabel = time?.label || null;
    this._label = time?.label ? formattedValue : null;
    this.inputElement &&
      (this.inputElement.value = time?.label ? formattedValue : null);
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl);
    this.agencyDateFormatService.timezone$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((timezone) => {
        this.timeZone = timezone;
        if (this.minuteControl && this.rangeStartTime) {
          this.initHour();
        }
      });
  }

  ngAfterViewInit(): void {
    this.onEventFocusOut();
    this.onEventFocus();
    this.onEventMouseUp();
  }

  private onEventMouseUp() {
    fromEvent(this.dropdownBtn.nativeElement, 'mouseup')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((event: EventListener) => {
        if (this.isFirstKeyUpAfterDropdownShow) {
          this.isFirstKeyUpAfterDropdownShow = false;
        }
      });
  }

  ngAfterViewChecked() {
    if (this.dropdownListElement?.nativeElement && !this.isDropdownVisible) {
      const timeFormat = this.matchesTimeFormat(this._label);
      const second = hmsToSecondsOnly(timeFormat);
      const hour = this._value ? this.findHour(timeFormat) : null;

      if (hour || second) {
        this.scrollOptionToTop(hour?.label || timeFormat);
      } else {
        this.scrollOptionToFirstChildWithoutDisable();
      }
      this.onEventKeyup();
      this.onEventClick();
      this.onEventKeydown();
      this.isDropdownVisible = true;
    } else if (
      !this.dropdownListElement?.nativeElement &&
      this.isDropdownVisible
    ) {
      this.isDropdownVisible = false;
      this.isFirstKeyUpAfterDropdownShow = true;
      this.keyupSubscription?.unsubscribe();
      this.clickSubscription?.unsubscribe();
      this.keydownSubscription?.unsubscribe();
    }
  }

  private onEventKeydown() {
    this.keydownSubscription = fromEvent(this.inputElement, 'keydown')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((event: EventListener) => {
        event.stopPropagation();
      });
  }
  private onEventKeyup() {
    this.keyupSubscription = fromEvent(this.inputElement, 'keyup')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(({ target, keyCode }: EventListener) => {
        this.handlerKeyUpAndDown(keyCode);

        if (this.isFirstKeyUpAfterDropdownShow) {
          this.isFirstKeyUpAfterDropdownShow = false;
          return;
        }
        let isDropdownVisibleKeyUp = false;
        const { value } = target;

        if (!value && !isDropdownVisibleKeyUp) {
          this._value = null;
          this._label = null;
          this._originalLabel = null;
          this.error = false;
          this.onChangeHour.emit('');
          if (this.optionElement) {
            this.optionElement.style.backgroundColor = '';
          }

          isDropdownVisibleKeyUp = true;

          if (keyCode === 13) {
            this.dropdownElement.click();
            this.inputElement.blur();
            return;
          }
          return;
        }
        isDropdownVisibleKeyUp = false;
        const query = this.matchesTimeFormat(value);
        this.error = !TimeRegex.test(query);

        const hour = this.findHour(query);
        if (keyCode !== 38 && keyCode !== 40) {
          if (hour) {
            this.scrollOptionToTop(hour?.label);
          } else if (!hour && TimeRegex.test(query)) {
            this.scrollOptionToTop(query);
          }
        }

        if (hour && keyCode === 13) {
          this.optionElement?.click();
          this.onChangeTime(hour);
          this.dropdownElement.click();
          this.inputElement.blur();
          return;
        }

        if (!hour && keyCode === 13) {
          this.setValueEvent(query);
          this.dropdownElement.click();
          this.inputElement.blur();
          return;
        }
        this.cdr.markForCheck();
      });
  }

  private onEventFocus() {
    fromEvent(this.inputElement, 'focus')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(({ target }: EventListener) => {
        const value: string = target.value;
        this.error = false;
        this.onError.emit(false);

        if (!TimeRegex.test(value)) {
          this._value = null;
          this.onChangeHour.emit('');
        }
        this.isFocus.emit(true);
        this.cdr.markForCheck();
      });
  }

  private onEventFocusOut() {
    fromEvent(this.inputElement, 'focusout')
      .pipe(takeUntil(this.unsubscribe), debounceTime(200))
      .subscribe(({ target }: EventListener) => {
        const value: string = target.value;
        this.error = false;
        const query = this.matchesTimeFormat(value);
        if (!TimeRegex.test(query)) {
          this.onError.emit(true);
          this.error = true;
          this.onChange('');
          this.onChangeHour.emit('');
          this.writeValue('');
          return;
        }

        const hour = this.findHour(query);

        if (hour) {
          this.onChangeTime(hour);
        } else {
          this.setValueEvent(query);
        }
        this.cdr.markForCheck();
      });
  }

  private onEventClick() {
    this.clickSubscription = fromEvent(document, 'click')
      .pipe(
        filter(({ target }: EventListener) => {
          return !this.dropdownElement?.contains(target);
        })
      )
      .subscribe(() => {
        const { value } = this.inputElement;
        const query = this.matchesTimeFormat(value);

        if (!TimeRegex.test(query)) {
          this.writeValue(null);
          this.onChangeHour.emit('');
        }

        if (this.control.errors) {
          this.setValueEvent(query);
        }
      });
  }

  private checkIsInValidRangeFromAndRangeTo(second: number): boolean {
    return (
      (this.isTo && this.rangeFrom >= second) ||
      (this.isFrom && this.rangeTo && this.rangeTo <= second)
    );
  }

  private setValueEvent(value: string) {
    if (!value) {
      this.onChangeHour.emit('');
      return;
    }

    if (!TimeRegex.test(value)) {
      this.error = true;
    } else {
      const second = hmsToSecondsOnly(this.convertTime12to24(value));
      const time = mapTime(second);

      if (this.checkIsInValidRangeFromAndRangeTo(second)) {
        this.writeValue(time?.value || '');
        this.onChangeHour.emit(time?.value);
        this.control.setErrors({ invalidRangeTime: true });
        this.onError.emit(true);
        this.error = true;
      } else {
        this.disabledTrigger = true;
        this.writeValue(second);
        this.onChangeHour.emit(second);
        this.disabledTrigger = false;
        this.error = false;
      }
      this.cdr.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rangeFrom'] || changes['rangeTo']) {
      this.initHour();
      if (
        (changes['rangeFrom']?.currentValue ||
          changes['rangeTo']?.currentValue) &&
        this.rangeFrom < this.rangeTo
      ) {
        this.error = false;
      }
    }

    if (changes['valueChangeDependentOnResetRangeTime']?.currentValue) {
      this.writeValue('');
      this.onChangeHour.emit('');
    }
  }

  onClick() {
    this.initHour();
    this.error = false;
  }

  onBlur() {
    this.isFocus.emit(false);
  }

  onChangeTime({ disabled, value }: IHourd) {
    if (disabled) return;
    this.writeValue(value);
    this.onChangeHour.emit(value);
    this.cdr.markForCheck();
  }

  private findHour(query: string) {
    let queryPeriodPartPM: string;
    if (query?.includes(ETimePrevios.AM)) {
      queryPeriodPartPM = query.replace(ETimePrevios.AM, ETimePrevios.PM);
    }
    return (
      this.hours.find((time) => time.label === query && !time.disabled) ||
      this.hours.find(
        (time) => time.label === queryPeriodPartPM && !time.disabled
      )
    );
  }

  private convertTime12to24 = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    if (!modifier) return time12h;
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier.toLowerCase() === ETimePrevios.PM) {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}:00`;
  };

  private matchesTimeFormat(query: string): string {
    if (!query) return null;
    const lowerQuery = query.toLowerCase();
    const parts = lowerQuery.split(' ');
    const timePart = parts[0]?.trim();
    const periodPart = parts[1]?.trim();

    const is12HourFormat =
      periodPart === ETimePrevios.AM || periodPart === ETimePrevios.PM;
    const hoursQuery = parseInt(timePart, 10);
    const [hoursStr, minutesStr] = timePart.split(':');
    const hours = parseInt(hoursStr, 10) === 0 ? 12 : parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr || '0', 10);
    const minutesQuery =
      isNaN(minutes) || minutes < 0 || minutes > 59 ? 0 : minutes;
    const queryTimePart = `${hours}:${minutesQuery
      .toString()
      .padStart(2, '0')}`;

    const queryHourAM = `${queryTimePart} ${ETimePrevios.AM}`;
    const queryHourPM = `${queryTimePart} ${ETimePrevios.PM}`;

    if (TimeRegex.test(lowerQuery)) {
      return lowerQuery;
    } else if (
      parts.length <= 2 &&
      IntegerRegex.test(hoursStr) &&
      (minutesStr ? IntegerRegex.test(minutesStr) : true)
    ) {
      const is12Hour =
        hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59;
      if (is12HourFormat && is12Hour) {
        return `${queryTimePart} ${periodPart}`;
      } else if (
        !isNaN(hoursQuery) &&
        hoursQuery >= 0 &&
        hoursQuery <= 24 &&
        minutes >= 0 &&
        minutes <= 59 &&
        !periodPart
      ) {
        const isAM = hoursQuery === 24 || hoursQuery === 0 || hoursQuery < 12;
        if (is12Hour) {
          const secondForAMHour = hmsToSecondsOnly(
            this.convertTime12to24(queryHourAM)
          );
          const secondForPMHour = hmsToSecondsOnly(
            this.convertTime12to24(queryHourPM)
          );

          if (!this.checkIsInValidRangeFromAndRangeTo(secondForAMHour)) {
            return queryHourAM;
          }

          if (!this.checkIsInValidRangeFromAndRangeTo(secondForPMHour)) {
            return queryHourPM;
          }
        }
        return `${hoursQuery === 0 ? 12 : hoursQuery % 12 || 12}:${minutesQuery
          .toString()
          .padStart(2, '0')} ${isAM ? ETimePrevios.AM : ETimePrevios.PM}`;
      } else if (is12Hour && periodPart && periodPart.length === 1) {
        if (periodPart === 'a') {
          return queryHourAM;
        } else if (periodPart === 'p') {
          return queryHourPM;
        }
      }
    }

    return lowerQuery;
  }

  private initHour() {
    this.hours = initTime(
      this.rangeFrom,
      this.rangeTo,
      this.isFrom,
      this.isTo,
      this.minuteControl,
      this.isHiddenDisableTime,
      this.rangeStartTime
    );
    this.defaultHours = this.hours;
  }

  private scrollOptionToTop(time: string) {
    if (this.optionElement) {
      this.optionElement.style.backgroundColor = '';
    }

    const findOptionElement = this.dropdownElement.querySelector(
      `.dropdown-list li[data-time="${time}"]`
    );

    if (findOptionElement) {
      this.optionElement = findOptionElement as HTMLElement;
      this.optionElement.scrollIntoView({
        behavior: 'auto',
        block: 'start',
        inline: 'nearest'
      });
      this.optionElement.style.backgroundColor = '#E5F3F2';
      return;
    }

    if (this._value) {
      const hours = [...this.hours];
      const valueSecond = hmsToSecondsOnly(this.convertTime12to24(time));
      const nearestHours = hours.reduce((prev, curr) => {
        const prevSecond = parseInt(prev.value.toString());
        const currSecond = parseInt(curr.value.toString());
        return Math.abs(currSecond - valueSecond) <
          Math.abs(prevSecond - valueSecond)
          ? curr
          : prev;
      });

      const element = this.dropdownElement.querySelector(
        `.dropdown-list li[data-time="${nearestHours.label}"]`
      );
      element?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  }

  private scrollOptionToFirstChildWithoutDisable() {
    if (this._value) return;
    const second8am = 28800;
    const hours = [...this.hours];
    const hoursStartFrom8am: IHourd[] = sortTimesStartingFrom(second8am, hours);
    const time = hoursStartFrom8am.find((hour) => !hour.disabled)?.label;

    const foundFirstElementOption = this.dropdownElement.querySelector(
      `.dropdown-list li[data-time="${time}"]`
    );
    if (foundFirstElementOption) {
      foundFirstElementOption.scrollIntoView({
        behavior: 'auto',
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  visibleChange(event: boolean) {
    this.resetValueKeyUpAndDown(event);
    if (this.disabled) return;
    if (!this.input) return;
    if (!this.dropdownBtn) return;
    if (this.disableTimeChange) return;
    this.dropdownBtn?.nativeElement.classList.toggle('dropdown-show');
    if (event) this.inputElement.focus();
  }

  handlerKeyUpAndDown(keyCode: EventListener['keyCode']) {
    const listItems = this.dropdownElement?.querySelectorAll(
      'li:not(.item-disabled)'
    );
    const indexActive = Array.from(listItems).findIndex((element) =>
      element.classList.contains('background-active')
    );
    const indexFocused = Array.from(listItems).findIndex((element) =>
      element.classList.contains('arrow-item-focused')
    );
    if (keyCode === 13 && indexFocused !== 1) {
      const element = listItems[indexFocused] as HTMLElement;
      const dataTime = element?.getAttribute('data-time');
      const result = this.hours.find((item) => item.label === dataTime);
      result && this.onChangeTime(result);
      return;
    }
    listItems.forEach((item) => {
      item.classList.remove('arrow-item-focused');
    });
    if (!this.isHitKeyUpAndDown && this.indexItemDropdown === 0) {
      if (indexActive === -1) this.indexItemDropdown = 0;
      else this.indexItemDropdown = indexActive;
      this.isHitKeyUpAndDown = true;
    }

    const element = listItems[this.indexItemDropdown] as HTMLElement;
    if (keyCode === 38 && this.isOpenDropdown) {
      this.handlerLogicKeyUpAndDown(element);
      this.indexItemDropdown !== 0 && this.indexItemDropdown--;
    } else if (keyCode === 40 && this.isOpenDropdown) {
      this.handlerLogicKeyUpAndDown(element);
      listItems.length !== this.indexItemDropdown && this.indexItemDropdown++;
    }
  }

  handlerLogicKeyUpAndDown(element: HTMLElement) {
    this.optionElement = element;
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest'
    });
    element?.classList.add('arrow-item-focused');
  }

  resetValueKeyUpAndDown(value: boolean) {
    this.isOpenDropdown = value;
    this.indexItemDropdown = value ? 0 : this.indexItemDropdown;
    this.isHitKeyUpAndDown = false;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
