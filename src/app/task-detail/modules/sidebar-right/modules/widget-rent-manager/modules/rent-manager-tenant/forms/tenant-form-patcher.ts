import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { FrequencyRental } from '@shared/types/trudi.interface';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import {
  EChargeType,
  ERecurringCharge
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { TenantFormName } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';
import {
  TenantOneTimeChargeForm,
  TenantRecurringChargeForm
} from './charges-form/tenant-charges-form';
import { TenantContactForm } from './contact-form/tenant-contact-form';

export class TenantFormPatcher {
  private _form: AbstractControl;

  constructor(form: AbstractControl) {
    this._form = form;
  }

  public patchId(id: string) {
    this._form.patchValue({ id });
  }

  public patchName({ firstName, lastName }) {
    this._form.patchValue({
      info: {
        name: {
          firstName,
          lastName
        }
      }
    });
  }

  public patchSetting({
    rentPeriod,
    rentDueDay,
    subsidies,
    defaultTaxTypeId,
    doNotAcceptChecks,
    doNotAcceptPayments,
    doNotChargeLateFees,
    doNotAllowTWAPayments
  }) {
    const mapSubSidies = subsidies?.map((item) => item?.subsidy?.id);
    this._form.patchValue({
      setting: {
        rentPeriod: rentPeriod?.toUpperCase() || FrequencyRental.MONTHLY,
        rentDueDay: rentDueDay || 1,
        taxTypeID: defaultTaxTypeId,
        subsidies: mapSubSidies,
        chargeLateFee: doNotChargeLateFees,
        acceptPayment: doNotAcceptPayments,
        acceptCheck: doNotAcceptChecks,
        allowTWAPayment: doNotAllowTWAPayments
      }
    });
  }

  public patchDeposit({
    amount,
    securityDepositTypeId,
    transactionDate,
    isSPToGLStartDate,
    isSecurityDepositPriorToGLStartDate
  }) {
    this._form.patchValue({
      deposit: {
        type: securityDepositTypeId,
        amount: amount,
        date: transactionDate || null,
        isDepositPrior: isSPToGLStartDate || isSecurityDepositPriorToGLStartDate
      }
    });
    const depositForm = this._form.get('deposit');
    const depositFormValue = depositForm.value;
    if (depositFormValue.isDepositPrior) {
      depositForm.get('date').disable();
    } else {
      depositForm.get('date').enable();
    }
  }

  public patchLease({
    endDate = undefined,
    expectedMoveOutDate = undefined,
    moveInDate = undefined,
    vacateDate = undefined,
    noticeDate = undefined,
    startDate = undefined,
    leasePeriod = undefined,
    source = undefined,
    moveOutDate = undefined,
    leaseTermId = undefined,
    signDate = undefined
  }) {
    this._form.patchValue({
      lease: {
        moveInDate: moveInDate,
        moveOutDate: vacateDate || moveOutDate,
        noticeDate: noticeDate,
        expectedMoveOutDate: expectedMoveOutDate,
        startDate: startDate,
        endDate: endDate,
        signDate: source?.leaseSign || signDate,
        term:
          (leasePeriod && !isNaN(leasePeriod) ? +leasePeriod : null) ||
          leaseTermId
      }
    });
  }

  public patchContact(contacts: any[]) {
    if (!contacts?.length) return;
    const contactForm = this._form.get(TenantFormName.Contact) as FormArray;
    contactForm.clear();
    for (const contact of contacts) {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        applicantType,
        isPrimary,
        contactTypeId,
        contactId
      } = contact;
      const form = new TenantContactForm(
        firstName,
        lastName,
        email,
        phoneNumber,
        applicantType,
        isPrimary,
        contactTypeId,
        contactId
      );
      contactForm.push(form);
    }
  }

  public patchCharge(charges: {
    recurringCharges: ERecurringCharge[];
    oneTimeCharges?;
  }) {
    if (!charges.recurringCharges.length && !charges?.oneTimeCharges?.length)
      return;

    const recurringChargesForm = this._form
      .get(TenantFormName.Charges)
      .get('recurring') as FormArray;
    const oneTimeChargesForm = this._form
      .get(TenantFormName.Charges)
      .get('oneTime') as FormArray;
    recurringChargesForm.clear();
    oneTimeChargesForm.clear();

    if (charges?.recurringCharges?.length) {
      for (let recurringCharge of charges.recurringCharges) {
        const {
          isException,
          id,
          entityType,
          chargeType,
          chargeTypeId,
          amount,
          comment,
          frequency,
          fromDate,
          toDate,
          calculation
        } = recurringCharge || {};
        const form = new TenantRecurringChargeForm(
          isException,
          id,
          entityType,
          (chargeType as EChargeType)?.id || chargeTypeId,
          amount,
          comment,
          frequency,
          fromDate,
          toDate,
          calculation
        );

        if (!isException || entityType === EEntityType.TENANT) {
          recurringChargesForm.push(form);
        }
      }
    }

    if (charges.oneTimeCharges.length) {
      for (let oneTimeCharge of charges.oneTimeCharges) {
        const {
          id,
          chargeTypeId,
          amount,
          comment,
          transactionDate,
          reference
        } = oneTimeCharge;
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
    }
  }

  public patchAddress(addresses: any[]) {
    const identifyField = 'typeId';
    const forms = (
      this._form
        .get(TenantFormName.Info)
        .get(TenantFormName.Address) as FormArray
    ).controls;
    const formRecords = forms.reduce((map, form) => {
      const controlId = form.get(identifyField).value;
      if (controlId) {
        map[controlId] = form;
      }
      return map;
    }, {});

    for (const address of addresses) {
      const form = formRecords[address[identifyField]] as FormGroup;
      if (form) {
        form?.patchValue(address);
      }
    }
  }
}
