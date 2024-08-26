import { Directive, Injector, TemplateRef } from '@angular/core';

export class BaseButtonIconDirective {
  public templateRef: TemplateRef<unknown>;
  constructor(injector: Injector) {
    this.templateRef = injector.get(TemplateRef);
  }
}

@Directive({
  selector: '[iconPrefix]'
})
export class IconPrefixDirective extends BaseButtonIconDirective {
  constructor(injector: Injector) {
    super(injector);
  }
}

@Directive({
  selector: '[iconSuffix]'
})
export class IconSuffixDirective extends BaseButtonIconDirective {
  constructor(injector: Injector) {
    super(injector);
  }
}
