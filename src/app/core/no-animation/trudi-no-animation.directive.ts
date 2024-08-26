import { coerceElement } from '@angular/cdk/coercion';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  Optional,
  Renderer2
} from '@angular/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

import { BooleanInput } from '@core';
import { InputBoolean } from '@core';

const DISABLED_CLASSNAME = 'trudi-animate-disabled';

@Directive({
  selector: '[trudiNoAnimation]',
  exportAs: 'trudiNoAnimation'
})
export class TrudiNoAnimationDirective implements OnChanges, AfterViewInit {
  static ngAcceptInputType_trudiNoAnimation: BooleanInput;

  @Input() @InputBoolean() trudiNoAnimation: boolean = false;

  constructor(
    private element: ElementRef,
    private renderer: Renderer2,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) private animationType: string
  ) {}

  ngOnChanges(): void {
    this.updateClass();
  }

  ngAfterViewInit(): void {
    this.updateClass();
  }

  private updateClass(): void {
    const element = coerceElement(this.element);
    if (!element) {
      return;
    }
    if (this.trudiNoAnimation || this.animationType === 'NoopAnimations') {
      this.renderer.addClass(element, DISABLED_CLASSNAME);
    } else {
      this.renderer.removeClass(element, DISABLED_CLASSNAME);
    }
  }
}
