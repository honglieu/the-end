import { SharedAgencySettingsService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings.service';
import { Component } from '@angular/core';

@Component({
  selector: 'sidebar-wrapper',
  templateUrl: './sidebar-wrapper.component.html',
  styleUrls: ['./sidebar-wrapper.component.scss']
})
export class SidebarWrapperComponent {
  constructor(
    readonly sharedAgencySettingsService: SharedAgencySettingsService
  ) {}

  onRightContentScroll() {
    this.sharedAgencySettingsService.emitScroll();
  }
}
