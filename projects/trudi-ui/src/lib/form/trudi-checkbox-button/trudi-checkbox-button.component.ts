import {
  Component,
  EventEmitter,
  Host,
  Input,
  OnInit,
  Optional,
  Output,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconType } from '../../views/trudi-icon/trudi-icon.component';
import { TrudiCheckboxGroupComponent } from '../../form/trudi-checkbox-group/trudi-checkbox-group.component';

@Component({
  selector: 'trudi-checkbox-button',
  templateUrl: './trudi-checkbox-button.component.html',
  styleUrls: ['./trudi-checkbox-button.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiCheckboxButtonComponent),
      multi: true
    }
  ]
})
export class TrudiCheckboxButtonComponent
  implements OnInit, ControlValueAccessor
{
  @Input() label: string;
  @Input() icon: IconType;
  @Input() disabled: boolean;
  @Input() stringValue: string;
  @Input() isChecked: boolean = false;

  @Output() clickCheckbox = new EventEmitter<boolean>();

  public isDisabled = false;
  public value = false;

  constructor(
    @Optional() @Host() private trudiCheckboxGroup: TrudiCheckboxGroupComponent
  ) {}

  ngOnInit(): void {
    if (this.trudiCheckboxGroup) {
      this.writeValue(this.trudiCheckboxGroup.contains(this.stringValue));
      this.trudiCheckboxGroup.eventEmitter.subscribe(() => {
        this.writeValue(this.trudiCheckboxGroup.contains(this.stringValue));
      });
    }
  }

  onChange: (_: any) => void = (_: any) => {};

  onTouched: () => void = () => {};

  updateChanges() {
    this.onChange(this.isChecked);
  }

  writeValue(val: boolean): void {
    this.value = val;
    this.isChecked = val;
    this.updateChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  toggleCheckbox(event: Event) {
    if (this.disabled) {
      return;
    }
    event.stopPropagation();
    this.isChecked = !this.isChecked;
    this.value = this.isChecked;
    this.clickCheckbox.emit(this.value);
    this.onChange(this.isChecked);

    if (this.trudiCheckboxGroup) {
      this.trudiCheckboxGroup.addOrRemove(this.stringValue);
    }
    this.onTouched();
  }
}
