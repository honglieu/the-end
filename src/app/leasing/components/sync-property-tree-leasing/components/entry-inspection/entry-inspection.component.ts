import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import { Subject, takeUntil } from 'rxjs';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';
import { convertTime12to24 } from '@/app/leasing/utils/functions';
import { IngoingInspectionService } from '@services/ingoing-inspection.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { IngoingInspectionStatus } from '@shared/enum/ingoing-inspection.enum';
import { POSITION_MAP } from '@services/constants';

@Component({
  selector: 'entry-inspection',
  templateUrl: './entry-inspection.component.html',
  styleUrls: ['./entry-inspection.component.scss']
})
export class EntryInspectionComponent implements OnInit {
  public rangeFrom: number = 0;
  public rangeTo: number = 0;
  public inspectionStatus: string = '';
  public minuteControl: number = 5;
  public readonly INGOING_INSPECTION_STATUS = IngoingInspectionStatus;
  private unsubscribe = new Subject<void>();
  public position = POSITION_MAP;

  constructor(
    public syncPropertyTreeLeasingFormService: SyncPropertyTreeLeasingFormService,
    private ingoingInspectionService: IngoingInspectionService
  ) {}

  get leasingForm(): FormGroup {
    return this.syncPropertyTreeLeasingFormService.leasingForm;
  }

  get entryInspectionForm(): FormGroup {
    return this.syncPropertyTreeLeasingFormService.entryInspectionForm;
  }

  get inspectionDate(): AbstractControl {
    return this.entryInspectionForm.get('inspectionDate');
  }

  get startTime(): AbstractControl {
    return this.entryInspectionForm.get('startTime');
  }

  get endTime(): AbstractControl {
    return this.entryInspectionForm.get('endTime');
  }

  ngOnInit(): void {
    this.ingoingInspectionService.inspectionStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.inspectionStatus = data;
      });
  }

  ngOnchangeStartHour() {
    if (this.startTime.value?.toString() === '') {
      this.rangeFrom = 0;
    }
    if (Number.isInteger(this.startTime.value)) {
      this.rangeFrom = this.startTime.value;
    } else {
      this.rangeFrom = hmsToSecondsOnly(
        convertTime12to24(this.startTime.value)
      );
    }
  }

  ngOnchangeEndHour() {
    if (this.endTime?.toString() === '') {
      this.rangeTo = 86400;
    }
    if (this.endTime) {
      if (Number.isInteger(this.endTime.value)) {
        this.rangeTo = this.endTime.value;
      } else {
        this.rangeTo = hmsToSecondsOnly(convertTime12to24(this.endTime.value));
      }
    }
  }

  handleChangeStartHour(hound: number) {
    this.startTime.setValue(hound);
    this.ngOnchangeStartHour();
    this.ngOnchangeEndHour();
  }

  handleChangeEndHour(hound: number) {
    this.endTime.setValue(hound);
    this.ngOnchangeStartHour();
    this.ngOnchangeEndHour();
  }

  triggerInputTouched(event: boolean, field: string) {
    if (!event) {
      this[field].markAsTouched();
    }
  }

  disableInspectionDate = (current: Date): boolean => {
    if (
      !new Date(this.leasingForm.get('originalLeaseStartDate').value) ||
      !current
    )
      return false;
    return (
      differenceInCalendarDays(
        current,
        new Date(this.leasingForm.get('originalLeaseStartDate').value)
      ) > 0
    );
  };
}
