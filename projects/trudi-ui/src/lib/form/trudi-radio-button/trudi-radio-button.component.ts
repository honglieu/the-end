import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Input,
  OnInit,
  TrackByFunction,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TrudiRadioButtonTemplateDirective } from './trudi-radio-button-template.directive';

export interface IRadioButton {
  label: string;
  value: number | string;
  icon?: string;
}

export enum EClassType {
  'COLUMN' = 'COLUMN',
  'ROW' = 'ROW'
}
@Component({
  selector: 'trudi-radio-button',
  templateUrl: './trudi-radio-button.component.html',
  styleUrls: ['./trudi-radio-button.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiRadioButtonComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiRadioButtonComponent implements OnInit, ControlValueAccessor {
  @Input() options: IRadioButton;
  @Input() classType: EClassType = EClassType.COLUMN;
  @Input() disabled: boolean = false;
  @Input() enableCustomTemplate: boolean = false;
  @Input() showIcon: boolean = false;
  @ContentChild(TrudiRadioButtonTemplateDirective)
  templateLabel: TrudiRadioButtonTemplateDirective;
  public selectedValue;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  trackByFn: TrackByFunction<{ value: string; label: string }> = (
    index,
    item
  ) => {
    return item.value;
  };

  writeValue(value: any): void {
    this.cdr.markForCheck();
    this.selectedValue = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onChange: (_: any) => void = (_: any) => {};

  onTouched: () => void = () => {};

  handleChange(event: Event) {
    this.selectedValue = event;
    this.onChange(event);
  }
}
