import { ScrollDispatcher } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Host,
  HostBinding,
  HostListener,
  Input,
  Optional,
  Renderer2,
  ViewContainerRef
} from '@angular/core';
import { NzNoAnimationDirective } from 'ng-zorro-antd/core/no-animation';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { of, switchMap, takeUntil } from 'rxjs';

@Directive({
  selector: '[trudi-tooltip]',
  exportAs: 'trudiTooltip'
})
export class TrudiTooltipDirective
  extends NzTooltipDirective
  implements AfterViewInit
{
  @Input() hideWhenClick = false;
  @HostBinding('class.ant-tooltip-open') get trudiVisible() {
    return this.visible;
  }

  constructor(
    public override elementRef: ElementRef<any>,
    private scrollDispatcher: ScrollDispatcher,
    public override hostView: ViewContainerRef,
    public override renderer: Renderer2,
    @Host() @Optional() noAnimation?: NzNoAnimationDirective
  ) {
    super();
  }

  public override ngAfterViewInit() {
    this.createComponent();
    this.registerTriggers();
    this.visibleChange
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res) => {
          if (res) {
            return this.scrollDispatcher.ancestorScrolled(this.elementRef);
          }
          return of(false);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.hide();
        }
      });
  }

  @HostListener('click', ['$event.target'])
  onClick() {
    if (this.hideWhenClick) {
      this.hide();
    }
  }
}
