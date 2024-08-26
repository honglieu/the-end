import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-workflow-content]'
})
export class TrudiWorkflowContentDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
