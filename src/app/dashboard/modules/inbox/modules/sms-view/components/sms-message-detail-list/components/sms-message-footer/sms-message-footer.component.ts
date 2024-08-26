import {
  combineNames,
  EConversationType,
  EMessageType,
  EUserPropertyType,
  UserProperty
} from '@/app/shared';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'sms-message-footer',
  templateUrl: './sms-message-footer.component.html',
  styleUrl: './sms-message-footer.component.scss'
})
export class SmsMessageFooterComponent implements OnChanges {
  @Input() message = null;
  @Input() isRead: boolean = false;
  @Input() isShowSending: boolean = false;
  @Input() conversationType: EConversationType;

  public fullName: string = null;
  public createdAt: string = null;
  public clickable: boolean = false;

  constructor(
    private readonly userProfileDrawerService: UserProfileDrawerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { message } = changes || {};

    if (message?.currentValue) {
      const { firstName, lastName, seenDate, createdAt } = message.currentValue;
      this.fullName = combineNames(firstName, lastName);
      this.createdAt = seenDate || createdAt;
      this.clickable = this.message?.userType === EUserPropertyType.LEAD;
      if (this.message?.messageType !== EMessageType.file) {
        this.isShowSending = true;
      }
    }
  }

  handleOpenUserProfile() {
    if (!this.clickable) return;
    const { userId, firstName, creator, userType } = this.message;

    let dataUser = {
      ...this.message,
      pmUserId: userId,
      pmName: firstName,
      email: creator.email,
      sendFromUserType: userType,
      pmNameClick: true,
      conversationType: this.conversationType
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
}
