import {
  Component,
  ElementRef,
  HostBinding,
  Injector,
  Input,
  OnInit,
  ViewChild,
  forwardRef,
  Output,
  EventEmitter,
  TemplateRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl
} from '@angular/forms';
import uuidv4 from 'uuid4';
import { EDirectives } from '../../common/enums/directive.enum';
@Component({
  selector: 'trudi-text-field',
  templateUrl: './trudi-text-field.component.html',
  styleUrls: ['./trudi-text-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiTextFieldComponent),
      multi: true
    }
  ]
})
export class TrudiTextFieldComponent implements OnInit, ControlValueAccessor {
  @ViewChild('input') inputElem: ElementRef<HTMLInputElement>;
  @Input() autoFocus = false;
  @Input() size: TrudiTextFieldSize = 'extra-large';
  @Input() prefixTemplate: TemplateRef<void>;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() iconLeft = '';
  @Input() clearIcon = 'closeBtn';
  @Input() prefixText = '';
  @Input() isBlockEvent: boolean = false;
  @Input() disabled: boolean;
  @Input() clearable: boolean = false;
  @Input() maxCharacter: number = null;
  @Input() directive: EDirectives;
  @Input() showCounting: boolean = true;
  @Input() isShowEmbedCodeFunction: boolean = false;
  @Input() listCodeOptions = [];
  @Input() onlyShowMaxCharacter: boolean = false;
  @Input() type: TrudiTextFieldTypeInput = 'text';
  @Input() autocomplete: string = 'off';
  @Input() dynamicWidth: boolean = false;
  @Input() e2eId: string = 'text-input';
  @Input() allowPreventDefault: boolean = true;
  @Input() readonly: boolean = false;
  @Input() iconSize = {
    width: 12,
    height: 12
  };

  // TODO: optimize later
  @Input() checkSubmit: boolean = false;
  @Output() clear = new EventEmitter();
  @Output() triggerEventInput = new EventEmitter<string>();
  @Output() triggerEventBlur = new EventEmitter<string>();
  @Output() triggerEventFocus = new EventEmitter();
  private ngControl: NgControl;
  private _value: string;
  readonly EDirectives = EDirectives;
  public uniqueId: string = uuidv4();
  public hasIconEyePassword: boolean = false;
  onChange: (_: string) => void = () => {};
  onTouched: () => void = () => {};

  get value() {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    this.onChange(this._value);
    this.onTouched();
  }
  constructor(private injector: Injector) {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: string): void {
    this.value = value;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl);
    this.hasIconEyePassword = this.type == 'password';
  }

  ngAfterViewInit() {
    if (this.autoFocus) {
      this.inputElem?.nativeElement?.focus();
    }
  }

  @HostBinding('attr.class') get classes() {
    return `trudi-ui trudi-ui-${this.size}`;
  }
  get clearIconStyle() {
    return this.size !== 'small'
      ? { 'width.px': this.iconSize.width, 'height.px': this.iconSize.height }
      : { 'width.px': 9.6, 'height.px': 9.6 };
  }

  handleClear(event: MouseEvent) {
    if (this.allowPreventDefault) {
      event.preventDefault();
    }
    if (event.button !== 0) return;
    this.value = '';
    this.clear.emit(this.inputElem);
  }

  get control() {
    return this.ngControl?.control;
  }

  get isDisabled() {
    return this.disabled ? 'disabled' : '';
  }

  get showClearable() {
    return this.value?.length > 0 && !this.disabled && this.clearable;
  }

  public handleEmbedCodeOption(codeOption) {
    let valueToInsert = `{${codeOption.param}}`;
    const remainingChar =
      Number(this.maxCharacter) - this.control?.value?.length;
    const hasSpace = remainingChar - valueToInsert.length >= 0;
    if (this.control?.value?.length === Number(this.maxCharacter) || !hasSpace)
      return;
    if (this.value) {
      const start = this.inputElem.nativeElement.selectionStart;
      const end = this.inputElem.nativeElement.selectionEnd;
      this.value =
        this.value.slice(0, start) + valueToInsert + this.value.slice(end);

      const newCursorPos = start + codeOption.text.length;
      this.inputElem.nativeElement.setSelectionRange(
        newCursorPos,
        newCursorPos
      );
    } else {
      this.value = valueToInsert;
    }
  }

  calculateInputWidth(): number {
    const inputNativeElement: HTMLInputElement = this.inputElem?.nativeElement;
    const minWidth = 5;

    // Calculate the width based on the content
    const textWidth = this.getTextWidth(
      inputNativeElement?.value,
      'Inter, sans-serif',
      18
    );

    const totalWidth = textWidth ? textWidth : minWidth;

    return totalWidth;
  }

  // Function to get the width of the text in pixels
  getTextWidth(text: string, font: string, fontSize: number): number {
    let padding = 3;
    const span = document.createElement('span');
    const offScreenContainer = document.createElement('div');
    span.style.fontSize = fontSize + 'px';
    span.style.font = font;
    span.innerHTML = text;
    offScreenContainer.style.position = 'absolute';
    offScreenContainer.style.left = '-9999px'; // Move off-screen
    offScreenContainer.appendChild(span);
    document.body.appendChild(offScreenContainer);
    const width = Math.ceil(span?.getBoundingClientRect()?.width);
    const paddingCount = padding + Math.round(text?.length / 9);
    return width + paddingCount * 2;
  }

  public changeTypeInput() {
    this.type = this.type === 'text' ? 'password' : 'text';
  }
}

export type TrudiTextFieldSize = 'small' | 'medium' | 'large' | 'extra-large';
export type TrudiTextFieldTypeInput = 'text' | 'password';
