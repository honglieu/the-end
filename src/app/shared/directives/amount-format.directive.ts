import {
  Directive,
  HostListener,
  ElementRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { formatterAmount } from '@shared/feature/function.feature';

@Directive({
  selector: '[amountFormat]'
})
export class AmountFormatDirective implements OnDestroy, OnInit {
  @Input() maxLengthNumber?: number;
  @Input() isFormattedWholePart? = true;
  @Input() formatOnBlur = false;
  public destroy$ = new Subject();

  constructor(private ngControl: NgControl, private el: ElementRef) {}

  ngOnInit() {
    if (this.formatOnBlur) {
      this.onFormatBlur();
    }

    this.transformAmount(this.ngControl.value);
    this.ngControl.valueChanges
      .pipe(debounceTime(SCROLL_THRESHOLD), takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value === this.ngControl.value) return;
        this.transformAmount(value);
      });
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    this.transformAmount(value);
  }

  @HostListener('focusout', ['$event.target.value'])
  onBlur(value) {
    this.onFormatBlur();
  }

  private onFormatBlur() {
    const value = +this.ngControl?.control?.value?.toString().replace(/,/g, '');

    if (value && this.formatOnBlur) {
      this.transformAmount(value.toFixed(2));
    }
  }

  private transformAmount(value: string): void {
    const transformedValue = formatterAmount(
      value,
      this.isFormattedWholePart,
      this.maxLengthNumber
    );
    if (value !== null) {
      this.ngControl.control.setValue(transformedValue, {
        emitEvent: false,
        onlySelf: true
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
