import { Subject } from 'rxjs';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';

@Component({
  selector: 'range-time-picker',
  templateUrl: './range-time-picker.component.html',
  styleUrls: ['./range-time-picker.component.scss']
})
export class RangeTimePickerComponent implements OnInit, OnChanges, OnDestroy {
  private unsubscribe = new Subject<void>();
  @Input() error: {};
  @Input() hideError: boolean = false;
  @Input() styleText: string;
  @Input() customLabel: string;

  @Input() startHourd: number;
  @Input() endHourd: number;
  @Input() validate: any;

  @Output() onChange = new EventEmitter<any>();

  public rangeFrom: number = 0;
  public rangeTo: number = 0;
  public startHourdError: boolean = false;
  public endHourdError: boolean = false;
  get isError() {
    return this.rangeFrom >= this.rangeTo;
  }

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.ngOnchangeStartHourd(changes);
    this.ngOnchangeEndHourd(changes);
  }

  convertTime12to24 = (time12h) => {
    if (!time12h) return;
    const [time, modifier] = time12h.split(' ');
    if (!modifier) return time12h;
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier.toUpperCase() === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}:00`;
  };

  ngOnchangeStartHourd(changes: SimpleChanges) {
    if (changes['startHourd']) {
      if (Number.isInteger(changes['startHourd']?.currentValue)) {
        this.rangeFrom = changes['startHourd']?.currentValue;
      } else {
        this.rangeFrom = hmsToSecondsOnly(
          this.convertTime12to24(changes['startHourd']?.currentValue)
        );
      }

      if (this.endHourd && this.startHourd) {
        this.startHourdError = this.isError;
        if (this.endHourdError) {
          this.endHourdError = this.isError;
        }
      } else {
        this.startHourdError = false;
      }
    }
  }

  ngOnchangeEndHourd(changes: SimpleChanges) {
    if (changes['endHourd']) {
      if (Number.isInteger(changes['endHourd']?.currentValue)) {
        this.rangeTo = changes['endHourd']?.currentValue;
      } else {
        this.rangeTo = hmsToSecondsOnly(
          this.convertTime12to24(changes['endHourd']?.currentValue)
        );
      }
      if (this.startHourd && this.endHourd) {
        if (this.startHourdError) {
          this.startHourdError = this.isError;
        }
        this.endHourdError = this.isError;
      } else {
        this.endHourdError = false;
      }
    }
  }

  handleChangeStartHourd(hourd: number) {
    this.startHourd = hourd;
    this.onChange.emit({
      startTime: this.startHourd,
      endTime: this.endHourd
    });
  }

  handleChangeEndHourd(hourd: number) {
    this.endHourd = hourd;
    this.onChange.emit({
      startTime: this.startHourd,
      endTime: this.endHourd
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
