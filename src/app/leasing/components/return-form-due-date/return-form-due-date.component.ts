import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import { takeUntil, Subject, debounceTime } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';

@Component({
  selector: 'return-form-due-date',
  templateUrl: './return-form-due-date.component.html',
  styleUrls: ['./return-form-due-date.component.scss']
})
export class ReturnFormDueDateComponent implements OnInit, OnDestroy {
  @Input() modalId: string;
  @Input() headerText: string;
  @Input() currentDueDate: string;
  @Input() isRequired: boolean = true;
  @Input() show: boolean;
  @Output() onNextStep = new EventEmitter<string>();
  @Output() onCloseStep = new EventEmitter<boolean>();
  @Output() onBack = new EventEmitter<boolean>();
  @Input() hasBackButton: boolean = false;

  dateForm: FormGroup;

  private destroy$ = new Subject<void>();
  public disabledNextButton = false;
  public showErrorMsg = false;

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit(): void {
    this.dateForm = new FormGroup({
      returnDueDate: new FormControl(
        this.currentDueDate ? this.currentDueDate : ''
      )
    });

    if (this.isRequired) {
      this.dateForm.controls['returnDueDate'].setValidators([
        Validators.required
      ]);
    }

    const returnDueDateControl = this.dateForm.get('returnDueDate');
    returnDueDateControl?.valueChanges.subscribe(() => {
      this.disabledNextButton = false;
    });

    this.returnDueDate.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(SCROLL_THRESHOLD))
      .subscribe(() => {
        this.showErrorMsg = false;
      });
  }

  onClose() {
    this.disabledNextButton = true;
    this.onCloseStep.next(true);
  }

  onNext() {
    this.showErrorMsg = true;
    const returnDueDateControl = this.dateForm.get('returnDueDate');
    returnDueDateControl?.markAsTouched();
    if (returnDueDateControl?.valid) {
      const returnDueDate = this.dateForm.value.returnDueDate;
      this.onNextStep.next(returnDueDate);
    } else {
      this.disabledNextButton = true;
    }
  }

  handleBack() {
    this.onBack.next(true);
  }

  get returnDueDate() {
    return this.dateForm?.get('returnDueDate');
  }

  disabledDate = (current: Date): boolean => {
    return differenceInCalendarDays(current, this.getToday()) < 0;
  };

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
