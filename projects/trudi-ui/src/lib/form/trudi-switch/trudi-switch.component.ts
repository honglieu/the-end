import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'trudi-switch',
  templateUrl: './trudi-switch.component.html',
  styleUrls: ['./trudi-switch.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSwitchComponent),
      multi: true
    }
  ]
})
export class TrudiSwitchComponent implements ControlValueAccessor, OnInit {
  @Input() reverse = false;
  @Input() label = '';
  @Input() index = -1;
  @Input() labelTemplate: TemplateRef<any>;
  @Input() reminderToggle: boolean = false;
  @Input() disabled = false;
  isChecked = true;
  constructor() {}

  ngOnInit(): void {}

  private onChange: (value: boolean) => void;
  private onTouched: () => void;

  writeValue(value: boolean): void {
    this.isChecked = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onCheckboxChange(e: boolean): void {
    if (!this.disabled) {
      this.isChecked = e;
      this.onChange(this.isChecked);
      this.onTouched();
    }
  }
}
