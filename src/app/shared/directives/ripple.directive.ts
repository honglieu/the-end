import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Directive({
  selector: '[ripple]'
})
export class RippleDirective {
  @Input() variant = 'rgba(0,0,0,0.16)';

  @HostBinding('style') get addStyle() {
    return this.ds.bypassSecurityTrustStyle(`
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease-in-out;
    `);
  }

  @HostListener('click', ['$event']) onClick(e: MouseEvent) {
    const x = e.offsetX;
    const y = e.offsetY;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.backgroundColor = this.variant;
    ripple.style.setProperty(
      '--scale-area',
      this.elr.nativeElement.offsetWidth
    );
    e.target['appendChild'](ripple);
    setTimeout(() => {
      ripple.parentNode.removeChild(ripple);
    }, 500);
  }

  constructor(
    private ds: DomSanitizer,
    private elr: ElementRef,
    private crd: ChangeDetectorRef
  ) {}
}
