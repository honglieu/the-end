import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  AfterViewInit,
  Output,
  EventEmitter
} from '@angular/core';

@Directive({
  selector: '[trudiTextFieldResize]'
})
export class TrudiTextFieldResizeDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLElement>) {}

  @Input() maxHeightResize: number = 0;
  @Input() minHeightResize: number = 0;
  @Output() resized = new EventEmitter();

  @HostListener('input', ['$event.target'])
  onInput(textarea: HTMLTextAreaElement): void {
    this.adjustTextareaHeight(textarea);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const textarea: HTMLTextAreaElement =
        this.el.nativeElement.querySelector('textarea');
      this.adjustTextareaHeight(textarea);
    });
  }

  adjustTextareaHeight(textarea: HTMLElement) {
    textarea.style.height = this.minHeightResize + 'px';

    if (textarea.scrollHeight <= 44) {
      //Reset to the initial height
      textarea.style.height = this.minHeightResize + 'px';
      textarea.style.overflowY = 'hidden';
      return;
    }

    textarea.style.height =
      Math.min(textarea.scrollHeight, this.maxHeightResize) + 'px';
    textarea.style.overflowY = 'auto';
    this.resized.emit(this.el.nativeElement.getBoundingClientRect());
  }

  resetTextareaHeight(textarea: HTMLElement, height: number) {
    textarea.style.height = height + 'px';
    textarea.style.overflowY = 'hidden';
  }
}
