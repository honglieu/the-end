import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl
} from '@angular/forms';

export enum AttachAction {
  Computer = 'Computer',
  ContactCard = 'Contact Card'
}
@Component({
  selector: 'trudi-textarea',
  templateUrl: './trudi-textarea.component.html',
  styleUrls: ['./trudi-textarea.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiTextareaComponent),
      multi: true
    }
  ]
})
export class TrudiTextareaComponent
  implements OnInit, OnChanges, ControlValueAccessor, AfterViewInit
{
  @ViewChild('textarea') textareaElem: ElementRef<HTMLTextAreaElement>;

  @Input() label = '';
  @Input() showRemainderCharacterMode: boolean;
  @Input() resizable = true;
  @Input() placeholder = '';
  @Input() disabled: boolean;
  @Input() maxCharacter: number = null;
  @Input() onlyShowMaxCharacter: boolean = false;
  @Input() cols: number = 4;
  @Input() rows: number = 4;
  @Input() showCounting: boolean = true;
  @Input() trim: boolean = true;
  @Input() autoFocus: boolean = false;
  @Input() isPressEnter: boolean = false;
  @Output() triggerEventBlur = new EventEmitter<string>();
  @Output() triggerEventFocus = new EventEmitter<string>();
  @Input() checkSubmit: boolean = false;
  @Input() suffixIcon: string = '';
  @Input() bottomButton: string = '';
  @Input() isShowCountingOutSide: boolean = false;
  @Input() isScrolledDrawerContent: boolean = false;
  @Input() isCustomPolicyAttach: boolean = false;
  @Input() index: number = 0;
  @Output() triggerEventClickAttachItem = new EventEmitter<string>();
  @Output() triggerEventClickAttachIcon = new EventEmitter<boolean>(false);
  @Output() triggerEventClickSuffixIcon = new EventEmitter();

  private ngControl: NgControl;
  private _value: string;
  untrimmedValue: string;
  public visibleDropdown: boolean = false;
  public attachOptions = [
    {
      text: 'Upload from computer',
      action: AttachAction.Computer,
      dataE2e: 'upload-from-computer-btn'
    },
    {
      text: 'Add contact card',
      action: AttachAction.ContactCard,
      dataE2e: 'add-contact-card-btn'
    }
  ];

  onChange: (_: string) => void = () => {};
  onTouched: () => void = () => {};

  get value() {
    return this.untrimmedValue;
  }

  set value(val: string) {
    this.untrimmedValue = val;
    this._value = this.trim ? val?.trim() : val;
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['isScrolledDrawerContent']?.currentValue) {
      this.visibleDropdown = !changes['isScrolledDrawerContent']?.currentValue;
    }
  }

  ngAfterViewInit() {
    this.autoFocus && this.textareaElem?.nativeElement.focus();
  }

  onDropdownMenuVisibleChange(event) {
    this.visibleDropdown = event;
  }

  onEnterThenOutFocus(event: KeyboardEvent) {
    if (!this.isPressEnter) return;
    event.preventDefault();
    this.textareaElem?.nativeElement.blur();
  }

  get control() {
    return this.ngControl?.control;
  }

  get isDisabled() {
    return this.disabled ? 'disabled' : '';
  }

  get isSuffixIcon() {
    return this.suffixIcon.length ? 'suffix-icon' : '';
  }

  get isVisibleDropdown() {
    return this.visibleDropdown ? 'visible-dropdown' : '';
  }
}
