import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[strictCharacter]'
})
export class StrictCharacterDirective {
  @Input() onlyNumber = false;
  @Input() specialCharacters = ['/'];
  private navigationKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'Home',
    'End',
    'ArrowLeft',
    'ArrowRight',
    'Clear',
    'Copy',
    'Paste'
  ];
  constructor(private elementRef: ElementRef<HTMLInputElement>) {}

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    const isNumber =
      Number.parseInt(event.key) >= 0 && Number.parseInt(event.key) <= 9;
    const isSpecial = this.specialCharacters.includes(event.key);
    const isNavigationKey = this.navigationKeys.includes(event.key);
    const isValid = this.onlyNumber
      ? isNumber || isSpecial || isNavigationKey
      : true;
    if (isValid) return;
    event.preventDefault();
  }
}
