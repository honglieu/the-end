import {
  ApplicationRef,
  ComponentRef,
  Injectable,
  Injector
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  TrudiConfirmComponent,
  ITrudiConfirmConfigs
} from '../trudi-confirm.component';

@Injectable({
  providedIn: 'root'
})
export class TrudiConfirmService {
  private overlayRef: OverlayRef | null = null;
  private confirmComponentRef: ComponentRef<TrudiConfirmComponent>;
  private configs: ITrudiConfirmConfigs = {
    title: '',
    subtitle: '',
    okText: 'Confirm',
    cancelText: 'Cancel',
    colorBtn: 'primary',
    iconName: 'iconTrudi'
  };

  constructor(
    private injector: Injector,
    private overlay: Overlay,
    private appRef: ApplicationRef
  ) {}

  getConfigs() {
    return this.configs;
  }

  confirm(configs: ITrudiConfirmConfigs, callback: CallBackConfirm) {
    this.closeConfirmModal();
    this.configs = {
      ...this.configs,
      ...configs
    };

    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      positionStrategy: this.overlay.position().global()
    });
    const componentPortal = new ComponentPortal(
      TrudiConfirmComponent,
      null,
      this.injector
    );
    const confirmComponentRef = this.overlayRef.attach(componentPortal);
    this.confirmComponentRef = confirmComponentRef;

    const confirmComponent = confirmComponentRef.instance;
    confirmComponent.confirmed.subscribe((res) => {
      callback({ result: true, isChecked: res });
      this.closeConfirmModal();
    });
    confirmComponent.canceled.subscribe(() => {
      callback({ result: false });
      this.closeConfirmModal();
    });

    this.appRef.attachView(confirmComponentRef.hostView);
  }

  private closeConfirmModal(): void {
    if (this.confirmComponentRef) {
      this.confirmComponentRef.destroy();
      this.confirmComponentRef = null;
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}

interface ResultTrudiConfirm {
  result: boolean;
  isChecked?: boolean;
}

type CallBackConfirm = (param: ResultTrudiConfirm) => void;
