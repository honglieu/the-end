import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[capitalizeFirstLetter]'
})
export class CapitalizeFirstLetterDirective {
  constructor(private el: ElementRef) {}

  @HostListener('ngModelChange') onInputChange() {
    if (this.el.nativeElement.value) {
      const value = this.el.nativeElement.value;
      this.el.nativeElement.value = this.capitalize(value);
    } else if (this.el.nativeElement.querySelector('textarea')) {
      const element = this.el.nativeElement.querySelector('textarea');
      element.value = this.capitalize(element.value);
    } else {
      const childElement = this.el.nativeElement.querySelector('input');
      childElement.value = this.capitalize(childElement.value);
    }
  }

  private capitalize(value: string): string {
    if (value) {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    return value;
  }
}
