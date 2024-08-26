import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-workflow-checked]'
})
export class TrudiWorkflowCheckedDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
