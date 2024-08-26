import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-group-tmp]',
  exportAs: 'trudiGroupTmp'
})
export class TrudiGroupTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
