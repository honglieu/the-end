import { FormControl, FormGroup, Validators } from '@angular/forms';
import { dueDayValidator } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/validators/rent-manager-lease-renewal.validator';

export class TenantSettingForm extends FormGroup {
  constructor() {
    super({
      rentPeriod: new FormControl({ value: undefined, disabled: false }, [
        Validators.required
      ]),
      rentDueDay: new FormControl({ value: undefined, disabled: false }, [
        Validators.required,
        dueDayValidator()
      ]),
      taxTypeID: new FormControl({ value: undefined, disabled: false }),
      subsidies: new FormControl({ value: undefined, disabled: false }),
      chargeLateFee: new FormControl(false),
      acceptPayment: new FormControl(false),
      acceptCheck: new FormControl(false),
      allowTWAPayment: new FormControl(false)
    });
  }
}
