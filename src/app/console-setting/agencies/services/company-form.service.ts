import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { PROTOCOL } from '@services/constants';
import { AgencyConsoleSetting } from '@shared/types/agency.interface';
import {
  COUNTRY_NAMES_MAPPING,
  EAddOn,
  EAddOnType,
  EAgencyPlan,
  PLAN_DEFAULT_ADDONS
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  ConfigPlan,
  FeaturesConfigPlan
} from '@/app/console-setting/agencies/utils/console.type';

@Injectable({
  providedIn: 'root'
})
export class CompanyFormService {
  public companyForm: FormGroup;
  public isAgencyExistBS: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private protocol = PROTOCOL;

  constructor(private fb: FormBuilder) {}

  buildCompanyForm() {
    this.companyForm = this.fb.group({
      companyName: [null],
      country: [null],
      CRM: [null],
      CRMSubscription: [null],
      customer: [null],
      subscription: [[]],
      plan: [EAgencyPlan.STARTER],
      taskEditor: [false],
      voicemail: [false],
      mobileApp: [false],
      suggestedReplies: [false],
      outgoingCalls: [false],
      voiceMailPhoneNumber: [{ value: '', disabled: true }],
      insights: [false],
      translation: [false],
      tasks: [{ value: [], disabled: true }],
      messenger: [false],
      sms: [false],
      whatsapp: [false]
    });
  }

  resetForm() {
    this.buildCompanyForm();
    this.patchValueCompanyForm(null);
  }

  setCustomValidator(check: boolean, name: string): ValidationErrors | null {
    return () => {
      return check ? { [name]: true } : null;
    };
  }

  setOrRemoveCustomValidator(
    field: AbstractControl,
    check: boolean,
    customValidatorName: string
  ) {
    if (check) {
      field.addValidators(
        this.setCustomValidator(true, customValidatorName) as ValidatorFn
      );
      field.markAsTouched();
    } else {
      field.clearValidators();
      field.addValidators(Validators.required);
    }
    field.updateValueAndValidity();
  }

  setValidationNumberField(field: AbstractControl) {
    field.setValidators([Validators.required, Validators.pattern(/^-?\d+$/)]);
    field.updateValueAndValidity();
  }

  clearValidationFields(fields: AbstractControl[]) {
    fields.forEach((item) => {
      item.clearValidators();
      item.updateValueAndValidity();
    });
  }

  setValidationFields(fields: AbstractControl[]) {
    fields.forEach((field) => {
      field.setValidators([Validators.required]);
      field.updateValueAndValidity();
    });
  }

  setMarkAsTouchedFields(fields: AbstractControl[]) {
    fields.forEach((item) => {
      item.markAsTouched();
      item.updateValueAndValidity();
    });
  }

  setMarkAsUnTouchedFields(fields: AbstractControl[]) {
    fields.forEach((item) => {
      item?.markAsPristine();
      item?.markAsUntouched();
      item?.updateValueAndValidity();
    });
  }

  patchValueCompanyForm(
    value: AgencyConsoleSetting,
    plan = EAgencyPlan.STARTER
  ) {
    let addOnValue;
    const features = value?.configPlans?.features;
    if (plan !== EAgencyPlan.CUSTOM) {
      addOnValue = PLAN_DEFAULT_ADDONS[plan];
    } else {
      addOnValue = {
        taskEditor: features?.[EAddOnType.TASK_EDITOR]?.state,
        voicemail: features?.[EAddOnType.VOICE_MAIL]?.state,
        mobileApp: features?.[EAddOnType.MOBILE_APP]?.state,
        suggestedReplies: features?.[EAddOnType.SUGGESTED_REPLIES]?.state,
        outgoingCalls: features?.[EAddOnType.OUTGOING_CALLS]?.state,
        translation: features?.[EAddOnType.LANGUAGE_TRANSLATIONS]?.state,
        insights: features?.[EAddOnType.INSIGHTS]?.state,
        messenger: features?.[EAddOnType.MESSENGER]?.state,
        sms: features?.[EAddOnType.SMS]?.state,
        whatsapp: features?.[EAddOnType.WHATSAPP]?.state
      };
    }

    if ([EAgencyPlan.STARTER, EAgencyPlan.PRO].includes(plan)) {
      this.disableVoiceMailPhoneNumberField();
    }

    this.companyForm.patchValue({
      companyName: value?.name || value?.companyName || null,
      country: value?.country || null,
      CRM: value?.CRM || null,
      agency: value?.id || null,
      CRMSubscription: value?.CRMSubscription || null,
      customer: value?.customer?.id || null,
      subscription:
        value?.subscriptions?.map((item) => item?.id) ||
        value?.subscription ||
        [],
      plan: value?.configPlans?.plan || EAgencyPlan.STARTER,
      voiceMailPhoneNumber: value?.voiceMailPhoneNumber || null,
      companyCode: value?.companyCode || null,
      tasks:
        value?.taskNameCompanies?.map((taskName) => taskName?.taskNameId) ||
        value?.tasks ||
        [],
      ...addOnValue
    });
    if (!this.companyForm.get('companyName').value) {
      this.setMarkAsUnTouchedFields([
        this.companyForm.get('companyName'),
        this.companyForm.get('voiceMailPhoneNumber')
      ]);
    }
  }

