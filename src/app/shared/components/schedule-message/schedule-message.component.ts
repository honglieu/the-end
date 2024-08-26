import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { CalendarService } from '@services/calendar.service';
import { AgencyService } from '@services/agency.service';
import dayjs from 'dayjs';
import {
  DEFAULT_DAYS_BEFORE_INSPECTION_DATE,
  DEFAULT_TIME_INSPECTION_DATE_IN_MILLISECOND
} from '@services/routine-inspection.constants';
import { differenceInCalendarDays } from 'date-fns';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'app-schedule-message',
  templateUrl: './schedule-message.component.html',
  styleUrls: ['./schedule-message.component.scss']
})
export class ScheduleMessageComponent implements OnInit {
  @Input() showPopup = false;
  @Input() showBackButton = false;
  @Input() scheduleDate: string = dayjs(new Date()).format(
    this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
  );
  @Input() overdue: boolean;
  @Input() textConfirm: string = 'Next';
  @Output() onCloseModal = new EventEmitter();
  @Output() onNext = new EventEmitter<string[]>();
  @Output() onBack = new EventEmitter<void>();
  public popupModalPosition = ModalPopupPosition;
  public dateTimeFormArray = new FormArray([]);
  public dateHoliday: Date = new Date();
  showWarning = {
    duplicate: false,
    after: false,
    before: false
  };

  warningMessage: string;
  warningMessages = [
    'Please select the reminder time after current time',
    'Reminder time can not be same',
    'Please select the reminder time before current time'
  ];
  constructor(
    private calendarService: CalendarService,
    private agencyService: AgencyService,
    private agencyDashboardService: AgencyDashboardService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.createDefaultReminderTime();
  }

  createDefaultReminderTime() {
    let dateTime = dayjs(this.scheduleDate, { utc: true })
      .startOf('day')
      .toDate();
    const timeZone = new Date().getTimezoneOffset();
    if (this.overdue) {
      dateTime = dayjs(this.scheduleDate, { utc: true })
        .startOf('day')
        .add(DEFAULT_DAYS_BEFORE_INSPECTION_DATE, 'day')
        .toDate();
    } else {
      dateTime = dayjs(this.scheduleDate, { utc: true })
        .startOf('day')
        .subtract(DEFAULT_DAYS_BEFORE_INSPECTION_DATE, 'day')
        .toDate();
    }
    const isCheckDiffDayAfterOrBefore = dayjs(dateTime).isAfter(
      new Date().getTime() + timeZone * 60000
    );

    if (isCheckDiffDayAfterOrBefore) {
      this.dateHoliday = dateTime;
      this.addNewDateTimeGroup(
        this.dateHoliday,
        DEFAULT_TIME_INSPECTION_DATE_IN_MILLISECOND
      );
    } else {
      this.dateHoliday = new Date();
      //TODO: wait confirm behaivior time default.
      // const dateNow =new Date();
      // let timeDefault =
      //   dateNow.getTime() -
      //   new Date(
      //     Date.UTC(
      //       dateNow.getUTCFullYear(),
      //       dateNow.getMonth(),
      //       dateNow.getDate(),
      //       0,
      //       0,
      //       0
      //     )
      //   ).getTime();
      // timeDefault = Math.ceil(timeDefault / 1000 / 900) * 900;
      this.addNewDateTimeGroup(
        this.dateHoliday,
        DEFAULT_TIME_INSPECTION_DATE_IN_MILLISECOND
      );
    }
    this.mergeDateAndTime(0);
  }

  mergeDateAndTime(index: number) {
    const valueDate = new Date(
      this.dateTimeFormArray.controls[index].get('date').value
    );
    const specificTime =
      this.dateTimeFormArray.controls[index].get('time').value;
    const time = new Date(
      Date.UTC(
        valueDate.getFullYear(),
        valueDate.getMonth(),
        valueDate.getDate(),
        specificTime / 3600,
        (specificTime % 3600) / 60,
        0
      )
    ).toISOString();
    this.dateTimeFormArray.controls[index].get('fullDateTime').setValue(time);
    this.checkDuplicate();
    //TODO: check validate time after or before current time
    this.checkTimeAfterCurrentTime();
    //this.checkTimeBeforeInspectionDateStartTime();
  }

  deleteGroup(index: number) {
    this.dateTimeFormArray.removeAt(index);
    this.checkDuplicate();
    //TODO: check validate time after or before current time
    this.checkTimeAfterCurrentTime();
    //this.checkTimeBeforeInspectionDateStartTime();
  }

  addNewDateTimeGroup(date: Date | string, time: number) {
    const group = new FormGroup({
      date: new FormControl(date, Validators.required),
      time: new FormControl(time, Validators.required),
      fullDateTime: new FormControl('')
    });
    this.dateTimeFormArray.push(group);
  }

  disabledDate = (current: Date): boolean => {
    const dateUTC = Date.UTC(
      new Date(this.scheduleDate).getUTCFullYear(),
      new Date(this.scheduleDate).getUTCMonth(),
      new Date(this.scheduleDate).getUTCDate(),
      0,
      0,
      0
    );
    return differenceInCalendarDays(current, this.getToday()) < 0; //|| differenceInCalendarDays(current, dateUTC) > 0;
  };

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  handleDateHoliday(value: Date, index: number) {
    this.dateTimeFormArray.controls[index].get('date').setValue(value);
    if (this.dateTimeFormArray.controls[index].get('time').value) {
      this.mergeDateAndTime(index);
    }
  }

  handleChangeStartHour(time: number, index: number) {
    this.dateTimeFormArray.controls[index].get('time').setValue(time);
    if (this.dateTimeFormArray.controls[index].get('date').value) {
      this.mergeDateAndTime(index);
    }
  }

  checkTimeAfterCurrentTime() {
    const fullDateTimeArray = this.dateTimeFormArray.controls.map(
      (el) => el.get('fullDateTime').value
    );
    const currentTimeToUTC = dayjs(new Date(), { utc: true }).format();
    const isTimeBeforeCurrentTime = fullDateTimeArray.some((el) =>
      dayjs(el).isSameOrBefore(currentTimeToUTC)
    );
    this.showWarning.after = isTimeBeforeCurrentTime;
    if (this.showWarning.after) {
      this.warningMessage = this.warningMessages[0];
    }
  }

  checkTimeBeforeInspectionDateStartTime() {
    const fullDateTimeArray = this.dateTimeFormArray.controls.map(
      (el) => el.get('fullDateTime').value
    );
    const isTimeAfterInspectionDate = fullDateTimeArray.some((el) =>
      dayjs(el).isSameOrAfter(dayjs(this.scheduleDate))
    );
    this.showWarning.before = isTimeAfterInspectionDate;
    if (this.showWarning.before) {
      this.warningMessage = this.warningMessages[2];
    }
  }

  checkDuplicate() {
    const fullDateTimeArray = this.dateTimeFormArray.controls.map(
      (el) => el.get('fullDateTime').value
    );
    const fullDateTimeSet = new Set(fullDateTimeArray);
    this.showWarning.duplicate =
      fullDateTimeSet.size !== fullDateTimeArray.length;
    if (this.showWarning.duplicate) {
      this.warningMessage = this.warningMessages[1];
    }
  }

  next() {
    this.onNext.emit(
      this.dateTimeFormArray.controls.map((el) => el.get('fullDateTime').value)
    );
  }

  back() {
    this.dateTimeFormArray.clear({ emitEvent: false });
    this.createDefaultReminderTime();
    this.onBack.emit();
  }
}
