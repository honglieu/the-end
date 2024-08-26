import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {
  IPolicyCustoms,
  IQuestionPolicy
} from '@/app/dashboard/modules/agency-settings/utils/enum';
import { EPolicySaveType } from '@/app/dashboard/modules/agency-settings/components/policies/utils/enum';
import {
  convertNewlinesToBreaks,
  hightLightMatchTextReply
} from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';

@Injectable({
  providedIn: 'root'
})
export class PoliciesFormService {
  public formData = {};

  getForm(option_id: string) {
    return this.formData[option_id];
  }

  setForm(option_id: string, form: FormGroup) {
    this.formData[option_id] = form;
  }

  isCheckBoxSelected(option_id: string) {
    return this.formData[option_id]?.get(option_id)?.value;
  }
  public policyForm: FormGroup;
  public questionForm: FormGroup;
  public addPolicyFormGroup: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  buildAddPolicyFormGroup() {
    this.addPolicyFormGroup = this.formBuilder.group({
      addOption: [EPolicySaveType.CREATE_NEW],
      policy: [null],
      version: [null]
    });
  }

  setValidationField(fields: AbstractControl[]) {
    fields.forEach((field) => {
      field.setValidators([Validators.required]);
      field.updateValueAndValidity();
    });
  }

  clearValidationFields(fields: AbstractControl[]) {
    fields.forEach((item) => {
      item.clearValidators();
      item.updateValueAndValidity();
    });
  }

  get customPolicy(): FormArray {
    return this.policyForm?.get('customPolicy') as FormArray;
  }

  get defaultReplyControl() {
    return this.policyForm.get('defaultReply');
  }

  buildPolicyForm() {
    this.policyForm = this.formBuilder.group({
      policyName: ['', Validators.required],
      questions: [[]],
      defaultReply: [''],
      selectedContactCard: [[]],
      listOfFiles: [[]],
      customPolicy: this.formBuilder.array([], this.uniquePolicyNameValidator())
    });
  }

  addCustomPolicyItem(value?: IPolicyCustoms, hightLightText?: string): void {
    const { id, additionalData, name, reply, tags, properties, isSelected } =
      value || {};
    const { uploadFile, contactCard } = additionalData || {};
    const tagIds = tags?.map((tag) => tag.id) || [];
    const propertyIds = properties?.map((pro) => pro.id) || [];
    const propertyOrTag = !!tagIds.length ? tagIds : propertyIds;

    const customForm = this.formBuilder.group({
      customPolicyId: [id || ''],
      policyName: [name || '', Validators.required],
      property: [propertyOrTag || [], Validators.required],
      generatedReplies: [
        this.matchingHightLightReply(reply, hightLightText, isSelected) || ''
      ],
      selectedContactCard: [contactCard || []],
      listOfFiles: [uploadFile || []]
    });
    this.customPolicy.push(customForm);
  }

  buildQuestionForm() {
    this.questionForm = this.formBuilder.group({
      question: [''],
      editQuestion: ['']
    });
  }

  validateDuplicateQuestion(
    listQuestion: IQuestionPolicy[],
    currentItemEditQuestion?: IQuestionPolicy
  ): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const question = control?.value;
      if (!question) return null;
      const hasInvalidDuplicate = listQuestion.some(
        (item) =>
          item.question.toLowerCase() === question.toLowerCase() &&
          (currentItemEditQuestion
            ? currentItemEditQuestion.id !== item.id
            : true)
      );
      return hasInvalidDuplicate ? { questionInvalid: true } : null;
    };
  }

  validateDuplicatePolicyName(condition) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control?.value) return null;
      return condition ? { policyNameInvalid: true } : null;
    };
  }

  uniquePolicyNameValidator(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const policies = (formArray as FormArray).controls.map((control) =>
        control.get('policyName')
      );
      let hasError = false;

      policies.forEach((currentControl, currentIndex) => {
        if (!currentControl) return;

        const currentName = currentControl.value;

        if (!currentName) {
          currentControl.setErrors({ required: true });
          hasError = true;
          return;
        }

        const otherControls = policies.filter(
          (control, index) => index !== currentIndex
        );
        const isDuplicate = otherControls.some(
          (control) =>
            control?.value &&
            control.value.toLowerCase() === currentName.toLowerCase()
        );

        if (isDuplicate) {
          currentControl.setErrors({ duplicate: true });
          hasError = true;
        } else {
          if (currentControl.hasError('duplicate')) {
            currentControl.updateValueAndValidity({ onlySelf: true });
          }
        }
      });

      return hasError ? { nonUniquePolicyNames: true } : null;
    };
  }

  invalidDefaultReplyField(
    defaultReplyValue: string,
    existedListOfFile: boolean,
    existedSelectedCard: boolean
  ) {
    const invalidReply =
      !defaultReplyValue &&
      !existedListOfFile &&
      !existedSelectedCard &&
      this.customPolicy?.controls?.length === 0;
    if (!invalidReply) {
      this.defaultReplyControl.clearValidators();
    } else {
      this.defaultReplyControl.setValidators(Validators.required);
    }
    this.defaultReplyControl.markAllAsTouched();
    this.defaultReplyControl.updateValueAndValidity();
    return invalidReply;
  }

  invalidDefaultReplyCustomField(
    defaultReplyValue: string,
    existedListOfFile: boolean,
    existedSelectedCard: boolean,
    index: number
  ) {
    const invalidReply =
      !defaultReplyValue && !existedListOfFile && !existedSelectedCard;
    const customPolicyArray = this.customPolicy as FormArray;
    const generatedRepliesControl = (
      customPolicyArray.at(index) as FormGroup
    ).get('generatedReplies');
    if (!invalidReply) {
      generatedRepliesControl.clearValidators();
    } else {
      generatedRepliesControl.setValidators(Validators.required);
    }
    generatedRepliesControl.markAllAsTouched();
    generatedRepliesControl.updateValueAndValidity();
    return invalidReply;
  }

  patchValueCustomPolicyForm(value: IPolicyCustoms[], hightLightText?: string) {
    if (!value?.length) return;
    this.customPolicy.clear();
    value.forEach((item) => {
      this.addCustomPolicyItem(item, hightLightText);
    });
  }

  patchValuePolicyForm(value, hightLightText) {
    const {
      policyCustoms,
      additionalData,
      defaultReply,
      isSelected,
      policyQuestions,
      name
    } = value;

    this.policyForm.patchValue({
      policyName: name,
      questions: policyQuestions.map(({ id, question }) => ({ id, question })),
      defaultReply: this.matchingHightLightReply(
        defaultReply,
        hightLightText,
        isSelected
      ),
      selectedContactCard: additionalData?.contactCard?.length
        ? additionalData?.contactCard
        : null,
      listOfFiles: additionalData?.uploadFile?.length
        ? additionalData?.uploadFile
        : null
    });
    this.patchValueCustomPolicyForm(policyCustoms, hightLightText);
  }

  matchingHightLightReply(reply, hightLight, isSelected) {
    const defaultReplyHtml = convertNewlinesToBreaks(reply);
    if (!isSelected) return defaultReplyHtml;
    const hightLightHtml = hightLightMatchTextReply(hightLight);
    return defaultReplyHtml + hightLightHtml;
  }
}
