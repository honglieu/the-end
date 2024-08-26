import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TrudiSingleRangePickerComponent } from '@trudi-ui';

@Component({
  selector: 'calendar-date-picker',
  templateUrl: './calendar-date-picker.component.html',
  styleUrls: ['./calendar-date-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalendarDatePickerComponent),
      multi: true
    }
  ]
})
export class CalendarDatePickerComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('datePicker') datePicker!: TrudiSingleRangePickerComponent;
  @Output() onPick = new EventEmitter();
  public rangeTimeValue;
  public defaultRangeDate = [
    dayjs().startOf('month').toDate(),
    dayjs().endOf('month').toDate()
  ];
  @Input() rangeDate: Date[] = this.defaultRangeDate;

  public showMonth = false;
  public showRange = false;

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  public readonly datePickerFormatPipe$ =
    this.agencyDateFormatService.dateFormatPipe$;

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.rangeDate[0] && !isNaN(this.rangeDate[0].getTime())) {
      if (
        this.rangeDate[1] &&
        !isNaN(this.rangeDate[1].getTime()) &&
        this.rangeDate[1].getTime() >= this.rangeDate[0].getTime()
      ) {
        this.rangeTimeValue = this.rangeDate;
      } else {
        this.rangeTimeValue = [this.rangeDate[0], null];
        this.rangeDate = this.defaultRangeDate;
      }
    } else {
      this.rangeTimeValue = [new Date(), null];
      this.rangeDate = this.defaultRangeDate;
    }
  }

  public handleApply(): void {
    this.datePicker.handleApply();
  }

  public handleRangeChange(event): void {
    this.closeAllPanels();
    this.rangeTimeValue = event;
    this.onPick.emit(event);
  }

  public handleCancel(): void {
    this.closeAllPanels();
    if (this.rangeTimeValue[1]) {
      this.rangeDate = this.rangeTimeValue;
    } else {
      this.rangeDate = this.defaultRangeDate;
    }
  }

  ngOnDestroy(): void {}

  handlePick(event) {
    this.closeAllPanels();
    this.rangeTimeValue = [event, null];
    this.onPick.emit([dayjs(event).startOf('month').toDate(), null]);
  }

  handleClick(): void {
    if (this.showMonth || this.showRange) {
      this.closeAllPanels();
    } else {
      if (!this.rangeTimeValue[1]) {
        this.rangeDate = this.defaultRangeDate;
        this.openMonthPickerPanel();
      } else {
        this.openRangePickerPanel();
      }
    }
  }

  openMonthPickerPanel(event?): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.showMonth = true;
    this.showRange = false;
  }

  openRangePickerPanel(event?): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.showRange = true;
    this.showMonth = false;
  }

  closeAllPanels(): void {
    this.showMonth = false;
    this.showRange = false;
  }

  handleClickOuside(): void {
    if (this.showMonth) {
      this.closeAllPanels();
    }
  }
}
