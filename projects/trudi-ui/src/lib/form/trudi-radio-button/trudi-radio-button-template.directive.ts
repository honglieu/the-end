import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-radio-button-tmp]',
  exportAs: 'trudiRadioButtonTmp'
})
export class TrudiRadioButtonTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
