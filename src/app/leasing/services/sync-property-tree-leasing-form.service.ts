import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { TaskService } from '@services/task.service';
import dayjs from 'dayjs';
import {
  ContactMethod,
  ISyncToPTFormData
} from '@/app/leasing/utils/leasingType';
import { convertStringToNum, reverseObj } from '@/app/leasing/utils/functions';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Injectable({
  providedIn: 'root'
})
export class SyncPropertyTreeLeasingFormService {
  public leasingForm: FormGroup;
  public tenantContactsForm: FormGroup;
  public entryInspectionForm: FormGroup;
  public bondForm: FormGroup;
  public contactMethodForm: FormGroup;
  public date: Date;
  public errorMessage: string = 'Required field';
  public isProcessingForm: boolean = false;
  public periodTypes = { weeks: 1, months: 2, years: 3, userDefined: 4 };
  public paymentTypes = {
    daily: 1,
    weeks: 2,
    fortnightly: 3,
    monthly: 4,
    quarterly: 5,
    yearly: 6,
    weekly: 2
  };
  public maxValidate = {
    leasePeriod: 100000000,
    rentAmount: 1000000,
    amount: 999999,
    amountLodgedDirect: 999999
  };
  public defaultValue = {
    leasingForm: {
      doChargeNewTenancyFees: true,
      leaseEndDate: '',
      leasePeriod: '',
      leasePeriodType: '',
      leaseStartDate: '',
      nextRentReview: '',
      originalLeaseStartDate: '',
      paymentPeriod: null,
      rentAmount: '',
      rentDescription: '',
      rentStartDate: '',
      tenancyName: '',
      tenantContacts: []
    },
    bondForm: {
      accountId: '',
      accountName: null,
      amount: '',
      amountLodgedDirect: '0.00'
    },
    entryInspectionForm: {
      inspectionDate: '',
      startTime: null,
      endTime: null
    },
    contactMethodForm: {
      offer: false,
      notice: false,
      invoice: false,
      receipt: false,
      contactEmail: false
    }
  };

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  buildForm(): void {
    this.isProcessingForm = true;
    this.leasingForm = this.formBuilder.group(
      {
        tenancyName: new FormControl('', [Validators.required]),
        tenantContacts: new FormControl([], [Validators.required]),
        originalLeaseStartDate: new FormControl('', [Validators.required]),
        leaseStartDate: new FormControl('', [Validators.required]),
        leaseEndDate: new FormControl('', [Validators.required]),
        leasePeriod: new FormControl({ value: '', disabled: true }, [
          Validators.required,
          this.validateAmount(this.maxValidate.leasePeriod, false, true)
        ]),
        leasePeriodType: new FormControl('', [Validators.required]),
        rentAmount: new FormControl('', [
          Validators.required,
          this.validateAmount(this.maxValidate.rentAmount, false)
        ]),
        paymentPeriod: new FormControl('', [Validators.required]),
        rentStartDate: new FormControl('', [Validators.required]),
        rentDescription: new FormControl('', [Validators.required]),
        nextRentReview: new FormControl(''),
        doChargeNewTenancyFees: new FormControl(true, [Validators.required])
      },
      { validators: this.customValidatorLeasing() }
    );
  }

  atLeastOneFieldRequired: ValidatorFn = (
    formGroup: FormGroup
  ): ValidationErrors | null => {
    const accountName = formGroup.get('accountName').value;
    const amount = formGroup.get('amount').value;
    const amountLodgedDirect = formGroup.get('amountLodgedDirect').value;
    const accountId = formGroup.get('accountId').value;

    if (accountName || amount) {
      if (!accountName) {
        formGroup.get('accountName').setErrors({ required: true });
      }

      if (!amount) {
        formGroup.get('amount').setErrors({ required: !amount });
      }

      if (amount || accountName) {
        formGroup.markAllAsTouched();
      }

      const amountLodged = convertStringToNum(amountLodgedDirect).toString();
      const amountRequired = convertStringToNum(amount).toString();

      if (accountId && !parseFloat(amountRequired)) {
        formGroup.markAsDirty();
        return { invalidBondAmount: true };
      }

      const isLodgedDirectInvalidMaximum = formGroup
        .get('amountLodgedDirect')
        .hasError('invalidMaximum');

      if (
        !isLodgedDirectInvalidMaximum &&
        parseFloat(amountRequired) !== 0 &&
        parseFloat(amountLodged) !== 0 &&
        parseFloat(amountLodged) > parseFloat(amountRequired)
      ) {
        formGroup.markAsDirty();
        formGroup
          .get('amountLodgedDirect')
          .setErrors({ invalidAmountLodgedDirectAmount: true });
        return { invalidAmountLodgedDirectAmount: true };
      }
      return null;
    }

    // Reset errors if at least one field has a value
    formGroup.get('accountName').setErrors(null);
    formGroup.get('amount').setErrors(null);
    formGroup.get('amountLodgedDirect').setErrors(null);

    return null;
  };

