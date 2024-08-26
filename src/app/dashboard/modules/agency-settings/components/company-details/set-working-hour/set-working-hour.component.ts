import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { Subject } from 'rxjs';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { AgencyService } from '@services/agency.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { AgencyDateFormatService } from './../../../../../services/agency-date-format.service';
import { CompanyService } from '@services/company.service';
@Component({
  selector: 'app-set-working-hour',
  templateUrl: './set-working-hour.component.html',
  styleUrls: ['./set-working-hour.component.scss']
})
export class SetWorkingHourComponent implements OnInit, OnDestroy, OnChanges {
  @Input() stateId: string;
  @Input() isAddTime: boolean;
  @Output() onCloseModal = new EventEmitter<boolean>();
  @Output() onEditSuccess = new EventEmitter<boolean>();
  public setWorkingForm: FormGroup;
  public stateList = [];
  public times = [];
  public validate = null;
  public submitting: boolean = false;
  public subTitle: string;
  timeZone = this.agencyDateFormatService.getCurrentTimezone();
  private destroy$ = new Subject<boolean>();

  constructor(
    private formBuilder: FormBuilder,
    public agencyService: AgencyService,
    public agencyDashboardService: AgencyDashboardService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.subTitle = `Times displayed in ${this.timeZone?.abbrev} ${this.timeZone?.gmt}`;
    this.getListRegion();
    this.initForm();
  }

  getListRegion() {
    this.agencyService.getListRegion().subscribe({
      next: (data) => {
        if (!data) return;
        data = data.map((item) => ({
          ...item,
          label: item.alias[1]
        }));
        this.stateList = data;
        let stateIndex = 0;
        if (this.stateId) {
          stateIndex = this.stateList.findIndex(
            (item) => item.id === this.stateId
          );
          if (!this.isAddTime) {
            this.setWorkingForm.controls['state'].setValue(
              this.stateList[stateIndex]
            );
          }
          this.getSetting();
        } else {
          this.times = this.initTime();
        }
      },
      error: () => {},
      complete: () => {}
    });
  }

  getSetting() {
    this.agencyService.getWorkingHourd(this.stateId).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.formatSetting(data);
        } else {
          this.times = this.initTime();
          console.log(this.times);
        }
      },
      error: () => {},
      complete: () => {}
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stateId']?.currentValue) {
      this.getListRegion();
    }
  }

  onChangeState(e) {
    if (e?.id === this.stateId) {
      this.getSetting();
    } else {
      this.times = this.initTime();
    }
  }

  initTime() {
    return [
      {
        label: 'Monday',
        status: true,
        startTime: '9:00:00',
        endTime: '17:00:00'
      },
      {
        label: 'Tuesday',
        status: true,
        startTime: '9:00:00',
        endTime: '17:00:00'
      },
      {
        label: 'Wednesday',
        status: true,
        startTime: '9:00:00',
        endTime: '17:00:00'
      },
      {
        label: 'Thursday',
        status: true,
        startTime: '9:00:00',
        endTime: '17:00:00'
      },
      {
        label: 'Friday',
        status: true,
        startTime: '9:00:00',
        endTime: '17:00:00'
      },
      {
        label: 'Saturday',
        status: false,
        startTime: '9:00:00',
        endTime: '17:00:00'
      },
      {
        label: 'Sunday',
        status: false,
        startTime: '9:00:00',
        endTime: '17:00:00'
      }
    ];
  }
  formatSetting(data) {
    this.times = data.map((item) => ({
      label: item.dayInWeek,
      status: item.isEnable,
      startTime: item.startTime,
      endTime: item.endTime
    }));
  }

  setTime(index: number, value) {
    this.times[index].startTime = value.startTime;
    this.times[index].endTime = value.endTime;
  }

  onCheckboxChange(status: boolean, index: number) {
    this.times[index].status = status;
  }

  close() {
    this.onCloseModal.emit();
  }

  public initForm() {
    this.setWorkingForm = this.formBuilder.group({
      state: this.formBuilder.control(null, [Validators.required])
    });
  }
  submit() {
    if (!this.setWorkingForm.valid) {
      this.validateAllFormFields(this.setWorkingForm);
      return;
    }
    this.submitting = true;
    this.validate = ['required'];
    let body = this.formatTimes(this.times);
    if (!body) {
      this.submitting = false;
      return;
    }
    body = body?.splice(0, 7);
    this.agencyService.updateWorkingHourd(body).subscribe({
      next: () => {},
      error: () => {
        this.submitting = false;
      },
      complete: () => {
        this.onEditSuccess.emit();
        this.onCloseModal.emit();
        this.submitting = false;
      }
    });
  }

  formatTimes(times) {
    let error = false;
    times.forEach((item) => {
      if (!item.status) {
        item.startTime = '9:00:00';
        item.endTime = '17:00:00';
        return;
      }
      let startTime = item.startTime;
      let endTime = item.endTime;
      if (!startTime && startTime !== 0) error = true;
      if (!endTime && endTime !== 0) error = true;
      if (Number.isInteger(startTime)) {
        startTime = new Date(startTime * 1000).toISOString().substring(11, 16);
      } else {
        startTime = this.convertTime12to24(startTime);
      }
      if (Number.isInteger(endTime)) {
        endTime = new Date(endTime * 1000).toISOString().substring(11, 16);
      } else {
        endTime = this.convertTime12to24(endTime);
      }

      if (hmsToSecondsOnly(startTime) >= hmsToSecondsOnly(endTime)) {
        error = true;
      }
      item.startTime = startTime;
      item.endTime = endTime;
    });

    if (error) return false;
    return times.map((item) => {
      return {
        regionId: this.getStateWorking.value?.id,
        isEnable: item.status,
        label: item.label.toUpperCase(),
        value: [
          {
            startTime: item.startTime,
            endTime: item.endTime
          }
        ]
      };
    });
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
    });
  }

  convertTime12to24 = (time12h) => {
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

  get getStateWorking() {
    return this.setWorkingForm?.get('state');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
