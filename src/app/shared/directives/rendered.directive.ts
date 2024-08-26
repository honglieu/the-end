import { Directive, EventEmitter, Output, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appRendered]'
})
export class RenderedDirective implements AfterViewInit {
  @Output() rendered: EventEmitter<void> = new EventEmitter<void>();
  ngAfterViewInit(): void {
    this.rendered.emit();
  }
}
