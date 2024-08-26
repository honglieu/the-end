import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'input[type="number"][appMaxLengthNumber]'
})
export class MaxLengthNumberDirective {
  @Input() maxLength: number = 10;
  invalidCharacter = ['e', 'E', '+', '-'];
  constructor(private el: ElementRef) {}

  @HostListener('keypress', ['$event']) onKeyPress(event) {
    // prevent inserting more value
    if (
      this.invalidCharacter.includes(event.key) ||
      this.el.nativeElement.value.length >= this.maxLength
    ) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event']) onInput(event) {
    // use slice when paste
    if (
      this.invalidCharacter.includes(event.key) ||
      this.el.nativeElement.value.length > this.maxLength
    ) {
      this.el.nativeElement.value = this.el.nativeElement.value.slice(
        0,
        this.maxLength
      );
    }
  }
}
