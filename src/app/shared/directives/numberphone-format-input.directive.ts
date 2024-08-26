import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[formControlName][phoneFormatInput]'
})
export class NumberPhoneFormatInputDirective implements OnInit {
  // positionOfCursor = 0;
  // currentValue = '';
  constructor(
    private ngControl: NgControl,
    private readonly elr: ElementRef<HTMLInputElement>
  ) {}

  ngOnInit() {
    this.onInputChange(this.ngControl.value, false);
  }

  @HostListener('ngModelChange', ['$event']) onModelChange(event) {
    this.onInputChange(event, false);
  }

  /*@HostListener('keydown.backspace', ['$event']) keydownBackspace() {
    this.setPositionOfCursor();
  }

  @HostListener('keyup', ['$event']) keyUp(event: KeyboardEvent) {
   this.positionOfCursor = (event.target as HTMLInputElement).selectionStart;
  }

  @HostListener('click', ['$event']) onFocus(event: PointerEvent) {
    this.positionOfCursor = (event.target as HTMLInputElement).selectionStart;
  }*/

  onInputChange(event: string, backspace: boolean) {
    // this.currentValue = event;
    let newVal = event?.replace(/\D/g, '');

    if (newVal?.length === 0) {
      newVal = '';
    } else {
      if (newVal?.toString().startsWith('04')) {
        if (newVal?.length <= 4) {
          newVal = newVal?.replace(/^(\d{0,4})/, '$1');
        } else if (newVal?.length <= 7) {
          newVal = newVal?.replace(/^(\d{0,4})(\d{0,3})/, '$1 $2');
        } else if (newVal?.length <= 10) {
          newVal = newVal?.replace(/^(\d{0,4})(\d{0,3})(\d{0,3})/, '$1 $2 $3');
        } else {
          newVal = newVal?.substring(0, 10);
          newVal = newVal?.replace(/^(\d{0,4})(\d{0,3})(\d{0,3})/, '$1 $2 $3');
        }
      } else {
        if (newVal?.length <= 2) {
          newVal = newVal?.replace(/^(\d{0,2})/, '$1');
        } else if (newVal?.length <= 6) {
          newVal = newVal?.replace(/^(\d{0,2})(\d{0,4})/, '$1 $2');
        } else if (newVal?.length <= 10) {
          newVal = newVal?.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, '$1 $2 $3');
        } else {
          newVal = newVal?.substring(0, 10);
          newVal = newVal?.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, '$1 $2 $3');
        }
      }
    }

    this.ngControl.valueAccessor.writeValue(newVal);
  }
}
