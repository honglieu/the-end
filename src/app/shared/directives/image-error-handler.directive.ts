import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[imageErrorHandler]'
})
export class ImageErrorHandlerDirective implements OnDestroy {
  private mutationObserver: MutationObserver;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {
    this.mutationObserver = new MutationObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        this.applyErrorHandlers();
      });
    });

    this.mutationObserver.observe(this.el.nativeElement, {
      childList: true,
      subtree: true
    });
  }

  private applyErrorHandlers() {
    const images = this.el.nativeElement.getElementsByTagName('img');
    for (let img of images) {
      if (!img.hasAttribute('data-error-handled')) {
        img.setAttribute('data-error-handled', 'true');
        const errorHandler = () => {
          img.src = '/assets/icon/icon-loading-image.svg';
        };
        img.errorHandlerRemoval = this.renderer.listen(
          img,
          'error',
          errorHandler
        );
      }
    }
  }

  disconnect() {
    this.mutationObserver.disconnect();
    const images = this.el.nativeElement.getElementsByTagName('img');
    for (let img of images) {
      if (img.errorHandlerRemoval) {
        img.errorHandlerRemoval();
        delete img.errorHandlerRemoval;
      }
    }
  }
  ngOnDestroy() {
    this.disconnect();
  }
}
