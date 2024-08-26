import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ISelectedReceivers } from '@/app/mailbox-setting/utils/out-of-office.interface';

@Injectable({
  providedIn: null
})
export class OutOfOfficeFormService {
  public outOfOfficeGroup: FormGroup;
  public selectedContactCard$: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  private originMsgContent$ = new BehaviorSubject<string>(null);

  get firstDate() {
    return this.outOfOfficeGroup.get('firstDate');
  }

  get lastDate() {
    return this.outOfOfficeGroup.get('lastDate');
  }

  getOriginMsgContent() {
    return this.originMsgContent$.value;
  }

  setOriginMsgContent(content: string) {
    return this.originMsgContent$.next(content);
  }

  getSelectedContactCard() {
    return this.selectedContactCard$.value;
  }

  setSelectedContactCard(value: ISelectedReceivers[]) {
    this.selectedContactCard$.next(value);
  }

  constructor(private formBuilder: FormBuilder) {}

  buildForm() {
    this.outOfOfficeGroup = this.formBuilder.group({
      id: this.formBuilder.control(''),
      firstDate: this.formBuilder.control('', [Validators.required]),
      lastDate: this.formBuilder.control('', [
        Validators.required,
        this.dateRangeValidator
      ]),
      message: this.formBuilder.control('', [
        Validators.required,
        this.customValidateMsgContent()
      ]),
      includeSignature: this.formBuilder.control(true),
      listOfFiles: this.formBuilder.control([]),
      selectedContactCard: this.formBuilder.control([])
    });
  }

  setForm(form: {}) {
    this.outOfOfficeGroup.setValue({ ...this.outOfOfficeGroup.value, ...form });
  }

  customValidateMsgContent(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const originContent = this.getOriginMsgContent()?.trim();
      if (!originContent || !originContent.length) {
        return { required: true };
      }
      return null;
    };
  }

  private dateRangeValidator: ValidatorFn = (): {
    [key: string]: any;
  } | null => {
    let invalid = false;
    const from = this.outOfOfficeGroup && this.firstDate.value;
    const to = this.outOfOfficeGroup && this.lastDate.value;

    if (from && to) {
      invalid =
        new Date(from).setHours(0, 0, 0, 0).valueOf() >
        new Date(to).setHours(0, 0, 0, 0).valueOf();
    }
    return invalid ? { invalidRange: true } : null;
  };
}
