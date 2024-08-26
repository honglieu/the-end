import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-label-tmp]',
  exportAs: 'trudiLabelTmp'
})
export class TrudiLabelTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
