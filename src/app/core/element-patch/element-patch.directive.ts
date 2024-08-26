import { Directive, ElementRef } from '@angular/core';

import { TrudiSafeAny } from '@core';

/**
 * A patch directive to select the element of a component.
 */
@Directive({
  selector: '[trudiElement], [trudi-element]',
  exportAs: 'trudiElement'
})
export class TrudiElementPatchDirective {
  get nativeElement(): TrudiSafeAny {
    return this.elementRef.nativeElement;
  }

  constructor(public elementRef: ElementRef) {}
}