  conditionalRequiredValidator(formGroup: FormGroup): ValidationErrors | null {
    const amountLodgedDirect = parseFloat(
      formGroup.get('amountLodgedDirect').value ?? 0
    );
    const accountName = formGroup.get('accountName');
    const amount = formGroup.get('amount');

    if (amountLodgedDirect && amountLodgedDirect !== 0) {
      if (!accountName.value) {
        accountName.setErrors({ ...accountName.errors, required: true });
      }
      if (!amount.value) {
        amount.setErrors({ ...amount.errors, required: true });
      }
    }

    return null;
  }

  buildFormBond(): void {
    this.bondForm = this.formBuilder.group(
      {
        accountId: new FormControl(null, []),
        accountName: new FormControl(null, []),
        amount: new FormControl(null, [
          Validators.required,
          this.validateAmount(this.maxValidate.amount)
        ]),
        amountLodgedDirect: new FormControl(null, [
          this.validateAmount(this.maxValidate.amountLodgedDirect, true, false)
        ])
      },
      {
        validators: [
          this.atLeastOneFieldRequired,
          this.conditionalRequiredValidator
        ]
      }
    );
  }

  buildFormContactMethod(): void {
    this.contactMethodForm = this.formBuilder.group({
      offer: [false],
      notice: [false],
      invoice: [false],
      receipt: [false],
      contactEmail: [false]
    });
  }

  buildFormEntryInspection(): void {
    this.entryInspectionForm = this.formBuilder.group(
      {
        inspectionDate: new FormControl('', [Validators.required]),
        startTime: new FormControl('', [Validators.required]),
        endTime: new FormControl('', [Validators.required])
      },
      { validators: this.customEntryInspectionValidator() }
    );
  }

  customEntryInspectionValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const originalLeaseStartDate = this.leasingForm.get(
        'originalLeaseStartDate'
      );
      const inspectionDate = control.get('inspectionDate');

      if (
        dayjs(originalLeaseStartDate.value).startOf('day').unix() <
        dayjs(inspectionDate.value).startOf('day').unix()
      ) {
        return { invalidInspectionDate: true };
      }

