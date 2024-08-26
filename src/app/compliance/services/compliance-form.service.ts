import { Injectable } from '@angular/core';
import { PropertyNoteForm } from '@/app/compliance/utils/compliance.type';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { EManagedBy } from '@/app/compliance/utils/compliance.enum';
import { EComplianceType } from '@shared/enum/compliance.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Injectable({
  providedIn: 'root'
})
export class ComplianceFormService {
  public complianceForm: FormGroup;
  get managedByControl() {
    return this.complianceForm.get('managedByControl');
  }
  get complianceItemControl() {
    return this.complianceForm.get('complianceItemControl');
  }
  constructor(
    private formBuilder: FormBuilder,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  initFormSyncCompliance() {
    this.buildFormCompliance();
    this.addServiceByAndAuthorField();
    this.addSmokeAlarmTypeFieldControl();
  }

  buildFormCompliance(customValue?: PropertyNoteForm): FormGroup {
    this.complianceForm = this.formBuilder.group({
      tenancyControl: [customValue?.tenancy ?? null, [Validators.required]],
      complianceItemControl: [
        customValue?.complianceItem ?? null,
        Validators.required
      ],
      managedByControl: [customValue?.managedBy ?? null, Validators.required],
      expiredDateControl: [
        customValue?.nextServiceDate
          ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
              customValue?.expiredDate
            )
          : ''
      ],
      lastServiceDateControl: [
        customValue?.lastServiceDate
          ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
              customValue?.lastServiceDate
            )
          : ''
      ],
      nextServiceDateControl: [
        customValue?.nextServiceDate
          ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
              customValue?.nextServiceDate
            )
          : ''
      ],
      noteControl: [customValue?.note ?? '']
    });
    return this.complianceForm;
  }

  addServiceByAndAuthorField(customValue?: PropertyNoteForm) {
    const complianceFormGroup = this.complianceForm;
    if (
      !complianceFormGroup.get('servicesByControl') ||
      !complianceFormGroup.get('authorReceivedControl')
    ) {
      complianceFormGroup.addControl(
        'servicesByControl',
        new FormControl(customValue?.creditorId ?? null, [Validators.required])
      );
      complianceFormGroup.addControl(
        'authorReceivedControl',
        new FormControl(customValue?.authorityForm ?? null)
      );
    }
  }

  clearServiceByAndAuthorFieldControl() {
    this.complianceForm.removeControl('servicesByControl');
    this.complianceForm.removeControl('authorReceivedControl');
  }

  addSmokeAlarmTypeFieldControl(customValue?: PropertyNoteForm) {
    const complianceFormGroup = this.complianceForm;
    if (!complianceFormGroup.get('smokeAlarmTypeControl')) {
      complianceFormGroup.addControl(
        'smokeAlarmTypeControl',
        new FormControl(customValue?.smokeAlarmType ?? null, [
          Validators.required
        ])
      );
    }
  }

  clearSmokeAlarmTypeFieldControl() {
    this.complianceForm.removeControl('smokeAlarmTypeControl');
  }

  handleFieldToForm(value) {
    if (value?.managedBy === EManagedBy.AGENT) {
      this.addServiceByAndAuthorField();
    } else {
      this.clearServiceByAndAuthorFieldControl();
    }
    if (value?.complianceCategory?.type !== EComplianceType.SMOKE_ALARM) {
      this.clearSmokeAlarmTypeFieldControl();
    } else {
      this.addSmokeAlarmTypeFieldControl();
    }
    this.complianceForm.updateValueAndValidity();
  }

  patchFormCompliance(customValue, complianceId?: string): void {
    this.handleFieldToForm(customValue);
    this.complianceForm.patchValue({
      tenancyControl: customValue?.idUserPropertyGroup || null,
      complianceItemControl:
        complianceId ?? customValue?.complianceCategory?.id ?? null,
      smokeAlarmTypeControl: customValue?.smokeAlarmType || null,
      managedByControl: customValue?.managedBy || null,
      expiredDateControl: customValue?.expiryDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            customValue?.expiryDate
          )
        : '',
      lastServiceDateControl: customValue?.lastServiceDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            customValue?.lastServiceDate
          )
        : '',
      nextServiceDateControl: customValue?.nextServiceDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            customValue?.nextServiceDate
          )
        : '',
      noteControl: customValue?.notes || '',
      servicesByControl: customValue?.creditorId || null,
      authorReceivedControl: customValue?.authorityForm || null
    });
  }

  resetForm() {
    this.complianceForm.reset();
    this.complianceForm.markAsPristine();
    this.complianceForm.markAsUntouched();
  }
}
