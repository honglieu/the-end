import {
  Directive,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  Input,
  Renderer2,
  OnDestroy,
  NgZone
} from '@angular/core';
import { fixedOutsideWhiteList } from '../common/constants/click-outside-white-list';
@Directive({
  selector: '[appOutsideClickListener]',
  standalone: true
})
export class ClickOutsideDirective implements OnInit, OnDestroy {
  @Input() trackEl: HTMLElement | null = null;
  @Input() whiteList: string[] = [];
  @Input() eventType: 'click' | 'mousedown' = 'click';
  @Output() clickOutside = new EventEmitter<MouseEvent>();
  private clickListener: () => void = null;

  constructor(
    private host: ElementRef,
    private renderer: Renderer2,
    private zone: NgZone
  ) {}
  public ngOnInit(): void {
    this.clickListener = this.zone.runOutsideAngular(() => {
      return this.renderer.listen(
        this.trackEl || document,
        this.eventType,
        (e: MouseEvent) => {
          this.handleClick(e);
        }
      );
    });
  }
  public ngOnDestroy(): void {
    if (typeof this.clickListener !== 'function') {
      return;
    }
    this.clickListener();
  }

  private handleClick(e: MouseEvent): void {
    const whiteList = (this.whiteList || []).concat(fixedOutsideWhiteList);

    if (whiteList.length) {
      if (e.target['id']) {
        if (whiteList.includes(e.target['id'])) return;
      }

      const isInWhiteTargets = whiteList.some(
        (item) => !!(e.target as HTMLElement).closest(`${item}`)
      );

      if (isInWhiteTargets) return;
    }

    const clickedInside = this.host.nativeElement.contains(e.target);

    if (e.which === 3 || clickedInside) {
      return;
    }

    this.clickOutside.emit(e);
  }
}
