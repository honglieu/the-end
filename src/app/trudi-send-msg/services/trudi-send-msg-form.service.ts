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
import { BehaviorSubject, Subject } from 'rxjs';
import { EMAIL_FORMAT_REGEX } from '@services/constants';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ShareValidators } from '@shared/validators/share-validator';
import { sendOptionType } from '@/app/trudi-send-msg/components/trudi-send-msg-header/components/trudi-send-option-menu/trudi-send-option-menu.component';
import {
  IDefaultValueTrudiSendMsg,
  ISelectedReceivers
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Injectable({
  providedIn: null
})
export class TrudiSendMsgFormService {
  public sendMsgForm: FormGroup;
  private readonly _isFilesValidate = new BehaviorSubject<boolean>(true);
  private readonly _isSignatureContentMsgValidate =
    new BehaviorSubject<boolean>(true);
  private originMsgContent$ = new BehaviorSubject<string>(null);
  public selectedContactCard$: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  public listFilesReiForm$: BehaviorSubject<[]> = new BehaviorSubject<[]>([]);
  public triggerUpdateSendOption: Subject<{
    type: sendOptionType;
    defaultValue: sendOptionType;
  }> = new Subject();

  public triggerOpenDropdownProperties$: Subject<boolean> = new BehaviorSubject(
    false
  );
  public valueSearchProperties$: Subject<string> = new Subject();
  set isFilesValidate(value: boolean) {
    this._isFilesValidate.next(value);
  }
  public needValidateContactCard: boolean = false;

  setNeedValidateContactCard(value) {
    this.needValidateContactCard = value;
  }
  get isFilesValidate() {
    return this._isFilesValidate.getValue();
  }

  setSignatureContentMsgValidate(value: boolean) {
    this._isSignatureContentMsgValidate.next(value);
  }

  get isSignatureContentMsgValidate() {
    return this._isSignatureContentMsgValidate.getValue();
  }

  get property() {
    return this.sendMsgForm.get('property');
  }

  private formDefaultValue: IDefaultValueTrudiSendMsg = {
    selectedSender: null,
    ccReceivers: [],
    bccReceivers: [],
    msgTitle: '',
    selectedReceivers: [],
    listOfFiles: [],
    attachMediaFiles: [],
    isRequiredContactCard: false,
    emailSignature: true,
    externalSendTo: '',
    property: null,
    selectedContactCard: []
  };

  getSelectedContactCard() {
    return this.selectedContactCard$.value;
  }

  setSelectedContactCard(value: ISelectedReceivers[]) {
    this.selectedContactCard$.next(value);
  }

  getOriginMsgContent() {
    return this.originMsgContent$.value;
  }

  setOriginMsgContent(content: string) {
    return this.originMsgContent$.next(content);
  }

  constructor(private formBuilder: FormBuilder) {}

  buildForm(customValue?: IDefaultValueTrudiSendMsg) {
    this.sendMsgForm = this.formBuilder.group({
      selectedSender: new FormControl(customValue.selectedSender, [
        Validators.required
      ]),
      selectedReceivers: new FormControl(
        customValue.selectedReceivers,
        !customValue.externalSendTo && [
          Validators.required,
          validateReceivers()
        ]
      ),
      // externalSendTo skip selectedReceivers
      externalSendTo: new FormControl(
        customValue.externalSendTo,
        customValue.externalSendTo && [
          Validators.required,
          this.validateExternalSendTo()
        ]
      ),
      attachMediaFiles: new FormControl(customValue.attachMediaFiles),
      listOfFiles: new FormControl(customValue.listOfFiles),
      msgTitle: new FormControl(customValue.msgTitle, [
        Validators.required,
        ShareValidators.trimValidator
      ]),
      msgContent: new FormControl('', [
        Validators.required,
        this.customValidateMsgContent()
      ]),
      textContent: new FormControl(''),
      emailSignature: new FormControl(true, [Validators.required]),
      isResolveConversation: new FormControl(false, [Validators.required]),
      selectedContactCard: new FormControl(customValue?.selectedContactCard),
      sendOption: new FormControl(null)
    });
  }

  buildFormV2(
    customValue: IDefaultValueTrudiSendMsg = this.formDefaultValue,
    isBulkSendEmails: boolean = false
  ) {
    this.sendMsgForm = this.formBuilder.group({
      selectedSender: new FormControl(customValue.selectedSender, [
        Validators.required
      ]),
      selectedReceivers: new FormControl(
        customValue.selectedReceivers,
        !customValue.externalSendTo && [
          this.validateRequiredReceivers(),
          validateReceivers(),
          ...(isBulkSendEmails ? [Validators.required] : [])
        ]
      ),
      ccReceivers: new FormControl(
        customValue.ccReceivers,
        !customValue.externalSendTo && [
          this.validateRequiredReceivers(),
          validateReceivers()
        ]
      ),
      bccReceivers: new FormControl(
        customValue.bccReceivers,
        !customValue.externalSendTo && [
          this.validateRequiredReceivers(),
          validateReceivers()
        ]
      ),
      // externalSendTo skip selectedReceivers
      externalSendTo: new FormControl(
        customValue.externalSendTo,
        customValue.externalSendTo && [
          Validators.required,
          this.validateExternalSendTo()
        ]
      ),
      attachMediaFiles: new FormControl(customValue.attachMediaFiles),
      listOfFiles: new FormControl(customValue.listOfFiles),
      msgTitle: new FormControl(customValue.msgTitle, [
        Validators.required,
        ShareValidators.trimValidator
      ]),
      msgContent: new FormControl(''),
      textContent: new FormControl(''),
      emailSignature: new FormControl(true, [Validators.required]),
      isResolveConversation: new FormControl(false, [Validators.required]),
      selectedContactCard: new FormControl(customValue?.selectedContactCard),
      sendOption: new FormControl(null),
      property: new FormControl(customValue.property),
      automateSimilar: new FormControl(false)
    });
  }

  buildFormV3(
    customValue: IDefaultValueTrudiSendMsg = this.formDefaultValue,
    isBulkSendEmails: boolean = false
  ) {
    this.sendMsgForm = this.formBuilder.group({
      selectedSender: new FormControl(customValue.selectedSender, [
        Validators.required
      ]),
      selectedReceivers: new FormControl(
        customValue.selectedReceivers,
        !customValue.externalSendTo && [
          this.validateRequiredReceivers(),
          validateReceivers(),
          ...(isBulkSendEmails ? [Validators.required] : [])
        ]
      ),
      ccReceivers: new FormControl(
        customValue.ccReceivers,
        !customValue.externalSendTo && [
          this.validateRequiredReceivers(),
          validateReceivers()
        ]
      ),
      bccReceivers: new FormControl(
        customValue.bccReceivers,
        !customValue.externalSendTo && [
          this.validateRequiredReceivers(),
          validateReceivers()
        ]
      ),
      // externalSendTo skip selectedReceivers
      externalSendTo: new FormControl(
        customValue.externalSendTo,
        customValue.externalSendTo && [
          Validators.required,
          this.validateExternalSendTo()
        ]
      ),
      attachMediaFiles: new FormControl(customValue.attachMediaFiles),
      listOfFiles: new FormControl(customValue.listOfFiles),
      msgContent: new FormControl(''),
      emailSignature: new FormControl(true, [Validators.required]),
      isResolveConversation: new FormControl(false, [Validators.required]),
      selectedContactCard: new FormControl(
        customValue?.selectedContactCard,
        customValue.isRequiredContactCard && [this.validateContactCard()]
      ),
      sendOption: new FormControl(null),
      property: new FormControl(customValue.property),
      automateSimilar: new FormControl(false)
    });
  }

  validateRequiredReceivers(): ValidatorFn {
    return (): ValidationErrors | null => {
      let receiversControllNames = [
        'selectedReceivers',
        'ccReceivers',
        'bccReceivers'
      ];
      const hasValue = receiversControllNames.some(
        (controlName) => this.sendMsgForm?.get(controlName)?.value?.length > 0
      );

      if (!hasValue) {
        const errors = { required: true };
        receiversControllNames.forEach((controlName) => {
          this.sendMsgForm?.get(controlName)?.setErrors(errors);
        });
        return errors;
      }

      receiversControllNames.forEach((controlName) => {
        let errors = this.sendMsgForm?.get(controlName).errors;
        if (errors) {
          delete errors['required'];
        }
        errors = errors && Object.keys(errors).length > 0 ? errors : null;
        this.sendMsgForm?.get(controlName).setErrors(errors);
      });

      return null;
    };
  }

  validateExternalSendTo(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const email = control?.value;
      if (!email) return null;
      const hasInvalidEmail = !EMAIL_FORMAT_REGEX.test(email);
      if (hasInvalidEmail) {
        return { emailInvalid: 'Please remove invalid email' };
      }
      return null;
    };
  }

  customValidateMsgContent(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isControlEmpty =
        !control.value?.length ||
        !control.value.trim().replaceAll('<p>&nbsp;</p>', '').length;

      if (isControlEmpty) {
        return { required: true };
      }

      return null;
    };
  }

  validateContactCard(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control?.value?.length) {
        return { requiredContactCard: 'Please add contact card' };
      }
      return null;
    };
  }
}

export function validateReceivers(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const selectedReceivers = control?.value;
    if (selectedReceivers) {
      const hasInvalidEmail = selectedReceivers
        .filter((receiver) => receiver.type === EUserPropertyType.UNIDENTIFIED)
        .some((receiver) => !EMAIL_FORMAT_REGEX.test(receiver?.email));
      if (hasInvalidEmail) {
        return { emailInvalid: 'Please remove invalid email' };
      }
    }
    return null;
  };
}
export function validateContactCard(content) {
  try {
    const editorDocument = new DOMParser().parseFromString(
      content,
      'text/html'
    );
    const contactCards = editorDocument.querySelectorAll(
      '[data-role=contact-card]'
    );
    const numberOfContactCards = Array.from(contactCards).length;
    return !!numberOfContactCards;
  } catch (error) {
    console.log('Error parsing DOM in checkHasContactCard:', error);
    return false;
  }
}
