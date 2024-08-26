import { FormArray, FormGroup } from '@angular/forms';
import {
  EChargeType,
  ERecurringCharge
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { TenantFormName } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';
import {
  TenantOneTimeChargeForm,
  TenantRecurringChargeForm
} from './charges-form/tenant-charges-form';
import { TenantAddressForm } from './info-form/tenant-info-form';

export class TenantFormBuilder {
  private _form: FormGroup;

  constructor(form: FormGroup) {
    this._form = form;
  }

  public build() {
    return this._form;
  }

  public buildAddress(addresOptions: Array<{ value: number; label: string }>) {
    if (!addresOptions?.length) return this;
    const addressForm = this._form
      .get(TenantFormName.Info)
      .get(TenantFormName.Address) as FormArray;
    for (const address of addresOptions) {
      const form = new TenantAddressForm({
        typeId: address.value,
        typeName: address.label
      });
      addressForm.push(form);
    }
    return this;
  }

  public buildCharge(charges: {
    options: any[];
    recurringCharges: ERecurringCharge[];
    oneTimeCharges?;
  }) {
    const recurringChargesForm = this._form
      .get(TenantFormName.Charges)
      .get(TenantFormName.Recurring) as FormArray;
    const oneTimeChargesForm = this._form
      .get(TenantFormName.Charges)
      .get(TenantFormName.OneTime) as FormArray;
    recurringChargesForm.clear();
    for (let recurringCharge of charges.recurringCharges) {
      const {
        id,
        entityType,
        chargeType,
        amount,
        comment,
        frequency,
        fromDate,
        toDate,
        calculation
      } = recurringCharge;
      const form = new TenantRecurringChargeForm(
        false,
        id,
        entityType,
        (chargeType as EChargeType).id,
        amount,
        comment,
        frequency,
        fromDate,
        toDate,
        calculation
      );
      recurringChargesForm.push(form);
    }

    oneTimeChargesForm.clear();
    if (!charges.oneTimeCharges) return this;
    for (let oneTimeCharge of charges.oneTimeCharges) {
      const { id, chargeTypeId, amount, comment, transactionDate, reference } =
        oneTimeCharge;
      const form = new TenantOneTimeChargeForm(
        id,
        chargeTypeId,
        amount,
        comment,
        transactionDate,
        reference
      );
      oneTimeChargesForm.push(form);
    }
    return this;
  }

  public buildUserField(fields: any[]) {
    return this;
  }
}
