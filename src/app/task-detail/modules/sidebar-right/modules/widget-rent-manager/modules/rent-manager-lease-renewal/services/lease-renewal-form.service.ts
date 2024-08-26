import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EChargeType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import {
  dateRangeValidator,
  dueDayValidator,
  recurringChargeDateValidator,
  recurringChargeValidator,
  validateAmountFn
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/validators/rent-manager-lease-renewal.validator';
import { LeaseRenewalRMService } from './lease-renewal.service';

@Injectable({
  providedIn: 'root'
})
export class LeaseRenewalFormRMService {
  public leaseRenewalForm: FormGroup;
  public recurringChargeForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private leaseRenewalService: LeaseRenewalRMService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  buildFormLeaseRenewalRM(customValue?: any) {
    this.leaseRenewalForm = this.formBuilder.group({
      tenancy: [customValue?.tenancy, [Validators.required]],
      leaseStart: [
        customValue?.leaseStart,
        [
          Validators.required,
          dateRangeValidator(
            'leaseStart',
            'leaseEnd',
            'Start date must be prior to the end date'
          )
        ]
      ],
      leaseEnd: [
        customValue?.leaseEnd ?? '',
        dateRangeValidator(
          'leaseStart',
          'leaseEnd',
          'End date must be after the start date'
        )
      ],
      leaseSign: [customValue?.leaseSign ?? null],
      leaseTerm: [customValue?.leaseTerm ?? null],
      rentPeriod: [customValue?.rentPeriod, [Validators.required]],
      dueDay: [customValue?.dueDay, [dueDayValidator()]]
    });
  }

  disableField(formControl: FormGroup, fields: string[]) {
    fields.forEach((field) => {
      formControl.get(field)?.disable();
    });
  }

  enableField(formControl: FormGroup, fields: string[]) {
    fields.forEach((field) => {
      formControl.get(field)?.enable();
    });
  }

  updateLeaseRenewalForm(currentData) {
    const {
      startDate,
      endDate,
      leaseSign,
      leaseTerm,
      frequency,
      tenancyId,
      rentDueDay
    } = currentData || {};

    this.leaseRenewalForm.patchValue({
      leaseStart: startDate,
      leaseEnd: endDate,
      leaseSign,
      leaseTerm,
      rentPeriod: frequency,
      dueDay: rentDueDay,
      tenancy: tenancyId
    });
  }

  buildFormRecurringChargeRM(customValue?: any) {
    this.recurringChargeForm = this.formBuilder.group({
      chargeType: [customValue?.chargeType, [Validators.required]],
      amount: [customValue?.amount, validateAmountFn()],
      caculation: [customValue?.caculation ?? ''],
      frequency: [
        customValue?.frequency ?? '',
        [
          recurringChargeDateValidator('', 'frequency'),
          recurringChargeValidator()
        ]
      ],
      from: [
        customValue?.from ?? '',
        recurringChargeDateValidator(
          'From date must be prior to the to date',
          'from'
        )
      ],
      to: [
        customValue?.to ?? '',
        recurringChargeDateValidator(
          'To date must be after the from date',
          'to'
        )
      ],
      comment: [customValue?.comment ?? '']
    });
  }

  generateLeaseRenewal(recurringCharge) {
    const recurringCharges =
      recurringCharge?.map((recurringCharge) => ({
        chargeTypeId:
          (recurringCharge.chargeType as EChargeType)?.id ||
          recurringCharge.chargeTypeId,
        amount: recurringCharge.amount ?? undefined,
        calculation: recurringCharge.calculation,
        fromDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
          recurringCharge.fromDate
        ),
        toDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
          recurringCharge.toDate
        ),
        comment: recurringCharge.comment,
        frequency: recurringCharge.frequency || undefined,
        id: recurringCharge?.id,
        entityType: recurringCharge?.entityType,
        chargeType: recurringCharge.chargeType,
        createdAt: recurringCharge?.createdAt
      })) || [];

    return {
      tenancyId: this.leaseRenewalForm.get('tenancy').value,
      leaseStart: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        this.leaseRenewalForm.get('leaseStart').value
      ),
      leaseEnd: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        this.leaseRenewalForm.get('leaseEnd').value
      ),
      leaseSign: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        this.leaseRenewalForm.get('leaseSign').value
      ),
      leaseTerm: this.leaseRenewalForm.get('leaseTerm')?.value,
      rentPeriod: this.leaseRenewalForm.get('rentPeriod').value,
      rentDueDay: this.leaseRenewalForm.get('dueDay').value,
      recurringCharges: recurringCharges
    };
  }
}
