import { Subject } from 'rxjs';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { cloneDeep, isEqual } from 'lodash-es';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { LoadingService } from '@services/loading.service';
import { ProfileSettingService } from '@services/profile-setting.service';
import { ToastrService } from 'ngx-toastr';
import {
  CHANGE_SUCCESSFULLY_ERROR,
  APPOINTMENT_AVAILABILITY_SAVED
} from '@services/messages.constants';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';

@Component({
  selector: 'appointment-availability',
  templateUrl: './appointment-availability.component.html',
  styleUrls: ['./appointment-availability.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentAvailabilityComponent implements OnInit, OnDestroy {
  isFormSaveChange() {
    this.times = this.times.map((time) => {
      return {
        ...time,
        value: time.value.filter((t) => t.startTime && t.endTime)
      };
    });
    return isEqual(this.times, this.defaultTimes);
  }
  private unsubscribe = new Subject<void>();
  public popupModalPosition = ModalPopupPosition;
  public times = [];
  public defaultTimes = [];

  public leaveWarning: boolean = false;
  public validate = null;

  constructor(
    public loadingService: LoadingService,
    private profileSettingService: ProfileSettingService,
    private toastService: ToastrService,
    protected cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadingService.onLoading();
    this.getSetting();
  }

  openDialog() {
    this.profileSettingService.editAppointmenting.next(true);
  }

  getSetting() {
    this.profileSettingService.getAppointment({}).subscribe({
      next: (data) => {
        this.formatSetting(data);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingService.stopLoading();
      },
      complete: () => {
        this.loadingService.stopLoading();
      }
    });
  }

  formatSetting(data) {
    this.times = [];
    if (data?.message) return;
    const temp = this.setDefaultValue() as any;
    const times = [];

    for (const property in temp) {
      if (!data[property]) this.times[property] = [];
      else this.times[property] = data[property];
    }

    for (const property in this.times) {
      if (this.times.hasOwnProperty(property)) {
        times.push({
          lable: property,
          value: this.times[property]
        });
      }
    }
    this.times = times;
    this.defaultTimes = cloneDeep(times);
  }

  insertTime(index: number) {
    this.validate = null;
    this.times[index].value.push({
      startTime: null,
      endTime: null
    });
  }

  removeTime(index: number, timeIndex: number) {
    this.validate = null;
    this.times[index].value.splice(timeIndex, 1);
  }
  setTime(index: number, timeIndex: number, value) {
    this.times[index].value[timeIndex].startTime = value.startTime;
    this.times[index].value[timeIndex].endTime = value.endTime;
  }

  submit() {
    this.times = this.times.map((time) => {
      return {
        ...time,
        value: time.value.filter((t) => t.startTime || t.endTime)
      };
    });
    const bg = document.querySelector(
      '.cdk-overlay-container'
    ) as HTMLDivElement;
    if (bg) {
      bg.click();
    }
    this.validate = ['required'];
    if (isEqual(this.times, this.defaultTimes)) return;
    const body = this.formatTimes(this.times);
    this.profileSettingService.updateAppointment(body).subscribe({
      next: () => {
        this.toastService.success(APPOINTMENT_AVAILABILITY_SAVED);
        this.getSetting();
      },
      error: () => {
        this.toastService.error(CHANGE_SUCCESSFULLY_ERROR);
      },
      complete: () => {
        this.loadingService.stopLoading();
      }
    });
  }

  formatTimes(times) {
    let body = [];
    let error = false;
    for (const item of times) {
      item.value = item.value.map((range) => {
        let startTime = range.startTime;
        let endTime = range.endTime;
        if (!startTime && startTime !== 0) error = true;
        if (!endTime && endTime !== 0) error = true;

        if (Number.isInteger(startTime)) {
          startTime = new Date(startTime * 1000)
            .toISOString()
            .substring(11, 16);
        }
        if (Number.isInteger(endTime)) {
          endTime = new Date(endTime * 1000).toISOString().substring(11, 16);
        }

        if (hmsToSecondsOnly(startTime) >= hmsToSecondsOnly(endTime)) {
          error = true;
        }

        range.endTime = endTime;
        range.startTime = startTime;
        return range;
      });
      body.push(item);
    }
    return error ? false : body;
  }

  setDefaultValue() {
    return {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: []
    };
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
