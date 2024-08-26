import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'trudi-checkbox-group',
  templateUrl: './trudi-checkbox-group.component.html',
  styleUrls: ['./trudi-checkbox-group.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiCheckboxGroupComponent),
      multi: true
    }
  ]
})
export class TrudiCheckboxGroupComponent
  implements OnInit, ControlValueAccessor
{
  @Input() label: string;
  @Output() eventEmitter = new EventEmitter<any>();

  public model: any[];

  constructor() {}

  onChange: (_: any) => void = (_: any) => {};
  onTouched: () => void = () => {};

  get selected(): boolean {
    return this.model?.length > 0;
  }

  updateChanges() {
    this.onChange(this.model);
  }

  writeValue(value: any[]): void {
    this.model = value;
    this.updateChanges();
    this.eventEmitter.emit();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private add(value: any) {
    if (!this.contains(value)) {
      if (this.model instanceof Array) {
        this.model.push(value);
      } else {
        this.model = [value];
      }
    }
  }

  private remove(value: any) {
    const index = this.model.indexOf(value);
    if (!this.model || index < 0) {
      return;
    }
    this.model.splice(index, 1);
  }

  addOrRemove(value: any) {
    if (this.contains(value)) {
      this.remove(value);
    } else {
      this.add(value);
    }
    this.onChange([...this.model]);
    this.onTouched();
  }

  contains(value: any): boolean {
    if (this.model instanceof Array) {
      return this.model.indexOf(value) > -1;
    } else if (!!this.model) {
      return this.model === value;
    }
    return false;
  }

  ngOnInit(): void {}
}
