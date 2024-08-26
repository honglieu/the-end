import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-option-tmp]',
  exportAs: 'trudiOptionTmp'
})
export class TrudiOptionTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
