import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Toast, ToastrService, ToastPackage } from 'ngx-toastr';
import { EToastType } from './toastType';

@Component({
  selector: '[toast-component]',
  styleUrls: [`./toast.component.scss`],
  templateUrl: `./toast.component.html`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('flyInOut', [
      state(
        'inactive',
        style({
          opacity: 1
        })
      ),
      transition(
        'inactive <=> active',
        animate(
          '500ms ease-out',
          keyframes([
            style({
              offset: 0,
              opacity: 0
            }),
            style({
              offset: 0.7,
              opacity: 1
            }),
            style({
              offset: 1
            })
          ])
        )
      ),
      transition(
        'active => removed',
        animate(
          '500ms ease-in',
          keyframes([
            style({
              opacity: 1,
              offset: 0.2
            }),
            style({
              opacity: 0,
              offset: 1
            })
          ])
        )
      )
    ])
  ],
  preserveWhitespaces: false
})
export class ToastComponent extends Toast {
  public toastDataE2e = 'toast';
  private timeOut: NodeJS.Timeout;
  public EToastType = EToastType;
  constructor(
    protected override toastrService: ToastrService,
    public override toastPackage: ToastPackage
  ) {
    super(toastrService, toastPackage);
  }
  getIcon(toastType: string): string {
    switch (toastType) {
      case EToastType.SUCCESS:
        this.toastDataE2e = 'created-task-successful-toast';
        return 'assets/icon/check-circle-success.svg';
      case EToastType.ERROR:
      case EToastType.ERROR_CUSTOM:
        this.toastDataE2e = 'error-toast';
        return 'assets/icon/icon-warning-red-fit.svg';
      case EToastType.WARNING_CUSTOM:
      case EToastType.WARNING:
        return 'assets/icon/icon-warning-red-fit.svg';
      case EToastType.INFO:
        return 'assets/icon/info-circle-blue.svg';
      case EToastType.SYNCING:
      case EToastType.SYNCING_CUSTOM:
        return 'assets/icon/syncing.svg';
      case EToastType.CHECK_WHITE:
        return 'assets/icon/check-circle-success.svg';
      default:
        return '';
    }
  }

  handleRemove(e: Event) {
    e.stopPropagation();
    this.remove();
  }

  action(event: Event) {
    event.stopPropagation();
    this.toastPackage.triggerAction();
    return false;
  }

  override ngOnDestroy() {
    clearTimeout(this.timeOut);
  }
}
