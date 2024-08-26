import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'warning-rei-form-popup',
  templateUrl: './warning-rei-form-popup.component.html',
  styleUrls: ['./warning-rei-form-popup.component.scss']
})
export class WarningReiFormPopupComponent implements OnDestroy {
  @Input() show: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  private readonly SETTING_PAGE_URL: string =
    '/dashboard/profile-settings/integrations';

  constructor(private router: Router) {}

  ngOnDestroy(): void {
    this.show = false;
    this.onClose.emit();
  }

  public onQuitModal(event?: Event) {
    event?.stopPropagation();
    this.show = false;
    this.onClose.emit();
  }

  public openSetting() {
    this.onQuitModal();
    this.router.navigate([this.SETTING_PAGE_URL]);
  }
}
