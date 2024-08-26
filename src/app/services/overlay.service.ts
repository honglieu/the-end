import { Injectable, Injector } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { OverlayData } from '@/app/overlay/overlay.config';
import { OverlayComponent } from '@/app/overlay/overlay.component';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  constructor(private overlay: Overlay, private parentInjector: Injector) {}

  showResultOverlay(data: OverlayData, delay: number) {
    const positionStrategy = this.getPositionStrategy();
    const overlayRef = this.overlay.create({ positionStrategy });

    const injector = this.getInjector(data, this.parentInjector);
    const toastPortal = new ComponentPortal(OverlayComponent, null, injector);

    overlayRef.attach(toastPortal);

    setTimeout(() => {
      overlayRef.detach();
    }, delay);

    const seconds = interval(delay);
    return seconds.pipe(take(1));
  }

  getInjector(data: OverlayData, parentInjector: Injector) {
    const tokens = new WeakMap();

    tokens.set(OverlayData, data);

    return new PortalInjector(parentInjector, tokens);
  }

  getPositionStrategy() {
    return this.overlay.position().global().top('0px').right('0px');
  }
}
