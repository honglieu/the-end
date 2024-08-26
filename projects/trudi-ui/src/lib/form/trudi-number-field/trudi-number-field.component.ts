import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl
} from '@angular/forms';
import { TrudiTextFieldSize } from '../trudi-text-field';

@Component({
  selector: 'trudi-number-field',
  templateUrl: './trudi-number-field.component.html',
  styleUrls: ['./trudi-number-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiNumberFieldComponent),
      multi: true
    }
  ]
})
export class TrudiNumberFieldComponent implements OnInit, ControlValueAccessor {
  @ViewChild('input') inputElem: ElementRef<HTMLInputElement>;
  @Input() size: TrudiTextFieldSize = 'medium';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() iconLeft = '';
  @Input() prefixText = '';
  @Input() disabled: boolean;
  @Input() clearable: boolean = false;
  @Input() maxCharacter: number;
  @Output() triggerEventBlur = new EventEmitter<string>();
  @Output() triggerEventFocus = new EventEmitter<void>();
  @Input() maskPattern = '';
  @Input() checkSubmit: false;
  @Input() maskLeadZero: boolean = false;
  @Input() thousandSeparatorType: string = '';
  @Input() separatorLimit: string = '';
  @Input() isNumeric: boolean = false;
  @Input() disableDotKey: boolean = false;
  @Input() isContactFormNewTenant: boolean = false;
  @Output() onChangeData = new EventEmitter<number>();
  @Output() onKeydownEnter = new EventEmitter<HTMLInputElement>();
  private ngControl: NgControl;
  private _value: number;
  invalidCharacter: string[] = ['e', 'E', '+', '-'];

  private onChange: (_: number) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private injector: Injector, private cdr: ChangeDetectorRef) {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: number): void {
    this.value = value;
    this.cdr.detectChanges();
    // can not use markForCheck, do not remove it.
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl);
  }

  @HostBinding('attr.class') get classes() {
    return `trudi-ui trudi-ui-${this.size}`;
  }

  get clearIconStyle() {
    return this.size !== 'small'
      ? { 'width.px': 12, 'height.px': 12 }
      : { 'width.px': 9.6, 'height.px': 9.6 };
  }

  handleClear(event) {
    event.preventDefault();
    event.stopPropagation();
    this.value = null;
    this.inputElem.nativeElement.focus();
  }

  get value() {
    return this._value;
  }

  set value(val: number) {
    this._value = val;
    this.onChange(val);
    if (!this.checkSubmit) this.onTouched();
  }

  get control() {
    return this.ngControl?.control;
  }

  get isDisabled() {
    return this.disabled ? 'disabled' : '';
  }

  get showClearable() {
    return (
      this.value?.toString().length > 0 && !this.disabled && this.clearable
    );
  }
}
