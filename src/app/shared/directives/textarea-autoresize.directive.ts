import {
  Directive,
  HostListener,
  ElementRef,
  OnInit,
  Input,
  Renderer2,
  OnDestroy
} from '@angular/core';

@Directive({
  selector: '[appTextareaAutoresize]'
})
export class TextareaAutoresizeDirective implements OnInit, OnDestroy {
  @Input() resizeWidth: boolean = false;
  @Input() maxWidth!: number;

  private divElement!: HTMLElement;
  private textAreaElement: HTMLTextAreaElement;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  @HostListener(':input')
  onInput() {
    this.resizeWidth && this.onResizeWidth();
    this.onResizeHeight();
  }

  ngOnInit() {
    this.textAreaElement =
      this.elementRef.nativeElement.tagName === 'TEXTAREA'
        ? this.elementRef.nativeElement
        : this.elementRef.nativeElement.querySelector('textarea');

    Object.defineProperty(this.textAreaElement, 'value', {
      get: () => {
        var valueProp = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value'
        );
        return valueProp.get.call(this.textAreaElement);
      },
      set: (newValue) => {
        var valueProp = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value'
        );
        var oldValue = valueProp.get.call(this.textAreaElement);
        valueProp.set.call(this.textAreaElement, newValue);

        if (oldValue != newValue) {
          this.resizeWidth && this.onResizeWidth();
          this.onResizeHeight();
        }
      }
    });
  }

  onResizeWidth() {
    if (!this.textAreaElement) return;

    if (!this.divElement) {
      this.divElement = this.renderer.createElement('div');
      this.renderer.addClass(this.divElement, 'visibility-hidden');
      this.renderer.addClass(this.divElement, 'absolute');
      this.renderer.setStyle(this.divElement, 'top', 0);
      this.renderer.setStyle(this.divElement, 'minWidth', '100px');
      this.renderer.appendChild(document.body, this.divElement);
    }

    this.renderer.setStyle(this.divElement, 'maxWidth', this.maxWidth);
    this.renderer.setProperty(
      this.divElement,
      'textContent',
      this.textAreaElement.value || ''
    );

    !this.textAreaElement.style.maxWidth &&
      (this.textAreaElement.style.maxWidth = '100%');

    const parentElementStyle = window.getComputedStyle(
      this.textAreaElement.parentElement
    );

    const parentInlinePadding = Number(
      parentElementStyle.getPropertyValue('padding-left').split('px')[0] +
        parentElementStyle.getPropertyValue('padding-right').split('px')[0]
    );

    const widthToSet =
      this.divElement.offsetWidth + parentInlinePadding >= this.maxWidth
        ? this.maxWidth - parentInlinePadding
        : this.divElement.offsetWidth + 10;

    this.textAreaElement.style.width = `${widthToSet}px`;
  }

  onResizeHeight() {
    if (!this.textAreaElement) return;

    this.textAreaElement.style.height = 'auto';
    this.textAreaElement.style.height =
      this.textAreaElement.scrollHeight + 'px';
  }

  ngOnDestroy(): void {
    this.renderer.removeChild(document.body, this.divElement);
  }
}
