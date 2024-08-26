import { CreateNewTaskPopUpComponent } from '@/app/share-pop-up/create-new-task-pop-up/create-new-task-pop-up.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable, Injector } from '@angular/core';

@Injectable()
export class AddItemToTaskService {
  public overlayRef: OverlayRef;
  private componentRef: componentRef;
  constructor(
    private readonly overlay: Overlay,
    private readonly injector: Injector
  ) {}

  public handleCreateNewTask(input) {
    const ref = this.createDialog(CreateNewTaskPopUpComponent);
    if (input)
      Object.entries(input).forEach(([key, value]) => {
        ref.instance[key] = value;
      });

    return ref;
  }

  private createDialog(componentType) {
    if (this.componentRef) this.componentRef.destroy();
    if (this.overlayRef) this.overlayRef.dispose();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(
      componentType,
      null,
      this.injector
    );
    this.componentRef = this.overlayRef.attach(componentPortal) as componentRef;
    return this.componentRef as ComponentRef<typeof componentType>;
  }
}
export type componentRef = ComponentRef<CreateNewTaskPopUpComponent>;
