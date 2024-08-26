import {
  Component,
  HostBinding,
  Injector,
  Input,
  OnInit,
  forwardRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import dayjs from 'dayjs';

@Component({
  selector: 'trudi-select-reminder',
  templateUrl: './trudi-select-reminder.component.html',
  styleUrls: ['./trudi-select-reminder.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSelectReminderComponent),
      multi: true
    }
  ]
})
export class TrudiSelectReminderComponent implements OnInit {
  @Input() type: TimeData;
  @Input() startHour: number = 8;
  @Input() startMinute: number = 32;
  @Input() endHour: number = 23;
  @Input() endMinute: number = 0;
  @Input() bindLabel: string = 'label';
  @Input() bindValue: string = 'value';
  public dateData = [
    { value: EReminderDateValue.days0, label: '0 days' },
    { value: EReminderDateValue.day1, label: '1 day' },
    { value: EReminderDateValue.days3, label: '3 days' },
    { value: EReminderDateValue.days5, label: '5 days' },
    { value: EReminderDateValue.days7, label: '7 days' },
    { value: EReminderDateValue.days14, label: '14 days' },
    { value: EReminderDateValue.days30, label: '30 days' },
    { value: EReminderDateValue.days60, label: '60 days' },
    { value: EReminderDateValue.days90, label: '90 days' }
  ];
  public timelineData = [
    {
      value: EReminderTimelineValue.before,
      label: EReminderTimelineValue.before
    },
    { value: EReminderTimelineValue.after, label: EReminderTimelineValue.after }
  ];
  public disabled: boolean;
  public startTime: Date;
  public endTime: Date;
  public hoursData = [];
  private ngControl: NgControl;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};
  selectedOption: string;
  writeValue(obj: any): void {
    this.selectedOption = obj;
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
  constructor(private injector: Injector) {}

  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl);
    this.startTime = this.createHours(this.startHour, this.startMinute);
    this.endTime = this.createHours(this.endHour, this.endMinute);
    this.hoursData = this.generateHours(this.startTime, this.endTime);
    this.showFirstData();
  }

  createHours(hour: number, minute: number): Date {
    const date = new Date();
    date.setHours(hour);
    if (minute % 15 === 0) {
      date.setMinutes(minute);
    } else {
      date.setMinutes(0);
    }
    return date;
  }

  showFirstData() {
    this.selectedOption = this.displayData[0].value;
  }

  generateHours(startTime: Date, endTime: Date) {
    const hoursData = [];
    let currentTime = new Date(startTime);

    while (currentTime <= endTime) {
      const formattedTime = dayjs(currentTime).format('hh:mm a');
      hoursData.push({
        value: formattedTime,
        label: formattedTime
      });
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }
    return hoursData;
  }

  get displayData() {
    switch (this.type) {
      case ESelectTypeReminder.date:
        return this.dateData;
      case ESelectTypeReminder.hours:
        return this.hoursData;
      case ESelectTypeReminder.timeline:
        return this.timelineData;
      default:
        return [];
    }
  }

  @HostBinding('attr.class') get classes() {
    return this.ngControl?.control?.invalid &&
      this.ngControl?.errors &&
      this.ngControl?.touched
      ? 'trudi-select-reminder-error'
      : '';
  }
}
type TimeData = 'date' | 'hours' | 'timeline';
export enum ESelectTypeReminder {
  date = 'date',
  hours = 'hours',
  timeline = 'timeline'
}
export enum EReminderDateValue {
  days0 = 0,
  day1 = 1,
  days3 = 3,
  days5 = 5,
  days7 = 7,
  days14 = 14,
  days30 = 30,
  days60 = 60,
  days90 = 90
}
export enum EReminderTimelineValue {
  before = 'before',
  after = 'after'
}
