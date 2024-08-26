import { FormControl, FormGroup, Validators } from '@angular/forms';

export class TenantNameForm extends FormGroup {
  constructor() {
    super({
      firstName: new FormControl({ value: undefined, disabled: false }),
      lastName: new FormControl({ value: undefined, disabled: false }, [
        Validators.required
      ])
    });
  }
}

export class TenantAddressForm extends FormGroup {
  constructor({
    id = undefined,
    address = undefined,
    typeId = undefined,
    typeName = undefined,
    isPrimary = undefined
  }) {
    super({
      id: new FormControl({ value: id, disabled: false }),
      address: new FormControl({ value: address, disabled: false }),
      typeId: new FormControl({ value: typeId, disabled: false }),
      typeName: new FormControl({ value: typeName, disabled: false }),
      isPrimary: new FormControl({ value: isPrimary, disabled: false })
    });
  }
}
