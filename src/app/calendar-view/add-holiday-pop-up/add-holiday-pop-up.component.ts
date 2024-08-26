import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { CandyDate } from '@trudi-ui';
import { INVALID_DATE, SHORT_ISO_DATE } from '@services/constants';
import { typePicker } from '@shared/components/date-time-picker/date-time-picker';
import dayjs from 'dayjs';
import { CalendarService } from '@services/calendar.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
@Component({
  selector: 'add-holiday-pop-up',
  templateUrl: './add-holiday-pop-up.component.html',
  styleUrls: ['./add-holiday-pop-up.component.scss']
})
export class AddHolidayPopUpComponent implements OnInit, OnChanges {
  @Input() visible: boolean;
  @Input() isShowModal: boolean = false;
  @Input() addHolidayTitle: string;
  @Input() regionId: string;
  @Input() dateHoliday: Date;
  @Output() onCancel = new EventEmitter();
  @Output() onConfirm = new EventEmitter();
  public addHolidayForm: FormGroup;
  public repeatSelected: string;
  public datePickerStatus = {
    status: null,
    type: null,
    message: null
  };

  typePicker = typePicker;

  public holidaysListCreate = [];
  public repeatList = [
    { label: 'Does not repeat', value: 'ONCE' },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Annually', value: 'ANNUALLY' }
  ];

  date = null;

  private yearRange = {
    start: new CandyDate().addYears(-2).getYear(),
    end: new CandyDate().addYears(2).getYear()
  };

  constructor(
    private formBuilder: FormBuilder,
    private calendarService: CalendarService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['visible']?.currentValue) {
      this.addHolidayForm?.get('repeat').setValue(this.repeatList[0].value);
    }
  }

  ngOnInit(): void {
    this.initForm();
  }

  public initForm() {
    this.addHolidayForm = this.formBuilder.group({
      reason: this.formBuilder.control('', [Validators.required]),
      repeat: this.formBuilder.control('')
    });
  }

  handleCancel() {
    this.onCancel.emit();
    this.handleClearForm();
  }

  resetDatePickerStatus() {
    this.datePickerStatus = {
      status: null,
      type: null,
      message: null
    };
  }

  openDatePicker(status: boolean) {
    if (status) this.resetDatePickerStatus();
  }

  validate(value: Date): boolean {
    // required
    if (!value || value?.toString().toLowerCase() === INVALID_DATE) {
      this.datePickerStatus.status = 'error';
      if (!value) {
        this.datePickerStatus.type = 'required';
        this.datePickerStatus.message = 'Required field';
      }
      return false;
    }
    // range
    const date = new CandyDate(value);
    if (!date.isValid()) {
      this.datePickerStatus.status = 'error';
      return false;
    }

    const year = date.getYear();
    if (this.yearRange.start > year) {
      this.datePickerStatus.status = 'error';
    } else if (this.yearRange.end < year) {
      this.datePickerStatus.status = 'error';
    }
    return !this.datePickerStatus.status;
  }

  handleDateHoliday(value: Date) {
    this.dateHoliday = new Date(
      this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(value)
    );
    if (!this.validate(value)) return;
    this.resetDatePickerStatus();
  }

  generateTempId(): string {
    return `holiday-temp-id-${Date.now()}`;
  }

  handleConfirm() {
    this.validate(this.dateHoliday);
    if (!this.addHolidayForm.valid || this.datePickerStatus.status) {
      this.validateAllFormFields(this.addHolidayForm);
      return;
    }
    this.dateHoliday = new Date(this.dateHoliday as Date);
    const body = {
      holidayId: this.generateTempId(),
      id: this.generateTempId(),
      regionId: this.regionId,
      name: this.getReson.value,
      isActive: true,
      isDefault: false,
      date: dayjs(
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          this.dateHoliday
        )
      ).format(SHORT_ISO_DATE),
      typeRepeat: this.getRepeat.value
    };
    this.onConfirm.emit(body);
    this.handleClearForm();
  }

  isFieldValid(field: string) {
    return (
      !this.addHolidayForm.get(field).valid &&
      this.addHolidayForm.get(field).touched
    );
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
    });
  }

  handleClearForm() {
    this.dateHoliday = null;
    this.addHolidayForm.reset();
  }

  get getReson() {
    return this.addHolidayForm?.get('reason');
  }

  get getRepeat() {
    return this.addHolidayForm?.get('repeat');
  }
}
