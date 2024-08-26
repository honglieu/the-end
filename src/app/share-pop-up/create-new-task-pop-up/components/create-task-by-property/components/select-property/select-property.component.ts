import {
  Component,
  ChangeDetectionStrategy,
  Input,
  forwardRef,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';

@Component({
  selector: 'select-property',
  templateUrl: './select-property.component.html',
  styleUrls: ['./select-property.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectPropertyComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectPropertyComponent
  implements ControlValueAccessor, OnChanges
{
  @Input() listProperties: UserPropertyInPeople[] = [];
  @Input() propertyId: string;
  @Output() onPropertyChanged = new EventEmitter<UserPropertyInPeople>();

  public currentProperty: UserPropertyInPeople = null;
  public currentPropertyId: string = '';

  onChange: (value: UserPropertyInPeople) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value): void {
    this.onChange(value);
  }

  registerOnChange(fn: (value) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId']?.currentValue) {
      this.currentPropertyId = this.propertyId;
      this.findPropertyId(this.propertyId);
    }
  }

  findPropertyId(propertyId: string) {
    this.currentProperty =
      this.listProperties.find((item) => item.id === propertyId) ?? null;
    this.onPropertyChanged.emit(this.currentProperty);
    this.writeValue(this.currentProperty);
  }

  onModelChange(propertyId) {
    this.currentPropertyId = this.propertyId === propertyId ? null : propertyId;
    this.propertyId = null;
    this.findPropertyId(this.currentPropertyId);
  }
}
