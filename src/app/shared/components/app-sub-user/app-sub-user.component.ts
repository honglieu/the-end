import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UserService } from '@services/user.service';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Component({
  selector: 'app-sub-user',
  templateUrl: './app-sub-user.component.html',
  styleUrls: ['./app-sub-user.component.scss']
})
export class AppSubUserComponent implements OnInit {
  @Input() subUser;
  @Input() mode: string = 'select';
  @ViewChild('internalTooltip') internalTooltip: ElementRef;
  public EUserInviteStatusType = EUserInviteStatusType;
  public EUserType = EUserPropertyType;
  public senderName: string;
  public userPropertyType: string;
  constructor(public userService: UserService) {}

  ngOnInit() {
    this.displayText();
  }

  displayText() {
    this.senderName =
      this.subUser.type === this.EUserType.OTHER
        ? this.subUser.name || this.subUser.user.name
        : (this.subUser.firstName || this.subUser.user?.firstName || '') +
          ' ' +
          (this.subUser.lastName || this.subUser.user?.lastName || '');
    this.userPropertyType = this.subUser.userPropertyType || this.subUser.type;
  }
}
