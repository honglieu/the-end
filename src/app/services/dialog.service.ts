import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable, Injector } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DialogService<T> {
  private overlayRef: OverlayRef;
  private componentRef: ComponentRef<T>;

  constructor(
    private readonly overlay: Overlay,
    private readonly injector: Injector
  ) {}

  public createDialog(
    componentClass,
    input,
    afterCloseEventName: string = 'afterClose'
  ) {
    const ref = this.createDialogRef(componentClass);
    if (input)
      Object.entries(input).forEach(([key, value]) => {
        ref.setInput(key, value);
      });

    ref.instance?.[afterCloseEventName].subscribe(() =>
      this.overlayRef.dispose()
    );
    return ref.instance;
  }

  private createDialogRef(componentType) {
    if (this.componentRef) this.componentRef.destroy();
    if (this.overlayRef) this.overlayRef.dispose();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(
      componentType,
      null,
      this.injector
    );
    this.componentRef = this.overlayRef.attach(
      componentPortal
    ) as ComponentRef<T>;
    return this.componentRef as ComponentRef<typeof componentType>;
  }
}
