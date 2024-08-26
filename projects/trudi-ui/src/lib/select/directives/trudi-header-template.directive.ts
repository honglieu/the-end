import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-header-tmp]',
  exportAs: 'trudiHeaderTmp'
})
export class TrudiHeaderTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
