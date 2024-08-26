import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import dayjs from 'dayjs';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';

@Component({
  selector: 'trudi-month-picker',
  templateUrl: './trudi-month-picker.component.html',
  styleUrls: ['./trudi-month-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiMonthPickerComponent),
      multi: true
    }
  ]
})
export class TrudiMonthPickerComponent implements ControlValueAccessor, OnInit {
  @ViewChild('datePicker', { static: true }) datePicker!: NzDatePickerComponent;
  @Output() onPick = new EventEmitter();
  onChange: (value: Date) => void = () => {};
  onTouched: () => void = () => {};
  dateValue: Date | null = null;
  @Input() visible: boolean = false;
  @Input() extraFooter?: TemplateRef<void> | string;

  @Output() onButtonClicked = new EventEmitter<void>();
  @Input() dateFormat: string | null;
  @Input() endDate?: Date;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.datePicker) {
      // do something with datePicker
    }
  }

  writeValue(obj: any): void {
    this.dateValue = obj;
    this.onChange(this.dateValue);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.datePicker.nzDisabled = isDisabled;
  }

  handlePrevAndNextVal(val: boolean) {
    if (val) {
      this.dateValue = dayjs(this.dateValue).subtract(1, 'month').toDate();
    } else {
      this.dateValue = dayjs(this.dateValue).add(1, 'month').toDate();
    }
    this.onChange(this.dateValue);
    this.onPick.emit(this.dateValue);
  }

  onSelect(event) {
    this.onPick.emit(event);
  }

  handleClick(): void {
    this.onButtonClicked.emit();
  }
}
