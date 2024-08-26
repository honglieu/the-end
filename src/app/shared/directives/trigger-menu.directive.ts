import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import {
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig,
  OverlayRef
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { POSITION_MAP } from '@services/constants';
import { merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';

enum State {
  Open,
  Close
}

@Directive({
  selector: '[menuTrigger]',
  exportAs: 'menu'
})
export class TriggerMenuDirective implements OnInit {
  @Input() menuTrigger?: TemplateRef<any>;
  @Input() position = [POSITION_MAP.bottomRight];
  @Input() backdropClass = '';
  @Output() menuStateChanged = new EventEmitter<boolean>();
  private portal: TemplatePortal;
  private overlayRef: OverlayRef;

  constructor(
    private elr: ElementRef,
    private overlay: Overlay,
    private vcr: ViewContainerRef
  ) {}

  ngOnInit(): void {}

  @HostListener('click', ['$event']) dClicked(e: MouseEvent) {
    if (!this.menuTrigger) {
      return;
    }
    const overlayConfig = this.getOverlayConfig();
    this.setOverlayPosition(
      overlayConfig.positionStrategy as FlexibleConnectedPositionStrategy
    );
    const overlayRef = this.overlay.create(overlayConfig);
    this.subscribeOverlayEvent(overlayRef);
    overlayRef.attach(this.getPortal());
    this.overlayRef = overlayRef;
    this.menuStateChanged.emit(true);
  }

  public close() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.menuStateChanged.emit(false);
    }
  }

  private getOverlayConfig(): OverlayConfig {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elr);
    return new OverlayConfig({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: this.backdropClass,
      minWidth: '140px',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });
  }

  private getPortal(): TemplatePortal {
    if (!this.portal || this.portal.templateRef !== this.menuTrigger) {
      this.portal = new TemplatePortal<any>(this.menuTrigger, this.vcr);
    }
    return this.portal;
  }

  private setOverlayPosition(
    positionStrategy: FlexibleConnectedPositionStrategy
  ): void {
    positionStrategy.withPositions([...this.position]);
  }

  private subscribeOverlayEvent(overlayRef: OverlayRef) {
    const subscription = merge(
      overlayRef.backdropClick(),
      overlayRef.detachments(),
      overlayRef
        .keydownEvents()
        .pipe(filter((e) => e.keyCode === ESCAPE && !hasModifierKey(e)))
    ).subscribe((e) => {
      this.close();
    });
  }
}
