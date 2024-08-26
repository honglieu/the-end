import { AgencyDateFormatService } from './../../../../../services/agency-date-format.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VoicemailFormService } from '@/app/dashboard/modules/agency-settings/components/voicemail/voicemail-form.service';
import { FormArray } from '@angular/forms';
import { daysOfWeek } from '@/app/dashboard/modules/agency-settings/utils/constants';
import { formatTimes } from '@/app/trudi-send-msg/utils/helper-functions';
import { VoicemailApiService } from '@/app/dashboard/modules/agency-settings/components/voicemail/voicemail-api.service';
import { Subject, takeUntil } from 'rxjs';
import { VoicemailService } from '@/app/dashboard/modules/agency-settings/components/voicemail/voicemail.service';
import {
  IVoicemailCustomHoursData,
  IVoicemailSetting
} from '@/app/dashboard/modules/agency-settings/utils/enum';
import { isEqual } from 'lodash-es';

@Component({
  selector: 'custom-hours-popup',
  templateUrl: './custom-hours-popup.component.html',
  styleUrls: ['./custom-hours-popup.component.scss']
})
export class CustomHoursPopupComponent {
  @Input() visible: boolean = false;
  @Input() idVoicemailSetting: string;
  @Output() closeModal = new EventEmitter<void>();
  @Output() isCustomHoursSaved = new EventEmitter<boolean>();
  daysOfWeek = daysOfWeek;
  checkSubmit: boolean = false;
  isUpdatingVoicemailSetting: boolean = false;
  hasError: boolean = false;
  subTitle: string;
  timeZone = this.agencyDateFormatService.getCurrentTimezone();
  private destroy$ = new Subject<void>();

  constructor(
    private voicemailFormService: VoicemailFormService,
    private voicemailApiService: VoicemailApiService,
    private voicemailService: VoicemailService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.subTitle = `Times displayed in ${this.timeZone?.abbrev} ${this.timeZone?.gmt}`;
  }

  get voicemailForm() {
    return this.voicemailFormService?.voicemailForm;
  }

  get days() {
    return this.voicemailForm.get('days') as FormArray;
  }

  get dayForms() {
    return (this.voicemailForm.get('days') as FormArray).controls;
  }

  get customiseVoicemail() {
    return this.voicemailForm.get('customiseVoicemail');
  }

  setTime(index: number, value: IVoicemailCustomHoursData) {
    this.checkSubmit = false;
    const formattedValue = formatTimes(value);
    this.days.at(index).patchValue(formattedValue);
  }

  onOk() {
    if (
      isEqual(
        this.createCustomHoursBody(),
        this.voicemailService?.voicemailSettingValue?.customizeValue
      )
    )
      return this.closeModal.emit();
    this.checkSubmit = true;
    this.checkError();
    if (this.hasError) return;
    this.isUpdatingVoicemailSetting = true;
    this.updateVoicemailSetting();
  }

  updateVoicemailSetting() {
    this.voicemailApiService
      .updateVoicemailSetting({
        idVoicemailSetting: this.idVoicemailSetting,
        customizeValue: this.createCustomHoursBody(),
        customizeType: this.customiseVoicemail.value
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (voicemailSetting: IVoicemailSetting) => {
          this.voicemailService.setVoicemailSetting(voicemailSetting);
          this.isUpdatingVoicemailSetting = false;
          this.closeModal.emit();
          this.isCustomHoursSaved.emit(true);
        },
        error: () => {
          this.isUpdatingVoicemailSetting = false;
          this.closeModal.emit();
        }
      });
  }

  createCustomHoursBody() {
    return {
      CUSTOM_HOURS: this.days.value.map(
        (data: IVoicemailCustomHoursData, index: number) => ({
          [daysOfWeek[index]]: {
            startTime: data.startTime,
            endTime: data.endTime
          }
        })
      )
    };
  }

  checkError() {
    const allEmpty = this.days.value.every((day: IVoicemailCustomHoursData) => {
      const { startTime, endTime } = day;
      return !startTime && !endTime;
    });

    this.hasError =
      allEmpty ||
      this.days.value.some((day: IVoicemailCustomHoursData) => {
        const { startTime, endTime } = day;
        return (!startTime || !endTime) && !(!startTime && !endTime);
      });
  }

  onCancel() {
    this.closeModal.emit();
    this.isCustomHoursSaved.emit(false);
  }
}
