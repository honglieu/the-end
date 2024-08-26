import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { LeasingRequestButtonAction } from '@shared/enum/leasing-request.enum';
import { FormControl, Validators } from '@angular/forms';
import {
  CURRENCYNUMBER,
  DEFAULT_CHAR_TRUDI_NUMBER_FIELD
} from '@services/constants';
import {
  distinctUntilChanged,
  filter,
  of,
  skip,
  startWith,
  Subject,
  switchMap,
  tap
} from 'rxjs';

@Component({
  selector: 'one-field-popup',
  templateUrl: './one-field-popup.component.html',
  styleUrls: ['./one-field-popup.component.scss']
})
export class OneFieldPopupComponent implements OnInit, OnChanges {
  private handleConfirm$: Subject<void> = new Subject();

  @Input() modalId: string;
  @Input() isShow = false;
  @Input() titleHeader: string = '';
  @Input() label: string = '';
  @Input() openFrom: LeasingRequestButtonAction;
  @Input() value: string;
  @Input() isRequired: boolean = true;
  @Output() getValue = new EventEmitter();
  @Output() closePopup = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  @Input() hasBackButton: boolean;
  public maskPattern = CURRENCYNUMBER;
  readonly DEFAULT_CHAR_TRUDI_NUMBER_FIELD = DEFAULT_CHAR_TRUDI_NUMBER_FIELD;
  public formControl: FormControl;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']?.currentValue && this.formControl) {
      this.formControl.setValue(this.value);
    }
  }

  ngOnInit(): void {
    this.formControl = new FormControl(null, [
      Validators.pattern(/^(?!.*\.$)\d+(\.\d+)?$/)
    ]);
    if (this.isRequired) {
      this.formControl.setValidators(Validators.required);
    }
    this.value && this.formControl.setValue(this.value);
    this.formControl.valueChanges
      .pipe(
        filter((value) => !!value || this.isRequired),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.formControl.removeValidators(Validators.required);
        this.formControl.updateValueAndValidity();
      });
    this.handleConfirm$
      .pipe(
        startWith(null),
        switchMap(() => {
          this.formControl.clearValidators();

          if (this.isRequired) {
            this.formControl.setValidators(Validators.required);
          }

          this.formControl.markAsTouched();
          this.formControl.updateValueAndValidity();

          if (this.formControl.invalid) {
            return of(null);
          }

          return of(this.formControl.value);
        }),
        skip(1),
        tap((value: string | null) => {
          if (value !== null || !this.isRequired) {
            this.getValue.emit(value);
          }
        })
      )
      .subscribe();
  }

  handleConfirm() {
    this.handleConfirm$.next();
  }

  handleClose() {
    this.closePopup.emit();
    this.formControl.reset();
  }

  handleCancel() {
    this.onCancel.emit();
    this.formControl.reset();
    if (this.isRequired) {
      this.formControl.removeValidators(Validators.required);
    }
    this.formControl.updateValueAndValidity();
  }
}
