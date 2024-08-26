import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ESignOfPhrase } from '@/app/mailbox-setting/utils/enum';
import { IEmailSignatureSetting } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import {
  LIST_GREETING,
  RECIPIENT_FORMAT_OPTIONS,
  SIGN_OFF_PHRASES
} from '@/app/mailbox-setting/utils/constant';

@Injectable({
  providedIn: 'root'
})
export class EmailSignatureFormService {
  public emailSignatureForm: FormGroup;
  constructor(private formBuilder: FormBuilder) {}

  buildForm() {
    this.emailSignatureForm = this.formBuilder.group({
      greetingOption: [LIST_GREETING[0].key],
      recipientOption: [RECIPIENT_FORMAT_OPTIONS[0].key],
      enableSignOffPhrase: [''],
      signOffPhrase: [SIGN_OFF_PHRASES[0].label],
      optionOther: [''],
      enableRole: [''],
      enableName: [''],
      enableTeamName: [''],
      teamName: [''],
      enableEmailAddress: [''],
      enablePhoneNumber: [''],
      enableSignature: [false]
    });
  }

  patchValueForm(data: IEmailSignatureSetting) {
    const {
      mailboxEmailAddress,
      memberName,
      memberRole,
      optionOther,
      signOffPhrase,
      teamName,
      phoneNumber,
      enableSignature,
      greeting,
      recipient
    } = data || {};
    this.emailSignatureForm.patchValue({
      enableSignOffPhrase: signOffPhrase?.isEnabled ?? false,
      signOffPhrase: signOffPhrase?.value || SIGN_OFF_PHRASES[0].label,
      optionOther:
        signOffPhrase?.key === ESignOfPhrase.OTHER ? signOffPhrase?.value : '',
      enableRole: memberRole?.isEnabled,
      enableName: memberName?.isEnabled,
      enableTeamName: teamName?.isEnabled,
      teamName: teamName?.value ?? '',
      enableEmailAddress: mailboxEmailAddress?.isEnabled,
      enablePhoneNumber: phoneNumber?.isEnabled,
      enableSignature,
      greetingOption: greeting || [LIST_GREETING[0].key],
      recipientOption: recipient || [RECIPIENT_FORMAT_OPTIONS[0].key]
    });
    this.validatorTeamName(data.teamName.isEnabled);
  }

  validatorTeamName(isEnabled: boolean) {
    const teamNameControl = this.emailSignatureForm.get('teamName');
    if (isEnabled && !teamNameControl.value) {
      teamNameControl.addValidators(Validators.required);
    } else {
      teamNameControl.clearValidators();
    }
    teamNameControl.updateValueAndValidity();
    this.emailSignatureForm.updateValueAndValidity();
  }

  validatorOther(isEnabled: boolean, signOffPhrase: ESignOfPhrase) {
    const otherControl = this.emailSignatureForm.get('optionOther');
    if (
      isEnabled &&
      !otherControl.value &&
      signOffPhrase === ESignOfPhrase.OTHER
    ) {
      otherControl.addValidators(Validators.required);
    } else {
      otherControl.clearValidators();
    }
    otherControl.markAsTouched();
    otherControl.updateValueAndValidity();
    this.emailSignatureForm.updateValueAndValidity();
  }
}
