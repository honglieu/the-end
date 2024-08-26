import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output
} from '@angular/core';

@Directive({
  selector: '[clickStopPropagation]'
})
export class ClickStopPropagationDirective {
  @Output() clickStopPropagation = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('click', ['$event'])
  @HostListener('keydown.enter', ['$event'])
  onClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.clickStopPropagation.emit();
  }
}
