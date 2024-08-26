import { CdkDragDrop, CdkDragStart } from '@angular/cdk/drag-drop';
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appE2EDragDrop]'
})
export class E2EDragDropDirective {
  constructor(private el: ElementRef) {}

  private getDataE2EAttribute() {
    const nativeElement = this.el.nativeElement;
    return nativeElement.getAttribute('data-e2e');
  }

  @HostListener('cdkDragDropped', ['$event'])
  onDrop(event: CdkDragDrop<any>) {
    const targetElement = event.event.target as HTMLElement;
    const targetE2EId = targetElement.getAttribute('data-e2e');
    if (this.getDataE2EAttribute() && targetE2EId) {
      window['dataLayer'] = window['dataLayer'] || [];
      window['dataLayer'].push({
        event: 'drag_drop_events',
        drag_e2e_id: this.getDataE2EAttribute(),
        drop_e2e_id: targetE2EId
      });
    }
  }
}
