import { BankAccount } from '@shared/types/user.interface';
import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class SharedAgencySettingsFormService {
  public formData = {};
  private accountForm: FormGroup;
  constructor(private formBuilder: FormBuilder) {}

  getForm(option_id: string) {
    return this.formData[option_id];
  }

  setForm(option_id: string, form: FormGroup) {
    this.formData[option_id] = form;
  }

  isCheckBoxSelected(option_id: string) {
    return this.formData[option_id]?.get(option_id)?.value;
  }

  buildAccountForm() {
    this.accountForm = this.formBuilder.group({
      crmSubscription: ['', Validators.required],
      accountName: ['', Validators.required],
      bsb: [
        '',
        [
          Validators.required,
          this.maxLength(6, 'BSB'),
          this.minLength(6, 'BSB')
        ]
      ],
      accountNumber: [
        '',
        [
          Validators.required,
          this.maxLength(12, 'Account number'),
          this.minLength(6, 'Account number')
        ]
      ]
    });
  }

  patchAccountForm(account: BankAccount) {
    const { accountName, accountNumber, bsb, agencyId } = account || {};
    this.accountForm.patchValue({
      crmSubscription: agencyId,
      accountName,
      bsb,
      accountNumber
    });
  }

  getAccountForm() {
    return this.accountForm;
  }

  getPayloadEditOrAddAccount(currentEditId: string) {
    const { accountName, accountNumber, bsb, crmSubscription } =
      this.accountForm.value;
    const payload = {
      id: currentEditId,
      accountName,
      accountNumber,
      bsb,
      agencyId: crmSubscription
    };
    if (!currentEditId) delete payload.id;
    return payload;
  }

  maxLength(max: number, name: string): ValidatorFn {
    return (
      control: AbstractControl
    ): { [key: string]: ValidationErrors } | null => {
      if (control.value && control.value.replace(/\s/g, '').length > max) {
        return { [name + ' ']: null };
      }
      return null;
    };
  }

  minLength(min: number, name: string): ValidatorFn {
    return (
      control: AbstractControl
    ): { [key: string]: ValidationErrors } | null => {
      if (control.value && control.value.replace(/[^0-9]/g, '').length < min) {
        return { [name + ' ']: null };
      }
      return null;
    };
  }

  checkSubscriptionExistence(
    listOfSubscription,
    listOfAccount,
    currentAgencyId?: string
  ) {
    return listOfSubscription.filter((subscription) => {
      return (
        !listOfAccount.some((item) => item.agencyId === subscription?.id) ||
        subscription?.id === currentAgencyId
      );
    });
  }

  resetAccountForm() {
    this.accountForm.markAsPristine();
    this.accountForm.markAsUntouched();
  }
}
