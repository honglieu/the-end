import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { noop } from 'rxjs';
import { NgClass } from '@angular/common';
import { ClickOutsideModule } from '@shared/directives/click-outside/click-outside.module';

@Component({
  selector: 'scale-percent-input',
  standalone: true,
  imports: [NgClass, ClickOutsideModule],
  templateUrl: './scale-percent-input.component.html',
  styleUrl: './scale-percent-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScalePercentInputComponent),
      multi: true
    }
  ]
})
export class ScalePercentInputComponent implements ControlValueAccessor {
  @Input() maxValue?: number;
  @Input() minValue?: number;
  @ViewChild('input') inputElement: ElementRef<HTMLSpanElement>;
  @ViewChild('inputWrapper') inputWrapperElement: ElementRef<HTMLDivElement>;

  value: number = 0;
  focusing: boolean = false;
  private _onChange: (value: number) => void = noop;
  private _onTouched: () => void = noop;
  constructor(private _cdr: ChangeDetectorRef) {}
  registerOnChange(fn: typeof this._onChange): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: typeof this._onTouched): void {
    this._onTouched = fn;
  }

  writeValue(value: number): void {
    this.value = value;
    this._onChange(value);
  }

  handleInput(event: Event) {
    const key = (event as KeyboardEvent).key;
    const inputElement = event.target as HTMLInputElement;
    const currentValue = inputElement.innerText;
    const isControlKey = [
      'Backspace',
      'ArrowLeft',
      'ArrowUp',
      'ArrowRight',
      'ArrowDown',
      'Home',
      'End',
      'Delete',
      'Insert'
    ].includes(key);

    if (
      (isNaN(Number(key)) ||
        currentValue.length >= this.maxValue.toString().length) &&
      !isControlKey
    ) {
      event.preventDefault();
    }
    event.stopPropagation();
    if (key === 'Enter') {
      this.handleBlur();
    }
  }

  private handleChange(value: string | number) {
    let resolvedValue = Number(value);

    if (this.minValue) {
      resolvedValue = Math.max(resolvedValue, this.minValue);
    }

    if (this.maxValue) {
      resolvedValue = Math.min(resolvedValue, this.maxValue);
    }

    this.value = resolvedValue;
    this.inputElement.nativeElement.textContent = String(this.value);
    this._onChange(this.value);
    this.inputElement.nativeElement?.blur();
    this._onTouched();
    this.focusing = false;
    this.inputWrapperElement.nativeElement.classList.remove('focused');
    this._cdr.markForCheck();
  }

  handleFocus() {
    this.inputWrapperElement.nativeElement.classList.add('focused');
    this.focusing = true;
  }

  handleBlur() {
    this.focusing &&
      this.handleChange(this.inputElement?.nativeElement?.textContent);
  }
}
