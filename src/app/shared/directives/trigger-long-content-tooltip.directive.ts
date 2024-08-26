import {
  AfterViewInit,
  Directive,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';

@Directive({
  selector: '[triggerLongContentTooltip]'
})
export class TriggerLongContentTooltipDirective implements AfterViewInit {
  @Input() keepHover: boolean = false;
  @Input() set elementRef(element: HTMLElement) {
    this._elementRef = element;
    this.updateTooltipTrigger();
  }
  @Output() exceedWidth = new EventEmitter<boolean>();
  private _elementRef: HTMLElement;

  constructor(private readonly _tooltip: NzTooltipDirective) {}

  ngAfterViewInit(): void {
    this.updateTooltipTrigger();
  }

  private updateTooltipTrigger(): void {
    if (!this._elementRef) {
      return;
    }
    if (this._elementRef.offsetWidth >= this._elementRef.scrollWidth) {
      if (this.keepHover) {
        this.exceedWidth.emit(false);
        this._tooltip.trigger = 'hover';
      } else {
        this._tooltip.trigger = null;
        this.exceedWidth.emit(true);
      }
    } else {
      this._tooltip.trigger = 'hover';
    }
  }
}
