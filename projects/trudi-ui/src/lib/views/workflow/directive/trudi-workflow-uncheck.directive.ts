import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-workflow-uncheck]'
})
export class TrudiWorkflowUncheckDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
