import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appDetectFocus]',
  exportAs: 'detectFocus'
})
export class DetectFocusDirective {
  private _isFocus = false;

  get isFocus() {
    return this._isFocus;
  }
  constructor() {}

  @HostListener('focus')
  onFocus() {
    this._isFocus = true;
  }

  @HostListener('blur')
  onBlur() {
    this._isFocus = false;
  }
}
