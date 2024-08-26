import { LINK_DESKTOP_APP } from '@/app/dashboard/utils/constants';
import { Component, Input, OnInit } from '@angular/core';

enum ERegion {
  AU = 'AU',
  US = 'US'
}
@Component({
  selector: 'update-version-popup',
  templateUrl: './update-version-popup.component.html',
  styleUrls: ['./update-version-popup.component.scss']
})
export class UpdateVersionPopupComponent implements OnInit {
  @Input() visible: boolean = false;
  public isWindows: boolean = false;
  public regionApp: string = '';
  public portalUS = 'https://us.portal.trudi.ai';

  constructor() {}

  ngOnInit(): void {
    this.checkOS();
  }

  checkOS() {
    const isPortalUS = window.location.href.includes(this.portalUS);
    this.isWindows = navigator.platform.indexOf('Win') != -1;
    this.regionApp = isPortalUS ? ERegion.US : ERegion.AU;
  }

  handleGoStoreApp() {
    const link =
      LINK_DESKTOP_APP[this.isWindows ? 'Windows' : 'MacOS'][this.regionApp];
    if (!link) return;
    window.location.replace(link);
  }
}
