import { Component, Input, OnInit } from '@angular/core';

export enum NavLink {
  FILES,
  TRANSACTION_HISTORY,
  LEASE_SUMMARY,
  PAYMENT_SETTINGS,
  MESSAGES,
  CHANGE_PASSWORD,
  SETTINGS
}

@Component({
  selector: 'app-trudi-nav-links',
  templateUrl: 'trudi-nav-links.html',
  styleUrls: ['./trudi-nav-links.scss']
})
export class TrudiNavLinksComponent implements OnInit {
  @Input() linkType;
  public navLinkHeader = '';
  public imageSrc = 'assets/icon/settings-trudi-menu-icon.svg';

  constructor() {}

  ngOnInit() {
    this.navLinkHeader = this.getHeader(this.linkType);
    this.imageSrc = this.getImageSrc(this.linkType);
  }

  getImageSrc(navLinkType): any {
    switch (navLinkType) {
      case NavLink[NavLink.FILES]:
        return 'assets/icon/files-trudi-menu-icon.svg';
      case NavLink[NavLink.LEASE_SUMMARY]:
        return 'assets/icon/lease-trudi-menu-icon.svg';
      case NavLink[NavLink.TRANSACTION_HISTORY]:
        return 'assets/icon/transaction-trudi-menu-icon.svg';
      case NavLink[NavLink.PAYMENT_SETTINGS]:
      case NavLink[NavLink.CHANGE_PASSWORD]:
      case NavLink[NavLink.SETTINGS]:
        return 'assets/icon/settings-trudi-menu-icon.svg';
      case NavLink[NavLink.MESSAGES]:
        return 'assets/icon/messages-trudi-menu-icon.svg';
    }
  }

  getHeader(navLinkType): any {
    switch (navLinkType) {
      case NavLink[NavLink.FILES]:
        return 'Files';
      case NavLink[NavLink.LEASE_SUMMARY]:
        return 'Lease Summary';
      case NavLink[NavLink.TRANSACTION_HISTORY]:
        return 'Transaction History';
      case NavLink[NavLink.PAYMENT_SETTINGS]:
        return 'Payment Settings';
      case NavLink[NavLink.CHANGE_PASSWORD]:
        return 'Change Password';
      case NavLink[NavLink.SETTINGS]:
        return 'Settings';
      case NavLink[NavLink.MESSAGES]:
        return 'Messages';
    }
  }
}
