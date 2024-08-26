import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[intersectionObserver]'
})
export class IntersectionObserverDirective {
  private observer: IntersectionObserver;
  @Output() intersection = new EventEmitter<void>();

  constructor(public el: ElementRef) {
    this.observer = new IntersectionObserver(this.callback, {
      rootMargin: '0px',
      threshold: 0.1,
      root: null
    });
    this.observer.observe(this.el.nativeElement);
  }

  private callback: ConstructorParameters<typeof IntersectionObserver>[0] = (
    entries
  ) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((_entry) => {
        this.intersection.emit();
        this.observer.disconnect();
      });
  };
}
