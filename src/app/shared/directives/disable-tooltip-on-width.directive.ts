import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  Optional
} from '@angular/core';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';

@Directive({
  selector: '[disableTooltipOnWidth]'
})
export class DisableTooltipOnWidthDirective implements AfterViewInit {
  @Input() maxWidthTooltip: number;
  constructor(
    private readonly _elementRef: ElementRef<HTMLElement>,
    @Optional() private readonly _tooltip: NzTooltipDirective
  ) {}

  ngAfterViewInit(): void {
    const element = this._elementRef.nativeElement;
    const maxWidth = this.maxWidthTooltip || element.scrollWidth;
    const isWidthConditionMet = this.maxWidthTooltip
      ? element.offsetWidth < maxWidth
      : element.offsetWidth >= element.scrollWidth;
    if (isWidthConditionMet) {
      this._tooltip.trigger = null;
    }
  }
}
