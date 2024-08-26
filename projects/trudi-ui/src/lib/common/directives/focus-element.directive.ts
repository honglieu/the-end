import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Directive({
  selector: '[focusElement]',
  standalone: true
})
export class FocusElementDirective implements OnChanges {
  @Input() isFocus: ElementRef;

  constructor(private readonly _elementRef: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['isFocus']?.currentValue) {
      const element = this._elementRef?.nativeElement as HTMLElement;
      if (element) {
        setTimeout(() => {
          element.focus();
        }, 200);
      }
    }
  }
}