  payloadForm() {
    const regexWebsite = new RegExp(`^${this.protocol}`);
    const {
      companyName,
      taskEditor,
      mobileApp,
      suggestedReplies,
      voicemail,
      voiceMailPhoneNumber,
      CRM,
      CRMSubscription,
      country,
      customer,
      subscription,
      companyCode,
      outgoingCalls,
      plan,
      insights,
      tasks,
      messenger,
      sms,
      whatsapp
    } = this.companyForm.value || {};
    return {
      name: companyName,
      configPlans: this.mapConfigPlans(plan) || null,
      outgoingCalls: outgoingCalls || false,
      taskEditor: taskEditor || false,
      mobileApp: mobileApp || false,
      suggestedReplies: suggestedReplies || false,
      voicemail: voicemail || false,
      voiceMailPhoneNumber,
      CRM,
      country: COUNTRY_NAMES_MAPPING[country] || country,
      customerId: customer,
      agencyIds: CRMSubscription || [],
      subscriptionIds: subscription || [],
      companyCode: companyCode || null,
      insights: insights || false,
      taskTemplateIds: tasks || [],
      messenger: messenger || false,
      sms,
      whatsapp: whatsapp || false
    };
  }

  mapConfigPlans(plan: EAgencyPlan): ConfigPlan {
    const enableList = {
      [EAddOnType.MOBILE_APP]: 'mobileApp',
      [EAddOnType.OUTGOING_CALLS]: 'outgoingCalls',
      [EAddOnType.SUGGESTED_REPLIES]: 'suggestedReplies',
      [EAddOnType.TASK_EDITOR]: 'taskEditor',
      [EAddOnType.VOICE_MAIL]: 'voicemail',
      [EAddOnType.INSIGHTS]: 'insights',
      [EAddOnType.LANGUAGE_TRANSLATIONS]: 'translation',
      [EAddOnType.EMBEDDABLE_WIDGET]: 'embeddable',
      [EAddOnType.MESSENGER]: 'messenger',
      [EAddOnType.SMS]: 'sms',
      [EAddOnType.WHATSAPP]: 'whatsapp'
    };
    let features: FeaturesConfigPlan = Object.entries(EAddOnType).reduce(
      (obj, [_, type]) => {
        obj = {
          ...obj,
          [type]: {
            enable: Object.entries(enableList)
              .map(([type]) => type)
              .includes(type),
            state: false,
            name: EAddOn[type]
          }
        };
        return obj;
      },
      {}
    );

    const value =
      plan !== EAgencyPlan.CUSTOM
        ? PLAN_DEFAULT_ADDONS[plan]
        : this.companyForm.value;

    Object.entries(enableList).forEach(([type, controlName]) => {
      features[type].state = Boolean(value[controlName]);
    });

    return {
      plan,
      features
    };
  }

  handlePlanChange(plan: EAgencyPlan, voiceMailPhoneNumber?: string) {
    const fields = [this.companyForm.get('voiceMailPhoneNumber')];
    switch (plan) {
      case EAgencyPlan.STARTER:
      case EAgencyPlan.PRO:
        this.resetVoiceMailPhoneNumberField();
        this.clearValidationFields(fields);
        this.disableVoiceMailPhoneNumberField();
        this.setVoiceMailPhoneNumberIfEmpty(voiceMailPhoneNumber);
        break;

      case EAgencyPlan.ELITE:
        this.setValidationFields(fields);
        this.setMarkAsUnTouchedFields(fields);
        this.enableVoiceMailPhoneNumberField();
        this.setVoiceMailPhoneNumberIfEmpty(voiceMailPhoneNumber);
        break;

      case EAgencyPlan.CUSTOM:
        this.clearValidationFields(fields);
        this.enableVoiceMailPhoneNumberField();
        this.setVoiceMailPhoneNumberIfEmpty(voiceMailPhoneNumber);
        break;

      default:
        break;
    }
  }

  private resetVoiceMailPhoneNumberField() {
    this.companyForm.get('voiceMailPhoneNumber').reset();
  }

  private enableVoiceMailPhoneNumberField() {
    this.companyForm.get('voiceMailPhoneNumber').enable();
  }

  private disableVoiceMailPhoneNumberField() {
    this.companyForm.get('voiceMailPhoneNumber').disable();
  }

  private setVoiceMailPhoneNumberIfEmpty(voiceMailPhoneNumber: string) {
    if (
      !this.companyForm.get('voiceMailPhoneNumber').value &&
      voiceMailPhoneNumber
    ) {
      this.companyForm
        .get('voiceMailPhoneNumber')
        .setValue(voiceMailPhoneNumber);
    }
  }
}
