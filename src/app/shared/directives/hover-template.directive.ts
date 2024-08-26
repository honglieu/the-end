import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';

type Placement = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appHoverShow]',
  exportAs: 'child'
})
export class HoverTemplateDirective {
  @Input('appHoverShow') contentTemplate: TemplateRef<any>;
  @Input() placement: Placement = 'bottom';
  @Input() automaticTooltipPosition: boolean = false;
  @Input() offset = 20;
  tooltipElement: HTMLElement;
  public isTooltipVisible = false;
  public tooltipHeight: number;
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private viewContainerRef: ViewContainerRef
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    this.tooltipElement = this.renderer.createElement('div');
    this.isTooltipVisible = true;
    this.viewContainerRef
      .createEmbeddedView(this.contentTemplate)
      .rootNodes.forEach((node) => {
        this.renderer.appendChild(this.tooltipElement, node);
      });
    const { left, top } = this.calculateTooltipPosition();
    this.renderer.setStyle(this.tooltipElement, 'display', 'grid');
    this.renderer.addClass(this.tooltipElement, 'tooltip');
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'zIndex', '99999');
    this.renderer.setStyle(this.tooltipElement, 'background-color', '#fff');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '8px');
    this.renderer.setStyle(this.tooltipElement, 'transition', 'opacity 0.3s');
    this.renderer.setStyle(this.tooltipElement, 'padding', '8px');
    this.renderer.setStyle(this.tooltipElement, 'opacity', '1');
    this.renderer.setStyle(this.tooltipElement, 'gap', '4px');
    this.renderer.setStyle(this.tooltipElement, 'max-width', '280px');
    this.renderer.setStyle(
      this.tooltipElement,
      'box-shadow',
      '0px 8px 28px rgba(0, 0, 0, 0.05), 0px 4px 12px rgba(0, 0, 0, 0.1)'
    );

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);

    //append template to body
    this.renderer.appendChild(document.body, this.tooltipElement);
    if (this.automaticTooltipPosition) {
      requestAnimationFrame(() => {
        if (!this.tooltipElement) return;
        const hostElement = this.elementRef.nativeElement;
        const hostRect = hostElement?.getBoundingClientRect();
        const headerHeight = 76;
        this.tooltipHeight = this.tooltipElement?.offsetHeight;
        this.placement =
          hostRect.top - headerHeight >= this.tooltipHeight ? 'top' : 'bottom';
        const { left, top } = this.calculateTooltipPosition();
        this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
        this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
      });
    }
  }

  @HostListener('mouseleave')
  @HostListener('wheel', ['$event'])
  onMouseLeave() {
    this.hideTooltip();
  }

  public hideTooltip() {
    if (this.tooltipElement) {
      if (this.tooltipElement?.parentNode) {
        this.renderer.removeChild(document.body, this.tooltipElement);
      }
      this.tooltipElement = null;
      this.isTooltipVisible = false;
    }
  }

  //calculate tooltip position
  private calculateTooltipPosition() {
    const hostElement = this.elementRef.nativeElement;
    if (!hostElement || !this.tooltipElement) return { top: 0, left: 0 };
    const hostRect = hostElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    let top = 0,
      left = 0;
    switch (this.placement) {
      case 'top':
        //The variable 'gap' refers to the distance between the attribute elements that are present in tooltip.
        const gap = 6;
        const tooltipSize = this.automaticTooltipPosition
          ? this.tooltipHeight + gap
          : tooltipRect.height + 10;
        top = hostRect.top + scrollY - tooltipSize;
        left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = hostRect.top + scrollY + hostRect.height + 10;
        left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top =
          hostRect.top + scrollY + hostRect.height / 2 - tooltipRect.height / 2;
        left = hostRect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top =
          hostRect.top + scrollY + hostRect.height / 2 - tooltipRect.height / 2;
        left = hostRect.left + hostRect.width + 10;
        break;
      default:
        top = hostRect.top + scrollY - tooltipRect.height - 10;
        left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        break;
    }
    // return an object with the CSS properties
    return { top, left };
  }

  ngOnDestroy() {
    this.hideTooltip();
  }
}
