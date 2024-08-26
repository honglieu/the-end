import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2
} from '@angular/core';

import { TrudiSafeAny } from '@core';

/**
 * hack the bug
 * angular router change with unexpected transition trigger after calling applicationRef.attachView
 * https://github.com/angular/angular/issues/34718
 */
@Directive({
  selector:
    '[trudi-button], trudi-button-group, [trudi-icon], [trudi-menu-item], [trudi-submenu], trudi-select-top-control, trudi-select-placeholder, trudi-input-group'
})
export class TrudiTransitionPatchDirective implements AfterViewInit, OnChanges {
  @Input() hidden: TrudiSafeAny = null;
  setHiddenAttribute(): void {
    if (this.hidden) {
      if (typeof this.hidden === 'string') {
        this.renderer.setAttribute(
          this.elementRef.nativeElement,
          'hidden',
          this.hidden
        );
      } else {
        this.renderer.setAttribute(this.elementRef.nativeElement, 'hidden', '');
      }
    } else {
      this.renderer.removeAttribute(this.elementRef.nativeElement, 'hidden');
    }
  }

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    this.renderer.setAttribute(this.elementRef.nativeElement, 'hidden', '');
  }

  ngOnChanges(): void {
    this.setHiddenAttribute();
  }

  ngAfterViewInit(): void {
    this.setHiddenAttribute();
  }
}
