import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup
} from '@angular/forms';
import dayjs from 'dayjs';
import { BehaviorSubject } from 'rxjs';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import {
  TenantOneTimeChargeForm,
  TenantRecurringChargeForm
} from './charges-form/tenant-charges-form';
import { TenantContactForm } from './contact-form/tenant-contact-form';
import { TenantDepositeForm } from './deposit-form/tenant-deposite-form';
import { TenantNameForm } from './info-form/tenant-info-form';
import { TenantLeaseForm } from './lease-form/tenant-lease-form';
import { TenantSettingForm } from './setting-form/tenant-setting-form';
import { TenantFormBuilder } from './tenant-form-builder';
import { TenantFormPatcher } from './tenant-form-patcher';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { AgencyService as AgencyServiceDashboard } from '@/app/dashboard/services/agency.service';
import { PHONE_PREFIXES } from '@services/constants';
import { formatPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { CompanyService } from '@services/company.service';

@Injectable()
export class TenantFormMasterService {
  private _form: FormGroup;
  private readonly _disable$ = new BehaviorSubject<boolean>(false);
  public readonly disable$ = this._disable$.asObservable();
  public setDisable(isDisable: boolean) {
    this._disable$.next(isDisable);
  }
  private readonly _isSyncing$ = new BehaviorSubject<boolean>(false);
  public readonly isSyncing$ = this._isSyncing$.asObservable();
  public setSyncing(isSyncing: boolean) {
    this._isSyncing$.next(isSyncing);
  }

  constructor(
    private formBuilder: FormBuilder,
    private phoneFormatPipe: PhoneNumberFormatPipe,
    private agencyService: AgencyServiceDashboard,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}

  public initForm(form?: FormGroup) {
    if (form) {
      this._form = form;
    } else {
      this._form = new FormGroup({
        id: new FormControl({ value: undefined, disabled: false }),
        info: new FormGroup({
          name: new TenantNameForm(),
          address: this.formBuilder.array([])
        }),
        lease: new TenantLeaseForm(),
        contacts: this.formBuilder.array([new TenantContactForm()]),
        deposit: new TenantDepositeForm(),
        setting: new TenantSettingForm(),
        charges: new FormGroup({
          recurring: this.formBuilder.array([new TenantRecurringChargeForm()]),
          oneTime: this.formBuilder.array([new TenantOneTimeChargeForm()])
        }),
        userFields: this.formBuilder.array([])
      });
    }
    this._form.markAsUntouched();
  }

  public getRawForm() {
    return this._form;
  }

  public buildForm(options) {
    const builder = new TenantFormBuilder(this._form);
    builder.buildAddress(options.tenantAddressTypes).buildCharge({
      options: options?.chargeTypes,
      recurringCharges:
        this.sortRecurringCharge(options?.recurringCharges) || []
    });
  }

  public patchFormData(tenant: {
    syncStatus?: ESyncStatus;
    syncDate?: Date;
    id?: string;
    info?: any;
    lease?: any;
    contacts?: any;
    deposit?: any;
    setting?: any;
    charges?: any;
    userFields?: any;
  }) {
    const formPatcher = new TenantFormPatcher(this._form);
    const { id, info, lease, contacts, deposit, setting, charges, userFields } =
      tenant || {};
    formPatcher.patchId(id);
    formPatcher.patchName(info?.name || {});
    formPatcher.patchAddress(info?.address || []);
    formPatcher.patchContact(this.mapContact(contacts) || []);
    formPatcher.patchCharge({
      recurringCharges: this.sortRecurringCharge(charges?.recurring) || [],
      oneTimeCharges: charges?.oneTime || []
    });
    formPatcher.patchSetting(setting || {});
    formPatcher.patchDeposit(deposit || {});
    formPatcher.patchLease(this.mapDateFormatLease(lease) || {});

    this._form.markAsUntouched();
    this._form.markAsPristine();
  }

  sortRecurringCharge(recurringCharges) {
    return recurringCharges?.sort((a, b) => {
      const indexKeyA = Object.keys(EEntityType).indexOf(
        a.entityType.toUpperCase()
      );
      const indexKeyB = Object.keys(EEntityType).indexOf(
        b.entityType.toUpperCase()
      );
      return (
        indexKeyA - indexKeyB ||
        dayjs(a?.createdAt).valueOf() - dayjs(b?.createdAt).valueOf()
      );
    });
  }

  mapDateFormatLease(lease) {
    return {
      ...lease,
      moveInDate: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        lease?.moveInDate
      ),
      moveOutDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          lease?.moveOutDate
        ),
      noticeDate: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        lease?.noticeDate
      ),
      expectedMoveOutDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          lease?.expectedMoveOutDate
        ),
      startDate: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        lease?.startDate
      ),
      endDate: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        lease?.endDate
      ),
      signDate: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        lease?.signDate
      )
    };
  }

  mapContact(contacts) {
    let isRmEnvironment: boolean;
    let areaCode: string;
    this.companyService
      .getCurrentCompany()
      .pipe()
      .subscribe((company) => {
        isRmEnvironment = this.agencyService?.isRentManagerCRM(company);
        areaCode = isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
    return contacts?.map((contact) => ({
      ...contact,
      phoneNumber: formatPhoneNumber(contact?.phoneNumber, areaCode)
    }));
  }
  /**
   * add new control to a `FormArray`
   * @param formArrayName
   * @param control control
   * @usage
   * ```ts
   * this.addControl('contacts', new TenantContactForm())
   * this.addControl('charges.reccurring', new TenantReccurringChargeForm())
   * this.addControl('charges.oneTime', new TenantOneTimeChargeForm())
   * ```
   */
  public addControl(formArrayName: string, control: AbstractControl): void {
    const controls = this._getFormArrayControlByName(formArrayName);
    controls.push(control);
  }

  /**
   * add new control to a `FormArray`
   * @param formArrayName
   * @param control control
   * @param index index
   * @usage
   * ```ts
   * this.updateControl('contacts', currentControlValue, 0)
   * this.updateControl('charges.reccurring', currentControlValue, 1)
   * this.updateControl('charges.oneTime', currentControlValue, 2)
   * ```
   */

  public updateControl(
    formArrayName: string,
    control: AbstractControl,
    index: number
  ): void {
    const controls = this._getFormArrayControlByName(formArrayName).controls;
    controls[index] = control;
  }

  /**
   * remove a control form a `FormArray`
   * @param formArrayName
   * @param index
   * @usage
   * ```ts
   * this.removeControl('contacts', 0)
   * this.removeControl('charges.reccurring', 1)
   * this.removeControl('charges.oneTime', 2)
   * ```
   */
  public removeControl(formArrayName: string, index: number): void {
    const controls = this._getFormArrayControlByName(formArrayName);
    controls.removeAt(index);
  }

  /**
   *
   * @param name propertyName of the tenant form
   * @usage
   * ```ts
   * const controls = this._getControlByName('contacts')
   * const controls = this._getControlByName('charges.reccurring')
   * const controls = this._getControlByName('charges.oneTime')
   * ```
   */
  private _getFormArrayControlByName(name: string): FormArray {
    const properties = name.split('.');
    let controls: FormArray;
    while (properties?.length) {
      const property = properties.shift();
      if (!controls) {
        controls = <FormArray>this._form.get(property);
      } else {
        controls = <FormArray>controls.get(property);
      }
    }
    return controls;
  }
}
