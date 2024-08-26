import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[trudi-select-dropdown-title-tmp]',
  exportAs: 'trudiSelectDropdownTitleTmp'
})
export class TrudiSelectDropdownTitleTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}

@Directive({
  selector: '[trudi-select-dropdown-option-tmp]',
  exportAs: 'trudiSelectDropdownOptionTmp'
})
export class TrudiSelectDropdownOptionTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}

@Directive({
  selector: '[trudi-select-dropdown-header-tmp]',
  exportAs: 'trudiSelectDropdownHeaderTmp'
})
export class TrudiSelectDropdownHeaderTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}

@Directive({
  selector: '[trudi-select-dropdown-footer-tmp]',
  exportAs: 'trudiSelectDropdownFooterTmp'
})
export class TrudiSelectDropdownFooterTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}

@Directive({
  selector: '[trudi-select-dropdown-group-tmp]',
  exportAs: 'trudiSelectDropdownGroupTmp'
})
export class TrudiSelectDropdownGroupTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}

@Directive({
  selector: '[trudi-select-dropdown-no-results-tmp]',
  exportAs: 'trudiSelectDropdownNoResultsTmp'
})
export class TrudiSelectDropdownNoResultsTemplateDirective {
  constructor(public templateRef: TemplateRef<HTMLElement>) {}
}
