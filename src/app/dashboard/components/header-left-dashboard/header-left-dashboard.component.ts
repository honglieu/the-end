import { SharedService } from '@services/shared.service';
import { EMenuDropdownType } from '@shared/directives/menuKeyboard.directive';
import { ICompany } from '@shared/types/company.interface';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
@Component({
  selector: 'header-left-dashboard',
  templateUrl: './header-left-dashboard.component.html',
  styleUrls: ['./header-left-dashboard.component.scss']
})
export class HeaderLeftDashboardComponent implements OnInit {
  @ViewChild(CdkOverlayOrigin) trigger: CdkOverlayOrigin;
  @Input() currentCompanyId: string;
  @Input() currentCompany: ICompany;
  public isDropdownVisible: boolean = false;
  public EMenuDropdownType = EMenuDropdownType;
  public isConsole: boolean = false;
  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  hiddenDropdownSelect(event: boolean) {
    this.isDropdownVisible = event;
  }

  overlayOutsideClick(event: MouseEvent) {
    const buttonElement = this.trigger.elementRef.nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (!buttonElement.contains(targetElement)) {
      this.isDropdownVisible = false;
    }
  }
}