      return null;
    };
  }

  buildFormTenantContact(): void {
    this.tenantContactsForm = this.formBuilder.group({
      givenName: [''],
      familyName: ['', Validators.required],
      unit: [''],
      streetNumber: [''],
      addressLine1: ['', Validators.required],
      suburb: [''],
      state: [''],
      postcode: [''],
      country: [''],
      email: ['', [Validators.required, this.validateEmail]],
      phoneNumber: ['']
    });
  }

  validateAmount(
    maxValue: number,
    isEqual: boolean = true,
    checkNumber: boolean = true
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toString() ?? '';

      if (!value) {
        return null;
      }

      const numericValue = convertStringToNum(value).toString();
      const [, decimalPart] = numericValue.split('.');

      if (checkNumber) {
        if (numericValue === '0') {
          return { invalidNumber: true };
        }
      }

      if (
        decimalPart?.length > 2 ||
        parseFloat(numericValue) < 0 ||
        numericValue[numericValue.length - 1] === '.'
      ) {
        return { invalidNumber: true };
      }

      if (
        (isEqual && +numericValue > +maxValue) ||
        (!isEqual && +numericValue >= +maxValue)
      ) {
        return { invalidMaximum: true };
      }

      return null;
    };
  }

  customValidatorLeasing(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const originalLeaseStartDate = control.get('originalLeaseStartDate');
      const leaseStartDate = control.get('leaseStartDate');
      const leaseEndDate = control.get('leaseEndDate');

      if (
        dayjs(originalLeaseStartDate.value).startOf('day').unix() >
        dayjs(leaseStartDate.value).startOf('day').unix()
      ) {
        return { invalidLeaseStart: true };
      }
      if (
        dayjs(leaseEndDate.value).startOf('day').unix() <=
        dayjs(leaseStartDate.value).startOf('day').unix()
      ) {
        return { invalidLeaseEnd: true };
      }
      if (
        dayjs(originalLeaseStartDate.value).startOf('day').unix() >
        dayjs(leaseEndDate.value).startOf('day').unix()
      ) {
        return { invalidLeaseEndOriginal: true };
      }

      return null;
    };
  }

  validateEmail(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(control.value);

    if (!isValid) {
      return { invalidEmail: 'Invalid email' };
    }

    return null;
  }

  resetForm(fields: string[]) {
    for (let field of fields) {
      const form = this[field] as FormGroup;
      form.setValue(this.defaultValue[field]);
      form.markAsPristine();
      form.markAsUntouched();
      form.updateValueAndValidity();
    }
  }

  resetLeasingForm() {
    this.resetForm(['leasingForm', 'bondForm', 'contactMethodForm']);
  }

  updateValueAndValidityLeasingForm() {
    for (let controlName in this.leasingForm.controls) {
      this.leasingForm.controls[controlName].updateValueAndValidity();
    }
  }

  generateEnumPayload() {
    return {
      paymentTypes: reverseObj(this.paymentTypes),
      periodTypes: reverseObj(this.periodTypes)
    };
  }

  mapTenantContact() {
    const form = this.tenantContactsForm.value;
    const contactInfos = [];

    if (form.email)
      contactInfos.push({
        contactMethod: ContactMethod.Email,
        details: form.email
      });
    if (form.phoneNumber)
      contactInfos.push({
        contactMethod: ContactMethod.HomePhone,
        details: form.phoneNumber
      });

    return {
      isPrimary: !(this.leasingForm.get('tenantContacts').value.length > 0),
      contact: {
        givenName: form.givenName,
        familyName: form.familyName,
        address: {
          unit: form.unit,
          streetNumber: form.streetNumber,
          addressLine1: form.addressLine1,
          addressLine2: '',
          suburb: form.suburb,
          state: form.state,
          postcode: form.postcode,
          country: form.country
        },
        contactInfos: contactInfos
      }
    };
  }

  mapPropertyTree() {
    const form = this.leasingForm.value;
    const bondForm = this.bondForm.value;
    const contactMethod = this.contactMethodForm.value;

    const payload: ISyncToPTFormData = {
      ...form,
      taskId: this.taskService.currentTask$.value.id,
      rentAmount: convertStringToNum(form.rentAmount),
      paymentPeriod: this.paymentTypes?.[form.paymentPeriod] || 0,
      originalLeaseStartDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(
          form.originalLeaseStartDate
        ) ?? '',
      leaseStartDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(
          form.leaseStartDate
        ) ?? '',
      leaseEndDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(
          form.leaseEndDate
        ) ?? '',
      leasePeriodType: this.periodTypes?.[form.leasePeriodType] || 0,
      rentStartDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(
          form.rentStartDate
        ) ?? '',
      nextRentReview:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(
          form.nextRentReview
        ) ?? '',
      leasePeriod: form.leasePeriod?.toString() || '',
      doNotChargeNewTenancyFees: !form.doChargeNewTenancyFees,
      preferredContactMethod: {
        preferredEmail: contactMethod.contactEmail,
        autoEmailReceipts: contactMethod.receipt,
        autoEmailInvoices: contactMethod.invoice,
        hasNotConsentedForElectronicNotices: contactMethod.notice,
        doNotContractTenant: contactMethod.offer
      }
    };

    if (bondForm.accountId && bondForm.accountName && bondForm.amount) {
      payload.securityDeposit = {
        ...bondForm,
        amount: convertStringToNum(bondForm.amount),
        amountLodgedDirect: convertStringToNum(bondForm.amountLodgedDirect ?? 0)
      };
    }

    delete payload.doChargeNewTenancyFees;

    return payload;
  }
}
