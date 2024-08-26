import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  Validator,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

@Component({
  selector: 'send-option-control',
  templateUrl: './send-option-control.component.html',
  styleUrls: ['./send-option-control.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SendOptionControlComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SendOptionControlComponent),
      multi: true
    }
  ]
})
export class SendOptionControlComponent
  implements ControlValueAccessor, Validator, OnChanges, AfterViewInit
{
  ngAfterViewInit(): void {
    this.writeValue(this.model.value);
    this.onChange(this.model.value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hasAppUser']?.currentValue !== null) {
      this.setModel();
    }
  }

  @Input() inlineMessage: boolean = true;
  @Input() hasAppUser: boolean = true;
  @Output() onChangeOptionControl = new EventEmitter<sendOptionModel>();

  isDropdownMenuOpen = false;
  dataList: sendOptionModel[] = [
    {
      id: 1,
      name: sendOptionLabel.APP,
      value: sendOptionType.APP,
      active: true
    },
    {
      id: 2,
      name: sendOptionLabel.EMAIL,
      value: sendOptionType.EMAIL,
      active: true
    }
  ];

  public model: sendOptionModel = null;

  onChange: (model: sendOptionType) => void;
  onTouched: () => void;
  isDisabled: boolean;

  validate(control: AbstractControl): ValidationErrors {
    return null;
  }

  writeValue(value: sendOptionType) {
    const model = this.dataList.find((item) => item.value === value);
    model ? (this.model = model) : this.setModel();
  }

  registerOnChange(fn: (model: sendOptionType) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.isDisabled = isDisabled;
  }

  setModel() {
    if (!this.hasAppUser) {
      this.dataList[1].name = sendOptionLabel.EMAIL;
      this.model = this.dataList[1];
      this.dataList[0].active = false;
    } else {
      this.dataList[1].name = sendOptionLabel.APP_EMAIL;
      this.model = this.dataList[0];
      this.dataList[0].active = true;
    }
    this.onChangeOptionControl.emit(this.model);
    if (this.onChange) {
      this.writeValue(this.model.value);
      this.onChange(this.model.value);
    }
  }

  handleOnChange($event: Event, item: sendOptionModel) {
    if (!item.id || !item.active) {
      $event.preventDefault();
      return;
    }
    const model = item;
    this.writeValue(model.value);
    this.onChange(model.value);
    this.isDropdownMenuOpen = false;
    this.onChangeOptionControl.emit(item);
  }
}

export interface sendOptionModel {
  id: number;
  name: string;
  value: sendOptionType;
  active: boolean;
}

export enum sendOptionType {
  EMAIL = 'EMAIL',
  APP = 'APP'
}

export enum sendOptionLabel {
  APP_EMAIL = 'Via tenant app & email',
  EMAIL = 'Via email',
  APP = 'Via tenant app'
}
