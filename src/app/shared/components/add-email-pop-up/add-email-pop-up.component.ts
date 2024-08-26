import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { EMAIL_PATTERN } from '@services/constants';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';

@Component({
  selector: 'add-email-pop-up',
  templateUrl: './add-email-pop-up.component.html',
  styleUrls: ['./add-email-pop-up.component.scss']
})
export class AddEmailPopUpComponent implements OnChanges, OnDestroy {
  @Input() isShowModal: boolean = false;
  @Input() addEmailTitle: string;
  @Input() APIerr: string = '';
  @Input() isAddingEmail: boolean = false;

  @Output() onCancel = new EventEmitter();
  @Output() onConfirm = new EventEmitter();
  private unsubscribe = new Subject<void>();
  public isEmail = true;
  public emailInput = '';
  public isEmailEmpty = false;
  public popupModalPosition = ModalPopupPosition;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    this.onchangeModel(changes);
  }

  onchangeModel(changes: SimpleChanges) {
    if (changes['isShowModal']) {
      this.emailInput = '';
      this.isShowModal = changes['isShowModal']?.currentValue;
    }
  }

  handleCancel() {
    this.emailInput = '';
    this.APIerr = '';
    this.isEmailEmpty = false;
    this.isEmail = true;
    this.onCancel.emit();
  }

  handleConfirm() {
    this.isEmail = this.validateEmail(this.emailInput);
    if (!this.isEmail) {
      return;
    }
    if (this.isEmail && this.emailInput.length > 0) {
      this.onConfirm.emit(this.emailInput);
    }
  }

  validateEmail(email: string): boolean {
    const regExp = EMAIL_PATTERN;
    return regExp.test(email);
  }

  handleSetInputValue($event) {
    this.APIerr = '';
    const value = $event.target.value;
    this.isEmail = true;
    if (this.isEmail) {
      this.emailInput = value;
    } else {
      this.emailInput = '';
    }
    this.isEmailEmpty = !value;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
