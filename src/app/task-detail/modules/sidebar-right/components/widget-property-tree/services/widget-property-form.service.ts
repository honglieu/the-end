import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { FileUploadProp } from '@shared/types/share.model';
import { Region } from '@shared/enum/region.enum';
import {
  ETenantVacateButtonAction,
  ITenantVacateForm
} from '@/app/tenant-vacate/utils/tenantVacateType';
import { requiredInGroup } from '@shared/validators/required-in-group-validator';
import { IWidgetVacate, TypeVacate } from '@/app/task-detail/utils/functions';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Injectable({
  providedIn: 'root'
})
export class WidgetFormPTService {
  public leaseRenewalForm: FormGroup;
  public tenantVacateForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  buildFormLeaseRenewalPT(customValue?: any) {
    this.leaseRenewalForm = this.formBuilder.group(
      {
        tenancy: [customValue?.tenancy ?? null, [Validators.required]],
        leaseStart: [customValue?.leaseStart ?? '', [Validators.required]],
        leaseEnd: [customValue?.leaseEnd ?? '', [Validators.required]],
        rentSchedule: [customValue?.rentSchedule ?? ''],
        rentType: [customValue?.rentType ?? ''],
        rentEffective: [customValue?.rentEffective ?? '']
      },
      {
        validators: [
          requiredInGroup(['rentSchedule', 'rentType', 'rentEffective'])
        ]
      }
    );
  }

  buildFormTenantVacatePT(customValue?: ITenantVacateForm) {
    this.tenantVacateForm = this.formBuilder.group({
      tenancy: [customValue?.tenancy ?? null, [Validators.required]],
      vacateType: [
        customValue?.tenantVacateType ?? null,
        [Validators.required]
      ],
      noticeDate: [customValue?.noticeDate ?? '', [Validators.required]],
      vacateDate: [customValue?.vacateDate ?? '', [Validators.required]],
      chargeToDate: [customValue?.chargeToDate ?? ''],
      description: [customValue?.description ?? '', [Validators.required]],
      terminationDate: [customValue?.terminationDate ?? '']
    });
  }

  formatDataLease(
    status: LeaseRenewalSyncStatus,
    startDate: string,
    endDate: string,
    rent: number,
    frequency: string,
    tenancyId: string,
    nameTenancy: string,
    effectiveDate?: string,
    lastTimeSync?: string,
    file?: FileUploadProp[],
    firstTimeSyncSuccess?: boolean,
    idPropertyTree?: string,
    isSuccessful?: boolean
  ) {
    return {
      status,
      startDate,
      endDate,
      rent,
      frequency,
      tenancyId,
      userPropertyGroup: { name: nameTenancy },
      ...(effectiveDate && { effectiveDate }),
      ...(lastTimeSync && { lastTimeSync }),
      ...(file && { file }),
      firstTimeSyncSuccess,
      idPropertyTree,
      isSuccessful
    };
  }

  addTerminationDateControl(customValue?: ITenantVacateForm) {
    if (!this.tenantVacateForm.get('terminationDate')) {
      this.tenantVacateForm.addControl(
        'terminationDate',
        new FormControl(customValue?.terminationDate ?? '', [
          Validators.required
        ])
      );
    }
  }

  clearTerminationDateControl() {
    this.tenantVacateForm.removeControl('terminationDate');
  }

  patchValueTerminationDate(data) {
    const buttonAction =
      data?.region === Region.DEFAULT
        ? ETenantVacateButtonAction.issueTenantWrittenNotice
        : ETenantVacateButtonAction.issueTenantVacateNotice;
    const trudiVariableReceivers = data?.variable?.receivers?.find(
      (button) => button?.action === buttonAction
    );
    const noticeToLeaveDate = trudiVariableReceivers?.noticeToLeaveDate;
    const terminationDateForm = this.tenantVacateForm.get('terminationDate');

    const formValue =
      trudiVariableReceivers && terminationDateForm
        ? noticeToLeaveDate
        : !trudiVariableReceivers && terminationDateForm
        ? data?.terminationDate
        : '';
    terminationDateForm?.patchValue(formValue);
  }

  setFormModal(tenantVacateInfo: IWidgetVacate) {
    const {
      tenancy,
      noticeDate,
      vacateDate,
      chargeToDate,
      description,
      terminationDate,
      tenantVacateType
    } = tenantVacateInfo || {};
    const dataForm = {
      tenancy: tenancy?.id,
      vacateType: TypeVacate.find(
        (type) => type.text.toLowerCase() === tenantVacateType?.toLowerCase()
      )?.value,
      noticeDate: noticeDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            noticeDate
          )
        : '',
      vacateDate: vacateDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            vacateDate
          )
        : '',
      chargeToDate: chargeToDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            chargeToDate
          )
        : '',
      description,
      terminationDate
    };
    this.tenantVacateForm.patchValue(dataForm);
    this.tenantVacateForm.markAsPristine();
    this.tenantVacateForm.markAsUntouched();
  }
}
