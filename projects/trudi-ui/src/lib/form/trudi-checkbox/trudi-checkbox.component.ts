import {
  Component,
  EventEmitter,
  forwardRef,
  Host,
  HostBinding,
  Input,
  OnInit,
  Optional,
  Output
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TrudiCheckboxGroupComponent } from '../../form/trudi-checkbox-group/trudi-checkbox-group.component';

import uuid4 from 'uuid4';

export enum ELabelPosition {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT'
}

type CheckBoxType = 'square' | 'circle';

@Component({
  selector: 'trudi-checkbox',
  templateUrl: './trudi-checkbox.component.html',
  styleUrls: ['./trudi-checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiCheckboxComponent),
      multi: true
    }
  ]
})
export class TrudiCheckboxComponent implements ControlValueAccessor, OnInit {
  @Input() label: string;
  @Input() disabled = false;
  @Input() isSelectedAll = false;
  @Input() labelPosition: ELabelPosition = ELabelPosition.RIGHT;
  @Input() stringValue?: string | boolean;
  @Input() type: CheckBoxType = 'square';
  @Input() pendingDisabled = false;
  @Input() preventClickEvent = false;
  @Input() e2ePrefix: string = '';
  @Input() focusInputOnly: boolean = true;
  @Output() triggerEventChange = new EventEmitter();
  @Output() triggerEventClick = new EventEmitter();

  @HostBinding('class.trudi-checkbox-square') get isSquare() {
    return this.type === 'square';
  }

  @HostBinding('class.trudi-checkbox-circle') get isCircle() {
    return this.type === 'circle';
  }

  private checked = false;
  uuid4 = uuid4();
  ELabelPosition = ELabelPosition;

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

  onChange: (_: boolean) => void = (_: boolean) => {};

  onTouched: () => void = () => {};

  writeValue(checked: boolean): void {
    this.checked = checked;
  }

  updateChanges() {
    this.onChange(this.checked);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  get value() {
    return this.checked;
  }

  set value(val: boolean) {
    this.checked = val;
    this.onChange(val);
    this.onTouched();
    if (this.trudiCheckboxGroup) {
      this.trudiCheckboxGroup.addOrRemove(this.stringValue);
    }
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  handleClick($event: MouseEvent) {
    if (this.preventClickEvent) {
      $event.preventDefault();
      return;
    }
    if ($event.shiftKey) {
      this.triggerEventClick.emit($event);
      $event.preventDefault();
      return;
    }
    $event.stopPropagation();
  }
  handleKeydownEnter($event: MouseEvent) {
    this.checked = !this.checked;
    this.triggerEventClick.emit($event);
    $event.preventDefault();
    return;
  }
}
