import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-footer-tmp]',
  exportAs: 'trudiFooterTmp'
})
export class TrudiFooterTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
